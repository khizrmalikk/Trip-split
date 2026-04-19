import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  requireAuth, getDbUser, getTripMembership,
  notifyTripMembers, createNotification,
} from '@/lib/auth';

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// POST /api/trips/[tripId]/members - Add a member (creator only)
export async function POST(request: NextRequest, context: RouteParams) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await context.params;
  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const membership = await getTripMembership(user.id, tripId);
  if (!membership || membership.role !== 'creator') {
    return NextResponse.json({ error: 'Only creators can add members' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, name, email } = body;

    // Adding an existing user by ID
    let newUser;
    if (userId) {
      const { data: existing } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', userId)
        .single();
      if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      newUser = existing;
    } else {
      // Adding a guest user
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      if (email?.trim()) {
        const { data: existing } = await supabase
          .from('users')
          .select()
          .eq('email', email.trim())
          .maybeSingle();
        if (existing) {
          newUser = existing;
        } else {
          const { data, error: insertErr } = await supabase
            .from('users')
            .insert({ name: name.trim(), email: email.trim() })
            .select()
            .single();
          if (insertErr) throw insertErr;
          newUser = data;
        }
      } else {
        const { data, error: insertErr } = await supabase
          .from('users')
          .insert({ name: name.trim() })
          .select()
          .single();
        if (insertErr) throw insertErr;
        newUser = data;
      }
    }

    // Add to trip
    const { error: memberError } = await supabase
      .from('trip_members')
      .insert({ trip_id: tripId, user_id: newUser.id, role: 'member' });

    if (memberError) {
      if (memberError.code === '23505') {
        return NextResponse.json({ error: 'This person is already a member' }, { status: 409 });
      }
      throw memberError;
    }

    // Get trip name for notification
    const { data: tripData } = await supabase
      .from('trips')
      .select('name')
      .eq('id', tripId)
      .single();

    // Notify the new member (if they have a DB record with clerk_id)
    await createNotification(
      newUser.id,
      'member_added',
      'Added to a trip',
      `${user.name} added you to "${tripData?.name ?? 'a trip'}".`,
      { tripId }
    );

    // Notify other members
    await notifyTripMembers(tripId, user.id, 'member_added',
      'New member joined',
      `${name.trim()} was added to the trip by ${user.name}.`,
      { tripId }
    );

    return NextResponse.json({
      member: { user: { id: newUser.id, name: newUser.name }, role: 'member' }
    }, { status: 201 });
  } catch (err) {
    console.error('Failed to add member:', err);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}
