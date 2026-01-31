-- ==========================================
-- PROMOTE USER TO ADMIN
-- Usage: Replace 'your_email@example.com' with the email you just created.
-- Run this in Supabase SQL Editor.
-- ==========================================

update public.profiles
set role = 'ADMIN'
where email = 'admin@test.com'; -- <--- CHANGE THIS EMAIL

-- Verify the change
select * from public.profiles where role = 'ADMIN';
