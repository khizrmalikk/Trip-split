'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Users, Receipt, TrendingUp, DollarSign,
  UserPlus, CheckCircle, Clock, History, UserMinus, Trash2,
  Crown, ClipboardList, Info, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AddExpenseModal } from '@/components/add-expense-modal';
import { AddMemberModal } from '@/components/add-member-modal';
import { RemoveMemberModal } from '@/components/remove-member-modal';
import { ResolveExpenseModal } from '@/components/resolve-expense-modal';
import { ExpenseRequestsPanel } from '@/components/expense-requests-panel';
import { EditTripModal } from '@/components/edit-trip-modal';
import { Navbar } from '@/components/navbar';
import { useToast } from '@/components/ui/toast';
import { useCurrency } from '@/lib/currency-context';
import { getExchangeRates } from '@/lib/currency';

interface Expense {
  id: string;
  description: string;
  amount: number;
  amountUsd: number;
  currency: string;
  date: string;
  status: string;
  paidBy: { name: string };
  splits: Array<{ user_id: string; amount: number }>;
}

interface TripData {
  trip: {
    id: string;
    name: string;
    description: string | null;
    currency: string;
    startDate: string;
    endDate?: string | null;
    currentUserId: string;
    currentUserRole: string;
    members: Array<{
      id: string;
      role: string;
      removed_at: string | null;
      user: { id: string; name: string };
    }>;
    expenses: Expense[];
    pendingExpenses: Expense[];
  };
  balances: Array<{
    userId: string;
    userName: string;
    net: number;
    removed: boolean;
  }>;
  settlements: Array<{
    from: string;
    fromName: string;
    to: string;
    toName: string;
    amount: number;
  }>;
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                            */
/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-7 w-24" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
              <Card>
                <CardHeader><Skeleton className="h-7 w-32" /></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/[0.04] rounded-xl">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><Skeleton className="h-7 w-40" /></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-start justify-between p-4 bg-white/[0.04] rounded-xl">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-20 ml-auto" />
                          <Skeleton className="h-3 w-16 ml-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                     */
/* ------------------------------------------------------------------ */

export default function TripDashboard({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const { toast } = useToast();
  const { currency: displayCurrency, symbol: currencySymbol } = useCurrency();
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [data, setData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [removingMember, setRemovingMember] = useState<{ id: string; name: string } | null>(null);
  const [resolvingExpense, setResolvingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);

  const loadData = () => {
    fetch(`/api/trips/${tripId}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadRequestCount = () => {
    fetch(`/api/trips/${tripId}/requests`)
      .then((res) => res.json())
      .then((d) => {
        const pending = (d.requests ?? []).filter((r: { status: string }) => r.status === 'pending');
        setPendingRequestCount(pending.length);
      })
      .catch(() => {});
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });
      if (res.ok) {
        toast.success('Expense deleted');
        loadData();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch {
      toast.error('Failed to delete expense');
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const promoteToCreator = async (userId: string) => {
    setPromotingUserId(userId);
    try {
      const res = await fetch(`/api/trips/${tripId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'creator' }),
      });
      if (res.ok) {
        toast.success('Member promoted to creator');
        loadData();
      } else {
        const d = await res.json();
        toast.error(d.error ?? 'Failed to promote member');
      }
    } catch {
      toast.error('Failed to promote member');
    } finally {
      setPromotingUserId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [tripId]);

  // Always fetch USD-based rates once. To convert from→to: amount * (rates[to] / rates[from])
  useEffect(() => {
    getExchangeRates('USD').then((r) => setRates(r.rates));
  }, []);

  // Load pending request count for creators
  useEffect(() => {
    if (data?.trip.currentUserRole === 'creator') {
      loadRequestCount();
    }
  }, [data?.trip.currentUserRole, tripId]);

  // rates are USD-based: rates.X = units of X per 1 USD
  // cross-rate formula: amount_from * (rates[to] / rates[from])
  const convert = (amount: number, from: string): string => {
    if (from === displayCurrency) return amount.toFixed(2);
    if (!rates) return amount.toFixed(2);
    const fromRate = rates[from] ?? 1;
    const toRate = rates[displayCurrency] ?? 1;
    return (amount * (toRate / fromRate)).toFixed(2);
  };

  const fmt = (amount: number, from: string) => `${currencySymbol}${convert(amount, from)}`;

  if (loading) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/[0.05] backdrop-blur-md border border-white/[0.08] rounded-2xl p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Trip not found</h2>
          <Link href="/trips" className="text-amber-400 hover:text-amber-300 transition-colors">
            Back to trips
          </Link>
        </div>
      </div>
    );
  }

  const { trip, balances, settlements } = data;
  const isCreator = trip.currentUserRole === 'creator';
  const activeMembers = trip.members.filter((m) => !m.removed_at);
  const removedMembers = trip.members.filter((m) => m.removed_at);
  // Sum amountUsd for a consistent cross-currency total; fall back to amount for old rows
  const totalExpenses = trip.expenses.reduce((sum, e) => sum + (e.amountUsd || e.amount), 0);

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{trip.name}</h1>
                {trip.description && (
                  <p className="text-slate-400">{trip.description}</p>
                )}
                <p className="text-sm text-slate-500 mt-1">
                  Started{' '}
                  {new Date(trip.startDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href={`/trips/${tripId}/history`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all text-sm font-medium"
                >
                  <History className="w-4 h-4" />
                  History
                </Link>

                {isCreator && (
                  <button
                    onClick={() => setShowEditTrip(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all text-sm font-medium cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Trip
                  </button>
                )}

                {/* Expense Requests button (creator only) */}
                {isCreator && (
                  <button
                    onClick={() => setShowRequests(true)}
                    className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all text-sm font-medium cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Requests
                    {pendingRequestCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold px-1.5">
                        {pendingRequestCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Add Member button (creator only) */}
                {isCreator && (
                  <Button variant="outline" onClick={() => setShowAddMember(true)}>
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </Button>
                )}

                <Button onClick={() => setShowAddExpense(true)}>
                  <Plus className="w-4 h-4" />
                  Add Expense
                </Button>
              </div>
            </div>
          </div>

          {/* Member role banner */}
          {!isCreator && (
            <div className="flex items-start gap-3 p-3 mb-6 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
              <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-200/70">
                You are a member. Expenses you add require creator approval.
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/15 border border-amber-500/20 rounded-lg">
                        <DollarSign className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Total Spent</p>
                        <p className="text-2xl font-bold text-white">
                          {fmt(totalExpenses, 'USD')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-500/15 border border-violet-500/20 rounded-lg">
                        <Receipt className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Expenses</p>
                        <p className="text-2xl font-bold text-white">{trip.expenses.length}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/15 border border-emerald-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Members</p>
                        <p className="text-2xl font-bold text-white">{activeMembers.length}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              {/* Pending Expenses */}
              {trip.pendingExpenses.length > 0 && (
                <Card className="border-amber-500/30 bg-amber-500/[0.04]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-400">
                      <Clock className="w-5 h-5" />
                      Pending Resolution
                      <span className="ml-auto text-sm font-normal bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                        {trip.pendingExpenses.length}
                      </span>
                    </CardTitle>
                    <p className="text-sm text-slate-400 mt-1">
                      These expenses involve removed members and need to be resolved.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trip.pendingExpenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-start justify-between p-4 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white">{expense.description}</h4>
                            <p className="text-sm text-slate-400 mt-1">
                              Paid by {expense.paidBy?.name ?? 'Unknown'} &bull;{' '}
                              {new Date(expense.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                            <p className="font-bold text-white">
                              {fmt(expense.amount, expense.currency)}
                            </p>
                            {isCreator && (
                              <button
                                onClick={() => setResolvingExpense(expense)}
                                className="px-3 py-1.5 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors border border-amber-500/30 cursor-pointer"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Balances */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    Balances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {balances
                      .filter((b) => !b.removed)
                      .map((balance) => (
                        <div
                          key={balance.userId}
                          className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                            balance.net > 0
                              ? 'bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/[0.15]'
                              : balance.net < 0
                              ? 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/[0.15]'
                              : 'bg-white/5 border border-white/[0.08] hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                balance.net > 0
                                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                                  : balance.net < 0
                                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                                  : 'bg-gradient-to-br from-slate-500 to-slate-600'
                              }`}
                            >
                              {balance.userName.charAt(0)}
                            </div>
                            <span className="font-medium text-white">{balance.userName}</span>
                          </div>
                          <span
                            className={`text-lg font-bold ${
                              balance.net > 0
                                ? 'text-emerald-400'
                                : balance.net < 0
                                ? 'text-red-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {balance.net > 0 ? '+' : ''}
                            {fmt(Math.abs(balance.net), 'USD')}
                          </span>
                        </div>
                      ))}
                    {balances.filter((b) => !b.removed).length === 0 && (
                      <p className="text-center text-slate-500 py-8">
                        No expenses yet. Add your first expense to see balances!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-violet-400" />
                    Recent Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trip.expenses.slice(0, 10).map((expense) => (
                      <div
                        key={expense.id}
                        className="group relative flex items-start justify-between p-4 bg-white/[0.04] rounded-xl hover:bg-white/[0.06] transition-all duration-200"
                      >
                        {deletingExpenseId === expense.id ? (
                          /* Inline delete confirmation */
                          <div className="flex-1 flex items-center justify-between gap-3">
                            <p className="text-sm text-slate-300">
                              Delete <span className="text-white font-medium">{expense.description}</span>? This cannot be undone.
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => setDeletingExpenseId(null)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-white/[0.06] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => deleteExpense(expense.id)}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <h4 className="font-medium text-white">{expense.description}</h4>
                              <p className="text-sm text-slate-400 mt-1">
                                Paid by {expense.paidBy?.name ?? 'Unknown'} &bull;{' '}
                                {new Date(expense.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="text-right">
                                <p className="font-bold text-white">
                                  {fmt(expense.amount, expense.currency)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Split {expense.splits.length} ways
                                </p>
                              </div>
                              {isCreator && (
                                <button
                                  onClick={() => setDeletingExpenseId(expense.id)}
                                  className="opacity-0 group-hover:opacity-100 mt-0.5 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                  aria-label="Delete expense"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {trip.expenses.length === 0 && (
                      <div className="text-center py-12">
                        <Receipt className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 mb-4">No expenses yet</p>
                        <Button onClick={() => setShowAddExpense(true)}>
                          <Plus className="w-4 h-4" />
                          Add First Expense
                        </Button>
                      </div>
                    )}
                    {trip.expenses.length > 10 && (
                      <Link
                        href={`/trips/${tripId}/history`}
                        className="flex items-center justify-center gap-2 py-3 text-sm text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        View all {trip.expenses.length} expenses
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Active Members */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5 text-emerald-400" />
                      Members
                    </CardTitle>
                    {isCreator && (
                      <button
                        onClick={() => setShowAddMember(true)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white cursor-pointer"
                        aria-label="Add member"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {activeMembers.map((member) => {
                      const memberIsCreator = member.role === 'creator';
                      return (
                        <div
                          key={member.user.id}
                          className="flex items-center gap-3 p-2 rounded-lg group hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-violet-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {member.user.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-white flex-1 flex items-center gap-2">
                            {member.user.name}
                            {memberIsCreator && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 rounded-md border border-amber-500/20">
                                <Crown className="w-2.5 h-2.5" />
                                Creator
                              </span>
                            )}
                          </span>

                          {/* Creator-only actions on non-creator members */}
                          {isCreator && !memberIsCreator && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => promoteToCreator(member.user.id)}
                                disabled={promotingUserId === member.user.id}
                                className="p-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer disabled:opacity-50"
                                aria-label={`Promote ${member.user.name} to creator`}
                                title="Promote to creator"
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setRemovingMember({ id: member.user.id, name: member.user.name })
                                }
                                className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                aria-label={`Remove ${member.user.name}`}
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Removed members */}
                  {removedMembers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/[0.08]">
                      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Removed</p>
                      <div className="space-y-1">
                        {removedMembers.map((member) => (
                          <div
                            key={member.user.id}
                            className="flex items-center gap-3 p-2 opacity-40"
                          >
                            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 text-sm font-semibold flex-shrink-0">
                              {member.user.name.charAt(0)}
                            </div>
                            <span className="text-sm text-slate-500 line-through">
                              {member.user.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Settlements */}
              <Card className="sticky top-8 border-amber-500/25 bg-white/[0.06]">
                <CardHeader>
                  <CardTitle className="text-xl">Settlement</CardTitle>
                  <p className="text-sm text-slate-400 mt-1">
                    Minimize transactions to settle all debts
                  </p>
                </CardHeader>
                <CardContent>
                  {settlements.length > 0 ? (
                    <div className="space-y-4">
                      {settlements.map((settlement, i) => (
                        <div
                          key={i}
                          className="p-4 bg-gradient-to-br from-amber-500/10 to-violet-500/10 border border-amber-500/25 rounded-2xl"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white">{settlement.fromName}</span>
                            <span className="text-xs text-slate-400">pays</span>
                            <span className="font-semibold text-white">{settlement.toName}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-2xl font-bold text-amber-400">
                              {fmt(settlement.amount, 'USD')}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-white/[0.08]">
                        <p className="text-sm text-center text-slate-400">
                          Settled in {settlements.length} transaction
                          {settlements.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <p className="text-emerald-400 font-semibold mb-1">All settled up!</p>
                      <p className="text-sm text-slate-500">No outstanding balances</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showEditTrip && (
          <EditTripModal
            tripId={tripId}
            initial={{
              name: trip.name,
              description: trip.description,
              startDate: trip.startDate,
              endDate: trip.endDate,
              currency: trip.currency,
            }}
            onClose={() => setShowEditTrip(false)}
            onSuccess={loadData}
          />
        )}

        {showAddExpense && data && (
          <AddExpenseModal
            tripId={tripId}
            currency={trip.currency}
            members={activeMembers.map((m) => ({ id: m.user.id, name: m.user.name }))}
            currentUserId={trip.currentUserId}
            userRole={trip.currentUserRole as 'creator' | 'member'}
            onClose={() => setShowAddExpense(false)}
            onSuccess={() => {
              loadData();
              if (isCreator) loadRequestCount();
            }}
          />
        )}

        {showAddMember && (
          <AddMemberModal
            tripId={tripId}
            onClose={() => setShowAddMember(false)}
            onSuccess={loadData}
          />
        )}

        {removingMember && (
          <RemoveMemberModal
            tripId={tripId}
            member={removingMember}
            onClose={() => setRemovingMember(null)}
            onSuccess={loadData}
          />
        )}

        {resolvingExpense && (
          <ResolveExpenseModal
            expense={resolvingExpense}
            onClose={() => setResolvingExpense(null)}
            onSuccess={() => {
              setResolvingExpense(null);
              loadData();
            }}
          />
        )}

        {showRequests && (
          <ExpenseRequestsPanel
            tripId={tripId}
            tripCurrency={trip.currency}
            onClose={() => setShowRequests(false)}
            onApproved={() => {
              loadData();
              loadRequestCount();
            }}
          />
        )}
      </div>
    </>
  );
}
