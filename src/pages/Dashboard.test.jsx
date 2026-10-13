import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarSupabaseMock } from '../test/supabaseMock'
import Dashboard from './Dashboard'

const { supabase } = vi.hoisted(() => ({ supabase: {} }))
vi.mock('../supabase', () => ({ supabase }))

const pacientes = [
  { id: 1, nome: 'João Pereira', iniciais: 'JP', data_nascimento: '1986-01-10', condicao: 'Entorse', contacto: '911111111', estado: 'Em tratamento', notas: [] },
  { id: 2, nome: 'Maria Silva', iniciais: 'MS', idade: '34', condicao: 'Lombalgia', contacto: '922222222', estado: 'Em avaliação', notas: [] },
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
    expect(screen.getByText('Total de pacientes').nextElementSibling).toHaveTextContent('2')
    expect(screen.getByText('Consultas hoje').nextElementSibling).toHaveTextContent('2')
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

    await user.click(screen.getByRole('button', { name: /Adicionar novo paciente/ }))
    await user.type(screen.getByLabelText(/Nome/), 'Rita Gomes')
    await user.type(screen.getByLabelText(/Data de nascimento/), '1997-06-15')
    await user.type(screen.getByLabelText(/Telefone/), '31933333333')
    await user.type(screen.getByLabelText(/Motivo da consulta/), 'Tendinite')
    await user.click(screen.getByRole('button', { name: /Salvar paciente/ }))

    expect(await screen.findByText('Rita Gomes')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Rita Gomes')
    expect(supabase.db.pacientes).toHaveLength(3)
    expect(supabase.db.pacientes[2]).toMatchObject({ nome: 'Rita Gomes', data_nascimento: '1997-06-15', iniciais: 'RG' })
  })

  it('mantém o modal aberto se a gravação falhar', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    supabase.falhas.pacientes = { insert: { message: 'falhou' } }
    render(<Dashboard />)
    await screen.findByText('João Pereira')

    await user.click(screen.getByRole('button', { name: /Adicionar novo paciente/ }))
    await user.type(screen.getByLabelText(/Nome/), 'Rita Gomes')
    await user.type(screen.getByLabelText(/Data de nascimento/), '1997-06-15')
    await user.type(screen.getByLabelText(/Telefone/), '31933333333')
    await user.type(screen.getByLabelText(/Motivo da consulta/), 'Tendinite')
    await user.click(screen.getByRole('button', { name: /Salvar paciente/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível salvar o paciente/)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('remove um paciente após confirmação na janela da app', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    await screen.findByText('João Pereira')

    await user.click(screen.getByRole('button', { name: 'Remover João Pereira' }))
    const dialogo = screen.getByRole('alertdialog', { name: 'Remover João Pereira?' })
    expect(dialogo).toHaveTextContent(/não pode ser desfeita/)
    await user.click(within(dialogo).getByRole('button', { name: 'Remover' }))

    expect(screen.queryByText('João Pereira')).not.toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(supabase.db.pacientes.map((p) => p.id)).toEqual([2])
    // as consultas dele deixam de contar para "Consultas Hoje"
    expect(screen.getByText('Consultas hoje').nextElementSibling).toHaveTextContent('1')
  })

  it('não remove se a pessoa cancelar', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    await screen.findByText('João Pereira')

    await user.click(screen.getByRole('button', { name: 'Remover João Pereira' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

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

    await user.click(screen.getByRole('button', { name: /Voltar para pacientes/ }))
    expect(within(linhaDe('Maria Silva')).getByText('Em pausa')).toHaveClass('badge-amber')
  })

  it('mostra erro na página se a remoção falhar', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    supabase.falhas.pacientes = { delete: { message: 'falhou' } }
    render(<Dashboard />)
    await screen.findByText('João Pereira')

    await user.click(screen.getByRole('button', { name: 'Remover João Pereira' }))
    await user.click(screen.getByRole('button', { name: 'Remover' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível remover/)
    expect(screen.getByText('João Pereira')).toBeInTheDocument()
  })

  it('mostra a idade calculada (data de nascimento) e a idade antiga de quem ainda não tem', async () => {
    render(<Dashboard />)
    await screen.findByText('João Pereira')
    expect(within(linhaDe('João Pereira')).getByText('40 anos')).toBeInTheDocument()
    expect(within(linhaDe('Maria Silva')).getByText('34 anos')).toBeInTheDocument()
  })

  it('editar o nome atualiza a ficha, a lista e o nome guardado nos agendamentos', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    await screen.findByText('João Pereira')

    await user.click(screen.getByRole('button', { name: 'Ver ficha de João Pereira' }))
    await user.click(await screen.findByRole('button', { name: /Editar dados/ }))
    const nome = screen.getByLabelText(/Nome/)
    await user.clear(nome)
    await user.type(nome, 'João Pereira Santos')
    await user.click(screen.getByRole('button', { name: /Salvar alterações/ }))

    expect(await screen.findByRole('heading', { name: 'João Pereira Santos' })).toBeInTheDocument()
    expect(supabase.db.pacientes.find((p) => p.id === 1)).toMatchObject({ nome: 'João Pereira Santos', estado: 'Em tratamento' })
    expect(supabase.db.marcacoes.find((m) => m.id === 10).nomePaciente).toBe('João Pereira Santos')
    // o agendamento da Maria não muda
    expect(supabase.db.marcacoes.find((m) => m.id === 11).nomePaciente).toBe('Maria Silva')

    await user.click(screen.getByRole('button', { name: /Voltar para pacientes/ }))
    expect(screen.getByText('João Pereira Santos')).toBeInTheDocument()
  })

  it('erro ao editar mantém o modal aberto com a mensagem', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<Dashboard />)
    await screen.findByText('João Pereira')
    supabase.falhas.pacientes = { update: { message: 'offline' } }

    await user.click(screen.getByRole('button', { name: 'Ver ficha de João Pereira' }))
    await user.click(await screen.findByRole('button', { name: /Editar dados/ }))
    await user.click(screen.getByRole('button', { name: /Salvar alterações/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível salvar as alterações/)
    expect(screen.getByRole('dialog', { name: 'Editar paciente' })).toBeInTheDocument()
  })

  it('mostra mensagem quando o carregamento falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    supabase.falhas.pacientes = { select: { message: 'offline' } }
    render(<Dashboard />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível carregar/)
  })
})
