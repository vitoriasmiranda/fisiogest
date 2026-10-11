import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import './Agenda.css'

function Agenda() {
  return (
    <div className="agenda-container">
      
      {}
      <div className="agenda-header">
        <div>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Agenda</h1>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Faça a gestão das marcações e horários de hoje.</p>
        </div>
        <div className="date-picker">
          <CalendarIcon size={18} color="#0d9488" />
          <span>Hoje, 11 de Outubro</span>
        </div>
      </div>

      {}
      <div className="agenda-grid">
        
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

        <div className="time-slot">
          <div className="time">10:00</div>
          <div className="appointment free">
            <span style={{ color: '#94a3b8' }}>Horário Livre</span>
          </div>
        </div>

        <div className="time-slot">
          <div className="time">11:00</div>
          <div className="appointment booked-evaluation">
            <div className="appointment-info">
              <strong>Ana Sofia Costa</strong>
              <span>Avaliação Inicial - Tendinite</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Agenda