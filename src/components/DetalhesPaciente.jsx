import { useState, useEffect } from 'react'
import { supabase } from '../supabase' 
import { ArrowLeft, Phone, Calendar, FileText, Plus, ClipboardList } from 'lucide-react'
import './DetalhesPaciente.css'

function DetalhesPaciente({ paciente, aoVoltar, aoAtualizar }) {
  const [textoNota, setTextoNota] = useState('')
  const [proximaSessao, setProximaSessao] = useState('A calcular...') 
  const [motivoSessao, setMotivoSessao] = useState('') 

  useEffect(() => {
    const buscarProximaSessao = async () => {
      if (!paciente) return;

      const { data, error } = await supabase
        .from('marcacoes')
        .select('data, hora, motivo')
        .eq('pacienteId', paciente.id) 

      if (error) {
        console.error("Erro ao buscar sessões:", error)
        setProximaSessao('Erro ao carregar')
        return
      }

      if (data && data.length > 0) {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        const consultasFuturas = data.filter(m => {
          const [ano, mes, dia] = m.data.split('-')
          const dataConsulta = new Date(ano, mes - 1, dia)
          return dataConsulta >= hoje
        })

        if (consultasFuturas.length === 0) {
          setProximaSessao("Por agendar")
          setMotivoSessao("")
          return
        }

        consultasFuturas.sort((a, b) => new Date(a.data) - new Date(b.data))
        const proxima = consultasFuturas[0]

        const [anoProxima, mesProxima, diaProxima] = proxima.data.split('-')
        const dataProximaConsulta = new Date(anoProxima, mesProxima - 1, diaProxima)
        
        if (dataProximaConsulta.getTime() === hoje.getTime()) {
          setProximaSessao(`Hoje, ${proxima.hora}`)
        } else {
          setProximaSessao(`${dataProximaConsulta.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}, ${proxima.hora}`)
        }
        
        setMotivoSessao(proxima.motivo)
        
      } else {
        setProximaSessao("Por agendar")
        setMotivoSessao("")
      }
    }

    buscarProximaSessao()
  }, [paciente])

  if (!paciente) return null;

  const notas = paciente.notas || []

  const registarNota = () => {
    if (textoNota.trim() === '') return;

    const dataAtual = new Date();
    const dia = dataAtual.getDate();
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const mes = meses[dataAtual.getMonth()];
    const ano = dataAtual.getFullYear();
    const dataFormatada = `${dia} ${mes} ${ano}`; 

    const novaNota = {
      id: Date.now(),
      data: dataFormatada, 
      texto: textoNota
    }

    const pacienteAtualizado = { 
      ...paciente, 
      notas: [novaNota, ...notas]
    }

    aoAtualizar(pacienteAtualizado)
    setTextoNota('') 
  }

  return (
    <div className="detalhes-page">
      <button className="btn-voltar" onClick={aoVoltar}>
        <ArrowLeft size={16} /> Voltar aos pacientes
      </button>

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
          value={paciente.estado}
          onChange={(e) => {
            const pacienteAtualizado = { ...paciente, estado: e.target.value }
            aoAtualizar(pacienteAtualizado) 
          }}
        >
          <option value="Em avaliação">Em avaliação</option>
          <option value="Em tratamento">Em tratamento</option>
          <option value="Em pausa">Em pausa</option>
          <option value="Alta médica">Alta médica</option>
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
              
              {}
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
              <label>Adicionar nota da sessão</label>
              <textarea 
                rows="4" 
                placeholder="Descreva a evolução do paciente nesta sessão..."
                value={textoNota}
                onChange={(e) => setTextoNota(e.target.value)}
              ></textarea>
              <div className="nota-footer">
                <span className="ajuda">A nota fica registada com a data de hoje.</span>
                <span className="contador">{textoNota.length}/1000</span>
              </div>
              <button className="btn-registar-nota" onClick={registarNota}>
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