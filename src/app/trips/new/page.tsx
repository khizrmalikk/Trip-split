'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { COMMON_CURRENCIES } from '@/lib/currency';
import { useToast } from '@/components/ui/toast';
import { Navbar } from '@/components/navbar';

const selectClass =
  'flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white transition-colors focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 [&>option]:bg-slate-900 [&>option]:text-white';

export default function NewTripPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    currency: 'USD',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Trip created successfully!');
        router.push(`/trips/${data.trip.id}`);
      } else {
        toast.error(data?.detail ?? data?.error ?? 'Failed to create trip');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to create trip');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Create a Trip</h1>
            <p className="text-slate-400">Set up a new trip to start tracking expenses with your friends</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
              <CardDescription>Fill in the basic information about your trip</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Trip Info */}
                <div className="space-y-4">
                  <Input
                    label="Trip Name"
                    placeholder="e.g., Dubai Trip 2026"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />

                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Description (optional)
                    </label>
                    <textarea
                      placeholder="e.g., Summer vacation with friends"
                      className="flex min-h-[80px] w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white transition-colors placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Start Date"
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                    <Input
                      label="End Date (optional)"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Default Currency <span className="text-red-400">*</span>
                    </label>
                    <select
                      required
                      className={selectClass}
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                      {COMMON_CURRENCIES.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Trip'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/15 rounded-lg border border-amber-500/20">
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white">Add Friends</h3>
              </div>
              <p className="text-sm text-slate-400">Invite friends after creating the trip</p>
            </div>

            <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/15 rounded-lg border border-emerald-500/20">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white">Track Expenses</h3>
              </div>
              <p className="text-sm text-slate-400">Add expenses in any currency</p>
            </div>

            <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-500/15 rounded-lg border border-violet-500/20">
                  <Calendar className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white">Settle Up</h3>
              </div>
              <p className="text-sm text-slate-400">See who owes whom at the end</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
