import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Login from './components/Login'
import RedefinirSenha from './components/RedefinirSenha'
import MinhaConta from './pages/MinhaConta'

function App() {
  const [session, setSession] = useState(null)
  // Enquanto o Supabase verifica a sessão salva, não mostramos o login (evita a tela "piscar").
  const [aVerificarSessao, setAVerificarSessao] = useState(true)
  // true quando a pessoa chegou pelo link de "Esqueci minha senha"
  // (o endereço do link traz "type=recovery"; o evento PASSWORD_RECOVERY confirma)
  const [redefinindoSenha, setRedefinindoSenha] = useState(() =>
    /type=recovery/.test(`${window.location.hash}${window.location.search}`),
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAVerificarSessao(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, session) => {
      setSession(session)
      if (evento === 'PASSWORD_RECOVERY') setRedefinindoSenha(true)
    })

    return () => subscription.unsubscribe()
  }, [])


  const [paginaAtual, setPaginaAtual] = useState('pacientes')
  const [recolhido, setRecolhido] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  const navegar = (pagina) => {
    setPaginaAtual(pagina)
    setMenuAberto(false)
  }

  if (aVerificarSessao) {
    return <div className="a-carregar" aria-busy="true" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Carregando...</div>
  }

  if (redefinindoSenha && session) {
    return <RedefinirSenha aoConcluir={() => setRedefinindoSenha(false)} />
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="app-layout">
      <header className="topbar">
        <button className="menu-btn" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">☰</button>
        <strong>FisioGest</strong>
      </header>

      {menuAberto && <div className="sidebar-overlay" onClick={() => setMenuAberto(false)} />}

      <Sidebar
        paginaAtual={paginaAtual}
        setPaginaAtual={navegar}
        recolhido={recolhido}
        setRecolhido={setRecolhido}
        aberta={menuAberto}
      />

      <main className={`app-main ${recolhido ? 'recolhido' : ''}`}>
        {paginaAtual === 'pacientes' && <Dashboard />}
        {paginaAtual === 'agenda' && <Agenda />}
        {paginaAtual === 'conta' && <MinhaConta email={session.user?.email} />}
      </main>
    </div>
  )
}

export default App