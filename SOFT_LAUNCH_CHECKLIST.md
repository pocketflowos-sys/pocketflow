# PocketFlow soft-launch checklist

## Included in this patched build
- Cashfree checkout integration on the frontend
- Cashfree create-order, verify, and webhook routes
- Payment verification moved to server-side Cashfree order status checks
- Webhook signature verification for Cashfree
- Payments table made provider-agnostic (`provider_order_id`, `provider_payment_id`)
- Settings row creation no longer overwrites saved settings on refresh
- Email update flow reordered to avoid profile/settings changing before auth update request succeeds
- Dashboard wording updated from "Current balance" to "Tracked balance"
- Landing page copy adjusted to match the real product promise: manual money tracking clarity
- Added Privacy Policy, Terms, Refund Policy, Support, Forgot Password, and Update Password pages
- Added composite indexes to the SQL schema for better per-user query performance
- Removed `Cash` from default asset categories to reduce double-counting risk

## Still required before public launch
1. Rotate every secret that may have been exposed in old shared archives
2. Deploy from clean source only (`.env.local`, `.next`, and `node_modules` must not be shipped)
3. Add your production domain and all auth redirect URLs in Supabase
4. Configure custom SMTP in Supabase for reliable signup and password reset emails
5. Add the Cashfree webhook URL in production and test both create-order and verification flows
6. Whitelist your production domain inside Cashfree before going live
7. Replace support email and legal wording with your final business details
8. Test signup, email confirm, forgot password, payment success, canceled payment, blocked payment, and refund support flow on mobile

## Recommended production environment variables
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CASHFREE_CLIENT_ID`
- `CASHFREE_CLIENT_ID`
- `CASHFREE_CLIENT_SECRET`
- `CASHFREE_WEBHOOK_SECRET`
- `CASHFREE_ENV`
- `NEXT_PUBLIC_CASHFREE_ENV`
- `BREVO_API_KEY` (or configure Supabase custom SMTP separately)
- `EMAIL_FROM`
- `SUPPORT_EMAIL`

## Suggested first soft-launch metrics
- signup to payment conversion
- payment success rate
- first transaction saved within first session
- 7-day returning users
- most-used modules: transactions, lend/borrow, investments, assets
