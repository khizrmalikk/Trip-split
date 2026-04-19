import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  requireAuth, getDbUser, getTripMembership,
  createNotification, notifyTripMembers,
} from '@/lib/auth';

interface RouteParams {
  params: Promise<{ tripId: string; userId: string }>;
}

// GET /api/trips/[tripId]/members/[userId] - Check impact of removing member
export async function GET(_request: NextRequest, context: RouteParams) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const { tripId, userId } = await context.params;
  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const membership = await getTripMembership(user.id, tripId);
  if (!membership || membership.role !== 'creator') {
    return NextResponse.json({ error: 'Only creators can check member impact' }, { status: 403 });
  }

  const { data: paidExpenses } = await supabase
    .from('expenses')
    .select('id, description, amount, currency, date, status')
    .eq('trip_id', tripId)
    .eq('paid_by_id', userId)
    .eq('status', 'active');

  const { data: splitExpenses } = await supabase
    .from('expense_splits')
    .select('expense_id, expenses!inner(id, description, amount, currency, date, status, paid_by_id, trip_id)')
    .eq('user_id', userId)
    .eq('expenses.trip_id', tripId)
    .eq('expenses.status', 'active')
    .neq('expenses.paid_by_id', userId);

  const paidIds = new Set((paidExpenses ?? []).map((e: any) => e.id));
  const splitOnly = (splitExpenses ?? [])
    .map((s: any) => s.expenses)
    .filter((e: any) => e && !paidIds.has(e.id));

  const allAffected = [
    ...(paidExpenses ?? []).map((e: any) => ({ ...e, role: 'payer' })),
    ...splitOnly.map((e: any) => ({ ...e, role: 'participant' })),
  ];

  return NextResponse.json({ affectedExpenses: allAffected });
}

// DELETE /api/trips/[tripId]/members/[userId] - Soft-remove member (creator only)
export async function DELETE(_request: NextRequest, context: RouteParams) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const { tripId, userId } = await context.params;
  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const membership = await getTripMembership(user.id, tripId);
  if (!membership || membership.role !== 'creator') {
    return NextResponse.json({ error: 'Only creators can remove members' }, { status: 403 });
  }

  const { error: memberError } = await supabase
    .from('trip_members')
    .update({ removed_at: new Date().toISOString() })
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .is('removed_at', null);

  if (memberError) throw memberError;

  const { data: expensesAsPayer } = await supabase
    .from('expenses')
    .select('id')
    .eq('trip_id', tripId)
    .eq('paid_by_id', userId)
    .eq('status', 'active');

  const { data: splitsAsParticipant } = await supabase
    .from('expense_splits')
    .select('expense_id, expenses!inner(id, trip_id, status)')
    .eq('user_id', userId)
    .eq('expenses.trip_id', tripId)
    .eq('expenses.status', 'active');

  const expenseIds = new Set([
    ...(expensesAsPayer ?? []).map((e: any) => e.id),
    ...(splitsAsParticipant ?? []).map((s: any) => s.expense_id),
  ]);

  if (expenseIds.size > 0) {
    await supabase
      .from('expenses')
      .update({ status: 'pending' })
      .in('id', Array.from(expenseIds));
  }

  // Notify the removed member
  const { data: tripData } = await supabase.from('trips').select('name').eq('id', tripId).single();
  await createNotification(
    userId,
    'member_removed',
    'Removed from trip',
    `You were removed from "${tripData?.name ?? 'a trip'}" by ${user.name}.`
  );

  return NextResponse.json({ affectedCount: expenseIds.size });
}

// PATCH /api/trips/[tripId]/members/[userId] - Promote/demote role (creator only)
export async function PATCH(request: NextRequest, context: RouteParams) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const { tripId, userId } = await context.params;
  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const membership = await getTripMembership(user.id, tripId);
  if (!membership || membership.role !== 'creator') {
    return NextResponse.json({ error: 'Only creators can change roles' }, { status: 403 });
  }

  const { role } = await request.json();
  if (role !== 'creator' && role !== 'member') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('trip_members')
    .update({ role })
    .eq('trip_id', tripId)
    .eq('user_id', userId);

  if (updateError) throw updateError;

  const { data: tripData } = await supabase.from('trips').select('name').eq('id', tripId).single();
  await createNotification(
    userId,
    'role_changed',
    role === 'creator' ? 'You are now a creator' : 'Role updated',
    role === 'creator'
      ? `${user.name} made you a creator of "${tripData?.name ?? 'a trip'}". You can now approve expenses and manage members.`
      : `Your role in "${tripData?.name ?? 'a trip'}" was changed to member by ${user.name}.`,
    { tripId }
  );

  return NextResponse.json({ role });
}
