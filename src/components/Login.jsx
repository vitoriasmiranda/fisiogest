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

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      setErro('Email ou palavra-passe incorretos. Verifique e tente novamente.')
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <Activity size={40} color="#0d9488" />
          <h1>FisioGest</h1>
          <p>Faça login para aceder ao sistema</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <MensagemErro mensagem={erro} />
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="login-password">Palavra-passe</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'A verificar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}