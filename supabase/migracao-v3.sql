-- =====================================================================
-- FisioGest — migração v3: cada profissional com seus próprios dados
-- Rode UMA vez no SQL Editor do Supabase, ANTES de usar a versão nova do app.
--
-- Depois desta migração:
--   * cada profissional só vê os PRÓPRIOS pacientes, notas e agendamentos;
--   * dois profissionais podem atender no mesmo horário (cada um na sua agenda);
--   * pacientes não são mais apagados, e sim arquivados (o prontuário fica guardado);
--   * notas de evolução não podem ser editadas nem apagadas.
--
-- ⚠️ Antes de rodar, confira o e-mail na linha marcada com 👉 abaixo:
--    os pacientes que já existem passam a pertencer a esse login.
-- =====================================================================

-- 1) Os agendamentos de teste são apagados (agenda começa limpa)
delete from public.marcacoes;

-- 2) Dono de cada paciente e de cada agendamento
alter table public.pacientes add column if not exists profissional_id uuid references auth.users(id);
alter table public.marcacoes add column if not exists profissional_id uuid references auth.users(id);

do $$
declare
  dona uuid;
begin
  -- 👉 e-mail do login que fica com os pacientes já cadastrados
  select id into dona from auth.users where email = 'vitoriamirandaa5@gmail.com';

  if dona is null and exists (select 1 from public.pacientes where profissional_id is null) then
    raise exception 'Login não encontrado. Corrija o e-mail na linha 👉 e rode de novo.';
  end if;

  update public.pacientes set profissional_id = dona where profissional_id is null;
end $$;

-- Novos registros recebem automaticamente o id de quem está logado
alter table public.pacientes alter column profissional_id set default auth.uid();
alter table public.pacientes alter column profissional_id set not null;
alter table public.marcacoes alter column profissional_id set default auth.uid();
alter table public.marcacoes alter column profissional_id set not null;

create index if not exists pacientes_profissional_idx on public.pacientes (profissional_id);
create index if not exists marcacoes_profissional_data_idx on public.marcacoes (profissional_id, data);

-- 3) Horário único POR PROFISSIONAL (antes era um só para a clínica inteira)
alter table public.marcacoes drop constraint if exists marcacoes_data_hora_unica;
alter table public.marcacoes drop constraint if exists marcacoes_profissional_data_hora_unica;
alter table public.marcacoes
  add constraint marcacoes_profissional_data_hora_unica unique (profissional_id, data, hora);

-- 4) Arquivar em vez de apagar
alter table public.pacientes add column if not exists arquivado boolean not null default false;

-- 5) Regras de acesso (RLS): troca "qualquer um com login vê tudo" por "cada um vê o seu"
alter table public.pacientes enable row level security;
alter table public.marcacoes enable row level security;
alter table public.notas enable row level security;

drop policy if exists "Permitir tudo para utilizadores com login" on public.pacientes;
drop policy if exists "Permitir tudo para utilizadores com login" on public.marcacoes;
drop policy if exists "Permitir tudo para usuários com login" on public.notas;

-- Pacientes: ver, cadastrar e editar só os seus. Sem regra de DELETE = ninguém apaga.
drop policy if exists "pacientes: ver os seus" on public.pacientes;
drop policy if exists "pacientes: cadastrar os seus" on public.pacientes;
drop policy if exists "pacientes: editar os seus" on public.pacientes;

create policy "pacientes: ver os seus" on public.pacientes
  for select to authenticated using (profissional_id = auth.uid());
create policy "pacientes: cadastrar os seus" on public.pacientes
  for insert to authenticated with check (profissional_id = auth.uid());
create policy "pacientes: editar os seus" on public.pacientes
  for update to authenticated using (profissional_id = auth.uid()) with check (profissional_id = auth.uid());

-- Agendamentos: tudo, mas só na própria agenda e só com os próprios pacientes
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

-- Notas: ver e escrever nas fichas dos próprios pacientes. Sem UPDATE/DELETE = não se altera o que foi registrado.
drop policy if exists "notas: ver as dos seus pacientes" on public.notas;
drop policy if exists "notas: escrever nos seus pacientes" on public.notas;

create policy "notas: ver as dos seus pacientes" on public.notas
  for select to authenticated
  using (exists (select 1 from public.pacientes p where p.id = paciente_id and p.profissional_id = auth.uid()));
create policy "notas: escrever nos seus pacientes" on public.notas
  for insert to authenticated
  with check (exists (select 1 from public.pacientes p where p.id = paciente_id and p.profissional_id = auth.uid()));
