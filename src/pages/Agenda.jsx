import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import ModalMarcacao from '../components/ModalMarcacao'
import MensagemErro from '../components/MensagemErro'
import { useConfirmacao } from '../hooks/useConfirmacao'
import {
  deslocamentoInicioMes,
  diasNoMes,
  formatarDataISO,
  normalizarHora,
  somarDias,
  somarMeses,
} from '../utils/datas'
import {
  existeConflito,
  marcacoesForaDoHorario,
  marcacoesNoBloco,
  temMarcacaoNaData,
} from '../utils/marcacoes'
import './Agenda.css'

const HORARIOS_TRABALHO = [
  '05:00', '06:00', '07:00', '08:00', '09:00', '10:00',
  '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00', '21:00',
]

const estiloBotaoIcone = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }

function CartaoMarcacao({ marcacao, aoRemover }) {
  return (
    <div className="appointment booked" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="appointment-info">
        <strong>{marcacao.nomePaciente}</strong>
        <span>{marcacao.motivo} (às {normalizarHora(marcacao.hora)})</span>
      </div>
      <button
        onClick={() => aoRemover(marcacao.id)}
        style={{ ...estiloBotaoIcone, color: '#ef4444', padding: '8px' }}
        title="Cancelar marcação"
        aria-label={`Cancelar marcação de ${marcacao.nomePaciente} às ${normalizarHora(marcacao.hora)}`}
      >
        <Trash2 size={18} />
      </button>
    </div>
  )
}

