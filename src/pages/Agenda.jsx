import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
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

function CartaoMarcacao({ marcacao, aoEditar, aoRemover }) {
  const descricao = `${marcacao.nomePaciente} às ${normalizarHora(marcacao.hora)}`
  return (
    <div className="appointment booked" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="appointment-info">
        <strong>{marcacao.nomePaciente}</strong>
        <span>{marcacao.motivo} (às {normalizarHora(marcacao.hora)})</span>
      </div>
      <div style={{ display: 'flex' }}>
        <button
          onClick={() => aoEditar(marcacao)}
          style={{ ...estiloBotaoIcone, color: '#64748b', padding: '8px' }}
          title="Editar agendamento"
          aria-label={`Editar agendamento de ${descricao}`}
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={() => aoRemover(marcacao.id)}
          style={{ ...estiloBotaoIcone, color: '#ef4444', padding: '8px' }}
          title="Cancelar agendamento"
          aria-label={`Cancelar agendamento de ${descricao}`}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}

function Agenda() {
  const [vista, setVista] = useState('dia')
  const [modalAberto, setModalAberto] = useState(false)
  const [marcacaoEditando, setMarcacaoEditando] = useState(null)
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
        console.error('Erro ao buscar agendamentos:', error)
        setErro('Não foi possível carregar os agendamentos. Verifique sua conexão.')
      }
      else setMarcacoes(data ?? [])
    }
    carregarMarcacoes()
    return () => { ativo = false }
  }, [])

  const abrirNovo = () => {
    setMarcacaoEditando(null)
    setModalAberto(true)
  }

  const abrirEdicao = (marcacao) => {
    setMarcacaoEditando(marcacao)
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setMarcacaoEditando(null)
  }

  /** Cria ou atualiza. Devolve uma mensagem de erro para o modal, ou null se deu certo. */
  const guardarMarcacao = async (dados) => {
    const idEditando = marcacaoEditando?.id ?? null
    if (existeConflito(marcacoes, dados, idEditando)) {
      return 'Horário indisponível! Já existe uma consulta agendada para este dia e horário.'
    }

    const consulta = idEditando
      ? supabase.from('marcacoes').update(dados).eq('id', idEditando).select()
      : supabase.from('marcacoes').insert([dados]).select()
    const { data, error } = await consulta

    if (error) {
      console.error('Erro ao salvar agendamento:', error)
      // 23505 = unique_violation da restrição UNIQUE(data, hora) no Supabase
      if (error.code === '23505') return 'Horário indisponível! Outra pessoa acabou de agendar este horário.'
      return 'Não foi possível salvar o agendamento. Tente novamente.'
    }
    const salva = data?.[0] ?? { ...marcacaoEditando, ...dados }
    setMarcacoes((atuais) => (idEditando ? atuais.map((m) => (m.id === idEditando ? salva : m)) : [...atuais, salva]))
    setDataAtual(new Date(`${dados.data}T00:00`))
    fecharModal()
    return null
  }

  const removerMarcacao = async (idParaRemover) => {
    const marcacao = marcacoes.find((m) => m.id === idParaRemover)
    const ok = await confirmar({
      titulo: 'Cancelar agendamento?',
      mensagem: marcacao
        ? `A sessão de ${marcacao.nomePaciente} às ${normalizarHora(marcacao.hora)} será removida da agenda.`
        : 'Este agendamento será removido da agenda.',
      textoConfirmar: 'Cancelar agendamento',
      textoCancelar: 'Manter',
      perigoso: true,
    })
    if (!ok) return

    const { error } = await supabase.from('marcacoes').delete().eq('id', idParaRemover)

    if (error) {
      console.error('Erro ao remover:', error)
      setErro('Não foi possível cancelar o agendamento. Tente novamente.')
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
          <p style={{ color: '#64748b', marginTop: '5px' }}>Gerencie os agendamentos e horários.</p>
        </div>

        <div className="agenda-actions">
          <div className="view-toggle" role="group" aria-label="Vista da agenda">
            <button className={vista === 'dia' ? 'active' : ''} aria-pressed={vista === 'dia'} onClick={() => setVista('dia')}>Dia</button>
            <button className={vista === 'mes' ? 'active' : ''} aria-pressed={vista === 'mes'} onClick={() => setVista('mes')}>Mês</button>
          </div>

          <button className="btn-nova-marcacao" onClick={abrirNovo}>
            <Plus size={18} /> Novo agendamento
          </button>
        </div>
      </div>

      <MensagemErro mensagem={erro} aoFechar={() => setErro(null)} />

      {vista === 'dia' ? (
        <div className="agenda-grid">
          <div className="date-picker-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', alignItems: 'center' }}>
            <button style={estiloBotaoIcone} onClick={() => setDataAtual(somarDias(dataAtual, -1))} aria-label="Dia anterior"><ChevronLeft size={20} /></button>
            <span data-testid="titulo-dia" style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
              {dataAtual.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
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
                    doBloco.map((m) => <CartaoMarcacao key={m.id} marcacao={m} aoEditar={abrirEdicao} aoRemover={removerMarcacao} />)
                  ) : (
                    <div className="appointment free">
                      <span style={{ color: '#94a3b8' }}>Horário livre</span>
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
                {foraDoHorario.map((m) => <CartaoMarcacao key={m.id} marcacao={m} aoEditar={abrirEdicao} aoRemover={removerMarcacao} />)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="calendar-month-grid">
          <div className="month-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
            <button style={estiloBotaoIcone} onClick={() => setDataAtual(somarMeses(dataAtual, -1))} aria-label="Mês anterior"><ChevronLeft size={20} /></button>
            <span data-testid="titulo-mes" style={{ fontWeight: 'bold', fontSize: '18px', textTransform: 'capitalize' }}>
              {dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
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
                  aria-label={`Dia ${dia}${temMarcacao ? ', com agendamentos' : ''}`}
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
          key={marcacaoEditando?.id ?? 'novo'}
          marcacao={marcacaoEditando}
          aoFechar={fecharModal}
          aoGuardar={guardarMarcacao}
          dataInicial={dataISO >= formatarDataISO(hoje) ? dataISO : ''}
        />
      )}

      {dialogo}
    </div>
  )
}

export default Agenda
