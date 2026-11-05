-- Pegar una sola vez en Supabase → SQL Editor → New query → Run
-- Crea la tabla de partidas: cada jugador solo puede leer y cambiar la suya
create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
drop policy if exists "saves_own" on public.saves;
create policy "saves_own" on public.saves
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
