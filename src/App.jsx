import { useState } from 'react' 
import './App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda' 

function App() {

  const [paginaAtual, setPaginaAtual] = useState('pacientes')

  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {}
      <Sidebar paginaAtual={paginaAtual} setPaginaAtual={setPaginaAtual} /> 
      
      <main style={{ marginLeft: '250px', padding: '40px', width: '100%', boxSizing: 'border-box' }}>
        
        {}
        {paginaAtual === 'pacientes' ? <Dashboard /> : <Agenda />}
        
      </main>
    </div>
  )
}

export default App