# PocketFlow Production Starter (Cashfree Edition)

This build moves PocketFlow into a real product-ready structure with Supabase auth, paid-access gating, and Cashfree checkout.

## What is included

- real Supabase auth structure
- protected app routes
- paid-access gating (`pending` vs `active`)
- Supabase-backed CRUD store for:
  - transactions
  - budgets
  - lend / borrow
  - investments
  - assets
  - user settings
- Cashfree order creation route
- Cashfree payment verification route
- Cashfree webhook route
- Brevo transactional email hook
- polished app shell with sign-out and refresh
- `.gitignore` ready for GitHub / Vercel

## Environment variables

Copy `.env.example` to `.env.local`.

```bash
cp .env.example .env.local
```

Required values:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CASHFREE_CLIENT_ID`
- `CASHFREE_CLIENT_ID`
- `CASHFREE_CLIENT_SECRET`
- `CASHFREE_WEBHOOK_SECRET`
- `CASHFREE_ENV`
- `NEXT_PUBLIC_CASHFREE_ENV`
- `BREVO_API_KEY`
- `EMAIL_FROM`
- `SUPPORT_EMAIL`

## Supabase setup

1. Open Supabase SQL Editor.
2. Run `supabase/schema.sql` for a fresh database.
3. If you are upgrading an existing project, run `supabase/migrations/20260329_cashfree_switch.sql`.
4. Create one real user account in the app.
5. Copy that user UUID from `auth.users`.
6. Replace `replace-with-real-user-uuid` inside `supabase/seed.sql`.
7. Run `supabase/seed.sql`.

## Auth flow

- signup creates an auth user
- SQL trigger creates `profiles` and `user_settings`
- login opens the private account
- unpaid users are redirected to `/checkout`
- paid users are allowed into the full app

## Cashfree flow

- `/api/cashfree/create-order` creates an order and stores a `payments` row
- `/api/cashfree/verify` checks the final order status from your backend and activates the profile once the order is `PAID`
- `/api/cashfree/webhook` supports asynchronous payment status updates from Cashfree

Recommended webhook URL:

```text
https://your-domain.com/api/cashfree/webhook
```

## Cashfree dashboard checklist

- add your domain to Cashfree domain whitelisting
- use sandbox keys first
- add your production webhook URL after testing
- keep the webhook secret in Vercel server environment variables only

## Brevo

The app uses the Brevo SMTP API endpoint through `lib/email.ts`.
Use a verified sender like:

```text
PocketFlow <support@pocketflowos.in>
```

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Push this folder to GitHub
2. Import the repo into Vercel
3. Add the same env variables in Vercel Project Settings
4. Deploy
5. Add your custom domain
6. Add the webhook URL in Cashfree
7. Whitelist your production domain in Cashfree

## Important notes

- rotate any secrets that were previously shared in chat
- do not commit `.env.local`
- verify Brevo domain authentication before sending live emails
- keep `SUPABASE_SERVICE_ROLE_KEY`, `CASHFREE_CLIENT_SECRET`, and `CASHFREE_WEBHOOK_SECRET` server-only
- verify payments on the server before unlocking access
