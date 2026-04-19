import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth, getDbUser, getTripMembership } from '@/lib/auth';

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
  if (!membership) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select(`
      id, amount, currency, description, category, date, split_type, status, created_at, paid_by_id,
      paid_by:users!paid_by_id(id, name),
      expense_splits(id, user_id, amount, settled)
    `)
    .eq('trip_id', tripId)
    .order('date', { ascending: false });

  if (expErr) throw expErr;

  const formatted = (expenses ?? []).map((e: any) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    currency: e.currency,
    date: e.date,
    status: e.status,
    splitType: e.split_type,
    paidBy: e.paid_by,
    splits: e.expense_splits ?? [],
  }));

  return NextResponse.json({ expenses: formatted });
}
