-- Fix: "Function Search Path Mutable"
-- We strictly set the search_path to 'public' to prevent malicious schema hijacking.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'STUDENT')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;
