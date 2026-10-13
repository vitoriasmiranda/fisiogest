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

/** Data e hora de uma nota de evolução: "13 OUT 2026, 14:05". Aceita Date ou texto ISO do Supabase. */
export function formatarDataHoraNota(valor) {
  const data = valor instanceof Date ? valor : new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  const hora = `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`
  return `${formatarDataNota(data)}, ${hora}`
}

/**
 * Idade em anos completos a partir de "AAAA-MM-DD".
 * Quem nasceu em 29/02 completa ano em 01/03 nos anos não bissextos.
 */
export function calcularIdade(dataNascimento, agora = new Date()) {
  if (!dataNascimento) return null
  const nascimento = parseDataISO(dataNascimento)
  if (Number.isNaN(nascimento.getTime())) return null
  let idade = agora.getFullYear() - nascimento.getFullYear()
  const aindaNaoFezAnos =
    agora.getMonth() < nascimento.getMonth() ||
    (agora.getMonth() === nascimento.getMonth() && agora.getDate() < nascimento.getDate())
  if (aindaNaoFezAnos) idade -= 1
  return idade
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
