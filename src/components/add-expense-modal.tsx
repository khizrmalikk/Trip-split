'use client';

import { useState } from 'react';
import { X, DollarSign, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { COMMON_CURRENCIES } from '@/lib/currency';
import { useToast } from './ui/toast';

const selectClass =
  'flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white transition-colors focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 [&>option]:bg-slate-900 [&>option]:text-white';

const labelClass = 'text-sm font-medium text-slate-300 mb-2 block';

interface Member {
  id: string;
  name: string;
}

interface AddExpenseModalProps {
  tripId: string;
  currency: string;
  members: Member[];
  currentUserId?: string;
  userRole?: 'creator' | 'member';
  onClose: () => void;
  onSuccess: () => void;
}

export function AddExpenseModal({
  tripId,
  currency,
  members,
  currentUserId,
  userRole,
  onClose,
  onSuccess,
}: AddExpenseModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: currency,
    paidById: currentUserId || members[0]?.id || '',
    splitType: 'equal' as 'equal' | 'custom' | 'pair',
    splitWith: [] as string[],
  });

  const isMember = userRole === 'member';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          paidById: formData.paidById,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          description: formData.description,
          splitType: formData.splitType,
          splitWith: formData.splitWith.length > 0 ? formData.splitWith : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.pending) {
          toast.success('Expense submitted for approval');
        } else {
          toast.success('Expense added successfully');
        }
        onSuccess();
        onClose();
      } else {
        toast.error('Failed to add expense');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to add expense');
      setLoading(false);
    }
  };

  const toggleMember = (memberId: string) => {
    setFormData({
      ...formData,
      splitWith: formData.splitWith.includes(memberId)
        ? formData.splitWith.filter(id => id !== memberId)
        : [...formData.splitWith, memberId],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0D1530]/95 backdrop-blur-xl border-white/[0.1]">
        <CardHeader className="border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              {isMember ? 'Submit Expense' : 'Add Expense'}
            </CardTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Member info banner */}
          {isMember && (
            <div className="flex items-start gap-3 p-3 mb-6 rounded-xl bg-amber-500/[0.08] border border-amber-500/20">
              <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-200/80">
                This expense will be sent to the trip creator for approval.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Description */}
            <Input
              label="What was this expense for?"
              placeholder="e.g., Dinner at restaurant"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            {/* Amount & Currency — inline so currency is impossible to miss */}
            <div>
              <label className={labelClass}>
                Amount <span className="text-red-400">*</span>
              </label>
              <div className="flex rounded-xl border border-white/10 bg-white/[0.06] overflow-hidden focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="flex-1 h-11 px-4 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
                <select
                  className="h-11 px-3 bg-white/[0.08] border-l border-white/10 text-sm font-semibold text-amber-400 focus:outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Who Paid */}
            <div>
              <label className={labelClass}>
                Who paid? <span className="text-red-400">*</span>
              </label>
              <select
                required
                className={selectClass}
                value={formData.paidById}
                onChange={(e) => setFormData({ ...formData, paidById: e.target.value })}
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Split Type */}
            <div>
              <label className={labelClass}>How to split?</label>
              <div className="space-y-2">
                {[
                  { value: 'equal', title: 'Split equally', desc: 'Everyone shares this expense' },
                  { value: 'custom', title: 'Select people', desc: 'Choose who shares this' },
                  { value: 'pair', title: 'Between two people', desc: 'One paid for another' },
                ].map(({ value, title, desc }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                      formData.splitType === value
                        ? 'border-amber-500/60 bg-amber-500/10'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="splitType"
                      value={value}
                      checked={formData.splitType === value}
                      onChange={() => setFormData({ ...formData, splitType: value as 'equal' | 'custom' | 'pair', splitWith: [] })}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{title}</div>
                      <div className="text-sm text-slate-400">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Select Members (for custom or pair) */}
            {(formData.splitType === 'custom' || formData.splitType === 'pair') && (
              <div>
                <label className={labelClass}>
                  {formData.splitType === 'pair' ? 'Select one person' : 'Select people to split with'}
                </label>
                <div className="space-y-2">
                  {members
                    .filter(m => m.id !== formData.paidById)
                    .map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 p-3 border border-white/10 bg-white/[0.04] rounded-xl cursor-pointer hover:bg-white/[0.07] transition-colors"
                      >
                        <input
                          type={formData.splitType === 'pair' ? 'radio' : 'checkbox'}
                          checked={formData.splitWith.includes(member.id)}
                          onChange={() => {
                            if (formData.splitType === 'pair') {
                              setFormData({ ...formData, splitWith: [member.id] });
                            } else {
                              toggleMember(member.id);
                            }
                          }}
                          className="w-4 h-4 accent-amber-500"
                        />
                        <span className="font-medium text-white">{member.name}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading
                  ? (isMember ? 'Submitting...' : 'Adding...')
                  : (isMember ? 'Submit for Approval' : 'Add Expense')
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
