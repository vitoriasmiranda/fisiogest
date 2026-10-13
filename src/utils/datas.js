// Funções puras de datas/horas usadas pela Agenda, Dashboard e ficha do paciente.
// Mantê-las aqui (e não dentro dos componentes) permite testá-las isoladamente.

const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

/** Date -> "AAAA-MM-DD" usando a hora LOCAL (não UTC). */
export function formatarDataISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** "AAAA-MM-DD" -> Date à meia-noite local. Evita o bug de new Date('AAAA-MM-DD') ser interpretado em UTC. */
export function parseDataISO(texto) {
  const [ano, mes, dia] = texto.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

/**
 * Normaliza a hora para "HH:MM".
 * O Supabase devolve colunas `time` como "09:00:00", mas o <input type="time"> dá "09:00".
 * Sem normalizar, a verificação de conflito de horário falha.
 */
export function normalizarHora(hora) {
  if (!hora) return ''
  const [h = '00', m = '00'] = String(hora).split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

/** "AAAA-MM-DD" -> "20 out". Formatação própria: toLocaleDateString varia entre navegadores/ambientes. */
export function formatarDataCurta(texto) {
  const data = parseDataISO(texto)
  return `${data.getDate()} ${MESES_ABREV[data.getMonth()].toLowerCase()}`
}

/** Formata a data de uma nota de evolução: "13 OUT 2026". */
export function formatarDataNota(data) {
  return `${data.getDate()} ${MESES_ABREV[data.getMonth()]} ${data.getFullYear()}`
}

/**
 * Soma/subtrai meses sem "saltar" um mês.
 * new Date(2026, 0, 31).setMonth(1) dá 3 de março — aqui fixamos no dia 1.
 */
export function somarMeses(data, quantidade) {
  return new Date(data.getFullYear(), data.getMonth() + quantidade, 1)
}

export function somarDias(data, quantidade) {
  const nova = new Date(data)
  nova.setDate(nova.getDate() + quantidade)
  return nova
}

export function diasNoMes(data) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate()
}

/** Quantas células vazias antes do dia 1 (0 = domingo). */
export function deslocamentoInicioMes(data) {
  return new Date(data.getFullYear(), data.getMonth(), 1).getDay()
}
