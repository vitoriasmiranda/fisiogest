import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ModalPaciente from './ModalPaciente'

function preencher(user, dados = {}) {
  const valores = { nome: 'Maria da Silva', idade: '34', contacto: '912 345 678', condicao: 'Lombalgia', ...dados }
  return (async () => {
    if (valores.nome) await user.type(screen.getByLabelText(/Nome/), valores.nome)
    if (valores.idade) await user.type(screen.getByLabelText(/Idade/), valores.idade)
    if (valores.contacto) await user.type(screen.getByLabelText(/Contato/), valores.contacto)
    if (valores.condicao) await user.type(screen.getByLabelText(/Motivo da consulta/), valores.condicao)
  })()
}

describe('<ModalPaciente />', () => {
  it('mostra erros em todos os campos obrigatórios e não guarda', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn()
    render(<ModalPaciente aoFechar={vi.fn()} aoGuardar={aoGuardar} />)

    await user.click(screen.getByRole('button', { name: /Guardar paciente/ }))

    expect(screen.getAllByRole('alert')).toHaveLength(4)
    expect(aoGuardar).not.toHaveBeenCalled()
  })

  it('guarda um paciente válido com os dados limpos e fecha', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn().mockResolvedValue(null)
    const aoFechar = vi.fn()
    render(<ModalPaciente aoFechar={aoFechar} aoGuardar={aoGuardar} />)

    await preencher(user)
    await user.type(screen.getByLabelText(/Histórico clínico/), 'Sem alergias')
    await user.click(screen.getByRole('button', { name: /Guardar paciente/ }))

    expect(aoGuardar).toHaveBeenCalledWith({
      nome: 'Maria da Silva',
      iniciais: 'MS',
      idade: 34,
      contacto: '912 345 678',
      condicao: 'Lombalgia',
      historico: 'Sem alergias',
      estado: 'Em avaliação',
    })
    expect(aoFechar).toHaveBeenCalled()
  })

  it('submete com Enter (o formulário agora tem onSubmit)', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn().mockResolvedValue(null)
    render(<ModalPaciente aoFechar={vi.fn()} aoGuardar={aoGuardar} />)

    await preencher(user, { condicao: 'Entorse{Enter}' })

    expect(aoGuardar).toHaveBeenCalledTimes(1)
  })

  it('NÃO fecha se a gravação falhar e mostra o erro dentro do modal', async () => {
    const user = userEvent.setup()
    const aoFechar = vi.fn()
    render(<ModalPaciente aoFechar={aoFechar} aoGuardar={vi.fn().mockResolvedValue('Sem ligação')} />)

    await preencher(user)
    await user.click(screen.getByRole('button', { name: /Guardar paciente/ }))

    expect(aoFechar).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Sem ligação')
    expect(screen.getByLabelText(/Nome/)).toHaveValue('Maria da Silva')
  })

  it('rejeita idade e contacto inválidos', async () => {
    const user = userEvent.setup()
    const aoGuardar = vi.fn()
    render(<ModalPaciente aoFechar={vi.fn()} aoGuardar={aoGuardar} />)

    await preencher(user, { idade: '150', contacto: '12' })
    await user.click(screen.getByRole('button', { name: /Guardar paciente/ }))

    expect(screen.getByText(/Idade inválida/)).toBeInTheDocument()
    expect(screen.getByText(/Contacto inválido/)).toBeInTheDocument()
    expect(aoGuardar).not.toHaveBeenCalled()
  })

  it('limpa o erro de um campo assim que o utilizador o corrige', async () => {
    const user = userEvent.setup()
    render(<ModalPaciente aoFechar={vi.fn()} aoGuardar={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Guardar paciente/ }))
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
