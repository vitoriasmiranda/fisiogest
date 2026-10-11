import { useState } from 'react'
import { UserPlus, Search } from 'lucide-react'
import ModalPaciente from '../components/ModalPaciente'
import './Dashboard.css'

function Dashboard() {
  const [modalAberto, setModalAberto] = useState(false)

  const [pacientes, setPacientes] = useState([
    {
      id: 1,
      iniciais: 'MF',
      nome: 'Maria Fernandes',
      idade: 54,
      condicao: 'Lombalgia crónica',
      proximaSessao: 'Hoje, 14:30',
      contacto: '912 345 678',
      estado: 'Em tratamento'
    }
  ])

  const adicionarNovoPaciente = (novoPaciente) => {
    setPacientes([novoPaciente, ...pacientes])
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
            <input type="text" placeholder="Pesquisar paciente..." />
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
            </tr>
          </thead>
          <tbody>
            {pacientes.map((paciente) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {}
      {modalAberto && <ModalPaciente aoFechar={() => setModalAberto(false)} aoGuardar={adicionarNovoPaciente} />}
      
    </div>
  )
}

export default Dashboard