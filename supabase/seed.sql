-- Replace the UUID below with a real auth.users id from your Supabase project.
-- Example:
-- select id, email from auth.users;

-- \set user_uuid 'replace-with-real-user-uuid'

insert into public.categories (user_id, name, kind, color)
values
  ('replace-with-real-user-uuid', 'Food', 'expense', '#f59e0b'),
  ('replace-with-real-user-uuid', 'Travel', 'expense', '#ef4444'),
  ('replace-with-real-user-uuid', 'Salary', 'income', '#10b981'),
  ('replace-with-real-user-uuid', 'Business', 'income', '#60a5fa');

insert into public.payment_methods (user_id, name)
values
  ('replace-with-real-user-uuid', 'UPI'),
  ('replace-with-real-user-uuid', 'Bank'),
  ('replace-with-real-user-uuid', 'Cash'),
  ('replace-with-real-user-uuid', 'Card');

insert into public.transactions (
  user_id,
  transaction_date,
  type,
  amount,
  notes
)
values
  ('replace-with-real-user-uuid', current_date, 'income', 85000, 'Salary credited'),
  ('replace-with-real-user-uuid', current_date - interval '1 day', 'expense', 2750, 'Groceries'),
  ('replace-with-real-user-uuid', current_date - interval '2 day', 'expense', 18000, 'House rent');

insert into public.lend_borrow_entries (
  user_id,
  entry_date,
  person_name,
  type,
  amount,
  amount_settled,
  due_date,
  notes
)
values
  ('replace-with-real-user-uuid', current_date, 'Afsal', 'given', 12000, 0, current_date + interval '2 day', 'Short-term payment'),
  ('replace-with-real-user-uuid', current_date - interval '5 day', 'Niyas', 'borrowed', 7500, 0, current_date - interval '1 day', 'Urgent expense');

insert into public.investments (
  user_id,
  investment_date,
  investment_type,
  platform,
  invested_amount,
  current_value,
  withdrawn_amount
)
values
  ('replace-with-real-user-uuid', current_date - interval '30 day', 'Mutual Fund', 'Groww', 150000, 162500, 0),
  ('replace-with-real-user-uuid', current_date - interval '60 day', 'Stock', 'Zerodha', 120000, 134000, 0);

insert into public.assets (
  user_id,
  asset_name,
  asset_category,
  purchase_date,
  purchase_cost,
  current_value,
  notes
)
values
  ('replace-with-real-user-uuid', 'MacBook Air', 'Electronics', current_date - interval '180 day', 95000, 76000, 'Work device'),
  ('replace-with-real-user-uuid', 'Scooter', 'Vehicle', current_date - interval '300 day', 110000, 90000, 'Daily travel');
