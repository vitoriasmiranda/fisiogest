import { useState, useEffect } from 'react'
import { Activity, Users, Calendar, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react'
import { supabase } from '../supabase'
import { useConfirmacao } from '../hooks/useConfirmacao'
import './Sidebar.css'

function Sidebar({ paginaAtual, setPaginaAtual, recolhido, setRecolhido, aberta }) {
  const [mobile, setMobile] = useState(window.innerWidth <= 900)

  useEffect(() => {
    const aoRedimensionar = () => setMobile(window.innerWidth <= 900)
    window.addEventListener('resize', aoRedimensionar)
    return () => window.removeEventListener('resize', aoRedimensionar)
  }, [])

  const [dialogo, confirmar] = useConfirmacao()

  const terminarSessao = async () => {
    const ok = await confirmar({
      titulo: 'Terminar sessão?',
      mensagem: 'Vai precisar de iniciar sessão novamente para aceder ao FisioGest.',
      textoConfirmar: 'Sair',
    })
    if (ok) await supabase.auth.signOut()
  }

  const compacto = recolhido && !mobile

  return (
    <aside className={`sidebar ${compacto ? 'recolhida' : ''} ${aberta ? 'aberta' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* Logótipo */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '32px 20px', 
        justifyContent: compacto ? 'center' : 'flex-start' 
      }}>
        <Activity size={28} color="#2dd4bf" style={{ minWidth: '28px' }} />
        {!compacto && <h2 style={{ color: 'white', margin: 0, fontSize: '22px', fontWeight: '600' }}>FisioGest</h2>}
      </div>
      
      {/* Menu Principal */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {/* A adicão de height: '100%' aqui é o que permite empurrar itens para o fundo */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
          
          <li 
            onClick={() => setPaginaAtual('pacientes')}
            title="Pacientes"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '14px', 
              padding: '14px', cursor: 'pointer', borderRadius: '10px',
              backgroundColor: paginaAtual === 'pacientes' ? '#1e293b' : 'transparent',
              justifyContent: compacto ? 'center' : 'flex-start',
              transition: 'all 0.2s'
            }}
          >
            <Users size={22} style={{ minWidth: '22px', color: paginaAtual === 'pacientes' ? '#2dd4bf' : '#94a3b8' }} />
            {!compacto && <span style={{ color: paginaAtual === 'pacientes' ? 'white' : '#cbd5e1', fontSize: '15px', fontWeight: paginaAtual === 'pacientes' ? '500' : '400' }}>Pacientes</span>}
          </li>
          
          <li 
            onClick={() => setPaginaAtual('agenda')}
            title="Agenda"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '14px', 
              padding: '14px', cursor: 'pointer', borderRadius: '10px',
              backgroundColor: paginaAtual === 'agenda' ? '#1e293b' : 'transparent',
              justifyContent: compacto ? 'center' : 'flex-start',
              transition: 'all 0.2s'
            }}
          >
            <Calendar size={22} style={{ minWidth: '22px', color: paginaAtual === 'agenda' ? '#2dd4bf' : '#94a3b8' }} />
            {!compacto && <span style={{ color: paginaAtual === 'agenda' ? 'white' : '#cbd5e1', fontSize: '15px', fontWeight: paginaAtual === 'agenda' ? '500' : '400' }}>Agenda</span>}
          </li>

          {/* Botão Sair - Agora ancorado ao fundo com marginTop: 'auto' */}
          <li 
            onClick={terminarSessao}
            title="Sair"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '14px', 
              padding: '14px', cursor: 'pointer', borderRadius: '10px',
              color: '#ef4444', 
              justifyContent: compacto ? 'center' : 'flex-start',
              transition: 'all 0.2s',
              marginTop: mobile ? '0' : 'auto', /* Empurra o botão até ao fundo no PC */
              marginBottom: mobile ? '0' : '8px'
            }}
          >
            <LogOut size={22} style={{ minWidth: '22px' }} />
            {!compacto && <span style={{ fontSize: '15px', fontWeight: '500' }}>Sair</span>}
          </li>

        </ul>
      </nav>

      {/* Botão de Recolher o Menu */}
      {!mobile && (
        <div style={{ padding: '0 12px 24px 12px' }}>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
            <div 
              onClick={() => setRecolhido(!recolhido)}
              title="Recolher menu"
              style={{ 
                display: 'flex', alignItems: 'center', gap: '14px', 
                padding: '14px', cursor: 'pointer', borderRadius: '10px',
                justifyContent: recolhido ? 'center' : 'flex-start', color: '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              {recolhido ? <PanelLeftOpen size={22} style={{ minWidth: '22px' }} /> : <PanelLeftClose size={22} style={{ minWidth: '22px' }} />}
              {!recolhido && <span style={{ fontSize: '15px' }}>Recolher</span>}
            </div>
          </div>
        </div>
      )}

      {dialogo}
    </aside>
  )
}

export default Sidebar