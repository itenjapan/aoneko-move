-- Phase 1 & 3: Advanced Registration & Admin

-- 1. Create Profiles Table (if not exists)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  name text,
  email text,
  phone text,
  user_type text check (user_type in ('customer', 'driver', 'admin')) default 'customer',
  aoneko_id text unique,
  -- Driver specific fields
  vehicle_type text,
  license_plate text,
  is_online boolean default false,
  rating numeric default 5.0,
  total_rides integer default 0
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 3. Phase 3: Aoneko ID Generator Function
-- Create a sequence for the ID
create sequence if not exists public.aoneko_id_seq;

create or replace function public.generate_aoneko_id()
returns trigger as $$
declare
  year_str text;
  seq_str text;
begin
  -- Get current year
  year_str := to_char(current_date, 'YYYY');
  -- Get next value from sequence, pad with 0 to length 3
  seq_str := lpad(nextval('public.aoneko_id_seq')::text, 3, '0');
  
  -- Result example: AONEKO-2026-001
  new.aoneko_id := 'AONEKO-' || year_str || '-' || seq_str;
  
  return new;
end;
$$ language plpgsql security definer;

-- 4. Trigger to set Aoneko ID on Insert
create or replace trigger on_profile_created
  before insert on public.profiles
  for each row
  execute procedure public.generate_aoneko_id();

-- 5. Admin Seeding (Update existing user if exists or instructions)
-- NOTE: In production, you would manually update the user after signup or use an edge function.
-- Example SQL to promote a user to admin:
-- update public.profiles set user_type = 'admin' where email = 'aoneko.move@gmail.com';

-- 6. New User Alert Trigger (Calls Edge Function)
-- Assuming supabase_functions schema or net extension is enabled
-- This part is conceptual as it typically requires 'supabase functions' CLI deployment.
-- We will setup the folder structure for this.
