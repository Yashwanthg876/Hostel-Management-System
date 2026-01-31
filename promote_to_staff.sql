-- ==========================================
-- PROMOTE USER TO MAINTENANCE STAFF
-- Usage: Replace 'staff@test.com' with the email you just created.
-- Run this in Supabase SQL Editor.
-- ==========================================

update public.profiles
set role = 'STAFF'
where email = 'staff@test.com'; -- <--- CHANGE THIS EMAIL

-- Verify the change
select * from public.profiles where role = 'STAFF';
