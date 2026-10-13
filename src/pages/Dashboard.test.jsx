import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarSupabaseMock } from '../test/supabaseMock'
import Dashboard from './Dashboard'

const { supabase } = vi.hoisted(() => ({ supabase: {} }))
vi.mock('../supabase', () => ({ supabase }))

const pacientes = [
  { id: 1, nome: 'João Pereira', iniciais: 'JP', idade: 40, condicao: 'Entorse', contacto: '911111111', estado: 'Em tratamento', notas: [] },
  { id: 2, nome: 'Maria Silva', iniciais: 'MS', idade: 34, condicao: 'Lombalgia', contacto: '922222222', estado: 'Em avaliação', notas: [] },
]
const marcacoes = [
  { id: 10, pacienteId: 1, nomePaciente: 'João Pereira', data: '2026-10-13', hora: '15:00:00', motivo: 'Sessão' },
  { id: 11, pacienteId: 2, nomePaciente: 'Maria Silva', data: '2026-10-20', hora: '09:30', motivo: 'Avaliação' },
  { id: 12, pacienteId: 2, nomePaciente: 'Maria Silva', data: '2026-10-13', hora: '08:00', motivo: 'Sessão' },
]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 13, 10, 0))
  Object.assign(supabase, criarSupabaseMock({ pacientes, marcacoes }))
})
afterEach(() => vi.useRealTimers())

const linhaDe = (nome) => screen.getByText(nome).closest('tr')

describe('<Dashboard />', () => {
  it('lista os pacientes e as estatísticas', async () => {
    render(<Dashboard />)

    expect(await screen.findByText('João Pereira')).toBeInTheDocument()
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('Total de Pacientes').nextElementSibling).toHaveTextContent('2')
    expect(screen.getByText('Consultas Hoje').nextElementSibling).toHaveTextContent('2')
  })

  it('carrega os pacientes apenas uma vez (antes eram duas)', async () => {
    render(<Dashboard />)
    await screen.findByText('João Pereira')
    const chamadasPacientes = supabase.from.mock.calls.filter(([t]) => t === 'pacientes')
    expect(chamadasPacientes).toHaveLength(1)
  })

  it('mostra a próxima sessão de cada paciente', async () => {
    render(<Dashboard />)
    await screen.findByText('João Pereira')

    expect(within(linhaDe('João Pereira')).getByText('Hoje, 15:00')).toBeInTheDocument()
    // Maria tem uma às 08:00 de hoje (já passou a hora, mas é hoje) e outra dia 20
    expect(within(linhaDe('Maria Silva')).getByText('Hoje, 08:00')).toBeInTheDocument()
  })

  it('pesquisa por nome ou condição, sem acentos', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    await screen.findByText('João Pereira')

    await user.type(screen.getByRole('searchbox', { name: 'Pesquisar paciente' }), 'joao')
    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'lombal')
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.queryByText('João Pereira')).not.toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'xyz')
    expect(screen.getByText(/Nenhum paciente corresponde a "xyz"/)).toBeInTheDocument()
  })

  it('cada estado tem a sua cor', async () => {
    render(<Dashboard />)
    await screen.findByText('João Pereira')
    expect(within(linhaDe('João Pereira')).getByText('Em tratamento')).toHaveClass('badge-green')
    expect(within(linhaDe('Maria Silva')).getByText('Em avaliação')).toHaveClass('badge-blue')
  })

  it('adiciona um paciente e mostra-o no topo da lista', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    await screen.findByText('João Pereira')

    await user.click(screen.getByRole('button', { name: /Adicionar Novo Paciente/ }))
    await user.type(screen.getByLabelText(/Nome/), 'Rita Gomes')
    await user.type(screen.getByLabelText(/Idade/), '29')
    await user.type(screen.getByLabelText(/Contato/), '933333333')
    await user.type(screen.getByLabelText(/Motivo da consulta/), 'Tendinite')
    await user.click(screen.getByRole('button', { name: /Guardar paciente/ }))

    expect(await screen.findByText('Rita Gomes')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Rita Gomes')
    expect(supabase.db.pacientes).toHaveLength(3)
    expect(supabase.db.pacientes[2]).toMatchObject({ nome: 'Rita Gomes', idade: 29, iniciais: 'RG' })
  })

  it('mantém o modal aberto se a gravação falhar', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    supabase.falhas.pacientes = { insert: { message: 'falhou' } }
    render(<Dashboard />)
    await screen.findByText('João Pereira')

    await user.click(screen.getByRole('button', { name: /Adicionar Novo Paciente/ }))
    await user.type(screen.getByLabelText(/Nome/), 'Rita Gomes')
    await user.type(screen.getByLabelText(/Idade/), '29')
    await user.type(screen.getByLabelText(/Contato/), '933333333')
    await user.type(screen.getByLabelText(/Motivo da consulta/), 'Tendinite')
    await user.click(screen.getByRole('button', { name: /Guardar paciente/ }))

    expect(window.alert).toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('remove um paciente após confirmação', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<Dashboard />)
    await screen.findByText('João Pereira')

    await user.click(screen.getByRole('button', { name: 'Remover João Pereira' }))

    expect(screen.queryByText('João Pereira')).not.toBeInTheDocument()
    expect(supabase.db.pacientes.map((p) => p.id)).toEqual([2])
    // as consultas dele deixam de contar para "Consultas Hoje"
    expect(screen.getByText('Consultas Hoje').nextElementSibling).toHaveTextContent('1')
  })

  it('não remove se o utilizador cancelar', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<Dashboard />)
    await screen.findByText('João Pereira')

    await user.click(screen.getByRole('button', { name: 'Remover João Pereira' }))

    expect(screen.getByText('João Pereira')).toBeInTheDocument()
    expect(supabase.db.pacientes).toHaveLength(2)
  })

  it('abre a ficha, muda o estado e volta à lista', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    await screen.findByText('João Pereira')

    await user.click(screen.getByRole('button', { name: 'Ver ficha de Maria Silva' }))
    expect(await screen.findByRole('heading', { name: 'Maria Silva' })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Estado do tratamento'), 'Em pausa')
    expect(supabase.db.pacientes.find((p) => p.id === 2).estado).toBe('Em pausa')

    await user.click(screen.getByRole('button', { name: /Voltar aos pacientes/ }))
    expect(within(linhaDe('Maria Silva')).getByText('Em pausa')).toHaveClass('badge-amber')
  })

  it('mostra mensagem quando o carregamento falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    supabase.falhas.pacientes = { select: { message: 'offline' } }
    render(<Dashboard />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível carregar/)
  })
})
