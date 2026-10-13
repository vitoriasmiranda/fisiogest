import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarSupabaseMock } from '../test/supabaseMock'
import DetalhesPaciente from './DetalhesPaciente'

const { supabase } = vi.hoisted(() => ({ supabase: {} }))
vi.mock('../supabase', () => ({ supabase }))

const paciente = {
  id: 7,
  nome: 'Ana Costa',
  iniciais: 'AC',
  data_nascimento: '1974-05-02',
  condicao: 'Pós-operatório LCA',
  contacto: '31911112222',
  estado: 'Em tratamento',
  historico: '',
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 13, 10, 0))
  Object.assign(
    supabase,
    criarSupabaseMock({
      emailUsuario: 'vitoria@clinica.com',
      marcacoes: [
        { id: 1, pacienteId: 7, data: '2026-10-01', hora: '09:00', motivo: 'Antiga' },
        { id: 2, pacienteId: 7, data: '2026-10-20', hora: '14:30:00', motivo: 'Reforço muscular' },
        { id: 3, pacienteId: 8, data: '2026-10-14', hora: '08:00', motivo: 'Outro paciente' },
      ],
      notas: [
        { id: 1, paciente_id: 7, texto: 'Primeira sessão', autor: 'joao@clinica.com', criado_em: '2026-10-01T12:00:00+00:00' },
        { id: 2, paciente_id: 8, texto: 'Nota de outro paciente', autor: null, criado_em: '2026-10-02T12:00:00+00:00' },
      ],
    }),
  )
})
afterEach(() => vi.useRealTimers())

const renderizar = (props = {}) =>
  render(<DetalhesPaciente paciente={paciente} aoVoltar={vi.fn()} aoAtualizar={vi.fn().mockResolvedValue(null)} {...props} />)

