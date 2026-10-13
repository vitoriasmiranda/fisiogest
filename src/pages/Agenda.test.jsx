import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarSupabaseMock } from '../test/supabaseMock'
import Agenda from './Agenda'

const { supabase } = vi.hoisted(() => ({ supabase: {} }))
vi.mock('../supabase', () => ({ supabase }))

const marcacoes = [
  { id: 1, pacienteId: 1, nomePaciente: 'João Pereira', data: '2026-10-13', hora: '09:00:00', motivo: 'Avaliação' },
  { id: 2, pacienteId: 2, nomePaciente: 'Maria Silva', data: '2026-10-13', hora: '09:30', motivo: 'Reforço' },
  { id: 3, pacienteId: 2, nomePaciente: 'Maria Silva', data: '2026-10-13', hora: '22:30', motivo: 'Fora de horas' },
  { id: 4, pacienteId: 1, nomePaciente: 'João Pereira', data: '2026-10-14', hora: '11:00', motivo: 'Amanhã' },
]

function prepararRelogio(data) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(data)
}

beforeEach(() => {
  prepararRelogio(new Date(2026, 9, 13, 10, 0))
  Object.assign(
    supabase,
    criarSupabaseMock({ pacientes: [{ id: 1, nome: 'João Pereira' }, { id: 2, nome: 'Maria Silva' }], marcacoes }),
  )
})
afterEach(() => vi.useRealTimers())

describe('<Agenda /> — vista de dia', () => {
  it('mostra as duas marcações do bloco das 09h (antes a das 09:30 ficava escondida)', async () => {
    render(<Agenda />)
    expect(await screen.findByText('Avaliação (às 09:00)')).toBeInTheDocument()
    expect(screen.getByText('Reforço (às 09:30)')).toBeInTheDocument()
  })

  it('mostra agendamentos fora do horário da grade numa linha "Outros"', async () => {
    render(<Agenda />)
    expect(await screen.findByText('Fora de horas (às 22:30)')).toBeInTheDocument()
    expect(screen.getByText('Outros')).toBeInTheDocument()
  })

  it('navega para o dia seguinte e anterior', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await user.click(screen.getByRole('button', { name: 'Dia seguinte' }))
    expect(screen.getByText('Amanhã (às 11:00)')).toBeInTheDocument()
    expect(screen.queryByText('Avaliação (às 09:00)')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dia anterior' }))
    expect(screen.getByText('Avaliação (às 09:00)')).toBeInTheDocument()
  })

  it('cancela um agendamento após confirmação na janela da app', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await user.click(screen.getByRole('button', { name: 'Cancelar agendamento de João Pereira às 09:00' }))
    const dialogo = screen.getByRole('alertdialog', { name: 'Cancelar agendamento?' })
    expect(dialogo).toHaveTextContent('A sessão de João Pereira às 09:00')
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar agendamento' }))

    expect(screen.queryByText('Avaliação (às 09:00)')).not.toBeInTheDocument()
    expect(supabase.db.marcacoes.map((m) => m.id)).toEqual([2, 3, 4])
  })

  it('"Manter" fecha a janela sem apagar', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await user.click(screen.getByRole('button', { name: 'Cancelar agendamento de João Pereira às 09:00' }))
    await user.click(screen.getByRole('button', { name: 'Manter' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByText('Avaliação (às 09:00)')).toBeInTheDocument()
    expect(supabase.db.marcacoes).toHaveLength(4)
  })

  it('mostra erro na página se o cancelamento falhar', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    supabase.falhas.marcacoes = { delete: { message: 'offline' } }
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await user.click(screen.getByRole('button', { name: 'Cancelar agendamento de João Pereira às 09:00' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar agendamento' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível cancelar o agendamento/)
    expect(screen.getByText('Avaliação (às 09:00)')).toBeInTheDocument()
  })
})

describe('<Agenda /> — nova marcação', () => {
  async function agendar(user, { data, hora, paciente = 'João Pereira', motivo = 'Nova sessão' }) {
    await user.click(screen.getByRole('button', { name: /Novo agendamento/ }))
    await user.selectOptions(await screen.findByLabelText('Paciente'), await screen.findByRole('option', { name: paciente }))
    const campoData = screen.getByLabelText('Data')
    await user.clear(campoData)
    await user.type(campoData, data)
    await user.type(screen.getByLabelText('Horário'), hora)
    await user.type(screen.getByLabelText('Motivo da sessão'), motivo)
    await user.click(screen.getByRole('button', { name: 'Agendar sessão' }))
  }

  it('bloqueia horário já ocupado, mesmo que o Supabase guarde "09:00:00"', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await agendar(user, { data: '2026-10-13', hora: '09:00' })

    expect(await screen.findByRole('alert')).toHaveTextContent(/Horário indisponível/)
    expect(supabase.db.marcacoes).toHaveLength(4)
  })

  it('salva um horário livre, fecha o modal e mostra na grade', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await agendar(user, { data: '2026-10-13', hora: '14:00', motivo: 'Mobilização' })

    expect(await screen.findByText('Mobilização (às 14:00)')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(supabase.db.marcacoes).toHaveLength(5)
  })

  it('depois de salvar em outro dia, a agenda vai para esse dia', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await agendar(user, { data: '2026-10-16', hora: '10:00', motivo: 'Sexta' })

    expect(await screen.findByText('Sexta (às 10:00)')).toBeInTheDocument()
    expect(screen.getByTestId('titulo-dia')).toHaveTextContent(/16/)
  })

  it('traduz a violação de UNIQUE do Supabase (duas pessoas agendando ao mesmo tempo)', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    supabase.falhas.marcacoes = { insert: { code: '23505', message: 'duplicate key' } }
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await agendar(user, { data: '2026-10-13', hora: '16:00' })

    expect(await screen.findByRole('alert')).toHaveTextContent(/Outra pessoa acabou de agendar/)
  })
})

