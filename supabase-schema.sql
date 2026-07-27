-- Create a table for User Profiles for the NoCode Dashboard (Idempotent)
create table if not exists public.nocode_profiles (
  id uuid references auth.users not null primary key,
  email text,
  username text,
  role text check (role in ('QA', 'dev', 'leader', 'admin')),
  full_name text,
  assigned_qa_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure columns exist if table was created previously
alter table public.nocode_profiles 
  add column if not exists assigned_qa_id uuid references auth.users(id);

-- Update the role check constraint to include 'admin' and 'Administrator' in case they already existed
alter table public.nocode_profiles drop constraint if exists nocode_profiles_role_check;
alter table public.nocode_profiles add constraint nocode_profiles_role_check check (role in ('QA', 'dev', 'leader', 'admin', 'Administrator'));

-- Function to get current user's role securely bypassing RLS
create or replace function public.get_auth_user_role()
returns text as $$
declare
  user_role text;
begin
  select role into user_role from public.nocode_profiles where id = auth.uid();
  return user_role;
end;
$$ language plpgsql security definer;

-- Turn on RLS
alter table public.nocode_profiles enable row level security;

-- Drop existing policies to allow re-running the script
drop policy if exists "Users can view their own nocode profile." on public.nocode_profiles;
drop policy if exists "QAs can view their assigned devs." on public.nocode_profiles;
drop policy if exists "Devs can view QAs who evaluated them." on public.nocode_profiles;
drop policy if exists "Leaders and admins can view all profiles." on public.nocode_profiles;
drop policy if exists "Users can update their own nocode profile." on public.nocode_profiles;
drop policy if exists "Users can insert their own nocode profile." on public.nocode_profiles;
drop policy if exists "Admins can insert and update any profile." on public.nocode_profiles;

-- Create policies for profiles
create policy "Users can view their own nocode profile."
  on public.nocode_profiles for select
  using ( auth.uid() = id );

create policy "QAs can view their assigned devs."
  on public.nocode_profiles for select
  using ( auth.uid() = assigned_qa_id );

create policy "Leaders and admins can view all profiles."
  on public.nocode_profiles for select
  using ( public.get_auth_user_role() in ('leader', 'admin', 'Administrator') );

create policy "Users can update their own nocode profile."
  on public.nocode_profiles for update
  using ( auth.uid() = id );

create policy "Users can insert their own nocode profile."
  on public.nocode_profiles for insert
  with check ( auth.uid() = id );

create policy "Admins can insert and update any profile."
  on public.nocode_profiles for all
  using ( public.get_auth_user_role() in ('admin', 'Administrator') );

-- La política "Users can update their own nocode profile." solo restringe QUÉ FILA
-- se puede tocar (auth.uid() = id), no QUÉ COLUMNAS. Sin este trigger, cualquier
-- usuario autenticado podría auto-ascenderse llamando directamente:
--   supabase.from('nocode_profiles').update({ role: 'admin' }).eq('id', suPropioId)
-- desde el cliente, con la anon key pública. Este trigger bloquea ese cambio salvo
-- que quien lo haga ya sea admin, o que la operación venga de la service role key
-- (Server Actions en admin.ts, que ya verifican el rol admin en el servidor).
create or replace function public.prevent_self_role_escalation()
returns trigger as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if (new.role is distinct from old.role or new.assigned_qa_id is distinct from old.assigned_qa_id)
     and coalesce(public.get_auth_user_role(), '') not in ('admin', 'Administrator') then
    raise exception 'No tienes permisos para modificar el rol o la asignación de QA.';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists prevent_self_role_escalation_trigger on public.nocode_profiles;

create trigger prevent_self_role_escalation_trigger
  before update on public.nocode_profiles
  for each row execute procedure public.prevent_self_role_escalation();


-- Create a table for KPIs (Idempotent)
create table if not exists public.nocode_kpis (
  id uuid default uuid_generate_v4() primary key,
  developer_id uuid references public.nocode_profiles(id),
  qa_analyst_id uuid references public.nocode_profiles(id),
  task_name text not null,
  platform text not null,
  score integer check (score >= 0 and score <= 100),
  status text check (status in ('approved', 'rejected', 'review')),
  pixel_perfect integer check (pixel_perfect >= 0 and pixel_perfect <= 100),
  cumplimiento_dod integer check (cumplimiento_dod >= 0 and cumplimiento_dod <= 100),
  calidad_visual integer check (calidad_visual >= 0 and calidad_visual <= 100),
  errores_visuales integer default 0,
  retrabajo integer default 0,
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  month text not null
);

-- Ensure columns exist if table was created previously
alter table public.nocode_kpis
  add column if not exists pixel_perfect integer check (pixel_perfect >= 0 and pixel_perfect <= 100),
  add column if not exists cumplimiento_dod integer check (cumplimiento_dod >= 0 and cumplimiento_dod <= 100),
  add column if not exists calidad_visual integer check (calidad_visual >= 0 and calidad_visual <= 100),
  add column if not exists errores_visuales integer default 0,
  add column if not exists retrabajo integer default 0,
  add column if not exists details text;

alter table public.nocode_kpis enable row level security;

-- Drop existing policies
drop policy if exists "Devs can view own, QA view assigned, Admin/Leader view all." on public.nocode_kpis;
drop policy if exists "QA can insert nocode KPIs for assigned devs." on public.nocode_kpis;
drop policy if exists "QA can update nocode KPIs." on public.nocode_kpis;
drop policy if exists "QA can view assigned devs KPIs" on public.nocode_kpis;
drop policy if exists "Devs view own, QA view assigned, Leaders view all." on public.nocode_kpis;
drop policy if exists "Authenticated users can view nocode KPIs." on public.nocode_kpis;
drop policy if exists "QA can insert nocode KPIs." on public.nocode_kpis;

-- Policies for KPIs
create policy "Devs can view own, QA view assigned, Admin/Leader view all."
  on public.nocode_kpis for select
  to authenticated
  using (
    auth.uid() = developer_id OR
    public.get_auth_user_role() in ('leader', 'admin', 'Administrator') OR
    (
      public.get_auth_user_role() = 'QA' AND
      auth.uid() = (select assigned_qa_id from public.nocode_profiles p where p.id = public.nocode_kpis.developer_id)
    )
  );

create policy "QA can insert nocode KPIs for assigned devs."
  on public.nocode_kpis for insert
  to authenticated
  with check ( 
    auth.uid() = qa_analyst_id AND
    public.get_auth_user_role() = 'QA' AND
    exists (
      select 1 from public.nocode_profiles
      where id = developer_id and assigned_qa_id = auth.uid()
    )
  );

create policy "QA can update nocode KPIs."
  on public.nocode_kpis for update
  to authenticated
  using (
    auth.uid() = qa_analyst_id AND
    public.get_auth_user_role() = 'QA'
  );

-- Función SECURITY DEFINER (igual patrón que get_auth_user_role): al bypasear RLS
-- internamente, evita la recursión infinita que se daría si la política de
-- nocode_profiles consultara nocode_kpis directamente (que a su vez consulta
-- nocode_profiles en su propia política).
create or replace function public.is_qa_of_current_dev(check_qa_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.nocode_kpis
    where developer_id = auth.uid() and qa_analyst_id = check_qa_id
  );
$$ language sql security definer stable;

-- Permite que un dev vea el perfil (username) del/los QA que lo han evaluado,
-- para poder mostrar el nombre real en vez de "QA" en su historial de auditorías.
-- Se declara aquí (y no junto a las demás políticas de nocode_profiles) porque
-- referencia la tabla nocode_kpis, que debe existir ya en este punto del script.
create policy "Devs can view QAs who evaluated them."
  on public.nocode_profiles for select
  to authenticated
  using ( public.is_qa_of_current_dev(id) );


-- Function to handle new user signup and create profile
create or replace function public.handle_nocode_new_user() 
returns trigger as $$
declare
  default_role text;
begin
  if new.email = 'admin@yopmail.com' or new.email ilike 'admin%' or new.email ilike '%.admin%' or new.email ilike '%_admin%' then
    default_role := 'admin';
  else
    default_role := 'dev';
  end if;

  insert into public.nocode_profiles (id, email, username, role)
  values (
    new.id, 
    new.email,
    split_part(new.email, '@', 1),
    default_role
  ) on conflict (id) do nothing; -- idempotency for inserts just in case
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create a profile for new users
drop trigger if exists on_auth_user_created_nocode on auth.users;

create trigger on_auth_user_created_nocode
  after insert on auth.users
  for each row execute procedure public.handle_nocode_new_user();


-- Create Projects Table
create table if not exists public.nocode_projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Projects
alter table public.nocode_projects enable row level security;

-- Policies for Projects
drop policy if exists "Anyone can view projects." on public.nocode_projects;
drop policy if exists "Admins can manage projects." on public.nocode_projects;

create policy "Anyone can view projects." on public.nocode_projects
  for select using (true);

create policy "Admins can manage projects." on public.nocode_projects
  for all using ( public.get_auth_user_role() in ('admin', 'Administrator') );


-- Create Assignments Table
create table if not exists public.nocode_project_assignments (
  id uuid default uuid_generate_v4() primary key,
  developer_id uuid references public.nocode_profiles(id) on delete cascade not null,
  qa_id uuid references public.nocode_profiles(id) on delete cascade not null,
  project_id uuid references public.nocode_projects(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_dev_qa_project unique (developer_id, qa_id, project_id)
);

-- Enable RLS for Assignments
alter table public.nocode_project_assignments enable row level security;

-- Policies for Assignments
drop policy if exists "Anyone can view assignments." on public.nocode_project_assignments;
drop policy if exists "Admins can manage assignments." on public.nocode_project_assignments;

create policy "Anyone can view assignments." on public.nocode_project_assignments
  for select using (true);

create policy "Admins can manage assignments." on public.nocode_project_assignments
  for all using ( public.get_auth_user_role() in ('admin', 'Administrator') );


-- Add project_id to nocode_kpis
alter table public.nocode_kpis add column if not exists project_id uuid references public.nocode_projects(id) on delete set null;
