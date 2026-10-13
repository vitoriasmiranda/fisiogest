-- Configuração de segurança do banco do FisioGest (já aplicada).
-- Serve como registro; não é preciso rodar de novo.
-- O histórico completo está em migracao-v2.sql (notas) e migracao-v3.sql (dados por profissional).

-- Acesso
--   * Cadastro público desligado (Authentication > Sign In / Providers).
--   * Os logins são criados pela administradora em Authentication > Users.

-- Cada profissional só enxerga o que é dele (RLS)
--   * pacientes: ver / cadastrar / editar onde profissional_id = auth.uid()
--                sem regra de DELETE: pacientes são arquivados, nunca apagados
--   * marcacoes: tudo, só na própria agenda e só com os próprios pacientes
--   * notas:     ver / escrever nas fichas dos próprios pacientes
--                sem UPDATE/DELETE: o que foi registrado não é alterado

-- Regras de integridade
--   * marcacoes: unique (profissional_id, data, hora) — sem dois atendimentos
--     no mesmo horário NA MESMA agenda; profissionais diferentes podem coincidir
--   * marcacoes."pacienteId" -> pacientes(id) on delete cascade
--   * notas.paciente_id      -> pacientes(id) on delete cascade
