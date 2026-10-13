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

  describe('Esqueci minha senha', () => {
    it('envia o link para o e-mail digitado, voltando para o próprio app', async () => {
      const user = userEvent.setup()
      render(<Login />)

      await user.click(screen.getByRole('button', { name: 'Esqueci minha senha' }))
      await user.type(screen.getByLabelText('E-mail'), ' joao@clinica.com ')
      await user.click(screen.getByRole('button', { name: 'Enviar link' }))

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('joao@clinica.com', {
        redirectTo: window.location.origin,
      })
      expect(screen.getByRole('status')).toHaveTextContent(/Se esse e-mail tiver uma conta/)
    })

    it('limite de envios do Supabase vira uma mensagem clara', async () => {
      const user = userEvent.setup()
      vi.spyOn(console, 'error').mockImplementation(() => {})
      supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: { message: 'email rate limit exceeded' } })
      render(<Login />)

      await user.click(screen.getByRole('button', { name: 'Esqueci minha senha' }))
      await user.type(screen.getByLabelText('E-mail'), 'joao@clinica.com')
      await user.click(screen.getByRole('button', { name: 'Enviar link' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(/Aguarde alguns minutos/)
    })

    it('"Voltar para o login" volta para a tela de entrar', async () => {
      const user = userEvent.setup()
      render(<Login />)

      await user.click(screen.getByRole('button', { name: 'Esqueci minha senha' }))
      await user.click(screen.getByRole('button', { name: 'Voltar para o login' }))

      expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    })
  })
})
