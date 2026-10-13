import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { ArrowLeft, Phone, Calendar, FileText, Plus, ClipboardList, Pencil, Cake } from 'lucide-react'
import MensagemErro from './MensagemErro'
import ModalPaciente from './ModalPaciente'
import { formatarDataHoraNota, parseDataISO } from '../utils/datas'
import { descreverProximaSessao, obterProximaMarcacao } from '../utils/marcacoes'
import { descreverIdade, ESTADOS, LIMITE_NOTA } from '../utils/pacientes'
import './DetalhesPaciente.css'

/**
 * Ficha do paciente.
 * aoAtualizar(alteracoes) recebe só os campos que mudaram e devolve uma mensagem de erro ou null.
 */
function DetalhesPaciente({ paciente, aoVoltar, aoAtualizar }) {
  const [textoNota, setTextoNota] = useState('')
  const [proximaSessao, setProximaSessao] = useState('Calculando...')
  const [motivoSessao, setMotivoSessao] = useState('')
  const [notas, setNotas] = useState([])
  const [carregandoNotas, setCarregandoNotas] = useState(true)
  const [salvandoNota, setSalvandoNota] = useState(false)
  const [editando, setEditando] = useState(false)
  const [erro, setErro] = useState(null)

  const pacienteId = paciente?.id

  useEffect(() => {
    if (pacienteId === undefined) return
    let ativo = true

    const carregar = async () => {
      const [resMarcacoes, resNotas] = await Promise.all([
        supabase.from('marcacoes').select('data, hora, motivo, pacienteId').eq('pacienteId', pacienteId),
        supabase.from('notas').select('*').eq('paciente_id', pacienteId).order('criado_em', { ascending: false }),
      ])
      if (!ativo) return

      if (resMarcacoes.error) {
        console.error('Erro ao buscar sessões:', resMarcacoes.error)
        setProximaSessao('Erro ao carregar')
      } else {
        const agora = new Date()
        const proxima = obterProximaMarcacao(resMarcacoes.data ?? [], pacienteId, agora)
        setProximaSessao(descreverProximaSessao(proxima, agora))
        setMotivoSessao(proxima?.motivo ?? '')
      }

      if (resNotas.error) {
        console.error('Erro ao buscar notas:', resNotas.error)
        setErro('Não foi possível carregar as notas de evolução.')
      } else {
        setNotas(resNotas.data ?? [])
      }
      setCarregandoNotas(false)
    }

    carregar()
    return () => { ativo = false }
  }, [pacienteId])

  if (!paciente) return null

  const salvarNota = async () => {
    const texto = textoNota.trim().slice(0, LIMITE_NOTA)
    if (texto === '') return

    setSalvandoNota(true)
    // Cada nota é uma linha própria: duas pessoas salvando ao mesmo tempo não apagam a nota uma da outra.
    const { data, error } = await supabase.from('notas').insert([{ paciente_id: paciente.id, texto }]).select()
    setSalvandoNota(false)

    if (error) {
      console.error('Erro ao salvar nota:', error)
      // Mantém o texto digitado para poder tentar de novo.
      setErro('Não foi possível salvar a nota. Tente novamente.')
      return
    }
    setErro(null)
    setNotas((atuais) => [data[0], ...atuais])
    setTextoNota('')
  }

  const alterarEstado = async (estado) => {
    const erroGuardar = await aoAtualizar({ estado })
    setErro(erroGuardar ?? null)
  }

  const nascimento = paciente.data_nascimento
    ? parseDataISO(paciente.data_nascimento).toLocaleDateString('pt-BR')
    : null

  return (
    <div className="detalhes-page">
      <button className="btn-voltar" onClick={aoVoltar}>
        <ArrowLeft size={16} /> Voltar para pacientes
      </button>

      <MensagemErro mensagem={erro} aoFechar={() => setErro(null)} />

      <div className="detalhes-header">
        <div className="detalhes-header-left">
          <div className="avatar large">{paciente.iniciais}</div>
          <div>
            <h2>{paciente.nome}</h2>
            <p className="subtitle">{descreverIdade(paciente)} · {paciente.condicao}</p>
          </div>
        </div>

        <div className="detalhes-header-acoes">
          <button className="btn-editar-paciente" onClick={() => setEditando(true)}>
            <Pencil size={16} /> Editar dados
          </button>
          <select
            className="badge-select"
            aria-label="Estado do tratamento"
            value={paciente.estado}
            onChange={(e) => alterarEstado(e.target.value)}
          >
            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>
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
                <Cake size={16} color="#64748b" />
                <span>
                  {nascimento ? `Nascimento: ${nascimento}` : 'Data de nascimento não informada'}
                </span>
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
              {paciente.historico ? paciente.historico : 'Nenhum histórico registrado na admissão.'}
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
                <span className="ajuda">A nota é registrada com a data e o horário de agora.</span>
                <span className="contador">{textoNota.length}/{LIMITE_NOTA}</span>
              </div>
              <button className="btn-registar-nota" onClick={salvarNota} disabled={textoNota.trim() === '' || salvandoNota}>
                <Plus size={16} /> {salvandoNota ? 'Salvando...' : 'Salvar nota'}
              </button>
            </div>

            <div className="lista-notas">
              {carregandoNotas ? (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Carregando notas...</p>
              ) : notas.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>
                  Ainda não há notas de evolução registradas.
                </p>
              ) : (
                notas.map((nota) => (
                  <div key={nota.id} className="nota-item">
                    <span className="nota-data">
                      {formatarDataHoraNota(nota.criado_em)}
                      {nota.autor ? ` · ${nota.autor}` : ''}
                    </span>
                    <p>{nota.texto}</p>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>

      {editando && (
        <ModalPaciente
          paciente={paciente}
          aoFechar={() => setEditando(false)}
          aoGuardar={aoAtualizar}
        />
      )}
    </div>
  )
}

export default DetalhesPaciente
