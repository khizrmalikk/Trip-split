'use client';

import { useState, useEffect } from 'react';
import { X, Check, XCircle, Clock, ChevronDown, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from './ui/toast';

interface ExpenseRequest {
  id: string;
  trip_id: string;
  expense_data: {
    description: string;
    amount: number;
    currency: string;
    paidById: string;
    splitType: string;
    splitWith?: string[];
  };
  status: 'pending' | 'approved' | 'denied';
  review_note: string | null;
  created_at: string;
  requested_by: { id: string; name: string } | null;
}

interface Props {
  tripId: string;
  tripCurrency: string;
  onClose: () => void;
  onApproved: () => void;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function ExpenseRequestsPanel({ tripId, tripCurrency, onClose, onApproved }: Props) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [denyNote, setDenyNote] = useState<Record<string, string>>({});
  const [showDenyInput, setShowDenyInput] = useState<string | null>(null);
  const [showReviewed, setShowReviewed] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
      }
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [tripId]);

  const handleAction = async (requestId: string, action: 'approve' | 'deny') => {
    setActionLoading(requestId);
    try {
      const body: Record<string, string> = { action };
      if (action === 'deny' && denyNote[requestId]) {
        body.note = denyNote[requestId];
      }

      const res = await fetch(`/api/trips/${tripId}/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(action === 'approve' ? 'Expense approved' : 'Request denied');
        // Remove from local state
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: action === 'approve' ? 'approved' : 'denied' } : r))
        );
        if (action === 'approve') {
          onApproved();
        }
        setShowDenyInput(null);
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Action failed');
      }
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const reviewedRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0D1530]/95 backdrop-blur-xl border-white/[0.1]">
        <CardHeader className="border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Expense Requests
              {pendingRequests.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-400 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </CardTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-white/[0.04] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : pendingRequests.length === 0 && reviewedRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No expense requests</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending requests */}
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Check className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => {
                    const ed = req.expense_data;
                    return (
                      <div
                        key={req.id}
                        className="p-4 bg-white/[0.04] border border-white/[0.08] rounded-xl space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white">{ed.description}</h4>
                            <p className="text-sm text-slate-400 mt-0.5">
                              Requested by {req.requested_by?.name ?? 'Unknown'} &bull;{' '}
                              {relativeTime(req.created_at)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="font-bold text-white">
                              {ed.currency} {ed.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">{ed.splitType} split</p>
                          </div>
                        </div>

                        {/* Deny note input */}
                        {showDenyInput === req.id && (
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                              <input
                                type="text"
                                placeholder="Reason for denying (optional)"
                                value={denyNote[req.id] ?? ''}
                                onChange={(e) =>
                                  setDenyNote((prev) => ({ ...prev, [req.id]: e.target.value }))
                                }
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/50"
                              />
                            </div>
                            <button
                              onClick={() => handleAction(req.id, 'deny')}
                              disabled={actionLoading === req.id}
                              className="px-3 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setShowDenyInput(null)}
                              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-white/[0.06] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Action buttons */}
                        {showDenyInput !== req.id && (
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleAction(req.id, 'approve')}
                              disabled={actionLoading === req.id}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm h-9"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </Button>
                            <button
                              onClick={() => setShowDenyInput(req.id)}
                              disabled={actionLoading === req.id}
                              className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 text-sm font-medium bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reviewed requests (collapsed) */}
              {reviewedRequests.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowReviewed((v) => !v)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors w-full cursor-pointer"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${showReviewed ? 'rotate-180' : ''}`}
                    />
                    Previously reviewed ({reviewedRequests.length})
                  </button>

                  {showReviewed && (
                    <div className="mt-3 space-y-2">
                      {reviewedRequests.map((req) => {
                        const ed = req.expense_data;
                        const isApproved = req.status === 'approved';
                        return (
                          <div
                            key={req.id}
                            className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl opacity-70"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium text-white">{ed.description}</h4>
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                      isApproved
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'bg-red-500/15 text-red-400'
                                    }`}
                                  >
                                    {isApproved ? 'Approved' : 'Denied'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {req.requested_by?.name ?? 'Unknown'} &bull; {ed.currency}{' '}
                                  {ed.amount.toFixed(2)}
                                </p>
                                {req.review_note && (
                                  <p className="text-xs text-slate-500 mt-1 italic">
                                    &quot;{req.review_note}&quot;
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
