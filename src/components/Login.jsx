import { useState } from 'react'
import { supabase } from '../supabase'
import { Activity, Eye, EyeOff } from 'lucide-react'
import MensagemErro from './MensagemErro'
import { mensagemErroLogin } from '../utils/login'
import './Login.css'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErro(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        console.error('Erro no login:', error)
        setErro(mensagemErroLogin(error))
      }
    } catch (falha) {
      // Sem internet ou servidor inacessível: a chamada nem chega a responder.
      console.error('Falha de conexão no login:', falha)
      setErro(mensagemErroLogin(falha ?? {}))
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <Activity size={40} color="#0d9488" />
          <h1>FisioGest</h1>
          <p>Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <MensagemErro mensagem={erro} />
          <div className="form-group">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Senha</label>
            <div className="campo-senha">
              <input
                id="login-password"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="btn-mostrar-senha"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
                aria-pressed={mostrarSenha}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="aviso-senha">Esqueceu a senha? Fale com a Vitória.</p>
        </form>
      </div>
    </div>
  )
}
