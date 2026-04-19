import { NextResponse } from 'next/server';
import { requireAuth, getDbUser } from '@/lib/auth';

// POST /api/auth/sync - Sync Clerk user to our DB (call on first load after sign-in)
export async function POST() {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const user = await getDbUser(clerkId!);
  if (!user) {
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }

  return NextResponse.json({ user });
}
