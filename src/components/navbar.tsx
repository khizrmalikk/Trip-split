'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ChevronDown, Check } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import { Logo } from '@/components/logo';
import { COMMON_CURRENCIES } from '@/lib/currency';
import { useCurrency } from '@/lib/currency-context';
import { NotificationBell } from '@/components/notification-bell';

export function Navbar() {
  const { currency, setCurrency, symbol } = useCurrency();
  const { isSignedIn, isLoaded } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync Clerk user to DB on mount (only when signed in)
  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/auth/sync', { method: 'POST' }).catch(() => {});
    }
  }, [isSignedIn]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.06] shadow-xl shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Left: Logo + Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Logo size={28} />
          <span className="font-semibold text-amber-400 hidden xs:inline sm:inline">Double Apple Pay</span>
        </Link>

        {/* Right: Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Picker */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
              aria-label="Select currency"
            >
              <span className="text-amber-400 font-semibold">{symbol}</span>
              <span className="hidden sm:inline">{currency}</span>
              <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Display Currency
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {COMMON_CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                        currency === c.code
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium w-5 text-center">{c.symbol}</span>
                        <span>{c.code}</span>
                        <span className="text-slate-500 text-xs">{c.name}</span>
                      </span>
                      {currency === c.code && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/trips"
            className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            My Trips
          </Link>

          {/* Auth-aware section */}
          {isLoaded && isSignedIn ? (
            <>
              <NotificationBell />
              <UserButton />
            </>
          ) : isLoaded ? (
            <Link
              href="/sign-in"
              className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              Sign in
            </Link>
          ) : null}

          <Link
            href="/trips/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 sm:px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Trip</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