describe('<DetalhesPaciente /> — dados', () => {
  it('mostra a idade calculada, a data de nascimento e a condição', async () => {
    renderizar()
    expect(screen.getByText('52 anos · Pós-operatório LCA')).toBeInTheDocument()
    expect(screen.getByText('Nascimento: 02/05/1974')).toBeInTheDocument()
    await screen.findByText('Primeira sessão')
  })

  it('paciente antigo sem data de nascimento mostra a idade guardada', async () => {
    renderizar({ paciente: { ...paciente, data_nascimento: null, idade: '50' } })
    expect(screen.getByText('50 anos · Pós-operatório LCA')).toBeInTheDocument()
    expect(screen.getByText('Data de nascimento não informada')).toBeInTheDocument()
    await screen.findByText('Primeira sessão')
  })

  it('mostra a próxima sessão e o motivo, ignorando as passadas e as de outros pacientes', async () => {
    renderizar()
    expect(await screen.findByText('Próxima sessão: 20 out, 14:30')).toBeInTheDocument()
    expect(screen.getByText('Motivo: Reforço muscular')).toBeInTheDocument()
  })

  it('"Por agendar" quando não há sessões futuras', async () => {
    supabase.db.marcacoes.length = 0
    renderizar()
    expect(await screen.findByText('Próxima sessão: Por agendar')).toBeInTheDocument()
  })

  it('mostra texto padrão quando não há histórico', async () => {
    renderizar()
    expect(screen.getByText(/Nenhum histórico registrado/)).toBeInTheDocument()
    await screen.findByText('Primeira sessão')
  })

  it('mudar o estado envia só o campo estado', async () => {
    const user = userEvent.setup()
    const aoAtualizar = vi.fn().mockResolvedValue(null)
    renderizar({ aoAtualizar })
    await screen.findByText('Primeira sessão')

    await user.selectOptions(screen.getByLabelText('Estado do tratamento'), 'Alta médica')

    expect(aoAtualizar).toHaveBeenCalledWith({ estado: 'Alta médica' })
  })

  it('não renderiza nada sem paciente', () => {
    const { container } = render(<DetalhesPaciente paciente={null} aoVoltar={vi.fn()} aoAtualizar={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('<DetalhesPaciente /> — editar dados', () => {
  it('abre o modal já preenchido e envia as alterações', async () => {
    const user = userEvent.setup()
    const aoAtualizar = vi.fn().mockResolvedValue(null)
    renderizar({ aoAtualizar })
    await screen.findByText('Primeira sessão')

    await user.click(screen.getByRole('button', { name: /Editar dados/ }))
    const modal = screen.getByRole('dialog', { name: 'Editar paciente' })
    const telefone = within(modal).getByLabelText(/Telefone/)
    await user.clear(telefone)
    await user.type(telefone, '31988887777')
    await user.click(within(modal).getByRole('button', { name: /Salvar alterações/ }))

    expect(aoAtualizar).toHaveBeenCalledWith(expect.objectContaining({ contacto: '31988887777', nome: 'Ana Costa' }))
    expect(aoAtualizar.mock.calls[0][0]).not.toHaveProperty('estado')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('<DetalhesPaciente /> — notas de evolução (tabela própria)', () => {
  it('carrega só as notas deste paciente, com data, horário e autor', async () => {
    renderizar()
    expect(await screen.findByText('Primeira sessão')).toBeInTheDocument()
    expect(screen.getByText('1 OUT 2026, 09:00 · joao@clinica.com')).toBeInTheDocument()
    expect(screen.queryByText('Nota de outro paciente')).not.toBeInTheDocument()
  })

  it('salva uma nota como linha nova na tabela notas, no topo da lista, e limpa o campo', async () => {
    const user = userEvent.setup()
    const aoAtualizar = vi.fn()
    renderizar({ aoAtualizar })
    await screen.findByText('Primeira sessão')

    await user.type(screen.getByLabelText('Adicionar nota da sessão'), '  Boa evolução  ')
    await user.click(screen.getByRole('button', { name: /Salvar nota/ }))

    const novas = supabase.db.notas.filter((n) => n.paciente_id === 7)
    expect(novas).toHaveLength(2)
    expect(novas[1]).toMatchObject({ paciente_id: 7, texto: 'Boa evolução' })
    // não reescreve a ficha do paciente (era isso que fazia uma nota apagar a outra)
    expect(aoAtualizar).not.toHaveBeenCalled()

    const itens = screen.getAllByText(/OUT 2026/)
    expect(itens[0].nextElementSibling).toHaveTextContent('Boa evolução')
    expect(screen.getByText('13 OUT 2026, 10:00 · vitoria@clinica.com')).toBeInTheDocument()
    expect(screen.getByLabelText('Adicionar nota da sessão')).toHaveValue('')
  })

  it('duas notas seguidas ficam as duas guardadas', async () => {
    const user = userEvent.setup()
    renderizar()
    await screen.findByText('Primeira sessão')

    await user.type(screen.getByLabelText('Adicionar nota da sessão'), 'Nota A')
    await user.click(screen.getByRole('button', { name: /Salvar nota/ }))
    await user.type(screen.getByLabelText('Adicionar nota da sessão'), 'Nota B')
    await user.click(screen.getByRole('button', { name: /Salvar nota/ }))

    expect(supabase.db.notas.filter((n) => n.paciente_id === 7).map((n) => n.texto)).toEqual([
      'Primeira sessão',
      'Nota A',
      'Nota B',
    ])
  })

  it('mantém o texto e mostra o erro se não conseguir salvar', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    supabase.falhas.notas = { insert: { message: 'offline' } }
    renderizar()
    await screen.findByText('Primeira sessão')

    await user.type(screen.getByLabelText('Adicionar nota da sessão'), 'Nota importante')
    await user.click(screen.getByRole('button', { name: /Salvar nota/ }))

    expect(screen.getByLabelText('Adicionar nota da sessão')).toHaveValue('Nota importante')
    expect(screen.getByRole('alert')).toHaveTextContent(/Não foi possível salvar a nota/)
  })

  it('avisa se não conseguir carregar as notas', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    supabase.falhas.notas = { select: { message: 'offline' } }
    renderizar()
    expect(await screen.findByRole('alert')).toHaveTextContent(/carregar as notas/)
  })

  it('mensagem quando ainda não há notas', async () => {
    supabase.db.notas.length = 0
    renderizar()
    expect(await screen.findByText('Ainda não há notas de evolução registradas.')).toBeInTheDocument()
  })

  it('o botão fica desativado com a nota vazia', async () => {
    renderizar()
    expect(screen.getByRole('button', { name: /Salvar nota/ })).toBeDisabled()
    await screen.findByText('Primeira sessão')
  })
})
