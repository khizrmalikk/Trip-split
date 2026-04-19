'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Receipt, Users, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';

interface Trip {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  currency: string;
  _count: {
    expenses: number;
  };
  members: Array<{
    user: {
      name: string;
    };
  }>;
}

/* ------------------------------------------------------------------ */
/*  Skeleton for the trips list                                        */
/* ------------------------------------------------------------------ */

function TripsListSkeleton() {
  return (
    <>
    <Navbar />
    <div className="min-h-screen py-6 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/[0.05] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trips')
      .then(res => res.json())
      .then(data => {
        setTrips(data.trips);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <TripsListSkeleton />;
  }

  return (
    <>
    <Navbar />
    <div className="min-h-screen py-6 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Your Trips</h1>
          <p className="text-slate-400 mt-1">
            {trips.length > 0
              ? `${trips.length} trip${trips.length > 1 ? 's' : ''} tracked`
              : 'Start by creating your first trip'}
          </p>
        </div>

        {trips.length === 0 ? (
          /* ---- Empty state ---- */
          <div className="bg-white/[0.05] backdrop-blur-md rounded-2xl border border-dashed border-white/[0.15] p-8 sm:p-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/25">
              <MapPin className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No trips yet</h2>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">
              Create your first trip to start tracking and splitting expenses with friends.
            </p>
            <Link href="/trips/new">
              <Button size="lg">
                <Plus className="w-5 h-5" />
                Create Your First Trip
              </Button>
            </Link>
          </div>
        ) : (
          /* ---- Trip cards ---- */
          <div className="grid gap-4">
            {trips.map((trip, index) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="card-3d group relative bg-white/[0.05] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 transition-all duration-200 hover:border-amber-500/30 hover:bg-white/[0.08] cursor-pointer"
                style={{ animationDelay: `${index * 60}ms`, animation: 'fadeInUp 0.4s ease-out both' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors truncate">
                      {trip.name}
                    </h3>
                    {trip.description && (
                      <p className="text-slate-400 text-sm mb-3 line-clamp-1">{trip.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {new Date(trip.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {trip.members.length} member{trip.members.length !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5" />
                        <span className="font-semibold text-white">{trip._count.expenses}</span>{' '}
                        expense{trip._count.expenses !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-400 border border-amber-500/25">
                      {trip.currency}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
    </>
  );
}
