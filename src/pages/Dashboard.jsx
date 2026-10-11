import { UserPlus, Search, ChevronRight } from 'lucide-react'
import './Dashboard.css'

function Dashboard() {
  return (
    <div className="dashboard">
      
      {}
      <div className="dashboard-header">
        <div>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Doentes</h1>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Gira os doentes da clínica e acompanhe o estado dos tratamentos.</p>
        </div>
        <button className="btn-adicionar">
          <UserPlus size={18} />
          Adicionar Novo Doente
        </button>
      </div>

      {}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>Doentes recentes</h3>
          <div className="search-box">
            <Search size={16} color="#94a3b8" />
            <input type="text" placeholder="Pesquisar doente..." />
          </div>
        </div>

        <table className="patients-table">
          <thead>
            <tr>
              <th>NOME</th>
              <th>CONDIÇÃO</th>
              <th>PRÓXIMA SESSÃO</th>
              <th>CONTACTO</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {}
            <tr>
              <td style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="avatar">MF</div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Maria Fernandes</strong>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>54 anos</div>
                </div>
              </td>
              <td>Lombalgia crónica</td>
              <td>Hoje, 14:30</td>
              <td>912 345 678</td>
              <td><span className="badge badge-green">Em tratamento</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      
    </div>
  )
}

export default Dashboard