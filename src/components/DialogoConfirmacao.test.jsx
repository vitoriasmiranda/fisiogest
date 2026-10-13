import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useConfirmacao } from '../hooks/useConfirmacao'

// Pequeno componente de teste que usa o hook como as páginas usam
function Exemplo({ aoResponder }) {
  const [dialogo, confirmar] = useConfirmacao()
  const perguntar = async () => {
    const ok = await confirmar({ titulo: 'Apagar tudo?', mensagem: 'Não há volta.', textoConfirmar: 'Apagar', perigoso: true })
    aoResponder(ok)
  }
  return (
    <>
      <button onClick={perguntar}>Abrir</button>
      {dialogo}
    </>
  )
}

function montar() {
  const respostas = []
  render(<Exemplo aoResponder={(r) => respostas.push(r)} />)
  return respostas
}

describe('useConfirmacao + <DialogoConfirmacao />', () => {
  it('mostra título e mensagem e devolve true ao confirmar', async () => {
    const user = userEvent.setup()
    const respostas = montar()

    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    const dialogo = screen.getByRole('alertdialog', { name: 'Apagar tudo?' })
    expect(dialogo).toHaveAccessibleDescription('Não há volta.')

    await user.click(screen.getByRole('button', { name: 'Apagar' }))

    expect(respostas).toEqual([true])
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('devolve false ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    const respostas = montar()
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(respostas).toEqual([false])
  })

  it('a tecla Esc cancela', async () => {
    const user = userEvent.setup()
    const respostas = montar()
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    await user.keyboard('{Escape}')
    expect(respostas).toEqual([false])
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('clicar fora da caixa cancela, clicar dentro não', async () => {
    const user = userEvent.setup()
    const respostas = montar()
    await user.click(screen.getByRole('button', { name: 'Abrir' }))

    await user.click(screen.getByText('Não há volta.'))
    expect(respostas).toEqual([])

    await user.click(document.querySelector('.dialogo-overlay'))
    expect(respostas).toEqual([false])
  })

  it('o foco começa no Cancelar (um Enter distraído não apaga nada)', async () => {
    const user = userEvent.setup()
    const respostas = montar()
    await user.click(screen.getByRole('button', { name: 'Abrir' }))

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(respostas).toEqual([false])
  })

  it('é renderizado no <body> (não fica preso dentro da sidebar)', async () => {
    const user = userEvent.setup()
    montar()
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(document.querySelector('.dialogo-overlay').parentElement).toBe(document.body)
  })
})
