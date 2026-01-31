-- ==========================================
-- FIX RECURSION ERROR (Profile Fetch Loop)
-- Usage: Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create a Helper Function to avoid RLS Loops
-- "SECURITY DEFINER" means this function runs with higher privileges
-- and bypasses the row-level security checks on the table it queries.
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

-- 2. Drop the buggy recursive policy
drop policy if exists "Admins/Staff can view all profiles" on public.profiles;

-- 3. Re-create the policy using the safe function
create policy "Admins/Staff can view all profiles"
on public.profiles for select
to authenticated
using (
  is_admin_or_staff()
);

-- 4. Ensure Self-View Policy still exists (Redundant safety check)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (
  auth.uid() = id
);
