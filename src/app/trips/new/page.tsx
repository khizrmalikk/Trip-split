'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { COMMON_CURRENCIES } from '@/lib/currency';

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    currency: 'USD',
    creatorName: '',
    creatorEmail: '',
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
        router.push(`/trips/${data.trip.id}`);
      } else {
        alert('Failed to create trip');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to create trip');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/trips"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to trips</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create a Trip</h1>
          <p className="text-gray-600">Set up a new trip to start tracking expenses with your friends</p>
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
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Description (optional)
                  </label>
                  <textarea
                    placeholder="e.g., Summer vacation with friends"
                    className="flex min-h-[80px] w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/20"
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
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Default Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/20"
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

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-gray-500 font-medium">Your Info</span>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-4">
                <Input
                  label="Your Name"
                  placeholder="e.g., John Doe"
                  required
                  value={formData.creatorName}
                  onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                />

                <Input
                  label="Email (optional)"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.creatorEmail}
                  onChange={(e) => setFormData({ ...formData, creatorEmail: e.target.value })}
                />
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
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Trip'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Add Friends</h3>
            </div>
            <p className="text-sm text-gray-600">Invite friends after creating the trip</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Track Expenses</h3>
            </div>
            <p className="text-sm text-gray-600">Add expenses in any currency</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Settle Up</h3>
            </div>
            <p className="text-sm text-gray-600">See who owes whom at the end</p>
          </div>
        </div>
      </div>
    </div>
  );
}
