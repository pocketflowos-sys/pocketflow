alter table if exists public.payments
  add column if not exists provider text not null default 'cashfree',
  add column if not exists provider_order_id text,
  add column if not exists provider_payment_id text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payments'
      and column_name = 'razorpay_order_id'
  ) then
    execute 'alter table public.payments alter column razorpay_order_id drop not null';
    execute $sql$
      update public.payments
      set
        provider = coalesce(provider, case when razorpay_order_id is not null then 'razorpay' else 'cashfree' end),
        provider_order_id = coalesce(provider_order_id, razorpay_order_id),
        provider_payment_id = coalesce(provider_payment_id, razorpay_payment_id)
      where provider_order_id is null or provider_payment_id is null or provider is null
    $sql$;
  end if;
end $$;

alter table public.payments
  alter column provider_order_id set not null;

create unique index if not exists payments_provider_order_id_key on public.payments(provider_order_id);
create unique index if not exists payments_provider_payment_id_key on public.payments(provider_payment_id) where provider_payment_id is not null;
create index if not exists payments_user_id_created_at_idx on public.payments(user_id, created_at desc);
