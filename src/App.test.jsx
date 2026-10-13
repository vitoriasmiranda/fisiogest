import { render, screen } from '@testing-library/react'
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
    expect(screen.getByText('A carregar...')).toBeInTheDocument()
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
    expect(screen.getByRole('alertdialog', { name: 'Terminar sessão?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })
})
