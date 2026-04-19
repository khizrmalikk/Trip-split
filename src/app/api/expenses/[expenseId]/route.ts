import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth, getDbUser, getTripMembership } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ expenseId: string }>;
}

// PATCH /api/expenses/[expenseId] - Resolve or delete (creator only)
// body: { action: 'delete' | 'mark_settled' }
export async function PATCH(request: NextRequest, context: RouteParams) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const { expenseId } = await context.params;
  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Get the expense to find its trip
  const { data: expense } = await supabase
    .from('expenses')
    .select('id, trip_id')
    .eq('id', expenseId)
    .single();

  if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

  // Verify creator role
  const membership = await getTripMembership(user.id, expense.trip_id);
  if (!membership || membership.role !== 'creator') {
    return NextResponse.json({ error: 'Only trip creators can modify expenses' }, { status: 403 });
  }

  const { action } = await request.json();

  if (action === 'delete') {
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
    if (deleteError) throw deleteError;
    return NextResponse.json({ deleted: true });
  }

  if (action === 'mark_settled') {
    const { error: updateError } = await supabase
      .from('expenses')
      .update({ status: 'settled' })
      .eq('id', expenseId);
    if (updateError) throw updateError;
    return NextResponse.json({ settled: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
