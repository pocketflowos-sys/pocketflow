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
