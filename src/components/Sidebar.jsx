import { Activity, Users, Calendar } from 'lucide-react'
import './Sidebar.css'

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Activity size={28} color="#2dd4bf" />
        <h2 style={{ color: 'white', margin: 0 }}>FisioGest</h2>
      </div>
      
      <nav className="menu" style={{ marginTop: '30px' }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', cursor: 'pointer' }}>
            <Users size={20} />
            <span>Doentes</span>
          </li>
          
          <li className="active" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px', cursor: 'pointer' }}>
            <Calendar size={20} />
            <span>Agenda</span>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar