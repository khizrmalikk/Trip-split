import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth, getDbUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// GET /api/trips/[tripId]/requests - List pending expense requests (creator only)
export async function GET(_req: NextRequest, context: RouteParams) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await context.params;
  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { data: requests, error: reqError } = await supabase
    .from('expense_requests')
    .select(`
      id, trip_id, expense_data, status, review_note, created_at,
      requested_by:users!requested_by_id(id, name)
    `)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  if (reqError) throw reqError;

  return NextResponse.json({ requests: requests ?? [] });
}
