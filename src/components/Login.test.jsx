import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { criarSupabaseMock } from '../test/supabaseMock'
import Login from './Login'

const { supabase } = vi.hoisted(() => ({ supabase: {} }))
vi.mock('../supabase', () => ({ supabase }))

beforeEach(() => Object.assign(supabase, criarSupabaseMock()))

async function entrar(user) {
  await user.type(screen.getByPlaceholderText('seu@email.com'), 'fisio@clinica.pt')
  await user.type(screen.getByPlaceholderText('••••••••'), 'segredo123')
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('<Login />', () => {
  it('envia e-mail e senha para o Supabase', async () => {
    const user = userEvent.setup()
    render(<Login />)
    await entrar(user)
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'fisio@clinica.pt', password: 'segredo123' })
  })

  it('mostra aviso na página (não um alert) quando as credenciais estão erradas', async () => {
    const user = userEvent.setup()
    const alerta = vi.spyOn(window, 'alert')
    supabase.auth.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login' } })
    render(<Login />)

    await entrar(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(/E-mail ou senha incorretos/)
    expect(alerta).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
  })

  it('desativa o botão enquanto verifica', async () => {
    const user = userEvent.setup()
    let terminar
    supabase.auth.signInWithPassword.mockReturnValue(new Promise((r) => { terminar = r }))
    render(<Login />)

    await entrar(user)

    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled()
    terminar({ error: null })
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeEnabled()
  })

  it('não submete com campos vazios (validação HTML required)', async () => {
    const user = userEvent.setup()
    render(<Login />)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('orienta quem esqueceu a senha a falar com a administradora', () => {
    render(<Login />)
    expect(screen.getByText('Esqueceu a senha? Fale com a Vitória.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Esqueci minha senha/ })).not.toBeInTheDocument()
  })
})
