// Mock do cliente Supabase com uma "base de dados" em memória.
// Suporta o subconjunto usado na app: from().select().order().eq().insert().update().delete()
// e auth.getSession / onAuthStateChange / signInWithPassword / signOut.

import { vi } from 'vitest'

export function criarSupabaseMock(inicial = {}) {
  const db = {
    pacientes: [...(inicial.pacientes ?? [])],
    marcacoes: [...(inicial.marcacoes ?? [])],
    notas: [...(inicial.notas ?? [])],
  }
  // Valores padrão que o banco preenche sozinho (como os DEFAULT do SQL)
  const padroes = {
    notas: () => ({ criado_em: new Date().toISOString(), autor: inicial.emailUsuario ?? 'fisio@clinica.com' }),
  }
  // Erros forçados por tabela/operação, ex.: falhas.marcacoes = { insert: { message: 'x' } }
  const falhas = {}
  let proximoId = 1000

  const from = vi.fn((tabela) => {
    const estado = { op: 'select', filtros: [], ordem: null, payload: null }

    const executar = () => {
      const erro = falhas[tabela]?.[estado.op]
      if (erro) return { data: null, error: erro }

      const corresponde = (linha) => estado.filtros.every(([col, val]) => String(linha[col]) === String(val))
      const linhas = db[tabela] ?? (db[tabela] = [])

      switch (estado.op) {
        case 'insert': {
          const novas = estado.payload.map((l) => ({ id: proximoId++, ...(padroes[tabela]?.() ?? {}), ...l }))
          linhas.push(...novas)
          return { data: novas, error: null }
        }
        case 'update': {
          const alteradas = []
          db[tabela] = linhas.map((l) => {
            if (!corresponde(l)) return l
            const nova = { ...l, ...estado.payload }
            alteradas.push(nova)
            return nova
          })
          return { data: alteradas, error: null }
        }
        case 'delete': {
          db[tabela] = linhas.filter((l) => !corresponde(l))
          return { data: null, error: null }
        }
        default: {
          let resultado = linhas.filter(corresponde)
          if (estado.ordem) {
            const { coluna, ascending } = estado.ordem
            resultado = [...resultado].sort((a, b) => (a[coluna] > b[coluna] ? 1 : -1) * (ascending ? 1 : -1))
          }
          return { data: resultado, error: null }
        }
      }
    }

    const builder = {
      select: () => builder, // depois de insert() mantém a operação
      order: (coluna, { ascending = true } = {}) => { estado.ordem = { coluna, ascending }; return builder },
      eq: (col, val) => { estado.filtros.push([col, val]); return builder },
      insert: (linhas) => { estado.op = 'insert'; estado.payload = linhas; return builder },
      update: (dados) => { estado.op = 'update'; estado.payload = dados; return builder },
      delete: () => { estado.op = 'delete'; return builder },
      then: (resolve, reject) => Promise.resolve().then(executar).then(resolve, reject),
    }
    return builder
  })

  let ouvinteAuth = null
  const auth = {
    sessao: inicial.sessao ?? null,
    getSession: vi.fn(async () => ({ data: { session: auth.sessao } })),
    onAuthStateChange: vi.fn((cb) => {
      ouvinteAuth = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    }),
    signInWithPassword: vi.fn(async () => ({ data: {}, error: null })),
    signOut: vi.fn(async () => {
      auth.sessao = null
      ouvinteAuth?.('SIGNED_OUT', null)
      return { error: null }
    }),
  }

  return { from, auth, db, falhas }
}
