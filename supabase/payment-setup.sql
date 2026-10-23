-- Jalankan file ini sekali di Supabase SQL Editor.
-- Dipakai untuk menyimpan bukti pembayaran QRIS dan hasil pemeriksaan otomatis.

alter table public.orders
  add column if not exists payment_status text,
  add column if not exists payment_proof_path text,
  add column if not exists payment_ai_result jsonb,
  add column if not exists payment_uploaded_at timestamptz,
  add column if not exists payment_approved_at timestamptz,
  add column if not exists payment_review_note text,
  add column if not exists payment_proof_hash text,
  add column if not exists payment_upload_count integer default 0;

update public.orders
set payment_status = 'unpaid'
where payment_status is null;

update public.orders
set payment_upload_count = 0
where payment_upload_count is null;

alter table public.orders
  alter column payment_status set default 'unpaid',
  alter column payment_status set not null,
  alter column payment_upload_count set default 0,
  alter column payment_upload_count set not null;

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('unpaid', 'review', 'paid', 'rejected'));

create index if not exists orders_payment_proof_hash_idx
  on public.orders (payment_proof_hash)
  where payment_proof_hash is not null;

-- Bucket private untuk bukti pembayaran.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Akses file hanya lewat service role di server (signed URL).
-- Tidak perlu policy publik untuk bucket ini.
