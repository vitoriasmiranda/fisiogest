import './App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard' 

function App() {
  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Sidebar /> 
      
      <main style={{ marginLeft: '250px', padding: '40px', width: '100%', boxSizing: 'border-box' }}>
        <Dashboard /> {}
      </main>
    </div>
  )
}

export default App