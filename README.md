# FisioGest

Sistema de gestão para clínicas de fisioterapia: ficha de pacientes, notas de evolução e agenda de sessões.

Feito com **React 19 + Vite** e **Supabase** (autenticação e base de dados).

## Funcionalidades

- Login da equipa (Supabase Auth)
- Lista de pacientes com pesquisa (por nome ou condição, ignora acentos) e estatísticas do dia
- Ficha do paciente: dados, histórico clínico, estado do tratamento e notas de evolução
- Agenda com vista de dia e de mês, deteção de horários ocupados

## Como correr

```bash
npm install
cp .env.example .env   # preencha com o URL e a chave anon do seu projeto Supabase
npm run dev
```

## Scripts

| Comando                 | O que faz                                   |
| ----------------------- | ------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento                 |
| `npm run build`         | Build de produção em `dist/`                |
| `npm run lint`          | Lint com oxlint                             |
| `npm test`              | Testes em modo watch                        |
| `npm run test:run`      | Corre os testes uma vez                     |
| `npm run test:coverage` | Testes + relatório de cobertura (`coverage/`) |

## Testes

Vitest + Testing Library. O Supabase é substituído por um mock em memória
(`src/test/supabaseMock.js`), por isso os testes não precisam de rede nem de credenciais.

- `src/utils/*.test.js` — regras de negócio puras (datas, conflitos de horário, validação, pesquisa)
- `src/components/*.test.jsx` e `src/pages/*.test.jsx` — comportamento dos ecrãs como o utilizador os usa
- `src/App.test.jsx` — fluxo de login, navegação e logout

Os testes correm automaticamente no GitHub Actions a cada push/PR (`.github/workflows/testes.yml`).

## Estrutura

```
src/
  components/   Login, Sidebar, modais, ficha do paciente
  pages/        Dashboard (pacientes) e Agenda
  utils/        lógica pura e testável (datas, marcações, pacientes)
  test/         configuração e mock do Supabase
supabase/
  seguranca.sql RLS, restrições e validações recomendadas para a base de dados
```

## Segurança

A chave `VITE_SUPABASE_KEY` é pública (vai no JavaScript do navegador). A proteção dos dados
clínicos depende de **Row Level Security** no Supabase — veja `supabase/seguranca.sql`.
