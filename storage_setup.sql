-- ==========================================
-- SETUP IMAGES & STORAGE (FIXED v2)
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add 'image_url' column to complaints table
alter table public.complaints 
add column if not exists image_url text;

-- 2. Create 'evidence' Storage Bucket
-- We use ON CONFLICT to avoid errors if it exists
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

-- 3. Create Policies (Safely)
-- We drop first to ensure clean state
drop policy if exists "Authenticated users can upload evidence" on storage.objects;
drop policy if exists "Everyone can view evidence" on storage.objects;

create policy "Authenticated users can upload evidence"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'evidence' );

create policy "Everyone can view evidence"
on storage.objects for select
to public
using ( bucket_id = 'evidence' );
