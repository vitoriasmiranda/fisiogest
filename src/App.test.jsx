import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { criarSupabaseMock } from './test/supabaseMock'
import App from './App'

const { supabase } = vi.hoisted(() => ({ supabase: {} }))
vi.mock('./supabase', () => ({ supabase }))

beforeEach(() => Object.assign(supabase, criarSupabaseMock()))

describe('<App />', () => {
  it('sem sessão mostra o login (sem piscar antes)', async () => {
    render(<App />)
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('com sessão mostra a lista de pacientes', async () => {
    supabase.auth.sessao = { user: { id: 'u1' } }
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Pacientes', level: 1 })).toBeInTheDocument()
  })

  it('navega entre Pacientes e Agenda pela barra lateral', async () => {
    const user = userEvent.setup()
    supabase.auth.sessao = { user: { id: 'u1' } }
    render(<App />)
    await screen.findByRole('heading', { name: 'Pacientes', level: 1 })

    await user.click(screen.getByTitle('Agenda'))
    expect(await screen.findByRole('heading', { name: 'Agenda', level: 1 })).toBeInTheDocument()

    await user.click(screen.getByTitle('Pacientes'))
    expect(await screen.findByRole('heading', { name: 'Pacientes', level: 1 })).toBeInTheDocument()
  })

  it('cancelar a saída mantém a sessão', async () => {
    const user = userEvent.setup()
    supabase.auth.sessao = { user: { id: 'u1' } }
    render(<App />)
    await screen.findByRole('heading', { name: 'Pacientes', level: 1 })

    await user.click(screen.getByTitle('Sair'))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(supabase.auth.signOut).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Pacientes', level: 1 })).toBeInTheDocument()
  })

  it('terminar sessão volta ao login', async () => {
    const user = userEvent.setup()
    supabase.auth.sessao = { user: { id: 'u1' } }
    render(<App />)
    await screen.findByRole('heading', { name: 'Pacientes', level: 1 })

    await user.click(screen.getByTitle('Sair'))
    expect(screen.getByRole('alertdialog', { name: 'Sair do sistema?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('"Minha conta" mostra o e-mail de quem está logado', async () => {
    const user = userEvent.setup()
    supabase.auth.sessao = { user: { id: 'u1', email: 'joao@clinica.com' } }
    render(<App />)
    await screen.findByRole('heading', { name: 'Pacientes', level: 1 })

    await user.click(screen.getByTitle('Minha conta'))

    expect(screen.getByRole('heading', { name: 'Minha conta', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('joao@clinica.com')).toBeInTheDocument()
  })

  it('ao voltar pelo link de recuperação, pede a nova senha antes de entrar', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('button', { name: 'Entrar' })

    act(() => supabase.auth.emitir('PASSWORD_RECOVERY', { user: { id: 'u1', email: 'joao@clinica.com' } }))

    expect(await screen.findByText('Crie uma nova senha')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nova senha'), 'novaSenha123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'novaSenha123')
    await user.click(screen.getByRole('button', { name: 'Salvar e entrar' }))

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'novaSenha123' })
    expect(await screen.findByRole('heading', { name: 'Pacientes', level: 1 })).toBeInTheDocument()
  })

  it('o endereço do link (type=recovery) já abre a tela de nova senha', async () => {
    window.history.replaceState(null, '', '/#access_token=abc&type=recovery')
    supabase.auth.sessao = { user: { id: 'u1', email: 'joao@clinica.com' } }
    try {
      render(<App />)
      expect(await screen.findByText('Crie uma nova senha')).toBeInTheDocument()
    } finally {
      window.history.replaceState(null, '', '/')
    }
  })
})
