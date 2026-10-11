import { useState, useEffect } from 'react'
import { UserPlus, Search, Trash2, Eye } from 'lucide-react' 
import ModalPaciente from '../components/ModalPaciente'
import DetalhesPaciente from '../components/DetalhesPaciente'
import './Dashboard.css'

function Dashboard() {
  const [modalAberto, setModalAberto] = useState(false)
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null)

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
        proximaSessao: 'Hoje, 14:30',
        contacto: '912 345 678',
        estado: 'Em tratamento',
        historico: 'Hérnia discal L4-L5 diagnosticada em 2019. Toma anti-inflamatórios por indicação médica.'
      }
    ]
  })

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

      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>Pacientes recentes</h3>
          <div className="search-box">
            <Search size={16} color="#94a3b8" />
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
                <td>{paciente.proximaSessao}</td>
                <td>{paciente.contacto}</td>
                <td><span className="badge badge-green">{paciente.estado}</span></td>
                
                <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn-acao" 
                    onClick={() => setPacienteSelecionado(paciente)}
                    title="Ver ficha"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    className="btn-remover" 
                    onClick={() => removerPaciente(paciente.id)}
                    title="Remover paciente"
                  >
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