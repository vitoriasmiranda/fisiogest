import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { UserPlus, Search, Archive, ArchiveRestore, Eye, Users, CalendarClock } from 'lucide-react'
import ModalPaciente from '../components/ModalPaciente'
import DetalhesPaciente from '../components/DetalhesPaciente'
import MensagemErro from '../components/MensagemErro'
import { useConfirmacao } from '../hooks/useConfirmacao'
import { formatarDataISO } from '../utils/datas'
import { contarMarcacoesNaData, descreverProximaSessao, obterProximaMarcacao } from '../utils/marcacoes'
import { classeBadgeEstado, descreverIdade, filtrarPacientes } from '../utils/pacientes'
import './Dashboard.css'

function Dashboard() {
  const [modalAberto, setModalAberto] = useState(false)
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null)
  const [pacientes, setPacientes] = useState([])
  const [marcacoes, setMarcacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState(null)
  const [verArquivados, setVerArquivados] = useState(false)
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
        setErroCarregamento('Não foi possível carregar os dados. Verifique sua conexão e tente novamente.')
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
      console.error('Erro ao salvar paciente:', error)
      return 'Não foi possível salvar o paciente. Tente novamente.'
    }
    setPacientes((atuais) => [data[0], ...atuais])
    return null
  }

  /**
   * Arquivar em vez de apagar: o prontuário precisa ficar guardado (e o banco não deixa apagar pacientes).
   * Os agendamentos FUTUROS são cancelados; os passados ficam no histórico.
   */
  const arquivarPaciente = async (id) => {
    const paciente = pacientes.find((p) => p.id === id)
    const ok = await confirmar({
      titulo: `Arquivar ${paciente?.nome ?? 'paciente'}?`,
      mensagem:
        'O paciente sai da lista e os agendamentos futuros dele são cancelados. A ficha e as notas continuam guardadas, e você pode reativá-lo quando quiser.',
      textoConfirmar: 'Arquivar',
    })
    if (!ok) return

    const { error } = await supabase.from('pacientes').update({ arquivado: true }).eq('id', id)
    if (error) {
      console.error('Erro ao arquivar:', error)
      setErroCarregamento('Não foi possível arquivar o paciente. Tente novamente.')
      return
    }

    const hojeISO = formatarDataISO(agora)
    const { error: erroAgenda } = await supabase
      .from('marcacoes')
      .delete()
      .eq('pacienteId', id)
      .gte('data', hojeISO)
    if (erroAgenda) console.error('Erro ao cancelar agendamentos futuros:', erroAgenda)

    setErroCarregamento(null)
    setPacientes((atuais) => atuais.map((p) => (p.id === id ? { ...p, arquivado: true } : p)))
    setMarcacoes((atuais) => atuais.filter((m) => !(String(m.pacienteId) === String(id) && m.data >= hojeISO)))
  }

  const reativarPaciente = async (id) => {
    const { error } = await supabase.from('pacientes').update({ arquivado: false }).eq('id', id)
    if (error) {
      console.error('Erro ao reativar:', error)
      setErroCarregamento('Não foi possível reativar o paciente. Tente novamente.')
      return
    }
    setErroCarregamento(null)
    setPacientes((atuais) => atuais.map((p) => (p.id === id ? { ...p, arquivado: false } : p)))
  }

  /** Recebe só os campos que mudaram (ex.: { estado }). Devolve uma mensagem de erro ou null. */
  const atualizarPaciente = async (alteracoes) => {
    const id = pacienteSelecionado.id
    const { error } = await supabase.from('pacientes').update(alteracoes).eq('id', id)

    if (error) {
      console.error('Erro ao atualizar paciente:', error)
      return 'Não foi possível salvar as alterações. Tente novamente.'
    }
    const atualizado = { ...pacienteSelecionado, ...alteracoes }
    setPacientes((atuais) => atuais.map((p) => (p.id === id ? atualizado : p)))
    setPacienteSelecionado(atualizado)
    // O nome também fica guardado em cada agendamento: atualiza lá para a agenda não mostrar o nome antigo.
    if (alteracoes.nome && alteracoes.nome !== pacienteSelecionado.nome) {
      const { error: erroAgenda } = await supabase
        .from('marcacoes')
        .update({ nomePaciente: alteracoes.nome })
        .eq('pacienteId', id)
      if (erroAgenda) console.error('Erro ao atualizar o nome nos agendamentos:', erroAgenda)
      setMarcacoes((atuais) =>
        atuais.map((m) => (String(m.pacienteId) === String(id) ? { ...m, nomePaciente: alteracoes.nome } : m)),
      )
    }
    return null
  }

  const ativos = pacientes.filter((p) => !p.arquivado)
  const arquivados = pacientes.filter((p) => p.arquivado)
  const pacientesFiltrados = filtrarPacientes(verArquivados ? arquivados : ativos, termoPesquisa)
  const totalPacientes = ativos.length
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
          <p style={{ color: '#64748b', marginTop: '5px' }}>Gerencie os pacientes da clínica e acompanhe o andamento dos tratamentos.</p>
        </div>
        
        <button className="btn-adicionar" onClick={() => setModalAberto(true)}>
          <UserPlus size={18} />
          Adicionar novo paciente
        </button>
      </div>

          <div className="stats-row">
      <div className="stat-card">
        <div className="stat-icon" style={{ backgroundColor: '#e0f2fe' }}>
          <Users color="#0284c7" size={28} />
        </div>
        <div>
          <p className="stat-label">Total de pacientes</p>
          <h2 className="stat-value">{totalPacientes}</h2>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ backgroundColor: '#ccfbf1' }}>
          <CalendarClock color="#0d9488" size={28} />
        </div>
        <div>
          <p className="stat-label">Consultas hoje</p>
          <h2 className="stat-value">{consultasDeHoje}</h2>
        </div>
      </div>
    </div>

      <div className="card">
        <div className="card-header">
          <div className="lista-titulo">
            <h3 style={{ margin: 0 }}>{verArquivados ? 'Pacientes arquivados' : 'Lista de pacientes'}</h3>
            {(verArquivados || arquivados.length > 0) && (
              <button className="btn-ver-arquivados" onClick={() => setVerArquivados((v) => !v)} aria-pressed={verArquivados}>
                {verArquivados ? '← Voltar para ativos' : `Ver arquivados (${arquivados.length})`}
              </button>
            )}
          </div>
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
        {carregando && <p className="estado-carregando">Carregando pacientes...</p>}

        <div className="table-wrapper">
  <table className="patients-table">
    <thead>
      <tr>
        <th>NOME</th><th>CONDIÇÃO</th><th>PRÓXIMA SESSÃO</th>
        <th>TELEFONE</th><th>ESTADO</th><th></th>
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
                <div style={{ fontSize: '12px', color: '#64748b' }}>{descreverIdade(paciente, agora)}</div>
              </div>
            </div>
          </td>
          <td data-label="Condição">{paciente.condicao}</td>
          <td data-label="Próxima sessão"><strong>{obterProximaSessao(paciente.id)}</strong></td>
          <td data-label="Telefone">{paciente.contacto}</td>
          <td data-label="Estado"><span className={`badge ${classeBadgeEstado(paciente.estado)}`}>{paciente.estado}</span></td>
          <td>
            <div className="acoes">
              <button className="btn-acao" onClick={() => setPacienteSelecionado(paciente)} title="Ver ficha" aria-label={`Ver ficha de ${paciente.nome}`}>
                <Eye size={18} />
              </button>
              {paciente.arquivado ? (
                <button className="btn-acao" onClick={() => reativarPaciente(paciente.id)} title="Reativar paciente" aria-label={`Reativar ${paciente.nome}`}>
                  <ArchiveRestore size={18} />
                </button>
              ) : (
                <button className="btn-remover" onClick={() => arquivarPaciente(paciente.id)} title="Arquivar paciente" aria-label={`Arquivar ${paciente.nome}`}>
                  <Archive size={18} />
                </button>
              )}
            </div>
          </td>
        </tr>
      ))}

      {!carregando && pacientesFiltrados.length === 0 && (
        <tr>
          <td colSpan="6" className="vazio">
            {termoPesquisa.trim()
              ? `Nenhum paciente corresponde a "${termoPesquisa}".`
              : verArquivados
                ? 'Nenhum paciente arquivado.'
                : 'Nenhum paciente cadastrado. Clique em "Adicionar novo paciente" para começar.'}
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