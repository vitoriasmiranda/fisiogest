import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { ArrowLeft, Phone, Calendar, FileText, Plus, ClipboardList } from 'lucide-react'
import MensagemErro from './MensagemErro'
import { formatarDataNota } from '../utils/datas'
import { descreverProximaSessao, obterProximaMarcacao } from '../utils/marcacoes'
import { ESTADOS, LIMITE_NOTA } from '../utils/pacientes'
import './DetalhesPaciente.css'

function DetalhesPaciente({ paciente, aoVoltar, aoAtualizar }) {
  const [textoNota, setTextoNota] = useState('')
  const [proximaSessao, setProximaSessao] = useState('A calcular...')
  const [motivoSessao, setMotivoSessao] = useState('')
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (!paciente) return
    let ativo = true

    const buscarProximaSessao = async () => {
      const { data, error } = await supabase
        .from('marcacoes')
        .select('data, hora, motivo, pacienteId')
        .eq('pacienteId', paciente.id)
      if (!ativo) return

      if (error) {
        console.error('Erro ao buscar sessões:', error)
        setProximaSessao('Erro ao carregar')
        return
      }
      const agora = new Date()
      const proxima = obterProximaMarcacao(data ?? [], paciente.id, agora)
      setProximaSessao(descreverProximaSessao(proxima, agora))
      setMotivoSessao(proxima?.motivo ?? '')
    }

    buscarProximaSessao()
    return () => { ativo = false }
  }, [paciente])

  if (!paciente) return null

  const notas = paciente.notas || []

  const registarNota = async () => {
    const texto = textoNota.trim()
    if (texto === '') return

    const novaNota = {
      id: Date.now(),
      data: formatarDataNota(new Date()),
      texto: texto.slice(0, LIMITE_NOTA),
    }

    const erroGuardar = await aoAtualizar({ ...paciente, notas: [novaNota, ...notas] })
    // Só limpa o texto se gravou — se falhar, a nota escrita não se perde.
    setErro(erroGuardar ?? null)
    if (!erroGuardar) setTextoNota('')
  }

  return (
    <div className="detalhes-page">
      <button className="btn-voltar" onClick={aoVoltar}>
        <ArrowLeft size={16} /> Voltar aos pacientes
      </button>

      <MensagemErro mensagem={erro} aoFechar={() => setErro(null)} />

      <div className="detalhes-header">
        <div className="detalhes-header-left">
          <div className="avatar large">{paciente.iniciais}</div>
          <div>
            <h2>{paciente.nome}</h2>
            <p className="subtitle">{paciente.idade} anos · {paciente.condicao}</p>
          </div>
        </div>
        
        <select 
          className="badge-select"
          aria-label="Estado do tratamento"
          value={paciente.estado}
          onChange={async (e) => {
            const erroGuardar = await aoAtualizar({ ...paciente, estado: e.target.value })
            setErro(erroGuardar ?? null)
          }}
        >
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
      </div>

      <div className="detalhes-grid">
        <div className="detalhes-col-esq">
          <div className="card-seccao">
            <div className="card-titulo">
              <FileText size={18} color="#64748b" />
              <h3>Dados do paciente</h3>
            </div>
            <div className="dados-lista">
              <div className="dado-item">
                <Phone size={16} color="#64748b" />
                <span>{paciente.contacto}</span>
              </div>
              <div className="dado-item">
                <Calendar size={16} color="#64748b" />
                <span>Próxima sessão: {proximaSessao}</span>
              </div>
              
              {motivoSessao && (
                <div className="dado-item" style={{ marginTop: '8px', color: '#0d9488', fontWeight: '500' }}>
                  <ClipboardList size={16} color="#0d9488" />
                  <span>Motivo: {motivoSessao}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card-seccao">
            <div className="card-titulo">
              <FileText size={18} color="#64748b" />
              <h3>Histórico clínico</h3>
            </div>
            <p className="texto-corrido">
              {paciente.historico ? paciente.historico : "Nenhum histórico registado na admissão."}
            </p>
          </div>
        </div>

        <div className="detalhes-col-dir">
          <div className="card-seccao altura-total">
            <h3>Notas de evolução</h3>
            
            <div className="adicionar-nota">
              <label htmlFor="nova-nota">Adicionar nota da sessão</label>
              <textarea
                id="nova-nota"
                rows="4"
                maxLength={LIMITE_NOTA}
                placeholder="Descreva a evolução do paciente nesta sessão..."
                value={textoNota}
                onChange={(e) => setTextoNota(e.target.value)}
              ></textarea>
              <div className="nota-footer">
                <span className="ajuda">A nota fica registada com a data de hoje.</span>
                <span className="contador">{textoNota.length}/{LIMITE_NOTA}</span>
              </div>
              <button className="btn-registar-nota" onClick={registarNota} disabled={textoNota.trim() === ''}>
                <Plus size={16} /> Registar nota
              </button>
            </div>

            <div className="lista-notas">
              {notas.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>
                  Ainda não existem notas de evolução registadas.
                </p>
              ) : (
                notas.map((nota) => (
                  <div key={nota.id} className="nota-item">
                    <span className="nota-data">{nota.data}</span>
                    <p>{nota.texto}</p>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default DetalhesPaciente