import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarSupabaseMock } from '../test/supabaseMock'
import ModalMarcacao from './ModalMarcacao'

const { supabase } = vi.hoisted(() => ({ supabase: {} }))
vi.mock('../supabase', () => ({ supabase }))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 13, 10, 0))
  Object.assign(
    supabase,
    criarSupabaseMock({
      pacientes: [
        { id: 2, nome: 'Rui Alves' },
        { id: 1, nome: 'Ana Costa' },
      ],
    }),
  )
})
afterEach(() => vi.useRealTimers())

async function preencher(user, { data = '2026-10-14', hora = '10:00', motivo = 'Sessão de rotina' } = {}) {
  await user.selectOptions(await screen.findByLabelText('Paciente'), await screen.findByRole('option', { name: 'Ana Costa' }))
  const campoData = screen.getByLabelText('Data')
  await user.clear(campoData)
  if (data) await user.type(campoData, data)
  if (hora) await user.type(screen.getByLabelText('Hora'), hora)
  if (motivo) await user.type(screen.getByLabelText('Motivo da Sessão'), motivo)
}

describe('<ModalMarcacao />', () => {
  it('carrega os pacientes por ordem alfabética', async () => {
    render(<ModalMarcacao aoFechar={vi.fn()} aoGuardar={vi.fn()} />)
    await screen.findByRole('option', { name: 'Ana Costa' })
    const opcoes = screen.getAllByRole('option')
    expect(opcoes.map((o) => o.textContent)).toEqual(['Selecione um paciente...', 'Ana Costa', 'Rui Alves'])
  })

  it('envia a marcação com o nome do paciente', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn().mockResolvedValue(null)
    render(<ModalMarcacao aoFechar={vi.fn()} aoGuardar={aoGuardar} />)

    await preencher(user)
    await user.click(screen.getByRole('button', { name: 'Agendar Sessão' }))

    expect(aoGuardar).toHaveBeenCalledWith({
      pacienteId: 1,
      nomePaciente: 'Ana Costa',
      data: '2026-10-14',
      hora: '10:00',
      motivo: 'Sessão de rotina',
    })
  })

  it('não deixa agendar no passado', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn()
    render(<ModalMarcacao aoFechar={vi.fn()} aoGuardar={aoGuardar} />)

    await preencher(user, { data: '2026-10-01' })
    await user.click(screen.getByRole('button', { name: 'Agendar Sessão' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/passado/)
    expect(aoGuardar).not.toHaveBeenCalled()
  })

  it('exige paciente selecionado', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn()
    render(<ModalMarcacao aoFechar={vi.fn()} aoGuardar={aoGuardar} />)

    await screen.findByRole('option', { name: 'Ana Costa' })
    await user.click(screen.getByRole('button', { name: 'Agendar Sessão' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/selecione um paciente/)
    expect(aoGuardar).not.toHaveBeenCalled()
  })

  it('mostra no modal o erro devolvido (ex.: horário ocupado)', async () => {
    const user = userEvent.setup()
    render(<ModalMarcacao aoFechar={vi.fn()} aoGuardar={vi.fn().mockResolvedValue('Horário indisponível!')} />)

    await preencher(user)
    await user.click(screen.getByRole('button', { name: 'Agendar Sessão' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Horário indisponível!')
  })

  it('vem com a data pré-preenchida e o mínimo é hoje', async () => {
    render(<ModalMarcacao aoFechar={vi.fn()} aoGuardar={vi.fn()} dataInicial="2026-10-20" />)
    const campoData = screen.getByLabelText('Data')
    expect(campoData).toHaveValue('2026-10-20')
    expect(campoData).toHaveAttribute('min', '2026-10-13')
    await screen.findByRole('option', { name: 'Ana Costa' })
  })

  it('avisa se não conseguir carregar os pacientes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    supabase.falhas.pacientes = { select: { message: 'offline' } }
    render(<ModalMarcacao aoFechar={vi.fn()} aoGuardar={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/lista de pacientes/)
  })
})