describe('<Agenda /> — vista de mês', () => {
  it('marca os dias com consultas e abre o dia ao clicar', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await user.click(screen.getByRole('button', { name: 'Mês' }))
    expect(screen.getByRole('button', { name: 'Dia 14, com agendamentos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dia 15' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dia 14, com agendamentos' }))
    expect(screen.getByText('Amanhã (às 11:00)')).toBeInTheDocument()
  })

  it('o dia de hoje fica destacado', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await user.click(screen.getByRole('button', { name: 'Mês' }))
    expect(screen.getByRole('button', { name: /^Dia 13/ })).toHaveClass('today')
  })

  it('de 31 de janeiro, "mês seguinte" vai para fevereiro (antes saltava para março)', async () => {
    prepararRelogio(new Date(2026, 0, 31, 10, 0))
    const user = userEvent.setup()
    render(<Agenda />)
    await user.click(screen.getByRole('button', { name: 'Mês' }))

    await user.click(screen.getByRole('button', { name: 'Mês seguinte' }))

    expect(screen.getByTestId('titulo-mes')).toHaveTextContent(/fevereiro/i)
    const dias = within(screen.getByTestId('titulo-mes').closest('.calendar-month-grid')).getAllByRole('button', { name: /^Dia \d+/ })
    expect(dias).toHaveLength(28)
  })
})

describe('<Agenda /> — editar agendamento', () => {
  it('abre o modal preenchido e salva a mudança de horário', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await user.click(screen.getByRole('button', { name: 'Editar agendamento de João Pereira às 09:00' }))
    const modal = screen.getByRole('dialog', { name: 'Editar agendamento' })
    await within(modal).findByRole('option', { name: 'João Pereira' })
    expect(within(modal).getByLabelText('Horário')).toHaveValue('09:00')

    const hora = within(modal).getByLabelText('Horário')
    await user.clear(hora)
    await user.type(hora, '15:00')
    await user.click(within(modal).getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Avaliação (às 15:00)')).toBeInTheDocument()
    expect(screen.queryByText('Avaliação (às 09:00)')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(supabase.db.marcacoes).toHaveLength(4)
    expect(supabase.db.marcacoes.find((m) => m.id === 1).hora).toBe('15:00')
  })

  it('salvar sem mudar o horário não acusa conflito consigo mesma', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await user.click(screen.getByRole('button', { name: 'Editar agendamento de João Pereira às 09:00' }))
    const modal = screen.getByRole('dialog', { name: 'Editar agendamento' })
    await within(modal).findByRole('option', { name: 'João Pereira' })
    const motivo = within(modal).getByLabelText('Motivo da sessão')
    await user.clear(motivo)
    await user.type(motivo, 'Reavaliação')
    await user.click(within(modal).getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Reavaliação (às 09:00)')).toBeInTheDocument()
  })

  it('não deixa mover para um horário de outro agendamento', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await user.click(screen.getByRole('button', { name: 'Editar agendamento de João Pereira às 09:00' }))
    const modal = screen.getByRole('dialog', { name: 'Editar agendamento' })
    await within(modal).findByRole('option', { name: 'João Pereira' })
    const hora = within(modal).getByLabelText('Horário')
    await user.clear(hora)
    await user.type(hora, '09:30')
    await user.click(within(modal).getByRole('button', { name: 'Salvar alterações' }))

    expect(await within(modal).findByRole('alert')).toHaveTextContent(/Horário indisponível/)
    expect(supabase.db.marcacoes.find((m) => m.id === 1).hora).toBe('09:00:00')
  })

  it('depois de editar, "Novo agendamento" abre o formulário vazio', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await user.click(screen.getByRole('button', { name: 'Editar agendamento de João Pereira às 09:00' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: /Novo agendamento/ }))

    expect(screen.getByRole('dialog', { name: 'Novo agendamento' })).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo da sessão')).toHaveValue('')
  })
})
