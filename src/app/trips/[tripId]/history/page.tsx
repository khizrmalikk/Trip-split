'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Receipt, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/navbar';
import { ResolveExpenseModal } from '@/components/resolve-expense-modal';
import { useToast } from '@/components/ui/toast';

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  status: 'active' | 'pending' | 'settled';
  splitType: string;
  paidBy: { id: string; name: string };
  splits: Array<{ user_id: string; amount: number }>;
}

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    icon: Receipt,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    dot: 'bg-amber-400',
  },
  settled: {
    label: 'Settled',
    icon: CheckCircle,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/20',
    dot: 'bg-slate-500',
  },
};

function HistorySkeleton() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48 mb-6" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 bg-white/[0.04] rounded-xl flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

type Filter = 'all' | 'active' | 'pending' | 'settled';

export default function HistoryPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tripName, setTripName] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [resolving, setResolving] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const deleteExpense = async (expenseId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });
      if (res.ok) {
        toast.success('Expense deleted');
        loadHistory();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch {
      toast.error('Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  };

  const loadHistory = () => {
    Promise.all([
      fetch(`/api/trips/${tripId}/history`).then((r) => r.json()),
      fetch(`/api/trips/${tripId}`).then((r) => r.json()),
    ])
      .then(([historyData, tripData]) => {
        setExpenses(historyData.expenses ?? []);
        setTripName(tripData.trip?.name ?? 'Trip');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, [tripId]);

  if (loading) return <HistorySkeleton />;

  const filtered =
    filter === 'all' ? expenses : expenses.filter((e) => e.status === filter);

  const counts = {
    all: expenses.length,
    active: expenses.filter((e) => e.status === 'active').length,
    pending: expenses.filter((e) => e.status === 'pending').length,
    settled: expenses.filter((e) => e.status === 'settled').length,
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/trips/${tripId}`}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {tripName}
            </Link>
            <h1 className="text-3xl font-bold text-white">Transaction History</h1>
            <p className="text-slate-400 mt-1">{expenses.length} total expenses</p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(['all', 'active', 'pending', 'settled'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  filter === f
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                    : 'bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="ml-1.5 text-xs opacity-70">({counts[f]})</span>
              </button>
            ))}
          </div>

          {/* Expense list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-violet-400" />
                {filter === 'all' ? 'All Expenses' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Expenses`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <p className="text-center text-slate-500 py-12">No expenses found</p>
              ) : (
                <div className="space-y-3">
                  {filtered.map((expense) => {
                    const cfg = STATUS_CONFIG[expense.status] ?? STATUS_CONFIG.active;
                    const isConfirmingDelete = deletingId === expense.id;
                    return (
                      <div
                        key={expense.id}
                        className="group flex items-start gap-4 p-4 bg-white/[0.04] rounded-xl hover:bg-white/[0.06] transition-all"
                      >
                        {/* Status dot */}
                        <div className="mt-1.5 flex-shrink-0">
                          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {isConfirmingDelete ? (
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <p className="text-sm text-slate-300">
                                Delete <span className="text-white font-medium">{expense.description}</span>? This cannot be undone.
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-white/[0.06] hover:bg-white/10 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => deleteExpense(expense.id)}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h4 className="font-medium text-white truncate">
                                    {expense.description}
                                  </h4>
                                  <p className="text-sm text-slate-400 mt-0.5">
                                    Paid by {expense.paidBy?.name ?? 'Unknown'} &bull;{' '}
                                    {new Date(expense.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </p>
                                </div>
                                <div className="flex items-start gap-2 flex-shrink-0">
                                  <div className="text-right">
                                    <p className="font-bold text-white">
                                      {expense.currency} {expense.amount.toFixed(2)}
                                    </p>
                                    <span
                                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1 ${cfg.bg} ${cfg.color}`}
                                    >
                                      {expense.status}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => setDeletingId(expense.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all mt-0.5"
                                    aria-label="Delete expense"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Resolve button for pending */}
                              {expense.status === 'pending' && (
                                <button
                                  onClick={() => setResolving(expense)}
                                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Resolve this expense
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {resolving && (
        <ResolveExpenseModal
          expense={resolving}
          onClose={() => setResolving(null)}
          onSuccess={() => {
            setResolving(null);
            loadHistory();
          }}
        />
      )}
    </>
  );
}
