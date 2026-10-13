import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ModalPaciente from './ModalPaciente'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 13, 10, 0))
})
afterEach(() => vi.useRealTimers())

async function preencher(user, dados = {}) {
  const valores = { nome: 'Maria da Silva', nascimento: '1992-03-20', contato: '(31) 98765-4321', condicao: 'Lombalgia', ...dados }
  if (valores.nome) await user.type(screen.getByLabelText(/Nome/), valores.nome)
  if (valores.nascimento) await user.type(screen.getByLabelText(/Data de nascimento/), valores.nascimento)
  if (valores.contato) await user.type(screen.getByLabelText(/Telefone/), valores.contato)
  if (valores.condicao) await user.type(screen.getByLabelText(/Motivo da consulta/), valores.condicao)
}

describe('<ModalPaciente /> — cadastro', () => {
  it('mostra erros em todos os campos obrigatórios e não salva', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn()
    render(<ModalPaciente aoFechar={vi.fn()} aoGuardar={aoGuardar} />)

    await user.click(screen.getByRole('button', { name: /Salvar paciente/ }))

    expect(screen.getAllByRole('alert')).toHaveLength(4)
    expect(aoGuardar).not.toHaveBeenCalled()
  })

  it('salva um paciente válido com os dados limpos e fecha', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn().mockResolvedValue(null)
    const aoFechar = vi.fn()
    render(<ModalPaciente aoFechar={aoFechar} aoGuardar={aoGuardar} />)

    await preencher(user)
    await user.type(screen.getByLabelText(/Histórico clínico/), 'Sem alergias')
    await user.click(screen.getByRole('button', { name: /Salvar paciente/ }))

    expect(aoGuardar).toHaveBeenCalledWith({
      nome: 'Maria da Silva',
      iniciais: 'MS',
      data_nascimento: '1992-03-20',
      contacto: '(31) 98765-4321',
      condicao: 'Lombalgia',
      historico: 'Sem alergias',
      estado: 'Em avaliação',
    })
    expect(aoFechar).toHaveBeenCalled()
  })

  it('mostra a idade calculada enquanto se digita a data de nascimento', async () => {
    const user = userEvent.setup()
    render(<ModalPaciente aoFechar={vi.fn()} aoGuardar={vi.fn()} />)

    expect(screen.getByText('A idade é calculada automaticamente.')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/Data de nascimento/), '1992-03-20')
    expect(screen.getByText('34 anos')).toBeInTheDocument()
  })

  it('não aceita data de nascimento no futuro (e o calendário vai só até hoje)', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn()
    render(<ModalPaciente aoFechar={vi.fn()} aoGuardar={aoGuardar} />)

    expect(screen.getByLabelText(/Data de nascimento/)).toHaveAttribute('max', '2026-10-13')
    await preencher(user, { nascimento: '2027-01-01' })
    await user.click(screen.getByRole('button', { name: /Salvar paciente/ }))

    expect(screen.getByText(/não pode ser no futuro/)).toBeInTheDocument()
    expect(aoGuardar).not.toHaveBeenCalled()
  })

  it('envia com Enter', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn().mockResolvedValue(null)
    render(<ModalPaciente aoFechar={vi.fn()} aoGuardar={aoGuardar} />)

    await preencher(user, { condicao: 'Entorse{Enter}' })

    expect(aoGuardar).toHaveBeenCalledTimes(1)
  })

  it('NÃO fecha se der erro ao salvar e mostra o erro dentro do modal', async () => {
    const user = userEvent.setup()
    const aoFechar = vi.fn()
    render(<ModalPaciente aoFechar={aoFechar} aoGuardar={vi.fn().mockResolvedValue('Sem conexão')} />)

    await preencher(user)
    await user.click(screen.getByRole('button', { name: /Salvar paciente/ }))

    expect(aoFechar).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Sem conexão')
    expect(screen.getByLabelText(/Nome/)).toHaveValue('Maria da Silva')
  })

  it('rejeita telefone inválido', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn()
    render(<ModalPaciente aoFechar={vi.fn()} aoGuardar={aoGuardar} />)

    await preencher(user, { contato: '12' })
    await user.click(screen.getByRole('button', { name: /Salvar paciente/ }))

    expect(screen.getByText('Telefone inválido.')).toBeInTheDocument()
    expect(aoGuardar).not.toHaveBeenCalled()
  })

  it('limpa o erro de um campo assim que a pessoa corrige', async () => {
    const user = userEvent.setup()
    render(<ModalPaciente aoFechar={vi.fn()} aoGuardar={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Salvar paciente/ }))
    expect(screen.getByText('O nome é obrigatório.')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Nome/), 'A')
    expect(screen.queryByText('O nome é obrigatório.')).not.toBeInTheDocument()
  })

  it('atualiza o contador do histórico e limita a 2000 caracteres', async () => {
    const user = userEvent.setup()
    render(<ModalPaciente aoFechar={vi.fn()} aoGuardar={vi.fn()} />)

    await user.type(screen.getByLabelText(/Histórico clínico/), 'abc')
    expect(screen.getByText('3 / 2000')).toBeInTheDocument()
    expect(screen.getByLabelText(/Histórico clínico/)).toHaveAttribute('maxLength', '2000')
  })

  it('Cancelar e o X chamam aoFechar', async () => {
    const user = userEvent.setup()
    const aoFechar = vi.fn()
    render(<ModalPaciente aoFechar={aoFechar} aoGuardar={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(aoFechar).toHaveBeenCalledTimes(2)
  })
})

