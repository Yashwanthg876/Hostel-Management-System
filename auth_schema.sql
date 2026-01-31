-- 1. Create Profiles Table (Public Profile for each Auth User)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text default 'STUDENT' check (role in ('STUDENT', 'STAFF', 'ADMIN')),
  created_at timestamptz default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Policies
-- Public read access (Simpler for now, can restrict later)
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- Users update their own profile
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 4. Trigger to Auto-Create Profile on Signup
-- This function runs every time a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'STUDENT') -- Default to STUDENT if no role provided
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
