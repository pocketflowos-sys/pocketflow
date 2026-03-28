# PocketFlow Production Starter

This build takes the earlier PocketFlow prototype and moves it into a real product-ready structure.

## What is now included

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
- Razorpay order creation
- Razorpay payment verification route
- Razorpay webhook route
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
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `BREVO_API_KEY`
- `EMAIL_FROM`
- `SUPPORT_EMAIL`

## Supabase setup

1. Open Supabase SQL Editor.
2. Run `supabase/schema.sql`.
3. Create one real user account in the app.
4. Copy that user UUID from `auth.users`.
5. Replace `replace-with-real-user-uuid` inside `supabase/seed.sql`.
6. Run `supabase/seed.sql`.

## Auth flow

- signup creates an auth user
- SQL trigger creates `profiles` and `user_settings`
- login opens the private account
- unpaid users are redirected to `/checkout`
- paid users are allowed into the full app

## Razorpay flow

- `/api/razorpay/create-order` creates a live test order and stores a `payments` row
- `/api/razorpay/verify` verifies the payment signature and activates the profile
- `/api/razorpay/webhook` supports the production webhook callback

Recommended webhook URL:

```text
https://your-domain.com/api/razorpay/webhook
```

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
6. Add the webhook URL in Razorpay

## Important notes

- rotate any secrets that were previously shared in chat
- do not commit `.env.local`
- use Razorpay **test keys** first
- verify Brevo domain authentication before sending live emails
- keep `SUPABASE_SERVICE_ROLE_KEY` server-only
