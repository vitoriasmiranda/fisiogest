-- Configuração de segurança do banco do FisioGest (já aplicada).
-- Serve como registro; não é preciso rodar de novo.

-- RLS ligado em pacientes e marcacoes, com a política
-- "Permitir tudo para utilizadores com login" (role authenticated).
-- Cadastro público de usuários desligado em Authentication > Sign In / Providers.

-- Impede duas consultas no mesmo dia e hora
alter table public.marcacoes
  add constraint marcacoes_data_hora_unica unique (data, hora);

-- Ao apagar um paciente, apaga também as consultas dele
alter table public.marcacoes
  add constraint marcacoes_paciente_fk
  foreign key ("pacienteId") references public.pacientes(id) on delete cascade;