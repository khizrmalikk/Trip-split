import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabase } from './supabase';

export interface DbUser {
  id: string;
  name: string;
  email: string | null;
  clerk_id: string;
}

/**
 * Get the authenticated Clerk user ID, or return a 401 response.
 * Call this at the top of every protected API route.
 */
export async function requireAuth(): Promise<
  { clerkId: string; error: null } | { clerkId: null; error: NextResponse }
> {
  const { userId } = await auth();
  if (!userId) {
    return {
      clerkId: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { clerkId: userId, error: null };
}

/**
 * Get the DB user record for the current Clerk user.
 * Syncs name/email from Clerk on first call.
 */
export async function getDbUser(clerkId: string): Promise<DbUser | null> {
  try {
    // Try to find existing user
    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('id, name, email, clerk_id')
      .eq('clerk_id', clerkId)
      .maybeSingle();

    if (findError) {
      console.error('getDbUser find error:', findError);
      throw findError;
    }
    if (existing) return existing as DbUser;

    // Sync from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
      clerkUser.username ||
      'User';
    const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;

    const { data: upserted, error: upsertError } = await supabase
      .from('users')
      .upsert({ clerk_id: clerkId, name, email }, { onConflict: 'clerk_id' })
      .select('id, name, email, clerk_id')
      .single();

    if (upsertError) {
      console.error('getDbUser upsert error:', upsertError);
      throw upsertError;
    }

    return (upserted as DbUser) ?? null;
  } catch (err) {
    console.error('getDbUser failed:', err);
    return null;
  }
}

/**
 * Get the DB user and their role in a specific trip.
 * Returns null role if not a member.
 */
export async function getTripMembership(
  dbUserId: string,
  tripId: string
): Promise<{ role: string; removed: boolean } | null> {
  const { data } = await supabase
    .from('trip_members')
    .select('role, removed_at')
    .eq('trip_id', tripId)
    .eq('user_id', dbUserId)
    .maybeSingle();

  if (!data) return null;
  return { role: data.role, removed: !!data.removed_at };
}

/**
 * Create a notification for a user.
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    data: data ?? null,
  });
}

/**
 * Notify all active trip creators about an event.
 */
export async function notifyTripCreators(
  tripId: string,
  exceptUserId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  const { data: creators } = await supabase
    .from('trip_members')
    .select('user_id')
    .eq('trip_id', tripId)
    .eq('role', 'creator')
    .is('removed_at', null)
    .neq('user_id', exceptUserId);

  if (!creators?.length) return;

  await supabase.from('notifications').insert(
    creators.map((c) => ({
      user_id: c.user_id,
      type,
      title,
      message,
      data: data ?? null,
    }))
  );
}

/**
 * Notify all active trip members about an event.
 */
export async function notifyTripMembers(
  tripId: string,
  exceptUserId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  const { data: members } = await supabase
    .from('trip_members')
    .select('user_id')
    .eq('trip_id', tripId)
    .is('removed_at', null)
    .neq('user_id', exceptUserId);

  if (!members?.length) return;

  await supabase.from('notifications').insert(
    members.map((m) => ({
      user_id: m.user_id,
      type,
      title,
      message,
      data: data ?? null,
    }))
  );
}
