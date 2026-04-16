'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Users, Receipt, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TripData {
  trip: {
    id: string;
    name: string;
    description: string | null;
    currency: string;
    startDate: string;
    members: Array<{
      user: {
        id: string;
        name: string;
      };
    }>;
    expenses: Array<{
      id: string;
      description: string;
      amount: number;
      currency: string;
      date: string;
      paidBy: {
        name: string;
      };
      splits: Array<{
        userId: string;
        amount: number;
      }>;
    }>;
  };
  balances: Array<{
    userId: string;
    userName: string;
    net: number;
  }>;
  settlements: Array<{
    from: string;
    fromName: string;
    to: string;
    toName: string;
    amount: number;
  }>;
}

export default function TripDashboard({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const [data, setData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);

  useEffect(() => {
    fetch(`/api/trips/${tripId}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tripId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading trip...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip not found</h2>
          <Link href="/trips" className="text-blue-600 hover:text-blue-700">
            ← Back to trips
          </Link>
        </div>
      </div>
    );
  }

  const { trip, balances, settlements } = data;
  const totalExpenses = trip.expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/trips"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to trips</span>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{trip.name}</h1>
              {trip.description && (
                <p className="text-gray-600">{trip.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Started {new Date(trip.startDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <Button onClick={() => setShowAddExpense(true)}>
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Stats & Balances */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {trip.currency} {totalExpenses.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Receipt className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expenses</p>
                      <p className="text-2xl font-bold text-gray-900">{trip.expenses.length}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Members</p>
                      <p className="text-2xl font-bold text-gray-900">{trip.members.length}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Balances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Balances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {balances.map((balance) => (
                    <div
                      key={balance.userId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {balance.userName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{balance.userName}</span>
                      </div>
                      <span
                        className={`text-lg font-bold ${
                          balance.net > 0
                            ? 'text-green-600'
                            : balance.net < 0
                            ? 'text-red-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {balance.net > 0 ? '+' : ''}
                        {trip.currency} {Math.abs(balance.net).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {balances.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
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
                  <Receipt className="w-5 h-5" />
                  Recent Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trip.expenses.slice(0, 10).map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{expense.description}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Paid by {expense.paidBy.name} •{' '}
                          {new Date(expense.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {expense.currency} {expense.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Split {expense.splits.length} ways
                        </p>
                      </div>
                    </div>
                  ))}
                  {trip.expenses.length === 0 && (
                    <div className="text-center py-12">
                      <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No expenses yet</p>
                      <Button onClick={() => setShowAddExpense(true)}>
                        <Plus className="w-4 h-4" />
                        Add First Expense
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settlements */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-xl">💰 Settlement</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Minimize transactions to settle all debts
                </p>
              </CardHeader>
              <CardContent>
                {settlements.length > 0 ? (
                  <div className="space-y-4">
                    {settlements.map((settlement, i) => (
                      <div
                        key={i}
                        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">{settlement.fromName}</span>
                          <span className="text-xs text-gray-500">pays</span>
                          <span className="font-semibold text-gray-900">{settlement.toName}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-2xl font-bold text-blue-600">
                            {trip.currency} {settlement.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t">
                      <p className="text-sm text-center text-gray-600">
                        ✨ Settled in {settlements.length} transaction{settlements.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">All settled up! 🎉</p>
                    <p className="text-sm text-gray-500">No outstanding balances</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
