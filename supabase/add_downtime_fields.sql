-- Evolução de indicadores de manutenção
-- Adiciona datas operacionais e downtime calculado sem alterar registros antigos.

alter table public.falhas
  add column if not exists falha_em timestamptz,
  add column if not exists retorno_em timestamptz;

alter table public.falhas
  drop constraint if exists falhas_retorno_depois_falha;

alter table public.falhas
  add constraint falhas_retorno_depois_falha
  check (retorno_em is null or falha_em is null or retorno_em >= falha_em);

comment on column public.falhas.falha_em is 'Data e hora em que a falha/parada ocorreu.';
comment on column public.falhas.retorno_em is 'Data e hora em que o equipamento retornou à operação.';

-- Downtime é calculado no aplicativo a partir de retorno_em - falha_em.
-- Campos são opcionais para manter compatibilidade com ocorrências antigas.