describe('<ModalPaciente /> — edição', () => {
  const paciente = {
    id: 7,
    nome: 'Ana Costa',
    iniciais: 'AC',
    data_nascimento: '1974-05-02',
    contacto: '31911112222',
    condicao: 'Pós-operatório LCA',
    historico: 'Cirurgia em 2025',
    estado: 'Em tratamento',
  }

  it('abre com o título de edição e os campos preenchidos', () => {
    render(<ModalPaciente paciente={paciente} aoFechar={vi.fn()} aoGuardar={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Editar paciente' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Nome/)).toHaveValue('Ana Costa')
    expect(screen.getByLabelText(/Data de nascimento/)).toHaveValue('1974-05-02')
    expect(screen.getByLabelText(/Telefone/)).toHaveValue('31911112222')
    expect(screen.getByLabelText(/Motivo da consulta/)).toHaveValue('Pós-operatório LCA')
    expect(screen.getByLabelText(/Histórico clínico/)).toHaveValue('Cirurgia em 2025')
    expect(screen.getByText('52 anos')).toBeInTheDocument()
  })

  it('envia só os campos do formulário — sem mexer no estado nem no id', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn().mockResolvedValue(null)
    const aoFechar = vi.fn()
    render(<ModalPaciente paciente={paciente} aoFechar={aoFechar} aoGuardar={aoGuardar} />)

    await user.clear(screen.getByLabelText(/Nome/))
    await user.type(screen.getByLabelText(/Nome/), 'Ana Costa Lima')
    await user.click(screen.getByRole('button', { name: /Salvar alterações/ }))

    expect(aoGuardar).toHaveBeenCalledWith({
      nome: 'Ana Costa Lima',
      iniciais: 'AL',
      data_nascimento: '1974-05-02',
      contacto: '31911112222',
      condicao: 'Pós-operatório LCA',
      historico: 'Cirurgia em 2025',
    })
    expect(aoFechar).toHaveBeenCalled()
  })

  it('paciente antigo sem data de nascimento precisa preenchê-la para salvar', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn()
    render(
      <ModalPaciente
        paciente={{ ...paciente, data_nascimento: null, idade: '50' }}
        aoFechar={vi.fn()}
        aoGuardar={aoGuardar}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Salvar alterações/ }))

    expect(screen.getByText('A data de nascimento é obrigatória.')).toBeInTheDocument()
    expect(aoGuardar).not.toHaveBeenCalled()
  })
})
