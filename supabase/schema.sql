-- TripSplit Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  phone text,
  created_at timestamptz default now()
);

-- Trips table
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz,
  currency text not null default 'USD',
  created_at timestamptz default now()
);

-- Trip members
create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  removed_at timestamptz,
  unique(trip_id, user_id)
);

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  paid_by_id uuid not null references public.users(id),
  amount float8 not null,
  currency text not null default 'USD',
  description text not null,
  category text,
  date timestamptz default now(),
  split_type text not null,
  status text not null default 'active',
  created_at timestamptz default now()
);

-- Expense splits
create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null,
  amount float8 not null,
  settled boolean not null default false,
  unique(expense_id, user_id)
);

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;

-- Permissive policies (no auth yet)
create policy "Allow all for users" on public.users for all using (true) with check (true);
create policy "Allow all for trips" on public.trips for all using (true) with check (true);
create policy "Allow all for trip_members" on public.trip_members for all using (true) with check (true);
create policy "Allow all for expenses" on public.expenses for all using (true) with check (true);
create policy "Allow all for expense_splits" on public.expense_splits for all using (true) with check (true);
