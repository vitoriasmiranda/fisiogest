import { useState, useEffect } from 'react' 
import { supabase } from '../supabase' 
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import ModalMarcacao from '../components/ModalMarcacao'
import './Agenda.css'

function Agenda() {
  const [vista, setVista] = useState('dia') 
  const [modalAberto, setModalAberto] = useState(false)
  const [dataAtual, setDataAtual] = useState(new Date()) 

  const [marcacoes, setMarcacoes] = useState([])

  const carregarMarcacoes = async () => {
    const { data, error } = await supabase
      .from('marcacoes')
      .select('*')
    
    if (error) {
      console.error("Erro a buscar marcações:", error)
    } else if (data) {
      setMarcacoes(data)
    }
  }

  useEffect(() => {
    carregarMarcacoes()
  }, [])

  const adicionarNovaMarcacao = async (novaMarcacao) => {
    const { id, ...dadosParaNuvem } = novaMarcacao;

    const horarioOcupado = marcacoes.some(
      (m) => m.data === dadosParaNuvem.data && m.hora === dadosParaNuvem.hora
    );

    if (horarioOcupado) {
      alert("⚠️ Horário indisponível! Já existe uma consulta marcada para este dia e hora.");
      return; 
    }
  
    const { data, error } = await supabase
      .from('marcacoes')
      .insert([dadosParaNuvem])
      .select();

    if (error) {
      console.error("Erro ao guardar marcação:", error);
      alert("Houve um erro ao guardar na nuvem!");
    } else if (data) {
      setMarcacoes([...marcacoes, data[0]]);
      setModalAberto(false);
    }
  }

  const removerMarcacao = async (idParaRemover) => {
    const confirmar = window.confirm("Tem a certeza que deseja cancelar esta marcação?")
    if (confirmar) {
      const { error } = await supabase
        .from('marcacoes')
        .delete()
        .eq('id', idParaRemover);

      if (error) {
        console.error("Erro ao remover:", error);
        alert("Houve um erro ao apagar na nuvem!");
      } else {
        const listaAtualizada = marcacoes.filter(m => m.id !== idParaRemover)
        setMarcacoes(listaAtualizada)
      }
    }
  }

  const formatarDataParaPesquisa = (data) => {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}` 
  }

  const mudarDia = (direcao) => {
    const novaData = new Date(dataAtual)
    novaData.setDate(novaData.getDate() + direcao)
    setDataAtual(novaData)
  }

  const mudarMes = (direcao) => {
    const novaData = new Date(dataAtual)
    novaData.setMonth(novaData.getMonth() + direcao)
    setDataAtual(novaData)
  }

  const horariosTrabalho = [
    '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', 
    '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', 
    '17:00', '18:00', '19:00', '20:00', '21:00'
  ]

  const diasNoMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0).getDate()
  const diasDoMesArray = Array.from({ length: diasNoMes }, (_, i) => i + 1)

  const temMarcacaoNoDia = (dia) => {
    const dataVerificar = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dia)
    const dataFormatada = formatarDataParaPesquisa(dataVerificar)
    return marcacoes.some(m => m.data === dataFormatada)
  }

  const dataAtualFormatadaString = formatarDataParaPesquisa(dataAtual)

  return (
    <div className="agenda-container">
      
      <div className="agenda-header">
        <div>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Agenda</h1>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Faça a gestão das marcações e horários.</p>
        </div>
        
        <div className="agenda-actions">
            <div className="view-toggle">
              <button className={vista === 'dia' ? 'active' : ''} onClick={() => setVista('dia')}>Dia</button>
              <button className={vista === 'mes' ? 'active' : ''} onClick={() => setVista('mes')}>Mês</button>
            </div>

            <button className="btn-nova-marcacao" onClick={() => setModalAberto(true)}>
              <Plus size={18} /> Nova Marcação
            </button>
         </div>
      </div>

      {vista === 'dia' ? (
        <div className="agenda-grid">
          <div className="date-picker-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', alignItems: 'center' }}>
            <ChevronLeft size={20} cursor="pointer" onClick={() => mudarDia(-1)} />
            <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
              {dataAtual.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <ChevronRight size={20} cursor="pointer" onClick={() => mudarDia(1)} />
          </div>

          {horariosTrabalho.map(horaSlot => {
            const prefixoHora = horaSlot.split(':')[0] 
            const marcacao = marcacoes.find(m => m.hora.startsWith(prefixoHora) && m.data === dataAtualFormatadaString)

            return (
              <div key={horaSlot} className="time-slot">
                <div className="time">{horaSlot}</div>
                
                {marcacao ? (
                  <div className="appointment booked" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="appointment-info">
                      <strong>{marcacao.nomePaciente}</strong>
                      <span>{marcacao.motivo} (às {marcacao.hora})</span>
                    </div>
                    
                    <button 
                      onClick={() => removerMarcacao(marcacao.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                      title="Cancelar marcação"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="appointment free">
                    <span style={{ color: '#94a3b8' }}>Horário Livre</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="calendar-month-grid">
          <div className="month-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
            <ChevronLeft size={20} cursor="pointer" onClick={() => mudarMes(-1)} />
            <span style={{ fontWeight: 'bold', fontSize: '18px', textTransform: 'capitalize' }}>
              {dataAtual.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
            </span>
            <ChevronRight size={20} cursor="pointer" onClick={() => mudarMes(1)} />
          </div>
          
          <div className="weekdays">
            <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
          </div>
          
          <div className="days">
            {Array.from({ length: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`vazio-${i}`} />
                ))}
            {diasDoMesArray.map((dia) => {
              const hoje = new Date();
              const isHoje = dia === hoje.getDate() && dataAtual.getMonth() === hoje.getMonth() && dataAtual.getFullYear() === hoje.getFullYear();
              
              return (
                <div key={dia} className={`day ${isHoje ? 'today' : ''}`}>
                  {dia}
                  {temMarcacaoNoDia(dia) && <div className="dot-appointment" style={{ backgroundColor: '#0d9488', width: '6px', height: '6px', borderRadius: '50%', margin: '0 auto', marginTop: '4px' }}></div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modalAberto && (
        <ModalMarcacao aoFechar={() => setModalAberto(false)} aoGuardar={adicionarNovaMarcacao} />
      )}

    </div>
  )
}

export default Agenda