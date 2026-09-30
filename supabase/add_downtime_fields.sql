-- Evolução de indicadores de manutenção
-- Classifica a parada para separar downtime não programado de intervenções programadas.

alter table public.falhas
  add column if not exists tipo_parada text,
  add column if not exists falha_em timestamptz,
  add column if not exists retorno_em timestamptz;

alter table public.falhas
  drop constraint if exists falhas_tipo_parada_valido;

alter table public.falhas
  add constraint falhas_tipo_parada_valido
  check (tipo_parada is null or tipo_parada in ('nao_programada', 'programada', 'sem_parada'));

alter table public.falhas
  drop constraint if exists falhas_retorno_depois_falha;

alter table public.falhas
  add constraint falhas_retorno_depois_falha
  check (retorno_em is null or falha_em is null or retorno_em >= falha_em);

comment on column public.falhas.tipo_parada is 'Classificação: nao_programada, programada ou sem_parada.';
comment on column public.falhas.falha_em is 'Data/hora de início da ocorrência ou intervenção.';
comment on column public.falhas.retorno_em is 'Data/hora de retorno do equipamento à operação.';

-- IMPORTANTE:
-- Somente tipo_parada = 'nao_programada' entra nos indicadores de downtime/MTTR.
-- Registros antigos permanecem com tipo_parada nulo e não entram nesses indicadores.
