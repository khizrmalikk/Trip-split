'use client';

import { useState, useEffect } from 'react';
import { X, UserMinus, AlertTriangle, Receipt } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/toast';

interface AffectedExpense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  role: 'payer' | 'participant';
}

interface RemoveMemberModalProps {
  tripId: string;
  member: { id: string; name: string };
  onClose: () => void;
  onSuccess: () => void;
}

export function RemoveMemberModal({
  tripId,
  member,
  onClose,
  onSuccess,
}: RemoveMemberModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [affectedExpenses, setAffectedExpenses] = useState<AffectedExpense[]>([]);

  useEffect(() => {
    fetch(`/api/trips/${tripId}/members/${member.id}`)
      .then((res) => res.json())
      .then((data) => {
        setAffectedExpenses(data.affectedExpenses ?? []);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [tripId, member.id]);

  const handleRemove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/members/${member.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.affectedCount > 0) {
          toast.success(
            `${member.name} removed. ${data.affectedCount} expense${data.affectedCount > 1 ? 's' : ''} moved to pending.`
          );
        } else {
          toast.success(`${member.name} removed from trip`);
        }
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to remove member');
        setLoading(false);
      }
    } catch {
      toast.error('Failed to remove member');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-[#0D1530]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/15 border border-red-500/20 rounded-lg">
              <UserMinus className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Remove Member</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <p className="text-slate-300">
            Are you sure you want to remove{' '}
            <span className="text-white font-semibold">{member.name}</span> from this trip?
          </p>

          {checking ? (
            <div className="flex items-center gap-3 text-slate-400 text-sm py-4">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-amber-400 rounded-full animate-spin" />
              Checking affected expenses…
            </div>
          ) : affectedExpenses.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {affectedExpenses.length} expense{affectedExpenses.length > 1 ? 's' : ''} will be marked as pending
                </span>
              </div>

              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl divide-y divide-white/[0.06] max-h-48 overflow-y-auto">
                {affectedExpenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="text-sm text-white truncate max-w-[180px]">
                        {exp.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-sm font-medium text-slate-300">
                        {exp.currency} {exp.amount.toFixed(2)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        exp.role === 'payer'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-slate-500/15 text-slate-400'
                      }`}>
                        {exp.role === 'payer' ? 'paid' : 'split'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-500">
                Pending expenses are excluded from balances until resolved.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              No active expenses affected
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
            onClick={handleRemove}
            disabled={loading || checking}
          >
            {loading ? 'Removing…' : 'Remove Member'}
          </Button>
        </div>
      </div>
    </div>
  );
}
