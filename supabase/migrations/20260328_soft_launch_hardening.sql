alter table public.user_settings
  alter column asset_categories set default array['Electronics','Vehicle','Property','Jewellery','Furniture','Other'];

create index if not exists transactions_user_id_transaction_date_idx on public.transactions(user_id, transaction_date desc);
create index if not exists budgets_user_id_month_start_idx on public.budgets(user_id, month_start desc);
create index if not exists lend_borrow_user_id_entry_date_idx on public.lend_borrow_entries(user_id, entry_date desc);
create index if not exists investments_user_id_investment_date_idx on public.investments(user_id, investment_date desc);
create index if not exists assets_user_id_purchase_date_idx on public.assets(user_id, purchase_date desc);
