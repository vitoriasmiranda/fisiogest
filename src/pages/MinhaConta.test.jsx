import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { criarSupabaseMock } from '../test/supabaseMock'
import MinhaConta from './MinhaConta'

const { supabase } = vi.hoisted(() => ({ supabase: {} }))
vi.mock('../supabase', () => ({ supabase }))

beforeEach(() => Object.assign(supabase, criarSupabaseMock()))

async function trocar(user, senha, confirmacao = senha) {
  await user.type(screen.getByLabelText('Nova senha'), senha)
  await user.type(screen.getByLabelText('Confirmar nova senha'), confirmacao)
  await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))
}

describe('<MinhaConta />', () => {
  it('mostra com qual e-mail a pessoa está conectada', () => {
    render(<MinhaConta email="joao@clinica.com" />)
    expect(screen.getByText('joao@clinica.com')).toBeInTheDocument()
  })

  it('troca a senha no Supabase, avisa e limpa os campos', async () => {
    const user = userEvent.setup()
    render(<MinhaConta email="joao@clinica.com" />)

    await trocar(user, 'novaSenha123')

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'novaSenha123' })
    expect(screen.getByRole('status')).toHaveTextContent('Senha alterada com sucesso.')
    expect(screen.getByLabelText('Nova senha')).toHaveValue('')
  })

  it('não envia se as senhas forem diferentes', async () => {
    const user = userEvent.setup()
    render(<MinhaConta email="joao@clinica.com" />)

    await trocar(user, 'novaSenha123', 'novaSenha124')

    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não são iguais.')
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('não envia senha curta', async () => {
    const user = userEvent.setup()
    render(<MinhaConta email="joao@clinica.com" />)

    await trocar(user, 'abc1')

    expect(screen.getByRole('alert')).toHaveTextContent(/pelo menos 8/)
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('traduz o erro do Supabase', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    supabase.auth.updateUser.mockResolvedValue({ error: { code: 'same_password', message: 'same' } })
    render(<MinhaConta email="joao@clinica.com" />)

    await trocar(user, 'novaSenha123')

    expect(screen.getByRole('alert')).toHaveTextContent('A nova senha precisa ser diferente da atual.')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
