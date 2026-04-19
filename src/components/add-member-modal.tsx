'use client';

import { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Search, UserCheck, User, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from './ui/toast';

interface UserResult {
  id: string;
  name: string;
  email: string | null;
  hasAccount: boolean;
}

interface AddMemberModalProps {
  tripId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMemberModal({ tripId, onClose, onSuccess }: AddMemberModalProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [mode, setMode] = useState<'search' | 'guest'>('search');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (mode !== 'search' || selected) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&tripId=${tripId}`);
        const data = await res.json();
        setResults(data.users ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, tripId, mode, selected]);

  const addMember = async (payload: { userId?: string; name?: string; email?: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        toast.success(`${payload.name ?? selected?.name} added to the trip`);
        onSuccess();
        onClose();
      } else {
        toast.error(data?.error ?? 'Failed to add member');
      }
    } catch {
      toast.error('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (u: UserResult) => {
    setSelected(u);
    setQuery(u.name);
    setResults([]);
  };

  const handleSubmitExisting = () => {
    if (!selected) return;
    addMember({ userId: selected.id, name: selected.name });
  };

  const handleSubmitGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    addMember({ name: guestName.trim(), email: guestEmail.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-[#0D1530]/95 backdrop-blur-xl border-white/[0.1]">
        <CardHeader className="border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              Add Member
            </CardTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06]">
            <button
              onClick={() => { setMode('search'); setSelected(null); setQuery(''); setResults([]); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'search'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Search className="w-4 h-4" />
              Find User
            </button>
            <button
              onClick={() => { setMode('guest'); setSelected(null); setQuery(''); setResults([]); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'guest'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <User className="w-4 h-4" />
              Add Guest
            </button>
          </div>

          {/* Search mode */}
          {mode === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                  className="w-full h-11 pl-9 pr-4 rounded-xl border border-white/10 bg-white/[0.06] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                  autoFocus
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
                )}
              </div>

              {/* Results */}
              {results.length > 0 && !selected && (
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  {results.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.06] transition-colors text-left border-b border-white/[0.06] last:border-0"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        {u.email && <p className="text-xs text-slate-500 truncate">{u.email}</p>}
                      </div>
                      {u.hasAccount && (
                        <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full flex-shrink-0">
                          Account
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* No results hint */}
              {query.length >= 2 && !searching && results.length === 0 && !selected && (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 mb-2">No users found for &ldquo;{query}&rdquo;</p>
                  <button
                    onClick={() => { setMode('guest'); setGuestName(query); }}
                    className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Add &ldquo;{query}&rdquo; as a guest instead →
                  </button>
                </div>
              )}

              {/* Selected user */}
              {selected && (
                <div className="flex items-center gap-3 p-3 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl">
                  <UserCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{selected.name}</p>
                    {selected.email && <p className="text-xs text-slate-400">{selected.email}</p>}
                  </div>
                  <button
                    onClick={() => { setSelected(null); setQuery(''); }}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button
                  className="flex-1"
                  disabled={!selected || loading}
                  onClick={handleSubmitExisting}
                >
                  {loading ? 'Adding...' : 'Add to Trip'}
                </Button>
              </div>
            </div>
          )}

          {/* Guest mode */}
          {mode === 'guest' && (
            <form onSubmit={handleSubmitGuest} className="space-y-4">
              <div className="p-3 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl">
                <p className="text-xs text-amber-200/70">
                  Guest members don&apos;t have an account. Only creators can log expenses on their behalf.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Jane Doe"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  autoFocus
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.06] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Email <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.06] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Guest'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
