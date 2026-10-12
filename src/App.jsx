import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Login from './components/Login'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
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
        {paginaAtual === 'pacientes' ? <Dashboard /> : <Agenda />}
      </main>
    </div>
  )
}

export default App