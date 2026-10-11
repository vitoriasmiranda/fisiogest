import { Activity, Users, Calendar } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ paginaAtual, setPaginaAtual }) {
  return (
    <aside className="sidebar">
      <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Activity size={28} color="#2dd4bf" />
        <h2 style={{ color: 'white', margin: 0 }}>FisioGest</h2>
      </div>
      
      <nav className="menu" style={{ marginTop: '30px' }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          
          {}
          <li 
            className={paginaAtual === 'pacientes' ? 'active' : ''} 
            onClick={() => setPaginaAtual('pacientes')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', cursor: 'pointer', borderRadius: '8px' }}
          >
            <Users size={20} />
            <span>Pacientes</span>
          </li>
          
          {}
          <li 
            className={paginaAtual === 'agenda' ? 'active' : ''} 
            onClick={() => setPaginaAtual('agenda')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', cursor: 'pointer', borderRadius: '8px' }}
          >
            <Calendar size={20} />
            <span>Agenda</span>
          </li>

        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar