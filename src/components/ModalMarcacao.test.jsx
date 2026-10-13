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
  if (hora) await user.type(screen.getByLabelText('Horário'), hora)
  if (motivo) await user.type(screen.getByLabelText('Motivo da sessão'), motivo)
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
    await user.click(screen.getByRole('button', { name: 'Agendar sessão' }))

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
    await user.click(screen.getByRole('button', { name: 'Agendar sessão' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/passado/)
    expect(aoGuardar).not.toHaveBeenCalled()
  })

  it('exige paciente selecionado', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn()
    render(<ModalMarcacao aoFechar={vi.fn()} aoGuardar={aoGuardar} />)

    await screen.findByRole('option', { name: 'Ana Costa' })
    await user.click(screen.getByRole('button', { name: 'Agendar sessão' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/Selecione um paciente/)
    expect(aoGuardar).not.toHaveBeenCalled()
  })

  it('mostra no modal o erro devolvido (ex.: horário ocupado)', async () => {
    const user = userEvent.setup()
    render(<ModalMarcacao aoFechar={vi.fn()} aoGuardar={vi.fn().mockResolvedValue('Horário indisponível!')} />)

    await preencher(user)
    await user.click(screen.getByRole('button', { name: 'Agendar sessão' }))

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

describe('<ModalMarcacao /> — edição', () => {
  const marcacao = { id: 5, pacienteId: 2, nomePaciente: 'Rui Alves', data: '2026-10-20', hora: '14:30:00', motivo: 'Reforço' }

  it('abre com o título de edição e os campos preenchidos (hora sem segundos)', async () => {
    render(<ModalMarcacao marcacao={marcacao} aoFechar={vi.fn()} aoGuardar={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Editar agendamento' })).toBeInTheDocument()
    await screen.findByRole('option', { name: 'Rui Alves' })
    expect(screen.getByLabelText('Paciente')).toHaveValue('2')
    expect(screen.getByLabelText('Data')).toHaveValue('2026-10-20')
    expect(screen.getByLabelText('Horário')).toHaveValue('14:30')
    expect(screen.getByLabelText('Motivo da sessão')).toHaveValue('Reforço')
  })

  it('salva as alterações', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn().mockResolvedValue(null)
    render(<ModalMarcacao marcacao={marcacao} aoFechar={vi.fn()} aoGuardar={aoGuardar} />)
    await screen.findByRole('option', { name: 'Rui Alves' })

    await user.clear(screen.getByLabelText('Motivo da sessão'))
    await user.type(screen.getByLabelText('Motivo da sessão'), 'Avaliação final')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(aoGuardar).toHaveBeenCalledWith({
      pacienteId: 2,
      nomePaciente: 'Rui Alves',
      data: '2026-10-20',
      hora: '14:30',
      motivo: 'Avaliação final',
    })
  })

  it('uma sessão que já passou pode ser editada mantendo a data dela', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn().mockResolvedValue(null)
    const antiga = { ...marcacao, data: '2026-10-01' }
    render(<ModalMarcacao marcacao={antiga} aoFechar={vi.fn()} aoGuardar={aoGuardar} />)
    await screen.findByRole('option', { name: 'Rui Alves' })

    expect(screen.getByLabelText('Data')).toHaveAttribute('min', '2026-10-01')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(aoGuardar).toHaveBeenCalled()
  })
})

describe('<ModalMarcacao /> — pacientes arquivados', () => {
  it('não aparecem para novos agendamentos', async () => {
    supabase.db.pacientes.push({ id: 3, nome: 'Carla Dias', arquivado: true })
    render(<ModalMarcacao aoFechar={vi.fn()} aoGuardar={vi.fn()} />)
    await screen.findByRole('option', { name: 'Ana Costa' })
    expect(screen.queryByRole('option', { name: 'Carla Dias' })).not.toBeInTheDocument()
  })

  it('aparecem ao editar um agendamento antigo desse paciente', async () => {
    supabase.db.pacientes.push({ id: 3, nome: 'Carla Dias', arquivado: true })
    const antiga = { id: 9, pacienteId: 3, nomePaciente: 'Carla Dias', data: '2026-10-01', hora: '10:00', motivo: 'Alta' }
    render(<ModalMarcacao marcacao={antiga} aoFechar={vi.fn()} aoGuardar={vi.fn()} />)
    expect(await screen.findByRole('option', { name: 'Carla Dias' })).toBeInTheDocument()
    expect(screen.getByLabelText('Paciente')).toHaveValue('3')
  })
})
