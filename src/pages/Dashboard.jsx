import { useState, useEffect } from 'react'
import { UserPlus, Search, Trash2, Eye, Users, CalendarClock } from 'lucide-react' 
import ModalPaciente from '../components/ModalPaciente'
import DetalhesPaciente from '../components/DetalhesPaciente'
import './Dashboard.css'

function Dashboard() {
  const [modalAberto, setModalAberto] = useState(false)
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null)
  
  const [marcacoes, setMarcacoes] = useState([])

  const [pacientes, setPacientes] = useState(() => {
    const dadosGuardados = localStorage.getItem('pacientes-fisiogest')
    if (dadosGuardados) {
      return JSON.parse(dadosGuardados) 
    }
    return [
      {
        id: 1,
        iniciais: 'MF',
        nome: 'Maria Fernandes',
        idade: 54,
        condicao: 'Lombalgia crónica',
        contacto: '912 345 678',
        estado: 'Em tratamento',
        historico: 'Hérnia discal L4-L5 diagnosticada em 2019. Toma anti-inflamatórios por indicação médica.'
      }
    ]
  })

  useEffect(() => {
    const dadosMarcacoes = localStorage.getItem('marcacoes-fisiogest')
    if (dadosMarcacoes) {
      setMarcacoes(JSON.parse(dadosMarcacoes))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('pacientes-fisiogest', JSON.stringify(pacientes))
  }, [pacientes])

  const adicionarNovoPaciente = (novoPaciente) => {
    setPacientes([novoPaciente, ...pacientes])
  }

  const removerPaciente = (idParaRemover) => {
    const confirmar = window.confirm("Tem a certeza que deseja remover este paciente?")
    if (confirmar) {
      const listaAtualizada = pacientes.filter(paciente => paciente.id !== idParaRemover)
      setPacientes(listaAtualizada)
      if (pacienteSelecionado && pacienteSelecionado.id === idParaRemover) {
        setPacienteSelecionado(null)
      }
    }
  }

  const atualizarPaciente = (pacienteAtualizado) => {
    const novaLista = pacientes.map(p => p.id === pacienteAtualizado.id ? pacienteAtualizado : p)
    setPacientes(novaLista)
    setPacienteSelecionado(pacienteAtualizado)
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

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: '#e0f2fe', padding: '16px', borderRadius: '50%', display: 'flex' }}>
            <Users color="#0284c7" size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Total de Pacientes</p>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '32px' }}>{totalPacientes}</h2>
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: '#ccfbf1', padding: '16px', borderRadius: '50%', display: 'flex' }}>
            <CalendarClock color="#0d9488" size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Consultas Hoje</p>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '32px' }}>{consultasDeHoje}</h2>
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

        <table className="patients-table">
          <thead>
            <tr>
              <th>NOME</th>
              <th>CONDIÇÃO</th>
              <th>PRÓXIMA SESSÃO</th>
              <th>CONTATO</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pacientesFiltrados.map((paciente) => (
              <tr key={paciente.id}>
                <td style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className="avatar">{paciente.iniciais}</div>
                  <div>
                    <strong style={{ color: '#0f172a' }}>{paciente.nome}</strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{paciente.idade} anos</div>
                  </div>
                </td>
                <td>{paciente.condicao}</td>
                <td><strong>{obterProximaSessao(paciente.id)}</strong></td>
                <td>{paciente.contacto}</td>
                <td><span className="badge badge-green">{paciente.estado}</span></td>
                
                <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button className="btn-acao" onClick={() => setPacienteSelecionado(paciente)} title="Ver ficha">
                    <Eye size={18} />
                  </button>
                  <button className="btn-remover" onClick={() => removerPaciente(paciente.id)} title="Remover paciente">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {modalAberto && <ModalPaciente aoFechar={() => setModalAberto(false)} aoGuardar={adicionarNovoPaciente} />}
      
    </div>
  )
}

export default Dashboard