-- Migration: Add Clerk auth, expense requests, and notifications
-- Run this in Supabase SQL Editor

-- 1. Link Clerk users to our users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS clerk_id text UNIQUE;

-- 2. Rename admin role to creator (update existing records)
UPDATE public.trip_members SET role = 'creator' WHERE role = 'admin';

-- 3. Expense requests (when a member proposes an expense, needs creator approval)
CREATE TABLE IF NOT EXISTS public.expense_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  requested_by_id uuid NOT NULL REFERENCES public.users(id),
  expense_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | denied
  review_note text,
  reviewed_by_id uuid REFERENCES public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.expense_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for expense_requests" ON public.expense_requests FOR ALL USING (true) WITH CHECK (true);

-- 4. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- 5. Index for fast notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expense_requests_trip_id ON public.expense_requests(trip_id, status);
