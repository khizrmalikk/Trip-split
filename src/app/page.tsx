'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowRight,
  Globe,
  Smartphone,
  Calculator,
  Users,
  Receipt,
  TrendingUp,
  Tent,
  Home,
  Plane,
} from 'lucide-react';
import { Logo } from '@/components/logo';

const ThreeHero = dynamic(
  () => import('@/components/three-hero').then((m) => ({ default: m.ThreeHero })),
  { ssr: false },
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#0D1530] to-[#0A0F1E] relative overflow-hidden">
      {/* ---- Hero Section ---- */}
      <div className="relative min-h-[88vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0A0F1E] via-[#0D1530] to-[#0A0F1E]">
        {/* Three.js canvas background */}
        <ThreeHero />

        {/* Animated mesh blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] animate-[meshFloat_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] animate-[meshFloat_10s_ease-in-out_infinite_reverse]" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-500/[0.08] rounded-full blur-[80px] animate-[meshFloat_12s_ease-in-out_infinite_2s]" />
        </div>

        {/* Hero content */}
        <div className="relative z-[2] flex flex-col items-center px-4 py-16 text-center">
          <div className="flex justify-center mb-8">
            <Logo size={72} />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 text-sm text-amber-400 mb-6">
            <Globe className="w-4 h-4" />
            <span>Smart Expense Splitting for Groups</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            <span className="bg-gradient-to-r from-amber-400 via-white to-violet-400 bg-clip-text text-transparent">
              Double Apple
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-white to-violet-400 bg-clip-text text-transparent">
              Pay
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Simplifies shared expense tracking for groups. Whether you&apos;re
            traveling with friends, sharing an apartment, or organizing a group
            dinner&nbsp;&mdash; eliminate the hassle of &ldquo;who owes whom.&rdquo;
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              href="/trips/new"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold py-4 px-8 rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/25 transition-all text-lg hover:-translate-y-0.5"
            >
              Create a Trip
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/trips"
              className="inline-flex items-center justify-center gap-2 bg-white/5 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-xl border border-white/15 hover:bg-white/10 transition-all text-lg"
            >
              View Trips
            </Link>
          </div>
        </div>
      </div>

      {/* ---- Below the fold content ---- */}
      <div className="relative z-10 flex flex-col items-center px-4 py-16">
        <div className="max-w-4xl w-full">
          {/* Example Scenarios */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Real-World Scenarios
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="card-3d bg-white/[0.05] backdrop-blur-md rounded-2xl border border-amber-500/25 p-6 transition-all duration-200 hover:bg-white/[0.08]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25">
                  <Tent className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Weekend Trip</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Alice, Bob &amp; Carol go camping. Alice pays for the Airbnb, Bob buys
                  groceries, Carol covers gas. TripSplit shows who owes whom&nbsp;&mdash;
                  settled in just 2 transactions instead of 6.
                </p>
              </div>

              <div className="card-3d bg-white/[0.05] backdrop-blur-md rounded-2xl border border-emerald-500/25 p-6 transition-all duration-200 hover:bg-white/[0.08]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25">
                  <Home className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Shared Apartment</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Four roommates track monthly expenses. Rent, utilities, groceries split
                  equally. At month-end, see exactly who owes what with minimal payments.
                </p>
              </div>

              <div className="card-3d bg-white/[0.05] backdrop-blur-md rounded-2xl border border-violet-500/25 p-6 transition-all duration-200 hover:bg-white/[0.08]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/25">
                  <Plane className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">International Trip</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Friends backpacking through Europe pay in Euros, Pounds, and Swiss Francs.
                  Everything converts to one currency automatically.
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white/[0.04] backdrop-blur-md rounded-3xl border border-white/[0.08] p-8 sm:p-10 mb-12">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">How it works</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/25">
                  <Users className="w-8 h-8 text-amber-400" />
                </div>
                <div className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Step 1
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Create a trip</h3>
                <p className="text-sm text-slate-400">
                  Set up a trip and invite friends as members
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/25">
                  <Receipt className="w-8 h-8 text-amber-400" />
                </div>
                <div className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Step 2
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Add expenses</h3>
                <p className="text-sm text-slate-400">
                  Log who paid for what, in any currency
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/25">
                  <Calculator className="w-8 h-8 text-amber-400" />
                </div>
                <div className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Step 3
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Settle up</h3>
                <p className="text-sm text-slate-400">
                  Smart algorithm minimizes transactions to the fewest possible
                </p>
              </div>
            </div>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
              <Users className="w-4 h-4" />
              Create trips &amp; add members
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
              <TrendingUp className="w-4 h-4" />
              Flexible split types
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
              <Receipt className="w-4 h-4" />
              Real-time balance tracking
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
              <Calculator className="w-4 h-4" />
              Optimized settlements
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
              <Globe className="w-4 h-4" />
              Multi-currency support
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
              <Smartphone className="w-4 h-4" />
              Mobile-responsive
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
