-- Segurança do Gestão de Falhas - Manutenção
-- Execute no SQL Editor do Supabase somente após revisar o e-mail do supervisor.
-- Troque gabrielmachado_91@outlook.com pelo e-mail real da conta supervisora.

create or replace function public.is_supervisor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and lower(email) = lower('gabrielmachado_91@outlook.com')
  );
$$;

revoke all on function public.is_supervisor() from public;
grant execute on function public.is_supervisor() to authenticated;

alter table public.falhas enable row level security;
alter table public.equipamentos enable row level security;

drop policy if exists "falhas_select_authenticated" on public.falhas;
create policy "falhas_select_authenticated"
on public.falhas for select
to authenticated
using (aprovado = true or public.is_supervisor());

drop policy if exists "falhas_insert_authenticated" on public.falhas;
create policy "falhas_insert_authenticated"
on public.falhas for insert
to authenticated
with check (aprovado = false);

drop policy if exists "falhas_update_supervisor" on public.falhas;
create policy "falhas_update_supervisor"
on public.falhas for update
to authenticated
using (public.is_supervisor())
with check (public.is_supervisor());

drop policy if exists "falhas_delete_supervisor" on public.falhas;
create policy "falhas_delete_supervisor"
on public.falhas for delete
to authenticated
using (public.is_supervisor());

drop policy if exists "equipamentos_select_authenticated" on public.equipamentos;
create policy "equipamentos_select_authenticated"
on public.equipamentos for select
to authenticated
using (true);

drop policy if exists "equipamentos_insert_supervisor" on public.equipamentos;
create policy "equipamentos_insert_supervisor"
on public.equipamentos for insert
to authenticated
with check (public.is_supervisor());

-- Storage: usuários autenticados podem enviar fotos de falhas.
drop policy if exists "fotos_falhas_insert_authenticated" on storage.objects;
create policy "fotos_falhas_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'fotos-falhas');

-- Storage: somente supervisor pode cadastrar imagens de equipamentos.
drop policy if exists "equipamentos_storage_insert_supervisor" on storage.objects;
create policy "equipamentos_storage_insert_supervisor"
on storage.objects for insert
to authenticated
with check (bucket_id = 'equipamentos' and public.is_supervisor());

-- Observação:
-- os buckets atuais usam getPublicUrl() no frontend. Se forem públicos,
-- a leitura das imagens não depende de RLS. Torná-los privados exige
-- trocar getPublicUrl() por signed URLs no aplicativo.
