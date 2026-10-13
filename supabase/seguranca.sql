-- =====================================================================
-- FisioGest — reforço de segurança e integridade no Supabase
-- Rever antes de correr no SQL Editor. Assume as tabelas `pacientes`
-- e `marcacoes` com as colunas usadas pela app.
-- =====================================================================

-- 1) Row Level Security (CRÍTICO)
-- A chave VITE_SUPABASE_KEY fica visível no navegador de qualquer pessoa.
-- Sem RLS, quem a tiver consegue ler/apagar TODOS os dados clínicos.
alter table public.pacientes enable row level security;
alter table public.marcacoes enable row level security;

-- Só utilizadores autenticados (a equipa da clínica) acedem aos dados.
create policy "equipa autenticada - pacientes" on public.pacientes
  for all to authenticated using (true) with check (true);

create policy "equipa autenticada - marcacoes" on public.marcacoes
  for all to authenticated using (true) with check (true);

-- Se no futuro houver vários fisioterapeutas e cada um só deve ver os seus
-- pacientes, acrescente uma coluna `owner uuid default auth.uid()` e troque
-- `using (true)` por `using (owner = auth.uid())`.

-- 2) Impedir duas marcações no mesmo dia e hora.
-- A app já verifica, mas só contra a lista que tem em memória: se duas
-- pessoas marcarem ao mesmo tempo, ambas passam. Com esta restrição, a
-- segunda recebe o erro 23505 e a app mostra "Outra pessoa acabou de marcar".
alter table public.marcacoes
  add constraint marcacoes_data_hora_unica unique (data, hora);

-- 3) Ao apagar um paciente, apagar também as suas marcações
-- (hoje ficam marcações "órfãs" na agenda).
-- Ajuste o nome da constraint se já existir uma FK.
alter table public.marcacoes
  add constraint marcacoes_paciente_fk
  foreign key ("pacienteId") references public.pacientes(id) on delete cascade;

-- 4) Validações também no servidor (a validação no navegador pode ser contornada)
alter table public.pacientes
  add constraint pacientes_idade_valida check (idade between 0 and 120),
  add constraint pacientes_historico_tamanho check (char_length(coalesce(historico, '')) <= 2000);
