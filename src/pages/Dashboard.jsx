import { useState, useEffect } from 'react'
import { supabase } from '../supabase' 
import { UserPlus, Search, Trash2, Eye, Users, CalendarClock } from 'lucide-react' 
import ModalPaciente from '../components/ModalPaciente'
import DetalhesPaciente from '../components/DetalhesPaciente'
import './Dashboard.css'

function Dashboard() {
  const [modalAberto, setModalAberto] = useState(false)
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null)
  
  const [marcacoes, setMarcacoes] = useState([])

  
  const [pacientes, setPacientes] = useState([])

  const carregarPacientes = async () => {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('id', { ascending: false })
    
    if (error) {
      console.error("Erro a buscar pacientes:", error)
    } else if (data) {
      setPacientes(data)
    }
  }

  useEffect(() => {
    carregarPacientes()
  }, [])

  const carregarMarcacoes = async () => {
    const { data, error } = await supabase
      .from('marcacoes')
      .select('*')
    if (data) {
      setMarcacoes(data)
    }
  }

  useEffect(() => {
    carregarPacientes()
    carregarMarcacoes()
  }, [])

  const adicionarNovoPaciente = async (novoPaciente) => {
    
    const { id, proximaSessao, ...dadosParaNuvem } = novoPaciente;

    const { data, error } = await supabase
      .from('pacientes')
      .insert([dadosParaNuvem])
      .select(); 

    if (error) {
      console.error("Erro ao guardar paciente:", error);
      alert("Houve um erro ao guardar na nuvem!");
    } else if (data) {
     
      setPacientes([data[0], ...pacientes]);
    }
  }

  const removerPaciente = async (idParaRemover) => {
    const confirmar = window.confirm("Tem a certeza que deseja remover este paciente?");
    if (confirmar) {
      const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', idParaRemover);

      if (error) {
        console.error("Erro ao remover:", error);
        alert("Houve um erro ao apagar na nuvem!");
      } else {
        const listaAtualizada = pacientes.filter(paciente => paciente.id !== idParaRemover);
        setPacientes(listaAtualizada);
        
        if (pacienteSelecionado && pacienteSelecionado.id === idParaRemover) {
          setPacienteSelecionado(null);
        }
      }
    }
  }
  
  const atualizarPaciente = async (pacienteAtualizado) => {
    const { id, ...dadosParaNuvem } = pacienteAtualizado;
    
    const { error } = await supabase
      .from('pacientes')
      .update(dadosParaNuvem)
      .eq('id', id);

    if (error) {
      console.error("Erro ao atualizar paciente:", error);
      alert("Houve um erro ao guardar as alterações na nuvem!");
    } else {
      const novaLista = pacientes.map(p => p.id === id ? pacienteAtualizado : p);
      setPacientes(novaLista);
      setPacienteSelecionado(pacienteAtualizado);
    }
  }

  const pacientesFiltrados = pacientes.filter((paciente) => {
    const termo = termoPesquisa.toLowerCase()
    return (
      paciente.nome.toLowerCase().includes(termo) || 
      paciente.condicao.toLowerCase().includes(termo)
    )
  })

  const totalPacientes = pacientes.length;

  const dataDeHoje = new Date()
  const ano = dataDeHoje.getFullYear()
  const mes = String(dataDeHoje.getMonth() + 1).padStart(2, '0')
  const dia = String(dataDeHoje.getDate()).padStart(2, '0')
  const dataHojeFormatada = `${ano}-${mes}-${dia}`
  
  const consultasDeHoje = marcacoes.filter(m => m.data === dataHojeFormatada).length;

  const obterProximaSessao = (pacienteId) => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const consultasFuturas = marcacoes.filter(m => {
      if (m.pacienteId.toString() !== pacienteId.toString()) return false
      
      const [anoMarcacao, mesMarcacao, diaMarcacao] = m.data.split('-')
      const dataConsulta = new Date(anoMarcacao, mesMarcacao - 1, diaMarcacao)
      return dataConsulta >= hoje
    })

    if (consultasFuturas.length === 0) return "Por agendar"

    consultasFuturas.sort((a, b) => new Date(a.data) - new Date(b.data))
    const proxima = consultasFuturas[0]

    const [anoProxima, mesProxima, diaProxima] = proxima.data.split('-')
    const dataProximaConsulta = new Date(anoProxima, mesProxima - 1, diaProxima)
    
    if (dataProximaConsulta.getTime() === hoje.getTime()) {
      return `Hoje, ${proxima.hora}`
    }

    return `${dataProximaConsulta.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}, ${proxima.hora}`
  }

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
              type="text" 
              placeholder="Pesquisar paciente..." 
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
            />
          </div>
        </div>

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
          <td data-label="Estado"><span className="badge badge-green">{paciente.estado}</span></td>
          <td>
            <div className="acoes">
              <button className="btn-acao" onClick={() => setPacienteSelecionado(paciente)} title="Ver ficha">
                <Eye size={18} />
              </button>
              <button className="btn-remover" onClick={() => removerPaciente(paciente.id)} title="Remover paciente">
                <Trash2 size={18} />
              </button>
            </div>
          </td>
        </tr>
      ))}

      {pacientesFiltrados.length === 0 && (
        <tr>
          <td colSpan="6" className="vazio">
            Nenhum paciente encontrado. Clique em "Adicionar Novo Paciente" para começar.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
      </div>
      
      {modalAberto && <ModalPaciente aoFechar={() => setModalAberto(false)} aoGuardar={adicionarNovoPaciente} />}
      
    </div>
  )
}

export default Dashboard