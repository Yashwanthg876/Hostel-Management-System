-- ==========================================
-- FIX PROFILE POLICIES
-- Reference: Resolving "Profile fetch error"
-- Usage: Run this in Supabase SQL Editor
-- ==========================================

-- 1. Enable RLS on profiles (ensure it's on)
alter table public.profiles enable row level security;

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins/Staff can view all profiles" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles; -- legacy

-- 3. Create Policy: Users can VIEW their own profile
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (
  auth.uid() = id
);

-- 4. Create Policy: Users can UPDATE their own profile
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (
  auth.uid() = id
);

-- 5. Create Policy: Admins & Staff can VIEW ALL profiles (for email lookups etc)
create policy "Admins/Staff can view all profiles"
on public.profiles for select
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'STAFF'))
);

-- 6. Create Policy: Users can INSERT (for auto-creation logic)
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (
  auth.uid() = id
);
