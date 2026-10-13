import { useState } from 'react'
import { supabase } from '../supabase'
import { Activity } from 'lucide-react'
import MensagemErro from './MensagemErro'
import './Login.css'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState(null)

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

          {/* Os logins são criados pela administradora. Quem esquecer a senha recebe
              uma provisória dela (pelo Supabase) e troca depois em "Minha conta". */}
          <p className="aviso-senha">Esqueceu a senha? Fale com a Vitória.</p>
        </form>
      </div>
    </div>
  )
}
