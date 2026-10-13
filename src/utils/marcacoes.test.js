import { describe, expect, it } from 'vitest'
import {
  contarMarcacoesNaData,
  descreverProximaSessao,
  existeConflito,
  marcacoesDoDia,
  marcacoesForaDoHorario,
  marcacoesNoBloco,
  obterProximaMarcacao,
  temMarcacaoNaData,
  validarMarcacao,
} from './marcacoes'

const AGORA = new Date(2026, 9, 13, 10, 0) 

const marcacoes = [
  { id: 1, pacienteId: 7, data: '2026-10-13', hora: '09:00:00', motivo: 'Avaliação' },
  { id: 2, pacienteId: 7, data: '2026-10-20', hora: '14:30', motivo: 'Reforço' },
  { id: 3, pacienteId: 8, data: '2026-10-13', hora: '09:30', motivo: 'LCA' },
  { id: 4, pacienteId: 7, data: '2026-10-01', hora: '08:00', motivo: 'Antiga' },
  { id: 5, pacienteId: 9, data: '2026-10-13', hora: '22:15', motivo: 'Fora de horas' },
]

describe('existeConflito', () => {
  it('deteta o mesmo dia e hora mesmo que o Supabase devolva segundos', () => {
    expect(existeConflito(marcacoes, { data: '2026-10-13', hora: '09:00' })).toBe(true)
  })

  it('não há conflito noutra hora ou noutro dia', () => {
    expect(existeConflito(marcacoes, { data: '2026-10-13', hora: '11:00' })).toBe(false)
    expect(existeConflito(marcacoes, { data: '2026-10-14', hora: '09:00' })).toBe(false)
  })

  it('ignora a própria marcação ao editar', () => {
    expect(existeConflito(marcacoes, { data: '2026-10-13', hora: '09:00' }, 1)).toBe(false)
  })

  it('lista vazia nunca tem conflito', () => {
    expect(existeConflito([], { data: '2026-10-13', hora: '09:00' })).toBe(false)
  })
})

describe('marcacoesDoDia / marcacoesNoBloco', () => {
  it('devolve as marcações do dia ordenadas por hora', () => {
    expect(marcacoesDoDia(marcacoes, '2026-10-13').map((m) => m.id)).toEqual([1, 3, 5])
  })

  it('mostra TODAS as marcações do bloco das 09h (antes a das 09:30 ficava escondida)', () => {
    expect(marcacoesNoBloco(marcacoes, '2026-10-13', '09:00').map((m) => m.id)).toEqual([1, 3])
  })

  it('bloco sem marcações devolve lista vazia', () => {
    expect(marcacoesNoBloco(marcacoes, '2026-10-13', '15:00')).toEqual([])
  })

  it('não confunde a hora 1 com 10/11/... (compara "01" e não "1")', () => {
    const lista = [{ id: 1, data: '2026-10-13', hora: '10:00' }]
    expect(marcacoesNoBloco(lista, '2026-10-13', '01:00')).toEqual([])
  })
})

describe('marcacoesForaDoHorario', () => {
  it('pega agendamentos fora da grade para não ficarem invisíveis', () => {
    const blocos = ['08:00', '09:00', '10:00']
    expect(marcacoesForaDoHorario(marcacoes, '2026-10-13', blocos).map((m) => m.id)).toEqual([5])
  })
})

describe('temMarcacaoNaData / contarMarcacoesNaData', () => {
  it('conta as consultas do dia', () => {
    expect(contarMarcacoesNaData(marcacoes, '2026-10-13')).toBe(3)
    expect(contarMarcacoesNaData(marcacoes, '2026-12-25')).toBe(0)
  })

  it('indica se há marcações no dia', () => {
    expect(temMarcacaoNaData(marcacoes, '2026-10-20')).toBe(true)
    expect(temMarcacaoNaData(marcacoes, '2026-10-21')).toBe(false)
  })
})

describe('obterProximaMarcacao', () => {
  it('ignora marcações passadas e escolhe a mais próxima', () => {
    expect(obterProximaMarcacao(marcacoes, 7, AGORA).id).toBe(1)
  })

  it('aceita o id como número ou texto', () => {
    expect(obterProximaMarcacao(marcacoes, '8', AGORA).id).toBe(3)
  })

  it('desempata pela hora quando há duas no mesmo dia', () => {
    const lista = [
      { id: 'tarde', pacienteId: 1, data: '2026-10-15', hora: '16:00' },
      { id: 'manha', pacienteId: 1, data: '2026-10-15', hora: '08:00' },
    ]
    expect(obterProximaMarcacao(lista, 1, AGORA).id).toBe('manha')
  })

  it('devolve null quando não há marcações futuras', () => {
    expect(obterProximaMarcacao(marcacoes, 999, AGORA)).toBeNull()
  })
})

describe('descreverProximaSessao', () => {
  it('"Por agendar" quando não há marcação', () => {
    expect(descreverProximaSessao(null, AGORA)).toBe('Por agendar')
  })

  it('"Hoje, HH:MM" para hoje (sem segundos)', () => {
    expect(descreverProximaSessao(marcacoes[0], AGORA)).toBe('Hoje, 09:00')
  })

  it('data curta + hora para outros dias', () => {
    const texto = descreverProximaSessao(marcacoes[1], AGORA)
    expect(texto).toBe('20 out, 14:30')
  })
})

describe('validarMarcacao', () => {
  const valida = { pacienteId: '7', data: '2026-10-14', hora: '10:00', motivo: 'Sessão' }

  it('aceita uma marcação válida', () => {
    expect(validarMarcacao(valida, AGORA)).toBeNull()
  })

  it('aceita uma marcação para hoje', () => {
    expect(validarMarcacao({ ...valida, data: '2026-10-13' }, AGORA)).toBeNull()
  })

  it.each([
    [{ pacienteId: '' }, /paciente/i],
    [{ data: '' }, /data/i],
    [{ hora: '' }, /horário/i],
    [{ motivo: '   ' }, /motivo/i],
    [{ data: '2026-10-12' }, /passado/i],
  ])('rejeita %o', (alteracao, mensagem) => {
    expect(validarMarcacao({ ...valida, ...alteracao }, AGORA)).toMatch(mensagem)
  })

  it('ao editar uma sessão antiga, deixa manter a data dela', () => {
    expect(validarMarcacao({ ...valida, data: '2026-10-01' }, AGORA, '2026-10-01')).toBeNull()
  })

  it('ao editar, não deixa mover para OUTRA data no passado', () => {
    expect(validarMarcacao({ ...valida, data: '2026-10-02' }, AGORA, '2026-10-01')).toMatch(/passado/)
  })
})
