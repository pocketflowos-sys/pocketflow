create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  preferred_currency text default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on public.categories(user_id);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_methods_user_id_idx on public.payment_methods(user_id);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_date date not null,
  type text not null check (type in ('income', 'expense')),
  category_id uuid references public.categories(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_transaction_date_idx on public.transactions(transaction_date desc);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_start date not null,
  category_id uuid references public.categories(id) on delete cascade,
  budget_amount numeric(12,2) not null check (budget_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists budgets_user_id_idx on public.budgets(user_id);
create unique index if not exists budgets_unique_month_category_idx
  on public.budgets(user_id, month_start, category_id);

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
create index if not exists lend_borrow_due_date_idx on public.lend_borrow_entries(due_date);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_date date not null,
  investment_type text not null,
  platform text,
  invested_amount numeric(12,2) not null check (invested_amount >= 0),
  current_value numeric(12,2) not null default 0 check (current_value >= 0),
  withdrawn_amount numeric(12,2) not null default 0 check (withdrawn_amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists investments_user_id_idx on public.investments(user_id);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_name text not null,
  asset_category text,
  purchase_date date,
  purchase_cost numeric(12,2) not null default 0 check (purchase_cost >= 0),
  current_value numeric(12,2) not null default 0 check (current_value >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assets_user_id_idx on public.assets(user_id);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  theme text default 'dark',
  locale text default 'en-IN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.payment_methods enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.lend_borrow_entries enable row level security;
alter table public.investments enable row level security;
alter table public.assets enable row level security;
alter table public.user_settings enable row level security;

create policy "profiles own row" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "categories own rows" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "payment methods own rows" on public.payment_methods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions own rows" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budgets own rows" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "lend borrow own rows" on public.lend_borrow_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "investments own rows" on public.investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "assets own rows" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user settings own rows" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
