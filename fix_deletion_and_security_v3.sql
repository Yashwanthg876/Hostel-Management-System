-- ==========================================
-- FINAL FIX V3: Force Cleanup & Fix Deletion
-- Usage: Run this in Supabase SQL Editor
-- ==========================================

-- 1. CLEANUP ALL POLICIES (Old & New)
-- We drop EVERY policy name we have ever used to ensure a clean slate.
do $$ 
begin
    -- Old Policy Names
    drop policy if exists "Authenticated users can view complaints" on public.complaints;
    drop policy if exists "Authenticated users can create complaints" on public.complaints;
    drop policy if exists "Authenticated users can update complaints" on public.complaints;
    drop policy if exists "Enable read access for all users" on public.complaints;
    drop policy if exists "Admins/Staff can view all complaints" on public.complaints;
    drop policy if exists "Students can view own complaints" on public.complaints;
    drop policy if exists "Users can create their own complaints" on public.complaints;
    drop policy if exists "Users can update ticket status" on public.complaints;

    -- V2/New Policy Names (This was causing the error!)
    drop policy if exists "View Complaints: Own or Admin" on public.complaints;
    drop policy if exists "Create Complaints: Own" on public.complaints;
    drop policy if exists "Update Complaints: Admin Only" on public.complaints;
    drop policy if exists "Delete Complaints: Admin Only" on public.complaints;

    -- Events Policies
    drop policy if exists "Authenticated users can view events" on public.events;
    drop policy if exists "Authenticated users can insert events" on public.events;
    drop policy if exists "View Events: Admin Only" on public.events;
    drop policy if exists "Create Events: Authenticated" on public.events;
end $$;


-- 2. FIX FOREIGN KEYS (For Deletion)
-- Ensure cascading delete is enabled
alter table public.profiles
drop constraint if exists profiles_id_fkey;

alter table public.profiles
add constraint profiles_id_fkey
foreign key (id) references auth.users(id)
on delete cascade;

alter table public.complaints
drop constraint if exists complaints_user_id_fkey;

alter table public.complaints
add constraint complaints_user_id_fkey
foreign key (user_id) references auth.users(id)
on delete cascade;


-- 3. RE-APPLY STRICT RLS POLICIES
alter table public.complaints enable row level security;
alter table public.events enable row level security;

-- Complaints: SELECT
create policy "View Complaints: Own or Admin"
on public.complaints for select
to authenticated
using (
  auth.uid() = user_id 
  or 
  exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'STAFF'))
);

-- Complaints: INSERT
create policy "Create Complaints: Own"
on public.complaints for insert
to authenticated
with check (
  auth.uid() = user_id
);

-- Complaints: UPDATE
create policy "Update Complaints: Admin Only"
on public.complaints for update
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'STAFF'))
);

-- Complaints: DELETE (New)
create policy "Delete Complaints: Admin Only"
on public.complaints for delete
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'STAFF'))
);

-- Events: SELECT
create policy "View Events: Admin Only"
on public.events for select
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'STAFF'))
);

-- Events: INSERT
create policy "Create Events: Authenticated"
on public.events for insert
to authenticated
with check (true);