function Agenda() {
  const [vista, setVista] = useState('dia')
  const [modalAberto, setModalAberto] = useState(false)
  const [dataAtual, setDataAtual] = useState(() => new Date())
  const [hoje] = useState(() => new Date())
  const [marcacoes, setMarcacoes] = useState([])
  const [erro, setErro] = useState(null)
  const [dialogo, confirmar] = useConfirmacao()

  useEffect(() => {
    let ativo = true
    const carregarMarcacoes = async () => {
      const { data, error } = await supabase.from('marcacoes').select('*')
      if (!ativo) return
      if (error) {
        console.error('Erro a buscar marcações:', error)
        setErro('Não foi possível carregar as marcações. Verifique a ligação.')
      }
      else setMarcacoes(data ?? [])
    }
    carregarMarcacoes()
    return () => { ativo = false }
  }, [])

  /** Devolve uma mensagem de erro para o modal, ou null se correu bem. */
  const adicionarNovaMarcacao = async (novaMarcacao) => {
    if (existeConflito(marcacoes, novaMarcacao)) {
      return 'Horário indisponível! Já existe uma consulta marcada para este dia e hora.'
    }

    const { data, error } = await supabase.from('marcacoes').insert([novaMarcacao]).select()

    if (error) {
      console.error('Erro ao guardar marcação:', error)
      // 23505 = unique_violation (se criar a restrição UNIQUE(data, hora) no Supabase)
      if (error.code === '23505') return 'Horário indisponível! Outra pessoa acabou de marcar este horário.'
      return 'Houve um erro ao guardar na nuvem!'
    }
    setMarcacoes((atuais) => [...atuais, data[0]])
    setDataAtual(new Date(`${novaMarcacao.data}T00:00`))
    setModalAberto(false)
    return null
  }

  const removerMarcacao = async (idParaRemover) => {
    const marcacao = marcacoes.find((m) => m.id === idParaRemover)
    const ok = await confirmar({
      titulo: 'Cancelar marcação?',
      mensagem: marcacao
        ? `A sessão de ${marcacao.nomePaciente} às ${normalizarHora(marcacao.hora)} vai ser removida da agenda.`
        : 'Esta marcação vai ser removida da agenda.',
      textoConfirmar: 'Cancelar marcação',
      textoCancelar: 'Manter',
      perigoso: true,
    })
    if (!ok) return

    const { error } = await supabase.from('marcacoes').delete().eq('id', idParaRemover)

    if (error) {
      console.error('Erro ao remover:', error)
      setErro('Não foi possível cancelar a marcação. Tente novamente.')
      return
    }
    setErro(null)
    setMarcacoes((atuais) => atuais.filter((m) => m.id !== idParaRemover))
  }

  const abrirDia = (dia) => {
    setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dia))
    setVista('dia')
  }

  const dataISO = formatarDataISO(dataAtual)
  const foraDoHorario = marcacoesForaDoHorario(marcacoes, dataISO, HORARIOS_TRABALHO)
  const totalDias = diasNoMes(dataAtual)

  return (
    <div className="agenda-container">

      <div className="agenda-header">
        <div>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Agenda</h1>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Faça a gestão das marcações e horários.</p>
        </div>

        <div className="agenda-actions">
          <div className="view-toggle" role="group" aria-label="Vista da agenda">
            <button className={vista === 'dia' ? 'active' : ''} aria-pressed={vista === 'dia'} onClick={() => setVista('dia')}>Dia</button>
            <button className={vista === 'mes' ? 'active' : ''} aria-pressed={vista === 'mes'} onClick={() => setVista('mes')}>Mês</button>
          </div>

          <button className="btn-nova-marcacao" onClick={() => setModalAberto(true)}>
            <Plus size={18} /> Nova Marcação
          </button>
        </div>
      </div>

      <MensagemErro mensagem={erro} aoFechar={() => setErro(null)} />

      {vista === 'dia' ? (
        <div className="agenda-grid">
          <div className="date-picker-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', alignItems: 'center' }}>
            <button style={estiloBotaoIcone} onClick={() => setDataAtual(somarDias(dataAtual, -1))} aria-label="Dia anterior"><ChevronLeft size={20} /></button>
            <span data-testid="titulo-dia" style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
              {dataAtual.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <button style={estiloBotaoIcone} onClick={() => setDataAtual(somarDias(dataAtual, 1))} aria-label="Dia seguinte"><ChevronRight size={20} /></button>
          </div>

          {HORARIOS_TRABALHO.map((horaSlot) => {
            const doBloco = marcacoesNoBloco(marcacoes, dataISO, horaSlot)
            return (
              <div key={horaSlot} className="time-slot">
                <div className="time">{horaSlot}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {doBloco.length > 0 ? (
                    doBloco.map((m) => <CartaoMarcacao key={m.id} marcacao={m} aoRemover={removerMarcacao} />)
                  ) : (
                    <div className="appointment free">
                      <span style={{ color: '#94a3b8' }}>Horário Livre</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {foraDoHorario.length > 0 && (
            <div className="time-slot">
              <div className="time">Outros</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {foraDoHorario.map((m) => <CartaoMarcacao key={m.id} marcacao={m} aoRemover={removerMarcacao} />)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="calendar-month-grid">
          <div className="month-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
            <button style={estiloBotaoIcone} onClick={() => setDataAtual(somarMeses(dataAtual, -1))} aria-label="Mês anterior"><ChevronLeft size={20} /></button>
            <span data-testid="titulo-mes" style={{ fontWeight: 'bold', fontSize: '18px', textTransform: 'capitalize' }}>
              {dataAtual.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
            </span>
            <button style={estiloBotaoIcone} onClick={() => setDataAtual(somarMeses(dataAtual, 1))} aria-label="Mês seguinte"><ChevronRight size={20} /></button>
          </div>

          <div className="weekdays">
            <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
          </div>

          <div className="days">
            {Array.from({ length: deslocamentoInicioMes(dataAtual) }).map((_, i) => (
              <div key={`vazio-${i}`} />
            ))}
            {Array.from({ length: totalDias }, (_, i) => i + 1).map((dia) => {
              const diaISO = formatarDataISO(new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dia))
              const isHoje = diaISO === formatarDataISO(hoje)
              const temMarcacao = temMarcacaoNaData(marcacoes, diaISO)

              return (
                <div
                  key={dia}
                  className={`day ${isHoje ? 'today' : ''}`}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => abrirDia(dia)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && abrirDia(dia)}
                  aria-label={`Dia ${dia}${temMarcacao ? ', com marcações' : ''}`}
                >
                  {dia}
                  {temMarcacao && <div className="dot-appointment" style={{ backgroundColor: '#0d9488', width: '6px', height: '6px', borderRadius: '50%', margin: '0 auto', marginTop: '4px' }}></div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modalAberto && (
        <ModalMarcacao
          aoFechar={() => setModalAberto(false)}
          aoGuardar={adicionarNovaMarcacao}
          dataInicial={dataISO >= formatarDataISO(hoje) ? dataISO : ''}
        />
      )}

      {dialogo}
    </div>
  )
}

export default Agenda
