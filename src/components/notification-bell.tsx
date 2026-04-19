'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
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

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // silent fail
    }
  }, []);

  // Fetch on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayNotifications = notifications.slice(0, 10);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      await fetchNotifications();
    } catch {
      // silent fail
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/40 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          {displayNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No notifications yet</p>
            </div>
          ) : (
            <div className="py-1">
              {displayNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 transition-colors hover:bg-white/[0.04] ${
                    !n.read
                      ? 'border-l-2 border-l-amber-500 bg-amber-500/[0.04]'
                      : 'border-l-2 border-l-transparent'
                  }`}
                >
                  <p className="font-medium text-white text-sm leading-snug">
                    {n.title}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5 leading-snug">
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {relativeTime(n.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
