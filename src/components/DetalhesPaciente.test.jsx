import { render, screen } from '@testing-library/react'
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
  idade: 52,
  condicao: 'Pós-operatório LCA',
  contacto: '912345678',
  estado: 'Em tratamento',
  historico: '',
  notas: [{ id: 1, data: '1 OUT 2026', texto: 'Primeira sessão' }],
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 13, 10, 0))
  Object.assign(
    supabase,
    criarSupabaseMock({
      marcacoes: [
        { id: 1, pacienteId: 7, data: '2026-10-01', hora: '09:00', motivo: 'Antiga' },
        { id: 2, pacienteId: 7, data: '2026-10-20', hora: '14:30:00', motivo: 'Reforço muscular' },
        { id: 3, pacienteId: 8, data: '2026-10-14', hora: '08:00', motivo: 'Outro paciente' },
      ],
    }),
  )
})
afterEach(() => vi.useRealTimers())

describe('<DetalhesPaciente />', () => {
  it('mostra a próxima sessão e o motivo, ignorando as passadas e as de outros pacientes', async () => {
    render(<DetalhesPaciente paciente={paciente} aoVoltar={vi.fn()} aoAtualizar={vi.fn()} />)
    expect(await screen.findByText('Próxima sessão: 20 out, 14:30')).toBeInTheDocument()
    expect(screen.getByText('Motivo: Reforço muscular')).toBeInTheDocument()
  })

  it('"Por agendar" quando não há sessões futuras', async () => {
    supabase.db.marcacoes.length = 0
    render(<DetalhesPaciente paciente={paciente} aoVoltar={vi.fn()} aoAtualizar={vi.fn()} />)
    expect(await screen.findByText('Próxima sessão: Por agendar')).toBeInTheDocument()
  })

  it('mostra texto por omissão quando não há histórico', async () => {
    render(<DetalhesPaciente paciente={paciente} aoVoltar={vi.fn()} aoAtualizar={vi.fn()} />)
    expect(screen.getByText(/Nenhum histórico registado/)).toBeInTheDocument()
    await screen.findByText(/Próxima sessão: 20 out/)
  })

  it('regista uma nota com a data de hoje, no topo, e limpa o campo', async () => {
    const user = userEvent.setup()
    const aoAtualizar = vi.fn().mockResolvedValue(true)
    render(<DetalhesPaciente paciente={paciente} aoVoltar={vi.fn()} aoAtualizar={aoAtualizar} />)

    await user.type(screen.getByLabelText('Adicionar nota da sessão'), '  Boa evolução  ')
    await user.click(screen.getByRole('button', { name: /Registar nota/ }))

    const atualizado = aoAtualizar.mock.calls[0][0]
    expect(atualizado.notas).toHaveLength(2)
    expect(atualizado.notas[0]).toMatchObject({ data: '13 OUT 2026', texto: 'Boa evolução' })
    expect(screen.getByLabelText('Adicionar nota da sessão')).toHaveValue('')
  })

  it('mantém o texto da nota se a gravação falhar', async () => {
    const user = userEvent.setup()
    render(<DetalhesPaciente paciente={paciente} aoVoltar={vi.fn()} aoAtualizar={vi.fn().mockResolvedValue(false)} />)

    await user.type(screen.getByLabelText('Adicionar nota da sessão'), 'Nota importante')
    await user.click(screen.getByRole('button', { name: /Registar nota/ }))

    expect(screen.getByLabelText('Adicionar nota da sessão')).toHaveValue('Nota importante')
  })

  it('o botão fica desativado com a nota vazia', async () => {
    render(<DetalhesPaciente paciente={paciente} aoVoltar={vi.fn()} aoAtualizar={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Registar nota/ })).toBeDisabled()
    await screen.findByText(/Próxima sessão: 20 out/)
  })

  it('mudar o estado chama aoAtualizar com o novo estado', async () => {
    const user = userEvent.setup()
    const aoAtualizar = vi.fn()
    render(<DetalhesPaciente paciente={paciente} aoVoltar={vi.fn()} aoAtualizar={aoAtualizar} />)

    await user.selectOptions(screen.getByLabelText('Estado do tratamento'), 'Alta médica')

    expect(aoAtualizar).toHaveBeenCalledWith({ ...paciente, estado: 'Alta médica' })
  })

  it('não renderiza nada sem paciente', () => {
    const { container } = render(<DetalhesPaciente paciente={null} aoVoltar={vi.fn()} aoAtualizar={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})
