import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth, getDbUser } from '@/lib/auth';

// GET /api/notifications - Get current user's notifications
export async function GET() {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ notifications: [] });

  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, message, data, read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ notifications: data ?? [] });
}

// PATCH /api/notifications - Mark all as read
export async function PATCH() {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ ok: true });

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  return NextResponse.json({ ok: true });
}
