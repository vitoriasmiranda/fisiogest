create table if not exists public.notas (
  id bigint generated always as identity primary key,
  paciente_id integer not null references public.pacientes(id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 1000),
  autor text default (auth.jwt() ->> 'email'),
  criado_em timestamptz not null default now()
);

create index if not exists notas_paciente_data_idx on public.notas (paciente_id, criado_em desc);

alter table public.notas enable row level security;

drop policy if exists "Permitir tudo para usuários com login" on public.notas;
create policy "Permitir tudo para usuários com login" on public.notas
  for all to authenticated using (true) with check (true);

insert into public.notas (paciente_id, texto, criado_em)
select
  p.id,
  n ->> 'texto',
  case
    when (n ->> 'id') ~ '^\d{13}$' then to_timestamp((n ->> 'id')::bigint / 1000.0)
    else now()
  end
from public.pacientes p
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(p.notas) = 'array' then p.notas else '[]'::jsonb end
) as n
where coalesce(trim(n ->> 'texto'), '') <> ''
  and not exists (select 1 from public.notas);

alter table public.pacientes add column if not exists data_nascimento date;

alter table public.pacientes alter column idade drop not null;
