-- Migration: Add member removal and expense status support
-- Run this in Supabase SQL Editor if you already ran schema.sql

ALTER TABLE public.trip_members
  ADD COLUMN IF NOT EXISTS removed_at timestamptz;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
