import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'

function App() {
  const [paginaAtual, setPaginaAtual] = useState('pacientes')
  const [recolhido, setRecolhido] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  const navegar = (pagina) => {
    setPaginaAtual(pagina)
    setMenuAberto(false)
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