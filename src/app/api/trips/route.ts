import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth, getDbUser, notifyTripMembers } from '@/lib/auth';

// GET /api/trips - List trips the current user is a member of
export async function GET() {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ trips: [] });

  const { data: memberships, error: mErr } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', user.id)
    .is('removed_at', null);

  if (mErr) throw mErr;
  const tripIds = (memberships ?? []).map((m) => m.trip_id);

  if (tripIds.length === 0) return NextResponse.json({ trips: [] });

  const { data: trips, error: tripErr } = await supabase
    .from('trips')
    .select(`
      id, name, description, start_date, end_date, currency, created_at,
      trip_members(
        id, role,
        user:users!user_id(id, name)
      ),
      expenses(id)
    `)
    .in('id', tripIds)
    .order('created_at', { ascending: false });

  if (tripErr) throw tripErr;

  const formatted = (trips ?? []).map((trip) => ({
    id: trip.id,
    name: trip.name,
    description: trip.description,
    startDate: trip.start_date,
    endDate: trip.end_date,
    currency: trip.currency,
    members: trip.trip_members,
    _count: { expenses: (trip.expenses as unknown[])?.length ?? 0 },
  }));

  return NextResponse.json({ trips: formatted });
}

// POST /api/trips - Create a new trip (current user becomes creator)
export async function POST(request: NextRequest) {
  const { clerkId, error } = await requireAuth();
  if (error) return error;

  const user = await getDbUser(clerkId!);
  if (!user) return NextResponse.json({ error: 'User not synced' }, { status: 400 });

  try {
    const body = await request.json();
    const { name, description, startDate, endDate, currency } = body;

    // Create trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        name,
        description: description || null,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        currency: currency || 'USD',
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // Add creator as creator member
    const { error: memberError } = await supabase
      .from('trip_members')
      .insert({ trip_id: trip.id, user_id: user.id, role: 'creator' });

    if (memberError) throw memberError;

    const { data: fullTrip } = await supabase
      .from('trips')
      .select(`
        id, name, description, start_date, end_date, currency, created_at,
        trip_members(id, role, user:users!user_id(id, name))
      `)
      .eq('id', trip.id)
      .single();

    return NextResponse.json({
      trip: { ...fullTrip, startDate: fullTrip!.start_date, members: fullTrip!.trip_members }
    }, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create trip:', err);
    return NextResponse.json(
      { error: 'Failed to create trip', detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
