# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
# Development (use npm)
npm run dev        # Start dev server
npm run build      # next build
npm start          # Start production server
npm run lint       # ESLint via next lint
```

Requires env vars in `.env`: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Architecture

**Stack:** Next.js 16 (App Router) · TypeScript · Supabase (PostgreSQL) · Tailwind CSS v4 · Zustand · TanStack Query

### Data Model

```
User → TripMember ← Trip
                      ↓
                   Expense → ExpenseSplit
```

- `TripMember` links users to trips with a role (`admin` | `member`)
- `Expense` stores the payer (`paidById`) and `splitType` (`equal` | `custom` | `pair`)
- `ExpenseSplit` stores per-user owed amounts; `settled` flag tracks payment

### API Routes (`src/app/api/`)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/trips` | GET, POST | List all trips; create trip (also upserts creator User) |
| `/api/trips/[tripId]` | GET | Trip detail + computed balances + settlement plan |
| `/api/trips/[tripId]/members` | POST | Add a member to a trip by name + optional email |
| `/api/expenses` | POST | Create expense + splits |

The `GET /api/trips/[tripId]` response shape is `{ trip, balances, settlements }`. Balances and settlements are computed server-side on every request (no caching).

### Settlement Algorithm (`src/lib/settlement.ts`)

`calculateSettlements(balances)` minimizes the number of transactions using a greedy debtor/creditor matching approach. Net balance = total paid − total owed.

### Key Libraries

- `src/lib/supabase.ts` — Supabase client (uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `src/lib/currency.ts` — `getExchangeRates` / `convertCurrency` with 1-hour in-memory cache; `COMMON_CURRENCIES` list
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `src/components/ui/` — minimal shadcn-style primitives (Button, Card, Input, Skeleton, Toast)

### Database

Schema is in `supabase/schema.sql`. Run it once in the Supabase SQL Editor to create all tables and permissive RLS policies. Tables use snake_case columns; API routes map to camelCase for the frontend. No auth yet — RLS policies allow all operations.

### Routing

```
/               → Landing / redirect
/trips          → Trip list
/trips/new      → Create trip form
/trips/[tripId] → Trip dashboard (expenses, balances, settlements)
```

`/trips/[tripId]/page.tsx` is a client component that fetches data via `fetch()` directly (not TanStack Query yet). `params` is a Promise in Next.js 16 — unwrap with `use(params)`.
