import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateSettlements } from '@/lib/settlement';
import { requireAuth, getDbUser, getTripMembership, notifyTripMembers } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

export async function GET(_request: NextRequest, context: RouteParams) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await context.params;
  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const membership = await getTripMembership(user.id, tripId);
  if (!membership) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  try {
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id, name, description, start_date, end_date, currency, created_at,
        trip_members(
          id, role, removed_at,
          user:users!user_id(id, name)
        ),
        expenses(
          id, amount, amount_usd, currency, description, category, date, split_type, status, created_at, paid_by_id,
          paid_by:users!paid_by_id(id, name),
          expense_splits(id, user_id, amount, amount_usd, settled)
        )
      `)
      .eq('id', tripId)
      .order('date', { foreignTable: 'expenses', ascending: false })
      .single();

    if (tripError) {
      if (tripError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }
      throw tripError;
    }

    const allExpenses = (trip.expenses as any[]) ?? [];
    const members = (trip.trip_members as any[]) ?? [];

    const activeExpenses = allExpenses.filter((e: any) => e.status === 'active');
    const pendingExpenses = allExpenses.filter((e: any) => e.status === 'pending');

    const balances = members.map((member: any) => {
      // Use amount_usd for consistent cross-currency math; fall back to amount if old rows
      const paid = activeExpenses
        .filter((e: any) => e.paid_by_id === member.user.id)
        .reduce((sum: number, e: any) => sum + (e.amount_usd || e.amount), 0);

      const owes = activeExpenses
        .flatMap((e: any) => e.expense_splits ?? [])
        .filter((s: any) => s.user_id === member.user.id)
        .reduce((sum: number, s: any) => sum + (s.amount_usd || s.amount), 0);

      return {
        userId: member.user.id,
        userName: member.user.name,
        removed: !!member.removed_at,
        net: Number((paid - owes).toFixed(6)),
      };
    });

    const settlements = calculateSettlements(balances.filter((b) => !b.removed));

    const formatExpense = (e: any) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      amountUsd: e.amount_usd ?? e.amount,
      currency: e.currency,
      date: e.date,
      status: e.status,
      paidBy: e.paid_by,
      splits: e.expense_splits ?? [],
    });

    const formattedTrip = {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      currency: trip.currency,
      startDate: trip.start_date,
      endDate: trip.end_date,
      members,
      expenses: activeExpenses.map(formatExpense),
      pendingExpenses: pendingExpenses.map(formatExpense),
      // Current user context
      currentUserId: user.id,
      currentUserRole: membership.role,
    };

    return NextResponse.json({ trip: formattedTrip, balances, settlements });
  } catch (err) {
    console.error('Failed to fetch trip:', err);
    return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await context.params;
  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const membership = await getTripMembership(user.id, tripId);
  if (!membership || membership.role !== 'creator') {
    return NextResponse.json({ error: 'Only creators can edit trip details' }, { status: 403 });
  }

  try {
    const { name, description, startDate, endDate, currency } = await request.json();

    const { data: trip, error: updateError } = await supabase
      .from('trips')
      .update({
        name,
        description: description || null,
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        currency,
      })
      .eq('id', tripId)
      .select('id, name')
      .single();

    if (updateError) throw updateError;

    await notifyTripMembers(tripId, user.id, 'trip_updated', 'Trip updated',
      `${user.name} updated the details of "${trip.name}".`, { tripId });

    return NextResponse.json({ trip });
  } catch (err: any) {
    console.error('Failed to update trip:', err);
    return NextResponse.json({ error: 'Failed to update trip', detail: err?.message }, { status: 500 });
  }
}
