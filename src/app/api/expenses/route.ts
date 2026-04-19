import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  requireAuth, getDbUser, getTripMembership,
  notifyTripCreators, notifyTripMembers,
} from '@/lib/auth';
import { toUsd } from '@/lib/currency';

// POST /api/expenses - Create expense (creator) or submit request (member)
export async function POST(request: NextRequest) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const body = await request.json();
    const { tripId, paidById, amount, currency, description, category, splitType, splitWith } = body;

    const membership = await getTripMembership(user.id, tripId);
    if (!membership || membership.removed) {
      return NextResponse.json({ error: 'Not a trip member' }, { status: 403 });
    }

    // Get active trip members
    const { data: members, error: membersError } = await supabase
      .from('trip_members')
      .select('user_id')
      .eq('trip_id', tripId)
      .is('removed_at', null);

    if (membersError) throw membersError;
    if (!members?.length) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // ── MEMBER: submit a request for creator approval ──────────────────
    if (membership.role !== 'creator') {
      const { data: reqData, error: reqError } = await supabase
        .from('expense_requests')
        .insert({
          trip_id: tripId,
          requested_by_id: user.id,
          expense_data: { paidById, amount, currency, description, category, splitType, splitWith },
          status: 'pending',
        })
        .select()
        .single();

      if (reqError) throw reqError;

      // Notify creators
      await notifyTripCreators(
        tripId,
        user.id,
        'expense_request',
        'New expense request',
        `${user.name} wants to add "${description}" (${currency} ${amount}). Review it in the trip dashboard.`,
        { tripId, requestId: reqData.id }
      );

      return NextResponse.json({ request: reqData, pending: true }, { status: 201 });
    }

    // ── CREATOR: add expense directly ──────────────────────────────────
    let participants: string[] = [];
    if (splitType === 'equal') {
      participants = members.map((m) => m.user_id);
    } else if (splitType === 'custom' && splitWith) {
      participants = splitWith;
    } else if (splitType === 'pair' && splitWith?.length === 1) {
      participants = [paidById, splitWith[0]];
    }

    if (participants.length === 0) {
      return NextResponse.json({ error: 'No participants' }, { status: 400 });
    }

    const amountUsd = await toUsd(amount, currency || 'USD');
    const splitAmount = Number((amount / participants.length).toFixed(2));
    const splitAmountUsd = Number((amountUsd / participants.length).toFixed(6));

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        paid_by_id: paidById,
        amount,
        currency: currency || 'USD',
        amount_usd: amountUsd,
        description,
        category: category || null,
        split_type: splitType,
        status: 'active',
      })
      .select()
      .single();

    if (expenseError) throw expenseError;

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(participants.map((uid) => ({
        expense_id: expense.id,
        user_id: uid,
        amount: splitAmount,
        amount_usd: splitAmountUsd,
      })));

    if (splitsError) throw splitsError;

    // Notify other trip members
    await notifyTripMembers(
      tripId,
      user.id,
      'expense_added',
      'New expense added',
      `${user.name} added "${description}" (${currency} ${amount}).`,
      { tripId }
    );

    return NextResponse.json({ expense }, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create expense:', err);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
