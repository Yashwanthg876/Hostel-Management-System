-- 1. Secure Complaint Table
alter table public.complaints enable row level security;

-- Policy: Anyone logged in can View Complaints
create policy "Authenticated users can view complaints"
on public.complaints for select
to authenticated
using (true);

-- Policy: Anyone logged in can Create Complaints (Student, Admin, Staff)
create policy "Authenticated users can create complaints"
on public.complaints for insert
to authenticated
with check (true);

-- Policy: Anyone logged in can Update Complaints (simplification for Demo)
-- In a real app, you'd restrict this to auth.uid() or specific roles
create policy "Authenticated users can update complaints"
on public.complaints for update
to authenticated
using (true);


-- 2. Secure Events Table
alter table public.events enable row level security;

-- Policy: Anyone logged in can View Events
create policy "Authenticated users can view events"
on public.events for select
to authenticated
using (true);

-- Policy: Anyone logged in can Create Events (needed for our API/Serverless functions running with Anon Key)
create policy "Authenticated users can insert events"
on public.events for insert
to authenticated
with check (true);
