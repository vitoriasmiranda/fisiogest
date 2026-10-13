import { useState } from 'react'
import { supabase } from '../supabase'
import { Activity } from 'lucide-react'
import MensagemErro from './MensagemErro'
import './Login.css'
import './FormNovaSenha.css'

export default function Login() {
  // 'entrar' | 'recuperar' | 'enviado'
  const [modo, setModo] = useState('entrar')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState(null)

  const trocarModo = (novo) => {
    setErro(null)
    setModo(novo)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErro(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setErro('E-mail ou senha incorretos. Verifique e tente novamente.')
    }
    setLoading(false)
  }

  const pedirLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErro(null)

    // O link do e-mail volta para este mesmo endereço; o App mostra a tela de nova senha.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    setLoading(false)

    if (error) {
      console.error('Erro ao pedir recuperação de senha:', error)
      setErro(
        /rate limit/i.test(error.message ?? '')
          ? 'Muitos pedidos seguidos. Aguarde alguns minutos e tente de novo.'
          : 'Não foi possível enviar o e-mail agora. Tente novamente mais tarde.',
      )
      return
    }
    // Mesma mensagem para e-mail cadastrado ou não: não revela quem tem conta.
    setModo('enviado')
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <Activity size={40} color="#0d9488" />
          <h1>FisioGest</h1>
          <p>
            {modo === 'entrar' ? 'Faça login para acessar o sistema' : 'Recuperar senha'}
          </p>
        </div>

        {modo === 'entrar' && (
          <form onSubmit={handleLogin} className="login-form">
            <MensagemErro mensagem={erro} />
            <div className="form-group">
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Senha</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="button" className="link-texto" onClick={() => trocarModo('recuperar')}>
                Esqueci minha senha
              </button>
            </div>
          </form>
        )}

        {modo === 'recuperar' && (
          <form onSubmit={pedirLink} className="login-form">
            <MensagemErro mensagem={erro} />
            <p style={{ color: '#475569', fontSize: '14px', marginTop: 0 }}>
              Digite o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.
            </p>
            <div className="form-group">
              <label htmlFor="recuperar-email">E-mail</label>
              <input
                id="recuperar-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="button" className="link-texto" onClick={() => trocarModo('entrar')}>
                Voltar para o login
              </button>
            </div>
          </form>
        )}

        {modo === 'enviado' && (
          <div className="login-form">
            <p className="mensagem-sucesso" role="status">
              Se esse e-mail tiver uma conta, você vai receber um link em instantes. Confira também a caixa de spam.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="button" className="link-texto" onClick={() => trocarModo('entrar')}>
                Voltar para o login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
