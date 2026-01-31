-- ==========================================
-- FINAL FIX: User Deletion & Security
-- Usage: Run this in Supabase SQL Editor
-- ==========================================

-- 1. FIX "FAILED TO DELETE USER" (Foreign Key Constraints)
-- We need to change the constraints to ON DELETE CASCADE
-- This allows you to delete a user from Auth, and automatically delete their Profile and Complaints.

-- Fix Profiles FK
alter table public.profiles
drop constraint if exists profiles_id_fkey;

alter table public.profiles
add constraint profiles_id_fkey
foreign key (id) references auth.users(id)
on delete cascade;

-- Fix Complaints FK
alter table public.complaints
drop constraint if exists complaints_user_id_fkey;

alter table public.complaints
add constraint complaints_user_id_fkey
foreign key (user_id) references auth.users(id)
on delete cascade;


-- 2. FIX "ALWAYS TRUE" WARNINGS (Strict RLS)
-- Reset Policies to be strict

-- Complaints
drop policy if exists "Authenticated users can view complaints" on public.complaints;
drop policy if exists "Authenticated users can create complaints" on public.complaints;
drop policy if exists "Enable read access for all users" on public.complaints;
drop policy if exists "Admins/Staff can view all complaints" on public.complaints;
drop policy if exists "Students can view own complaints" on public.complaints;
drop policy if exists "Users can create their own complaints" on public.complaints;

create policy "View Complaints: Own or Admin"
on public.complaints for select
to authenticated
using (
  auth.uid() = user_id 
  or 
  exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'STAFF'))
);

create policy "Create Complaints: Own"
on public.complaints for insert
to authenticated
with check (
  auth.uid() = user_id
);

create policy "Update Complaints: Admin Only"
on public.complaints for update
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'STAFF'))
);

create policy "Delete Complaints: Admin Only"
on public.complaints for delete
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'STAFF'))
);

-- Events
drop policy if exists "Authenticated users can view events" on public.events;
drop policy if exists "Authenticated users can insert events" on public.events;

create policy "View Events: Admin Only"
on public.events for select
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'STAFF'))
);

create policy "Create Events: Authenticated"
on public.events for insert
to authenticated
with check (true);
