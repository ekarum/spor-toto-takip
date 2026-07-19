-- Karum Toto V7 - haftalar ve cihazlar arası anlık senkronizasyon
create extension if not exists pgcrypto;

create table if not exists public.karum_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key text not null,
  week_name text not null,
  file_name text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_key)
);

alter table public.karum_weeks enable row level security;

drop policy if exists "Kullanici kendi haftalarini okur" on public.karum_weeks;
create policy "Kullanici kendi haftalarini okur"
on public.karum_weeks for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Kullanici kendi haftasini ekler" on public.karum_weeks;
create policy "Kullanici kendi haftasini ekler"
on public.karum_weeks for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Kullanici kendi haftasini gunceller" on public.karum_weeks;
create policy "Kullanici kendi haftasini gunceller"
on public.karum_weeks for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Kullanici kendi haftasini siler" on public.karum_weeks;
create policy "Kullanici kendi haftasini siler"
on public.karum_weeks for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.karum_weeks to authenticated;
revoke all on public.karum_weeks from anon;

-- Realtime yayınına yalnızca bir kez ekle.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'karum_weeks'
  ) then
    alter publication supabase_realtime add table public.karum_weeks;
  end if;
end $$;
