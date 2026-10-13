import { describe, expect, it } from 'vitest'
import {
  classeBadgeEstado,
  contatoValido,
  criarPaciente,
  dadosDoFormulario,
  descreverIdade,
  ESTADOS,
  filtrarPacientes,
  formularioDoPaciente,
  gerarIniciais,
  idadeDoPaciente,
  LIMITE_HISTORICO,
  validarPaciente,
} from './pacientes'

const HOJE = new Date(2026, 9, 13) // 13/10/2026

describe('gerarIniciais', () => {
  it.each([
    ['Maria da Silva', 'MS'],
    ['joão pedro', 'JP'],
    ['  Ana   Costa  ', 'AC'], // espaços extras
    ['Ana', 'AN'],
    ['', '?'],
    [null, '?'],
    ['Élio Ângelo', 'ÉÂ'],
  ])('%s -> %s', (nome, esperado) => {
    expect(gerarIniciais(nome)).toBe(esperado)
  })
})

describe('contatoValido', () => {
  it.each(['31987654321', '(31) 98765-4321', '+55 31 98765-4321', '3133334444', '912345678'])('aceita %s', (c) => {
    expect(contatoValido(c)).toBe(true)
  })

  it.each(['123', 'abc123456789', '3198765432a', '', '+1234567890123456'])('rejeita %s', (c) => {
    expect(contatoValido(c)).toBe(false)
  })
})

describe('idadeDoPaciente / descreverIdade', () => {
  it('calcula pela data de nascimento', () => {
    expect(idadeDoPaciente({ data_nascimento: '1992-03-20' }, HOJE)).toBe(34)
  })

  it('a data de nascimento tem prioridade sobre a idade antiga', () => {
    expect(idadeDoPaciente({ data_nascimento: '1992-03-20', idade: '20' }, HOJE)).toBe(34)
  })

  it('paciente antigo sem data de nascimento usa a idade guardada (texto)', () => {
    expect(idadeDoPaciente({ idade: '40' }, HOJE)).toBe(40)
  })

  it('sem nenhuma das duas devolve null', () => {
    expect(idadeDoPaciente({}, HOJE)).toBeNull()
    expect(idadeDoPaciente({ idade: '' }, HOJE)).toBeNull()
    expect(idadeDoPaciente({ idade: 'abc' }, HOJE)).toBeNull()
  })

  it('texto para a tela, com singular e plural', () => {
    expect(descreverIdade({ data_nascimento: '1992-03-20' }, HOJE)).toBe('34 anos')
    expect(descreverIdade({ data_nascimento: '2025-05-01' }, HOJE)).toBe('1 ano')
    expect(descreverIdade({ data_nascimento: '2026-09-01' }, HOJE)).toBe('0 anos')
    expect(descreverIdade({}, HOJE)).toBe('Idade não informada')
  })
})

describe('validarPaciente', () => {
  const valido = { nome: 'Maria Silva', dataNascimento: '1992-03-20', contato: '31987654321', condicao: 'Lombalgia', historico: '' }

  it('não devolve erros para dados válidos', () => {
    expect(validarPaciente(valido, HOJE)).toEqual({})
  })

  it('aponta todos os campos obrigatórios em falta', () => {
    const erros = validarPaciente({ nome: '', dataNascimento: '', contato: '', condicao: '' }, HOJE)
    expect(Object.keys(erros).sort()).toEqual(['condicao', 'contato', 'dataNascimento', 'nome'])
  })

  it('nome só com espaços conta como vazio', () => {
    expect(validarPaciente({ ...valido, nome: '   ' }, HOJE).nome).toMatch(/obrigatório/)
  })

  it('rejeita data de nascimento no futuro', () => {
    expect(validarPaciente({ ...valido, dataNascimento: '2026-10-14' }, HOJE).dataNascimento).toMatch(/futuro/)
  })

  it('aceita quem nasceu hoje', () => {
    expect(validarPaciente({ ...valido, dataNascimento: '2026-10-13' }, HOJE).dataNascimento).toBeUndefined()
  })

  it('rejeita mais de 120 anos', () => {
    expect(validarPaciente({ ...valido, dataNascimento: '1900-01-01' }, HOJE).dataNascimento).toMatch(/inválida/)
  })

  it('rejeita telefone inválido', () => {
    expect(validarPaciente({ ...valido, contato: '12' }, HOJE).contato).toMatch(/inválido/)
  })

  it('rejeita histórico acima do limite', () => {
    const historico = 'a'.repeat(LIMITE_HISTORICO + 1)
    expect(validarPaciente({ ...valido, historico }, HOJE).historico).toBeDefined()
  })
})

describe('dadosDoFormulario / criarPaciente / formularioDoPaciente', () => {
  const form = { nome: ' Maria Silva ', dataNascimento: '1992-03-20', contato: ' 31987654321 ', condicao: ' Lombalgia ', historico: '' }

  it('limpa espaços e usa os nomes de coluna do banco', () => {
    expect(dadosDoFormulario(form)).toEqual({
      nome: 'Maria Silva',
      iniciais: 'MS',
      data_nascimento: '1992-03-20',
      contacto: '31987654321',
      condicao: 'Lombalgia',
      historico: '',
    })
  })

  it('a edição não mexe no estado nem no id', () => {
    const dados = dadosDoFormulario(form)
    expect(dados).not.toHaveProperty('estado')
    expect(dados).not.toHaveProperty('id')
  })

  it('o cadastro novo começa "Em avaliação" e não envia idade nem id', () => {
    const p = criarPaciente(form)
    expect(p.estado).toBe('Em avaliação')
    expect(p).not.toHaveProperty('idade')
    expect(p).not.toHaveProperty('id')
  })

  it('preenche o formulário de edição a partir da ficha', () => {
    const ficha = { id: 1, nome: 'Ana', data_nascimento: '1980-01-02', contacto: '31911112222', condicao: 'Entorse', historico: null }
    expect(formularioDoPaciente(ficha)).toEqual({
      nome: 'Ana',
      dataNascimento: '1980-01-02',
      contato: '31911112222',
      condicao: 'Entorse',
      historico: '',
    })
  })

  it('sem ficha devolve formulário vazio', () => {
    expect(formularioDoPaciente(null)).toEqual({ nome: '', dataNascimento: '', contato: '', condicao: '', historico: '' })
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

  it('não quebra com campos em falta', () => {
    expect(filtrarPacientes([{ id: 9, nome: null }], 'x')).toEqual([])
  })
})

describe('classeBadgeEstado', () => {
  it('cada estado tem uma cor própria', () => {
    const classes = ESTADOS.map(classeBadgeEstado)
    expect(new Set(classes).size).toBe(ESTADOS.length)
  })

  it('estado desconhecido usa cinza', () => {
    expect(classeBadgeEstado('???')).toBe('badge-gray')
  })
})
