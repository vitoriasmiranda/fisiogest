import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { UserPlus, Search, Trash2, Eye, Users, CalendarClock } from 'lucide-react'
import ModalPaciente from '../components/ModalPaciente'
import DetalhesPaciente from '../components/DetalhesPaciente'
import MensagemErro from '../components/MensagemErro'
import { useConfirmacao } from '../hooks/useConfirmacao'
import { formatarDataISO } from '../utils/datas'
import { contarMarcacoesNaData, descreverProximaSessao, obterProximaMarcacao } from '../utils/marcacoes'
import { classeBadgeEstado, filtrarPacientes } from '../utils/pacientes'
import './Dashboard.css'

function Dashboard() {
  const [modalAberto, setModalAberto] = useState(false)
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null)
  const [pacientes, setPacientes] = useState([])
  const [marcacoes, setMarcacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState(null)
  const [agora] = useState(() => new Date())
  const [dialogo, confirmar] = useConfirmacao()

  // Um único carregamento ao montar (antes havia dois useEffect e os pacientes eram buscados duas vezes).
  useEffect(() => {
    let ativo = true
    const carregar = async () => {
      const [resPacientes, resMarcacoes] = await Promise.all([
        supabase.from('pacientes').select('*').order('id', { ascending: false }),
        supabase.from('marcacoes').select('*'),
      ])
      if (!ativo) return
      if (resPacientes.error || resMarcacoes.error) {
        console.error('Erro ao carregar dados:', resPacientes.error || resMarcacoes.error)
        setErroCarregamento('Não foi possível carregar os dados. Verifique a ligação e tente novamente.')
      }
      setPacientes(resPacientes.data ?? [])
      setMarcacoes(resMarcacoes.data ?? [])
      setCarregando(false)
    }
    carregar()
    return () => { ativo = false }
  }, [])

  const adicionarNovoPaciente = async (novoPaciente) => {
    const { data, error } = await supabase.from('pacientes').insert([novoPaciente]).select()

    if (error) {
      console.error('Erro ao guardar paciente:', error)
      return 'Não foi possível guardar o paciente. Tente novamente.'
    }
    setPacientes((atuais) => [data[0], ...atuais])
    return null
  }

  const removerPaciente = async (idParaRemover) => {
    const paciente = pacientes.find((p) => p.id === idParaRemover)
    const ok = await confirmar({
      titulo: `Remover ${paciente?.nome ?? 'paciente'}?`,
      mensagem: 'A ficha, as notas de evolução e as marcações deste paciente serão apagadas. Esta ação não pode ser desfeita.',
      textoConfirmar: 'Remover',
      perigoso: true,
    })
    if (!ok) return

    const { error } = await supabase.from('pacientes').delete().eq('id', idParaRemover)

    if (error) {
      console.error('Erro ao remover:', error)
      setErroCarregamento('Não foi possível remover o paciente. Tente novamente.')
      return
    }
    setPacientes((atuais) => atuais.filter((p) => p.id !== idParaRemover))
    setMarcacoes((atuais) => atuais.filter((m) => String(m.pacienteId) !== String(idParaRemover)))
    if (pacienteSelecionado?.id === idParaRemover) setPacienteSelecionado(null)
  }

  const atualizarPaciente = async (pacienteAtualizado) => {
    const { id, ...dadosParaNuvem } = pacienteAtualizado

    const { error } = await supabase.from('pacientes').update(dadosParaNuvem).eq('id', id)

    if (error) {
      console.error('Erro ao atualizar paciente:', error)
      return 'Não foi possível guardar as alterações. Tente novamente.'
    }
    setPacientes((atuais) => atuais.map((p) => (p.id === id ? pacienteAtualizado : p)))
    setPacienteSelecionado(pacienteAtualizado)
    return null
  }

  const pacientesFiltrados = filtrarPacientes(pacientes, termoPesquisa)
  const totalPacientes = pacientes.length
  const consultasDeHoje = contarMarcacoesNaData(marcacoes, formatarDataISO(agora))
  const obterProximaSessao = (pacienteId) =>
    descreverProximaSessao(obterProximaMarcacao(marcacoes, pacienteId, agora), agora)

  if (pacienteSelecionado) {
    return (
      <DetalhesPaciente 
        paciente={pacienteSelecionado} 
        aoVoltar={() => setPacienteSelecionado(null)}
        aoAtualizar={atualizarPaciente} 
      />
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Pacientes</h1>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Gira os pacientes da clínica e acompanhe o estado dos tratamentos.</p>
        </div>
        
        <button className="btn-adicionar" onClick={() => setModalAberto(true)}>
          <UserPlus size={18} />
          Adicionar Novo Paciente
        </button>
      </div>

          <div className="stats-row">
      <div className="stat-card">
        <div className="stat-icon" style={{ backgroundColor: '#e0f2fe' }}>
          <Users color="#0284c7" size={28} />
        </div>
        <div>
          <p className="stat-label">Total de Pacientes</p>
          <h2 className="stat-value">{totalPacientes}</h2>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ backgroundColor: '#ccfbf1' }}>
          <CalendarClock color="#0d9488" size={28} />
        </div>
        <div>
          <p className="stat-label">Consultas Hoje</p>
          <h2 className="stat-value">{consultasDeHoje}</h2>
        </div>
      </div>
    </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>Pacientes recentes</h3>
          <div className="search-box">
            <Search color="#94a3b8" size={16} />
            <input 
              type="search"
              aria-label="Pesquisar paciente"
              placeholder="Pesquisar paciente..." 
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
            />
          </div>
        </div>

        <MensagemErro mensagem={erroCarregamento} aoFechar={() => setErroCarregamento(null)} />
        {carregando && <p className="estado-carregando">A carregar pacientes...</p>}

        <div className="table-wrapper">
  <table className="patients-table">
    <thead>
      <tr>
        <th>NOME</th><th>CONDIÇÃO</th><th>PRÓXIMA SESSÃO</th>
        <th>CONTATO</th><th>ESTADO</th><th></th>
      </tr>
    </thead>
    <tbody>
      {pacientesFiltrados.map((paciente) => (
        <tr key={paciente.id}>
          <td>
            <div className="paciente-cell">
              <div className="avatar">{paciente.iniciais}</div>
              <div>
                <strong style={{ color: '#0f172a' }}>{paciente.nome}</strong>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{paciente.idade} anos</div>
              </div>
            </div>
          </td>
          <td data-label="Condição">{paciente.condicao}</td>
          <td data-label="Próxima sessão"><strong>{obterProximaSessao(paciente.id)}</strong></td>
          <td data-label="Contato">{paciente.contacto}</td>
          <td data-label="Estado"><span className={`badge ${classeBadgeEstado(paciente.estado)}`}>{paciente.estado}</span></td>
          <td>
            <div className="acoes">
              <button className="btn-acao" onClick={() => setPacienteSelecionado(paciente)} title="Ver ficha" aria-label={`Ver ficha de ${paciente.nome}`}>
                <Eye size={18} />
              </button>
              <button className="btn-remover" onClick={() => removerPaciente(paciente.id)} title="Remover paciente" aria-label={`Remover ${paciente.nome}`}>
                <Trash2 size={18} />
              </button>
            </div>
          </td>
        </tr>
      ))}

      {!carregando && pacientesFiltrados.length === 0 && (
        <tr>
          <td colSpan="6" className="vazio">
            {pacientes.length === 0
              ? 'Nenhum paciente registado. Clique em "Adicionar Novo Paciente" para começar.'
              : `Nenhum paciente corresponde a "${termoPesquisa}".`}
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
      </div>
      
      {dialogo}
      {modalAberto && <ModalPaciente aoFechar={() => setModalAberto(false)} aoGuardar={adicionarNovoPaciente} />}
      
    </div>
  )
}

export default Dashboard