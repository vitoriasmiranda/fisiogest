import { describe, expect, it } from 'vitest'
import {
  classeBadgeEstado,
  contactoValido,
  criarPaciente,
  ESTADOS,
  filtrarPacientes,
  gerarIniciais,
  LIMITE_HISTORICO,
  validarPaciente,
} from './pacientes'

describe('gerarIniciais', () => {
  it.each([
    ['Maria da Silva', 'MS'],
    ['joão pedro', 'JP'],
    ['  Ana   Costa  ', 'AC'], // espaços extra
    ['Ana', 'AN'],
    ['', '?'],
    [null, '?'],
    ['Élio Ângelo', 'ÉÂ'],
  ])('%s -> %s', (nome, esperado) => {
    expect(gerarIniciais(nome)).toBe(esperado)
  })
})

describe('contactoValido', () => {
  it.each(['912345678', '+351 912 345 678', '(31) 98765-4321', '+55 31 98765-4321'])('aceita %s', (c) => {
    expect(contactoValido(c)).toBe(true)
  })

  it.each(['123', 'abc123456789', '91234567a', '', '+1234567890123456'])('rejeita %s', (c) => {
    expect(contactoValido(c)).toBe(false)
  })
})

describe('validarPaciente', () => {
  const valido = { nome: 'Maria Silva', idade: '34', contacto: '912345678', condicao: 'Lombalgia', historico: '' }

  it('não devolve erros para dados válidos', () => {
    expect(validarPaciente(valido)).toEqual({})
  })

  it('assinala todos os campos obrigatórios em falta', () => {
    const erros = validarPaciente({ nome: '', idade: '', contacto: '', condicao: '' })
    expect(Object.keys(erros).sort()).toEqual(['condicao', 'contacto', 'idade', 'nome'])
  })

  it('nome só com espaços conta como vazio', () => {
    expect(validarPaciente({ ...valido, nome: '   ' }).nome).toMatch(/obrigatório/)
  })

  it.each(['-1', '121', '3.5', 'abc'])('rejeita idade %s', (idade) => {
    expect(validarPaciente({ ...valido, idade }).idade).toMatch(/inválida/)
  })

  it('aceita idade 0 (bebés)', () => {
    expect(validarPaciente({ ...valido, idade: '0' }).idade).toBeUndefined()
  })

  it('rejeita contacto inválido', () => {
    expect(validarPaciente({ ...valido, contacto: '12' }).contacto).toMatch(/inválido/)
  })

  it('rejeita histórico acima do limite', () => {
    const historico = 'a'.repeat(LIMITE_HISTORICO + 1)
    expect(validarPaciente({ ...valido, historico }).historico).toBeDefined()
  })
})

describe('criarPaciente', () => {
  it('limpa espaços, converte a idade em número e define o estado inicial', () => {
    const p = criarPaciente({ nome: ' Maria Silva ', idade: '34', contacto: ' 912345678 ', condicao: ' Lombalgia ', historico: '' })
    expect(p).toEqual({
      nome: 'Maria Silva',
      iniciais: 'MS',
      idade: 34,
      contacto: '912345678',
      condicao: 'Lombalgia',
      historico: '',
      estado: 'Em avaliação',
    })
  })

  it('não envia id (é gerado pelo Supabase)', () => {
    expect(criarPaciente({ nome: 'A B', idade: '1', contacto: '912345678', condicao: 'x' })).not.toHaveProperty('id')
  })
})

describe('filtrarPacientes', () => {
  const pacientes = [
    { id: 1, nome: 'João Pereira', condicao: 'Entorse' },
    { id: 2, nome: 'Maria Silva', condicao: 'Lombalgia' },
    { id: 3, nome: 'Ana Costa', condicao: 'Pós-operatório LCA' },
  ]

  it('termo vazio devolve todos', () => {
    expect(filtrarPacientes(pacientes, '  ')).toHaveLength(3)
  })

  it('pesquisa por nome sem diferenciar maiúsculas nem acentos', () => {
    expect(filtrarPacientes(pacientes, 'JOAO').map((p) => p.id)).toEqual([1])
  })

  it('pesquisa pela condição', () => {
    expect(filtrarPacientes(pacientes, 'lca').map((p) => p.id)).toEqual([3])
  })

  it('não rebenta com campos em falta', () => {
    expect(filtrarPacientes([{ id: 9, nome: null }], 'x')).toEqual([])
  })
})

describe('classeBadgeEstado', () => {
  it('cada estado tem uma cor própria', () => {
    const classes = ESTADOS.map(classeBadgeEstado)
    expect(new Set(classes).size).toBe(ESTADOS.length)
  })

  it('estado desconhecido usa cinzento', () => {
    expect(classeBadgeEstado('???')).toBe('badge-gray')
  })
})
