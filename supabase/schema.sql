create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  preferred_currency text not null default 'INR',
  access_status text not null default 'pending' check (access_status in ('pending', 'active', 'blocked')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  profile_name text default '',
  email text default '',
  currency text not null default 'INR',
  categories text[] not null default array['Food','Housing','Bills','Travel','Shopping','Health','Education','Salary','Business','Investment'],
  payment_methods text[] not null default array['UPI','Bank','Cash','Card','Wallet'],
  investment_types text[] not null default array['Mutual Fund','Stock','FD','Gold','Crypto','Other'],
  investment_platforms text[] not null default array['Groww','Zerodha','Upstox','Bank','Other'],
  asset_categories text[] not null default array['Electronics','Vehicle','Property','Jewellery','Furniture','Other'],
  support_email text default 'support@pocketflowos.in',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_date date not null,
  type text not null check (type in ('income', 'expense')),
  title text not null,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text not null,
  notes text,
  proof_storage_path text,
  proof_file_name text,
  proof_mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_transaction_date_idx on public.transactions(transaction_date desc);
create index if not exists transactions_user_id_transaction_date_idx on public.transactions(user_id, transaction_date desc);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_start date not null,
  category text not null,
  budget_amount numeric(12,2) not null check (budget_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, month_start, category)
);

create index if not exists budgets_user_id_idx on public.budgets(user_id);
create index if not exists budgets_user_id_month_start_idx on public.budgets(user_id, month_start desc);

create table if not exists public.lend_borrow_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  person_name text not null,
  type text not null check (type in ('given', 'borrowed')),
  amount numeric(12,2) not null check (amount >= 0),
  amount_settled numeric(12,2) not null default 0 check (amount_settled >= 0),
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lend_borrow_user_id_idx on public.lend_borrow_entries(user_id);
create index if not exists lend_borrow_user_id_entry_date_idx on public.lend_borrow_entries(user_id, entry_date desc);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_date date not null,
  investment_type text not null,
  platform text not null,
  invested_amount numeric(12,2) not null check (invested_amount >= 0),
  current_value numeric(12,2) not null default 0 check (current_value >= 0),
  withdrawn_amount numeric(12,2) not null default 0 check (withdrawn_amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists investments_user_id_idx on public.investments(user_id);
create index if not exists investments_user_id_investment_date_idx on public.investments(user_id, investment_date desc);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_date date,
  asset_name text not null,
  asset_category text not null,
  purchase_cost numeric(12,2) not null default 0 check (purchase_cost >= 0),
  current_value numeric(12,2) not null default 0 check (current_value >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assets_user_id_idx on public.assets(user_id);
create index if not exists assets_user_id_purchase_date_idx on public.assets(user_id, purchase_date desc);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'cashfree',
  provider_order_id text not null unique,
  provider_payment_id text unique,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  status text not null default 'created',
  verified_at timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_user_id_created_at_idx on public.payments(user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do nothing;

  insert into public.user_settings (user_id, profile_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute procedure public.touch_updated_at();
drop trigger if exists user_settings_touch_updated_at on public.user_settings;
create trigger user_settings_touch_updated_at before update on public.user_settings for each row execute procedure public.touch_updated_at();
drop trigger if exists transactions_touch_updated_at on public.transactions;
create trigger transactions_touch_updated_at before update on public.transactions for each row execute procedure public.touch_updated_at();
drop trigger if exists budgets_touch_updated_at on public.budgets;
create trigger budgets_touch_updated_at before update on public.budgets for each row execute procedure public.touch_updated_at();
drop trigger if exists lend_borrow_touch_updated_at on public.lend_borrow_entries;
create trigger lend_borrow_touch_updated_at before update on public.lend_borrow_entries for each row execute procedure public.touch_updated_at();
drop trigger if exists investments_touch_updated_at on public.investments;
create trigger investments_touch_updated_at before update on public.investments for each row execute procedure public.touch_updated_at();
drop trigger if exists assets_touch_updated_at on public.assets;
create trigger assets_touch_updated_at before update on public.assets for each row execute procedure public.touch_updated_at();
drop trigger if exists payments_touch_updated_at on public.payments;
create trigger payments_touch_updated_at before update on public.payments for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.lend_borrow_entries enable row level security;
alter table public.investments enable row level security;
alter table public.assets enable row level security;
alter table public.payments enable row level security;

drop policy if exists "profiles own row" on public.profiles;
create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "user settings own row" on public.user_settings;
create policy "user settings own row" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions own rows" on public.transactions;
create policy "transactions own rows" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "budgets own rows" on public.budgets;
create policy "budgets own rows" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "lend borrow own rows" on public.lend_borrow_entries;
create policy "lend borrow own rows" on public.lend_borrow_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "investments own rows" on public.investments;
create policy "investments own rows" on public.investments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "assets own rows" on public.assets;
create policy "assets own rows" on public.assets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "payments own rows" on public.payments;
create policy "payments own rows" on public.payments for select using (auth.uid() = user_id);


alter table if exists public.user_settings
  add column if not exists theme text not null default 'dark' check (theme in ('dark', 'light'));

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_name text not null,
  issuer text not null default '',
  billing_date date not null,
  due_date date not null,
  credit_limit numeric(12,2) not null default 0 check (credit_limit >= 0),
  current_balance numeric(12,2) not null default 0 check (current_balance >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credit_cards_user_id_idx on public.credit_cards(user_id);
create index if not exists credit_cards_user_id_due_date_idx on public.credit_cards(user_id, due_date asc);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_name text not null,
  lender text not null default '',
  start_date date not null,
  due_date date,
  principal_amount numeric(12,2) not null default 0 check (principal_amount >= 0),
  outstanding_amount numeric(12,2) not null default 0 check (outstanding_amount >= 0),
  emi_amount numeric(12,2) not null default 0 check (emi_amount >= 0),
  next_emi_date date,
  interest_rate numeric(8,2) not null default 0 check (interest_rate >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loans_user_id_idx on public.loans(user_id);
create index if not exists loans_user_id_next_emi_idx on public.loans(user_id, next_emi_date asc);

alter table public.credit_cards enable row level security;
alter table public.loans enable row level security;

drop policy if exists "credit cards own rows" on public.credit_cards;
create policy "credit cards own rows" on public.credit_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "loans own rows" on public.loans;
create policy "loans own rows" on public.loans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists credit_cards_touch_updated_at on public.credit_cards;
create trigger credit_cards_touch_updated_at before update on public.credit_cards for each row execute procedure public.touch_updated_at();
drop trigger if exists loans_touch_updated_at on public.loans;
create trigger loans_touch_updated_at before update on public.loans for each row execute procedure public.touch_updated_at();
