-- Add user_id to complaints table
alter table public.complaints 
add column user_id uuid references auth.users(id);

-- Update existing complaints to have a dummy user (or null) if needed
-- For now, we leave them null or you can assign them to your current user ID if known.

-- Enable RLS policy for Users to see ONLY their own complaints
-- First, drop the old "view all" policy if you want strict privacy
drop policy "Authenticated users can view complaints" on public.complaints;

-- Create new policies
create policy "Admins/Staff can view all complaints"
on public.complaints for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() 
    and (profiles.role = 'ADMIN' or profiles.role = 'STAFF')
  )
);

create policy "Students can view own complaints"
on public.complaints for select
to authenticated
using (
  auth.uid() = user_id
);

-- Update Insert Policy to ensure users assign themselves
drop policy "Authenticated users can create complaints" on public.complaints;

create policy "Users can create their own complaints"
on public.complaints for insert
to authenticated
with check (
  auth.uid() = user_id
);
