'use client';

import { useState } from 'react';
import { X, Pencil } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { COMMON_CURRENCIES } from '@/lib/currency';
import { useToast } from './ui/toast';

const selectClass =
  'flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white transition-colors focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 [&>option]:bg-slate-900 [&>option]:text-white';

interface EditTripModalProps {
  tripId: string;
  initial: {
    name: string;
    description: string | null;
    startDate: string;
    endDate?: string | null;
    currency: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTripModal({ tripId, initial, onClose, onSuccess }: EditTripModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initial.name,
    description: initial.description ?? '',
    startDate: initial.startDate ? initial.startDate.slice(0, 10) : '',
    endDate: initial.endDate ? initial.endDate.slice(0, 10) : '',
    currency: initial.currency,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Trip updated');
        onSuccess();
        onClose();
      } else {
        const d = await res.json();
        toast.error(d.error ?? 'Failed to update trip');
      }
    } catch {
      toast.error('Failed to update trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg bg-[#0D1530]/95 backdrop-blur-xl border-white/[0.1]">
        <CardHeader className="border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-amber-400" />
              Edit Trip
            </CardTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Trip Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Description</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Currency</label>
              <select
                className={selectClass}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
