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

  it('mostra marcações fora do horário da grelha numa linha "Outros"', async () => {
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

  it('cancela uma marcação após confirmação', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await user.click(screen.getByRole('button', { name: 'Cancelar marcação de João Pereira às 09:00' }))

    expect(screen.queryByText('Avaliação (às 09:00)')).not.toBeInTheDocument()
    expect(supabase.db.marcacoes.map((m) => m.id)).toEqual([2, 3, 4])
  })
})

describe('<Agenda /> — nova marcação', () => {
  async function agendar(user, { data, hora, paciente = 'João Pereira', motivo = 'Nova sessão' }) {
    await user.click(screen.getByRole('button', { name: /Nova Marcação/ }))
    await user.selectOptions(await screen.findByLabelText('Paciente'), await screen.findByRole('option', { name: paciente }))
    const campoData = screen.getByLabelText('Data')
    await user.clear(campoData)
    await user.type(campoData, data)
    await user.type(screen.getByLabelText('Hora'), hora)
    await user.type(screen.getByLabelText('Motivo da Sessão'), motivo)
    await user.click(screen.getByRole('button', { name: 'Agendar Sessão' }))
  }

  it('bloqueia horário já ocupado, mesmo que o Supabase guarde "09:00:00"', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await agendar(user, { data: '2026-10-13', hora: '09:00' })

    expect(await screen.findByRole('alert')).toHaveTextContent(/Horário indisponível/)
    expect(supabase.db.marcacoes).toHaveLength(4)
  })

  it('grava um horário livre, fecha o modal e mostra-o na grelha', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await agendar(user, { data: '2026-10-13', hora: '14:00', motivo: 'Mobilização' })

    expect(await screen.findByText('Mobilização (às 14:00)')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(supabase.db.marcacoes).toHaveLength(5)
  })

  it('depois de gravar noutro dia, a agenda salta para esse dia', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await agendar(user, { data: '2026-10-16', hora: '10:00', motivo: 'Sexta' })

    expect(await screen.findByText('Sexta (às 10:00)')).toBeInTheDocument()
    expect(screen.getByTestId('titulo-dia')).toHaveTextContent(/16/)
  })

  it('traduz a violação de UNIQUE do Supabase (corrida entre dois utilizadores)', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    supabase.falhas.marcacoes = { insert: { code: '23505', message: 'duplicate key' } }
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await agendar(user, { data: '2026-10-13', hora: '16:00' })

    expect(await screen.findByRole('alert')).toHaveTextContent(/Outra pessoa acabou de marcar/)
  })
})

describe('<Agenda /> — vista de mês', () => {
  it('marca os dias com consultas e abre o dia ao clicar', async () => {
    const user = userEvent.setup()
    render(<Agenda />)
    await screen.findByText('Avaliação (às 09:00)')

    await user.click(screen.getByRole('button', { name: 'Mês' }))
    expect(screen.getByRole('button', { name: 'Dia 14, com marcações' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dia 15' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dia 14, com marcações' }))
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
