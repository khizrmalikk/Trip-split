import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth, getDbUser } from '@/lib/auth';

// GET /api/users/search?q=...&tripId=...
// Returns existing users matching the query, excluding current trip members
export async function GET(request: NextRequest) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ users: [] });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const tripId = searchParams.get('tripId') ?? '';

  if (q.length < 2) return NextResponse.json({ users: [] });

  // Get existing trip member user IDs to exclude
  let excludeIds: string[] = [];
  if (tripId) {
    const { data: members } = await supabase
      .from('trip_members')
      .select('user_id')
      .eq('trip_id', tripId)
      .is('removed_at', null);
    excludeIds = (members ?? []).map((m) => m.user_id);
  }

  // Search by name or email (case-insensitive)
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, clerk_id')
    .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
    .not('id', 'in', excludeIds.length > 0 ? `(${excludeIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)')
    .limit(8);

  return NextResponse.json({
    users: (users ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      hasAccount: !!u.clerk_id,
    })),
  });
}
