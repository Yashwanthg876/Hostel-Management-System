-- ==========================================
-- COMPLETE SYSTEM FIX (Run This!)
-- Consolidates: Recursion Fix, Profile RLS, Storage, Deletion
-- ==========================================

BEGIN;

-- 1. Helper Function (Security Definer to bypass RLS loops)
create or replace function public.is_admin_or_staff()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('ADMIN', 'STAFF')
  );
end;
$$ language plpgsql security definer;

-- 2. Reset Policies on PROFILES
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins/Staff can view all profiles" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can view own profile"
on public.profiles for select
to authenticated
using ( auth.uid() = id );

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ( auth.uid() = id );

create policy "Admins/Staff can view all profiles"
on public.profiles for select
to authenticated
using ( is_admin_or_staff() );

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check ( auth.uid() = id );

-- 3. Reset Policies on COMPLAINTS
alter table public.complaints enable row level security;

drop policy if exists "View Complaints: Own or Admin" on public.complaints;
drop policy if exists "Create Complaints: Own" on public.complaints;
drop policy if exists "Update Complaints: Admin Only" on public.complaints;
drop policy if exists "Delete Complaints: Admin Only" on public.complaints;

create policy "View Complaints: Own or Admin"
on public.complaints for select
to authenticated
using (
  auth.uid() = user_id 
  or 
  is_admin_or_staff()
);

create policy "Create Complaints: Own"
on public.complaints for insert
to authenticated
with check ( auth.uid() = user_id );

create policy "Update Complaints: Admin Only"
on public.complaints for update
to authenticated
using ( is_admin_or_staff() );

create policy "Delete Complaints: Admin Only"
on public.complaints for delete
to authenticated
using ( is_admin_or_staff() );

-- 4. Reset Policies on EVENTS
alter table public.events enable row level security;

drop policy if exists "View Events: Admin Only" on public.events;
drop policy if exists "Create Events: Authenticated" on public.events;

create policy "View Events: Admin Only"
on public.events for select
to authenticated
using ( is_admin_or_staff() );

create policy "Create Events: Authenticated"
on public.events for insert
to authenticated
with check ( true );

-- 5. Storage Access (Evidence)
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

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

COMMIT;
