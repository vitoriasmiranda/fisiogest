
delete from public.marcacoes;

alter table public.pacientes add column if not exists profissional_id uuid references auth.users(id);
alter table public.marcacoes add column if not exists profissional_id uuid references auth.users(id);

do $$
declare
  dona uuid;
begin

  select id into dona from auth.users where email = 'vitoriamirandaa5@gmail.com';

  if dona is null and exists (select 1 from public.pacientes where profissional_id is null) then
    raise exception 'Login não encontrado. Corrija o e-mail na linha 👉 e rode de novo.';
  end if;

  update public.pacientes set profissional_id = dona where profissional_id is null;
end $$;


alter table public.pacientes alter column profissional_id set default auth.uid();
alter table public.pacientes alter column profissional_id set not null;
alter table public.marcacoes alter column profissional_id set default auth.uid();
alter table public.marcacoes alter column profissional_id set not null;

create index if not exists pacientes_profissional_idx on public.pacientes (profissional_id);
create index if not exists marcacoes_profissional_data_idx on public.marcacoes (profissional_id, data);

alter table public.marcacoes drop constraint if exists marcacoes_data_hora_unica;
alter table public.marcacoes drop constraint if exists marcacoes_profissional_data_hora_unica;
alter table public.marcacoes
  add constraint marcacoes_profissional_data_hora_unica unique (profissional_id, data, hora);

alter table public.pacientes add column if not exists arquivado boolean not null default false;


alter table public.pacientes enable row level security;
alter table public.marcacoes enable row level security;
alter table public.notas enable row level security;

drop policy if exists "Permitir tudo para utilizadores com login" on public.pacientes;
drop policy if exists "Permitir tudo para utilizadores com login" on public.marcacoes;
drop policy if exists "Permitir tudo para usuários com login" on public.notas;


drop policy if exists "pacientes: ver os seus" on public.pacientes;
drop policy if exists "pacientes: cadastrar os seus" on public.pacientes;
drop policy if exists "pacientes: editar os seus" on public.pacientes;

create policy "pacientes: ver os seus" on public.pacientes
  for select to authenticated using (profissional_id = auth.uid());
create policy "pacientes: cadastrar os seus" on public.pacientes
  for insert to authenticated with check (profissional_id = auth.uid());
create policy "pacientes: editar os seus" on public.pacientes
  for update to authenticated using (profissional_id = auth.uid()) with check (profissional_id = auth.uid());

drop policy if exists "agenda: a sua" on public.marcacoes;
create policy "agenda: a sua" on public.marcacoes
  for all to authenticated
  using (profissional_id = auth.uid())
  with check (
    profissional_id = auth.uid()
    and exists (
      select 1 from public.pacientes p
      where p.id = "pacienteId" and p.profissional_id = auth.uid()
    )
  );


drop policy if exists "notas: ver as dos seus pacientes" on public.notas;
drop policy if exists "notas: escrever nos seus pacientes" on public.notas;

create policy "notas: ver as dos seus pacientes" on public.notas
  for select to authenticated
  using (exists (select 1 from public.pacientes p where p.id = paciente_id and p.profissional_id = auth.uid()));
create policy "notas: escrever nos seus pacientes" on public.notas
  for insert to authenticated
  with check (exists (select 1 from public.pacientes p where p.id = paciente_id and p.profissional_id = auth.uid()));
