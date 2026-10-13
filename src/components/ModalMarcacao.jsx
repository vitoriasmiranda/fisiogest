import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { X } from 'lucide-react'
import { formatarDataISO } from '../utils/datas'
import { validarMarcacao } from '../utils/marcacoes'
import './ModalMarcacao.css'

const estiloCampo = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }

/**
 * aoGuardar(novaMarcacao) deve devolver uma mensagem de erro (string) ou null em caso de sucesso.
 * dataInicial permite abrir o modal já com o dia selecionado na agenda.
 */
function ModalMarcacao({ aoFechar, aoGuardar, dataInicial = '' }) {
  const [pacienteId, setPacienteId] = useState('')
  const [data, setData] = useState(dataInicial)
  const [hora, setHora] = useState('')
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState(null)
  const [aGuardar, setAGuardar] = useState(false)
  const [pacientes, setPacientes] = useState([])
  const [hoje] = useState(() => formatarDataISO(new Date()))

  useEffect(() => {
    let ativo = true
    const carregarPacientes = async () => {
      const { data, error } = await supabase.from('pacientes').select('id, nome').order('nome')
      if (!ativo) return
      if (error) {
        console.error('Erro ao carregar pacientes no modal:', error)
        setErro('Não foi possível carregar a lista de pacientes.')
      } else {
        setPacientes(data ?? [])
      }
    }
    carregarPacientes()
    return () => { ativo = false }
  }, [])

  const submeterFormulario = async (e) => {
    e.preventDefault()

    const mensagem = validarMarcacao({ pacienteId, data, hora, motivo })
    if (mensagem) {
      setErro(mensagem)
      return
    }

    const pacienteSelecionado = pacientes.find((p) => String(p.id) === pacienteId)
    if (!pacienteSelecionado) {
      setErro('Por favor, selecione um paciente.')
      return
    }

    setAGuardar(true)
    const erroGuardar = await aoGuardar({
      pacienteId: pacienteSelecionado.id,
      nomePaciente: pacienteSelecionado.nome,
      data,
      hora,
      motivo: motivo.trim(),
    })
    setAGuardar(false)
    if (erroGuardar) setErro(erroGuardar)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-marcacao">
        <div className="modal-header">
          <h2 id="titulo-modal-marcacao">Nova Marcação</h2>
          <button className="btn-fechar" onClick={aoFechar} aria-label="Fechar">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={submeterFormulario} noValidate>
          {erro && (
            <p role="alert" style={{ color: '#b91c1c', background: '#fef2f2', padding: '10px', borderRadius: '6px', fontSize: '14px' }}>
              {erro}
            </p>
          )}

          <div className="form-group">
            <label htmlFor="marcacao-paciente">Paciente</label>
            <select id="marcacao-paciente" value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} style={estiloCampo}>
              <option value="">Selecione um paciente...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div className="form-row-marcacao">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="marcacao-data">Data</label>
              <input id="marcacao-data" type="date" min={hoje} value={data} onChange={(e) => setData(e.target.value)} style={estiloCampo} />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="marcacao-hora">Hora</label>
              <input id="marcacao-hora" type="time" step="900" value={hora} onChange={(e) => setHora(e.target.value)} style={estiloCampo} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="marcacao-motivo">Motivo da Sessão</label>
            <input
              id="marcacao-motivo"
              type="text"
              placeholder="Ex: Reabilitação LCA, Sessão de rotina..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              style={estiloCampo}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={aoFechar}>Cancelar</button>
            <button type="submit" className="btn-salvar" disabled={aGuardar}>
              {aGuardar ? 'A agendar...' : 'Agendar Sessão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalMarcacao
