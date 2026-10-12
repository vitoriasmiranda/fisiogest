import { useState, useEffect } from 'react'
import { supabase } from '../supabase' 
import { X } from 'lucide-react'
import './ModalMarcacao.css'

function ModalMarcacao({ aoFechar, aoGuardar }) {
  const [pacienteId, setPacienteId] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [motivo, setMotivo] = useState('')
  
  const [pacientes, setPacientes] = useState([])

  useEffect(() => {
    const carregarPacientes = async () => {
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nome') 
      
      if (error) {
        console.error("Erro ao carregar pacientes no modal:", error)
      } else if (data) {
        setPacientes(data)
      }
    }

    carregarPacientes()
  }, [])

  const submeterFormulario = (e) => {
    e.preventDefault()

    const pacienteSelecionado = pacientes.find(p => p.id.toString() === pacienteId)

    if (!pacienteSelecionado) {
      alert("Por favor, selecione um paciente.")
      return
    }

    const novaMarcacao = {
      pacienteId: pacienteSelecionado.id,
      nomePaciente: pacienteSelecionado.nome,
      data: data,
      hora: hora,
      motivo: motivo
    }

    aoGuardar(novaMarcacao)
    aoFechar()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Nova Marcação</h2>
          <button className="btn-fechar" onClick={aoFechar}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={submeterFormulario}>
          <div className="form-group">
            <label>Paciente</label>
            <select 
              value={pacienteId} 
              onChange={(e) => setPacienteId(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="">Selecione um paciente...</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Data</label>
              <input 
                type="date" 
                value={data} 
                onChange={(e) => setData(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Hora</label>
              <input 
                type="time" 
                value={hora} 
                onChange={(e) => setHora(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Motivo da Sessão</label>
            <input 
              type="text" 
              placeholder="Ex: Reabilitação LCA, Sessão de rotina..."
              value={motivo} 
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={aoFechar}>Cancelar</button>
            <button type="submit" className="btn-salvar">Agendar Sessão</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalMarcacao