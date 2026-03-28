-- Replace 'replace-with-real-user-uuid' with an actual auth.users id.

insert into public.profiles (id, full_name, email, preferred_currency, access_status)
values ('replace-with-real-user-uuid', 'PocketFlow User', 'user@example.com', 'INR', 'active')
on conflict (id) do nothing;

insert into public.user_settings (user_id, profile_name, email, currency)
values ('replace-with-real-user-uuid', 'PocketFlow User', 'user@example.com', 'INR')
on conflict (user_id) do nothing;

insert into public.transactions (user_id, transaction_date, type, title, category, amount, payment_method, notes)
values
  ('replace-with-real-user-uuid', current_date, 'income', 'Salary credited', 'Salary', 85000, 'Bank', 'Monthly salary'),
  ('replace-with-real-user-uuid', current_date - interval '1 day', 'expense', 'Groceries', 'Food', 2750, 'UPI', 'Weekly groceries'),
  ('replace-with-real-user-uuid', current_date - interval '2 day', 'expense', 'House rent', 'Housing', 18000, 'Bank', 'Monthly rent');

insert into public.budgets (user_id, month_start, category, budget_amount)
values
  ('replace-with-real-user-uuid', date_trunc('month', current_date)::date, 'Food', 12000),
  ('replace-with-real-user-uuid', date_trunc('month', current_date)::date, 'Travel', 6000)
on conflict (user_id, month_start, category) do nothing;

insert into public.lend_borrow_entries (user_id, entry_date, person_name, type, amount, amount_settled, due_date, notes)
values
  ('replace-with-real-user-uuid', current_date, 'Afsal', 'given', 12000, 0, current_date + interval '2 day', 'Short-term payment'),
  ('replace-with-real-user-uuid', current_date - interval '5 day', 'Niyas', 'borrowed', 7500, 0, current_date - interval '1 day', 'Urgent expense');

insert into public.investments (user_id, investment_date, investment_type, platform, invested_amount, current_value, withdrawn_amount)
values
  ('replace-with-real-user-uuid', current_date - interval '30 day', 'Mutual Fund', 'Groww', 150000, 162500, 0),
  ('replace-with-real-user-uuid', current_date - interval '60 day', 'Stock', 'Zerodha', 120000, 134000, 0);

insert into public.assets (user_id, asset_name, asset_category, purchase_date, purchase_cost, current_value, notes)
values
  ('replace-with-real-user-uuid', 'MacBook Air', 'Electronics', current_date - interval '180 day', 95000, 76000, 'Work device'),
  ('replace-with-real-user-uuid', 'Scooter', 'Vehicle', current_date - interval '300 day', 110000, 90000, 'Daily travel');
