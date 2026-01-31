-- ==========================================
-- SUPER SECURITY FIX (V2)
-- Usage: Run this in Supabase SQL Editor
-- Purpose: Fix "Always True" warnings & Secure Data
-- ==========================================

-- 1. CLEANUP (Drop potentially conflicting old policies)
-- We wrap in DO blocks to avoid errors if they don't exist
do $$ 
begin
    -- Complaints Policies
    drop policy if exists "Authenticated users can view complaints" on public.complaints;
    drop policy if exists "Authenticated users can create complaints" on public.complaints;
    drop policy if exists "Authenticated users can update complaints" on public.complaints;
    drop policy if exists "Enable read access for all users" on public.complaints;
    drop policy if exists "Admins/Staff can view all complaints" on public.complaints;
    drop policy if exists "Students can view own complaints" on public.complaints;
    drop policy if exists "Users can create their own complaints" on public.complaints;
    drop policy if exists "Users can update ticket status" on public.complaints;

    -- Events Policies
    drop policy if exists "Authenticated users can view events" on public.events;
    drop policy if exists "Authenticated users can insert events" on public.events;
end $$;

-- 2. SECURE COMPLAINTS TABLE
alter table public.complaints enable row level security;

-- SELECT: Students see OWN, Admins/Staff see ALL
create policy "View Complaints: Own or Admin"
on public.complaints for select
to authenticated
using (
  auth.uid() = user_id 
  or 
  exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'STAFF'))
);

-- INSERT: Students can create their own
create policy "Create Complaints: Own"
on public.complaints for insert
to authenticated
with check (
  auth.uid() = user_id
);

-- UPDATE: Admins can update Status, Students can update Description? (Let's restrict to Admins for Status for now)
-- Actually API uses Service Role for heavy lifting usually, but our API uses User Token.
-- We added PATCH /api/complaints for Admins.
create policy "Update Complaints: Admin Only"
on public.complaints for update
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'STAFF'))
);


-- 3. SECURE EVENTS TABLE
alter table public.events enable row level security;

-- SELECT: Admins Only (Dashboard)
create policy "View Events: Admin Only"
on public.events for select
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'STAFF'))
);

-- INSERT: Authenticated users (so Student API calls can log events)
-- Note: 'Using true' for INSERT is acceptable if we trust the API logic, or we can check payload?
-- For simplicty, as 'events' are just logs, we allow authenticated inserts.
create policy "Create Events: Authenticated"
on public.events for insert
to authenticated
with check (true); 

-- 4. ENSURE PROFILES EXIST (Just in case)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text default 'STUDENT' check (role in ('STUDENT', 'STAFF', 'ADMIN')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- Public read for profiles (so we can check roles)
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Read Profiles: Public"
on public.profiles for select
using (true);

-- Users update own
drop policy if exists "Users can update own profile." on public.profiles;
create policy "Update Profiles: Own"
on public.profiles for update
using ( id = auth.uid() );

-- Insert own (usually handled by Trigger, but safe to add)
drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Insert Profiles: Own"
on public.profiles for insert
with check ( id = auth.uid() );
