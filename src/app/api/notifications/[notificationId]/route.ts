import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth, getDbUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ notificationId: string }>;
}

// PATCH /api/notifications/[notificationId] - Mark single notification as read
export async function PATCH(_req: NextRequest, context: RouteParams) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const { notificationId } = await context.params;
  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ ok: true });

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}
