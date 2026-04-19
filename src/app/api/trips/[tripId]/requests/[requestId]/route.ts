import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  requireAuth, getDbUser, getTripMembership,
  createNotification, notifyTripMembers,
} from '@/lib/auth';
import { toUsd } from '@/lib/currency';

interface RouteParams {
  params: Promise<{ tripId: string; requestId: string }>;
}

// PATCH /api/trips/[tripId]/requests/[requestId] - Approve or deny (creator only)
// body: { action: 'approve' | 'deny', note?: string }
export async function PATCH(req: NextRequest, context: RouteParams) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const { tripId, requestId } = await context.params;
  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const membership = await getTripMembership(user.id, tripId);
  if (!membership || membership.role !== 'creator') {
    return NextResponse.json({ error: 'Only trip creators can review requests' }, { status: 403 });
  }

  const { action, note } = await req.json();
  if (action !== 'approve' && action !== 'deny') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Fetch the request
  const { data: expReq } = await supabase
    .from('expense_requests')
    .select('*, requested_by:users!requested_by_id(id, name)')
    .eq('id', requestId)
    .eq('trip_id', tripId)
    .single();

  if (!expReq) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (expReq.status !== 'pending') {
    return NextResponse.json({ error: 'Request already reviewed' }, { status: 409 });
  }

  if (action === 'approve') {
    // Create the actual expense + splits
    const ed = expReq.expense_data as any;

    // Get trip members for equal split
    const { data: members } = await supabase
      .from('trip_members')
      .select('user_id')
      .eq('trip_id', tripId)
      .is('removed_at', null);

    let participants: string[] = [];
    if (ed.splitType === 'equal') {
      participants = (members ?? []).map((m: any) => m.user_id);
    } else if (ed.splitWith?.length) {
      participants =
        ed.splitType === 'pair'
          ? [ed.paidById, ed.splitWith[0]]
          : ed.splitWith;
    }

    if (participants.length === 0) {
      return NextResponse.json({ error: 'No participants' }, { status: 400 });
    }

    const amountUsd = await toUsd(ed.amount, ed.currency ?? 'USD');
    const splitAmount = Number((ed.amount / participants.length).toFixed(2));
    const splitAmountUsd = Number((amountUsd / participants.length).toFixed(6));

    const { data: expense, error: expError } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        paid_by_id: ed.paidById,
        amount: ed.amount,
        currency: ed.currency ?? 'USD',
        amount_usd: amountUsd,
        description: ed.description,
        category: ed.category ?? null,
        split_type: ed.splitType,
        status: 'active',
      })
      .select()
      .single();

    if (expError) throw expError;

    await supabase.from('expense_splits').insert(
      participants.map((uid: string) => ({
        expense_id: expense.id,
        user_id: uid,
        amount: splitAmount,
        amount_usd: splitAmountUsd,
      }))
    );

    // Mark request approved
    await supabase
      .from('expense_requests')
      .update({
        status: 'approved',
        review_note: note ?? null,
        reviewed_by_id: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    // Notify requester
    const requesterName = (expReq.requested_by as any)?.name ?? 'Someone';
    await createNotification(
      expReq.requested_by_id,
      'request_approved',
      'Expense approved',
      `Your expense "${ed.description}" (${ed.currency} ${ed.amount}) was approved by ${user.name}.`
    );

    // Notify all trip members about the new expense
    await notifyTripMembers(
      tripId,
      expReq.requested_by_id,
      'expense_added',
      'New expense added',
      `${requesterName}'s expense "${ed.description}" (${ed.currency} ${ed.amount}) was approved and added.`,
      { tripId }
    );

    return NextResponse.json({ approved: true, expense });
  }

  // Deny
  await supabase
    .from('expense_requests')
    .update({
      status: 'denied',
      review_note: note ?? null,
      reviewed_by_id: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  const ed = expReq.expense_data as any;
  await createNotification(
    expReq.requested_by_id,
    'request_denied',
    'Expense request denied',
    `Your expense "${ed.description}" (${ed.currency} ${ed.amount}) was denied by ${user.name}${note ? `: "${note}"` : '.'}`
  );

  return NextResponse.json({ denied: true });
}
