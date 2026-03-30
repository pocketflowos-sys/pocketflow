alter table if exists public.transactions
  add column if not exists proof_storage_path text,
  add column if not exists proof_file_name text,
  add column if not exists proof_mime_type text;

insert into storage.buckets (id, name, public, file_size_limit)
values ('transaction-proofs', 'transaction-proofs', false, 10485760)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "transaction proofs select own" on storage.objects;
create policy "transaction proofs select own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'transaction-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "transaction proofs insert own" on storage.objects;
create policy "transaction proofs insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'transaction-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "transaction proofs update own" on storage.objects;
create policy "transaction proofs update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'transaction-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'transaction-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "transaction proofs delete own" on storage.objects;
create policy "transaction proofs delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'transaction-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
