'use client';

import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { COMMON_CURRENCIES } from '@/lib/currency';

interface Member {
  id: string;
  name: string;
}

interface AddExpenseModalProps {
  tripId: string;
  currency: string;
  members: Member[];
  currentUserId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddExpenseModal({
  tripId,
  currency,
  members,
  currentUserId,
  onClose,
  onSuccess,
}: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: currency,
    paidById: currentUserId || members[0]?.id || '',
    splitType: 'equal' as 'equal' | 'custom' | 'pair',
    splitWith: [] as string[],
  });

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
        onSuccess();
        onClose();
      } else {
        alert('Failed to add expense');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to add expense');
      setLoading(false);
    }
  };

  const toggleMember = (memberId: string) => {
    if (formData.splitWith.includes(memberId)) {
      setFormData({
        ...formData,
        splitWith: formData.splitWith.filter(id => id !== memberId),
      });
    } else {
      setFormData({
        ...formData,
        splitWith: [...formData.splitWith, memberId],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Add Expense
            </CardTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Description */}
            <Input
              label="What was this expense for?"
              placeholder="e.g., Dinner at restaurant"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            {/* Amount & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Currency
                </label>
                <select
                  className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/20"
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Who paid? <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/20"
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
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                How to split?
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="radio"
                    name="splitType"
                    value="equal"
                    checked={formData.splitType === 'equal'}
                    onChange={(e) => setFormData({ ...formData, splitType: 'equal', splitWith: [] })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Split equally</div>
                    <div className="text-sm text-gray-600">Everyone shares this expense</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="radio"
                    name="splitType"
                    value="custom"
                    checked={formData.splitType === 'custom'}
                    onChange={(e) => setFormData({ ...formData, splitType: 'custom', splitWith: [] })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Select people</div>
                    <div className="text-sm text-gray-600">Choose who shares this</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="radio"
                    name="splitType"
                    value="pair"
                    checked={formData.splitType === 'pair'}
                    onChange={(e) => setFormData({ ...formData, splitType: 'pair', splitWith: [] })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Between two people</div>
                    <div className="text-sm text-gray-600">One paid for another</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Select Members (for custom or pair) */}
            {(formData.splitType === 'custom' || formData.splitType === 'pair') && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  {formData.splitType === 'pair' ? 'Select one person' : 'Select people to split with'}
                </label>
                <div className="space-y-2">
                  {members
                    .filter(m => m.id !== formData.paidById) // Don't show the payer
                    .map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
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
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="font-medium text-gray-900">{member.name}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
