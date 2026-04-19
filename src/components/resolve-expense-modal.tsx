'use client';

import { useState } from 'react';
import { X, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/toast';

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: { name: string };
}

interface ResolveExpenseModalProps {
  expense: Expense;
  onClose: () => void;
  onSuccess: () => void;
}

const options = [
  {
    action: 'mark_settled' as const,
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/[0.15]',
    selectedBg: 'bg-emerald-500/20 border-emerald-500/50',
    title: 'Mark as settled',
    desc: 'This expense has been sorted out manually. Keep the record but exclude from balances.',
  },
  {
    action: 'delete' as const,
    icon: Trash2,
    iconColor: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30 hover:bg-red-500/[0.15]',
    selectedBg: 'bg-red-500/20 border-red-500/50',
    title: 'Delete expense',
    desc: 'Permanently remove this expense and all its splits. This cannot be undone.',
  },
];

export function ResolveExpenseModal({
  expense,
  onClose,
  onSuccess,
}: ResolveExpenseModalProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<'mark_settled' | 'delete' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResolve = async () => {
    if (!selected) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: selected }),
      });

      if (res.ok) {
        toast.success(
          selected === 'delete' ? 'Expense deleted' : 'Expense marked as settled'
        );
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to resolve expense');
        setLoading(false);
      }
    } catch {
      toast.error('Failed to resolve expense');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-[#0D1530]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/15 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Resolve Pending Expense</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expense summary */}
        <div className="mx-6 mt-5 p-4 bg-white/[0.04] border border-white/[0.08] rounded-xl">
          <p className="font-medium text-white">{expense.description}</p>
          <p className="text-sm text-slate-400 mt-1">
            Paid by {expense.paidBy.name} &mdash;{' '}
            <span className="text-white font-semibold">
              {expense.currency} {expense.amount.toFixed(2)}
            </span>
          </p>
        </div>

        {/* Options */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-slate-400">How would you like to resolve this?</p>
          {options.map(({ action, icon: Icon, iconColor, bg, selectedBg, title, desc }) => (
            <label
              key={action}
              className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                selected === action ? selectedBg : bg
              }`}
            >
              <input
                type="radio"
                name="resolution"
                value={action}
                checked={selected === action}
                onChange={() => setSelected(action)}
                className="sr-only"
              />
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
              <div>
                <p className="font-medium text-white">{title}</p>
                <p className="text-sm text-slate-400 mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleResolve}
            disabled={!selected || loading}
          >
            {loading ? 'Resolving…' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
}
