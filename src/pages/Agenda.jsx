import { useState } from 'react' 
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import './Agenda.css'

function Agenda() {
 
  const [vista, setVista] = useState('dia') 

  return (
    <div className="agenda-container">
      
      <div className="agenda-header">
        <div>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Agenda</h1>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Faça a gestão das marcações e horários.</p>
        </div>
        
        {}
        <div className="view-toggle">
          <button 
            className={vista === 'dia' ? 'active' : ''} 
            onClick={() => setVista('dia')}
          >
            Dia
          </button>
          <button 
            className={vista === 'mes' ? 'active' : ''} 
            onClick={() => setVista('mes')}
          >
            Mês
          </button>
        </div>
      </div>

      {}
      {vista === 'dia' ? (
        
       
        <div className="agenda-grid">
          <div className="date-picker-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <ChevronLeft size={20} cursor="pointer" />
            <span style={{ fontWeight: 'bold' }}>Hoje, 11 de Outubro</span>
            <ChevronRight size={20} cursor="pointer" />
          </div>

          <div className="time-slot">
            <div className="time">08:00</div>
            <div className="appointment free">
              <span style={{ color: '#94a3b8' }}>Horário Livre</span>
            </div>
          </div>
          <div className="time-slot">
            <div className="time">09:00</div>
            <div className="appointment booked">
              <div className="appointment-info">
                <strong>João Pereira</strong>
                <span>Reabilitação pós-cirúrgica (LCA)</span>
              </div>
            </div>
          </div>
        </div>

      ) : (

        <div className="calendar-month-grid">
          <div className="month-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <ChevronLeft size={20} cursor="pointer" />
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Outubro 2026</span>
            <ChevronRight size={20} cursor="pointer" />
          </div>
          
          <div className="weekdays">
            <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
          </div>
          
          <div className="days">
            {}
            {[...Array(31)].map((_, index) => (
              <div key={index} className={`day ${index + 1 === 11 ? 'today' : ''}`}>
                {index + 1}
                {}
                {index + 1 === 14 && <div className="dot-appointment"></div>}
              </div>
            ))}
          </div>
        </div>

      )}

    </div>
  )
}

export default Agenda