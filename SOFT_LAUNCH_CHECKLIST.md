# PocketFlow soft-launch checklist

## Included in this patched build
- Safer Supabase auth callback redirect handling
- Safer Razorpay verification with order ownership check
- Webhook activation tied to existing payment records when possible
- Basic rate limiting for order creation and payment verification
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
5. Add Razorpay webhook URL in production and test both payment verify path and webhook path
6. Replace support email and legal wording with your final business details
7. Test signup, email confirm, forgot password, payment success, blocked payment, and refund support flow on mobile

## Recommended production environment variables
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `BREVO_API_KEY` (or configure Supabase custom SMTP separately)
- `EMAIL_FROM`
- `SUPPORT_EMAIL`

## Suggested first soft-launch metrics
- signup to payment conversion
- payment success rate
- first transaction saved within first session
- 7-day returning users
- most-used modules: transactions, lend/borrow, investments, assets
