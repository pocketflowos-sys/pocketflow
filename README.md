# PocketFlow Phase 4

PocketFlow Phase 4 makes the local VS Code build more like a real product.

## Included now

- premium landing page
- auth screens
- functional dashboard with local persistence
- transactions page with search, filters, CSV export, edit, delete
- budget planner with month-based tracking
- lend / borrow tracker with overdue highlights
- investments page with returns and allocation view
- assets page with grouped value tracking
- settings managers for categories, payment methods, investment types, platforms, asset categories, and preferred currency
- Razorpay placeholder routes
- Supabase schema and seed files for the next real-data phase

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

- `/` landing page
- `/dashboard`
- `/transactions`
- `/budgets`
- `/lend-borrow`
- `/investments`
- `/assets`
- `/settings`

## Current storage mode

This phase still uses browser localStorage for demo functionality.

## Best next phase

- replace localStorage with real Supabase auth + CRUD
- add user-specific database sync
- connect Razorpay success flow to paid access logic
- connect email delivery after payment
- protect app routes by real login state


## Git / GitHub-safe structure
This package intentionally excludes build artifacts and dependencies. After extracting, run `npm install` locally to generate `node_modules`. The included `.gitignore` already prevents `node_modules`, `.next`, `.env.local`, `.vercel`, and `*.tsbuildinfo` from being committed.
