-- Vigorix - schema da tabela de sincronizacao
-- Rodar no SQL Editor do Supabase (projeto zssawfmvlcsrirupgvnv).
-- Idempotente: pode rodar mais de uma vez sem erro.

create table if not exists public.vigorix_store (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  key         text not null,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (user_id, key)
);

alter table public.vigorix_store enable row level security;

-- Cada usuario so enxerga/grava as proprias linhas.
drop policy if exists "vigorix_select_own" on public.vigorix_store;
create policy "vigorix_select_own" on public.vigorix_store
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "vigorix_insert_own" on public.vigorix_store;
create policy "vigorix_insert_own" on public.vigorix_store
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "vigorix_update_own" on public.vigorix_store;
create policy "vigorix_update_own" on public.vigorix_store
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "vigorix_delete_own" on public.vigorix_store;
create policy "vigorix_delete_own" on public.vigorix_store
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.vigorix_store to authenticated;

-- Indice para a busca feita por api.js (user_id + key).
create index if not exists vigorix_store_user_key_idx
  on public.vigorix_store (user_id, key);

-- OPCIONAL, mas recomendado: o updated_at passa a ser definido pelo servidor,
-- evitando que um aparelho com relogio errado "venca" a sincronizacao.
create or replace function public.vigorix_store_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists vigorix_store_touch on public.vigorix_store;
create trigger vigorix_store_touch
  before insert or update on public.vigorix_store
  for each row execute function public.vigorix_store_touch();
