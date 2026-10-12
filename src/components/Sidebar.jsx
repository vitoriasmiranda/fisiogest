import { useState } from 'react'
import { Activity, Users, Calendar, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ paginaAtual, setPaginaAtual }) {
  const [recolhido, setRecolhido] = useState(false)

  return (
    <aside 
      className="sidebar"
      style={{ 
        width: recolhido ? '84px' : '240px', 
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#0f172a',
        boxSizing: 'border-box'
      }}
    >
      {}
      <div className="logo" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '32px 24px 40px 24px', 
        justifyContent: recolhido ? 'center' : 'flex-start' 
      }}>
        <Activity size={28} color="#2dd4bf" style={{ minWidth: '28px' }} />
        {!recolhido && <h2 style={{ color: 'white', margin: 0, fontSize: '22px', fontWeight: '600' }}>FisioGest</h2>}
      </div>
      
      {}
      <nav className="menu" style={{ flex: 1, padding: '0 16px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <li 
            className={paginaAtual === 'pacientes' ? 'active' : ''} 
            onClick={() => setPaginaAtual('pacientes')}
            title="Pacientes"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '14px', 
              padding: '14px 16px', cursor: 'pointer', borderRadius: '10px',
              backgroundColor: paginaAtual === 'pacientes' ? '#1e293b' : 'transparent',
              justifyContent: recolhido ? 'center' : 'flex-start',
              transition: 'all 0.2s'
            }}
          >
            <Users size={22} style={{ minWidth: '22px', color: paginaAtual === 'pacientes' ? '#2dd4bf' : '#94a3b8' }} />
            {!recolhido && <span style={{ color: paginaAtual === 'pacientes' ? 'white' : '#cbd5e1', fontSize: '15px', fontWeight: paginaAtual === 'pacientes' ? '500' : '400' }}>Pacientes</span>}
          </li>
          
          <li 
            className={paginaAtual === 'agenda' ? 'active' : ''} 
            onClick={() => setPaginaAtual('agenda')}
            title="Agenda"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '14px', 
              padding: '14px 16px', cursor: 'pointer', borderRadius: '10px',
              backgroundColor: paginaAtual === 'agenda' ? '#1e293b' : 'transparent',
              justifyContent: recolhido ? 'center' : 'flex-start',
              transition: 'all 0.2s'
            }}
          >
            <Calendar size={22} style={{ minWidth: '22px', color: paginaAtual === 'agenda' ? '#2dd4bf' : '#94a3b8' }} />
            {!recolhido && <span style={{ color: paginaAtual === 'agenda' ? 'white' : '#cbd5e1', fontSize: '15px', fontWeight: paginaAtual === 'agenda' ? '500' : '400' }}>Agenda</span>}
          </li>

        </ul>
      </nav>

      {}
      <div style={{ padding: '0 16px 32px 16px' }}>
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
          <li 
            onClick={() => setRecolhido(!recolhido)}
            title="Recolher menu"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '14px', 
              padding: '14px 16px', cursor: 'pointer', borderRadius: '10px', listStyle: 'none',
              justifyContent: recolhido ? 'center' : 'flex-start', color: '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            {recolhido ? <PanelLeftOpen size={22} style={{ minWidth: '22px' }} /> : <PanelLeftClose size={22} style={{ minWidth: '22px' }} />}
            {!recolhido && <span style={{ fontSize: '15px' }}>Recolher</span>}
          </li>
        </div>
      </div>

    </aside>
  )
}

export default Sidebar