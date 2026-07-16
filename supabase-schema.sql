-- Create a table for User Profiles for the NoCode Dashboard
create table public.nocode_profiles (
  id uuid references auth.users not null primary key,
  email text,
  username text,
  role text check (role in ('QA', 'dev', 'leader')),
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS
alter table public.nocode_profiles enable row level security;

-- Create policies for profiles
create policy "Users can view their own nocode profile."
  on public.nocode_profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own nocode profile."
  on public.nocode_profiles for update
  using ( auth.uid() = id );

create policy "Users can insert their own nocode profile."
  on public.nocode_profiles for insert
  with check ( auth.uid() = id );

-- Create a table for KPIs (if we are syncing the mock data to DB)
create table public.nocode_kpis (
  id uuid default uuid_generate_v4() primary key,
  developer_id uuid references public.nocode_profiles(id),
  qa_analyst_id uuid references public.nocode_profiles(id),
  task_name text not null,
  platform text not null,
  score integer check (score >= 0 and score <= 100),
  status text check (status in ('approved', 'rejected', 'review')),
  -- Nuevos KPIs
  pixel_perfect integer check (pixel_perfect >= 0 and pixel_perfect <= 100),
  cumplimiento_dod integer check (cumplimiento_dod >= 0 and cumplimiento_dod <= 100),
  calidad_visual integer check (calidad_visual >= 0 and calidad_visual <= 100),
  errores_visuales integer default 0,
  retrabajo integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  month text not null -- e.g. '2026-07'
);

alter table public.nocode_kpis enable row level security;

-- Policies for KPIs
-- Devs solo pueden ver sus propios KPIs. QA y leader pueden ver todo.
create policy "Devs can view their own KPIs, QA/Leaders can view all."
  on public.nocode_kpis for select
  to authenticated
  using (
    auth.uid() = developer_id OR
    exists (
      select 1 from public.nocode_profiles 
      where id = auth.uid() and role in ('QA', 'leader')
    )
  );

-- Only QA can insert KPIs
create policy "QA can insert nocode KPIs."
  on public.nocode_kpis for insert
  to authenticated
  with check ( exists (
    select 1 from public.nocode_profiles
    where id = auth.uid() and role = 'QA'
  ));

-- Only QA can update KPIs
create policy "QA can update nocode KPIs."
  on public.nocode_kpis for update
  to authenticated
  using ( exists (
    select 1 from public.nocode_profiles
    where id = auth.uid() and role = 'QA'
  ));

-- Function to handle new user signup and create profile
create or replace function public.handle_nocode_new_user() 
returns trigger as $$
begin
  insert into public.nocode_profiles (id, email, username, role)
  values (
    new.id, 
    new.email,
    split_part(new.email, '@', 1),
    'dev' -- Default role, change manually in DB for QA and leader
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create a profile for new users
-- Note: if you already have a trigger on auth.users for another project, 
-- you can have multiple triggers on auth.users, they will all execute.
drop trigger if exists on_auth_user_created_nocode on auth.users;

create trigger on_auth_user_created_nocode
  after insert on auth.users
  for each row execute procedure public.handle_nocode_new_user();
