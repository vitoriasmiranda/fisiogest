
const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

export function formatarDataISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}


export function parseDataISO(texto) {
  const [ano, mes, dia] = texto.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}


export function normalizarHora(hora) {
  if (!hora) return ''
  const [h = '00', m = '00'] = String(hora).split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

export function formatarDataCurta(texto) {
  const data = parseDataISO(texto)
  return `${data.getDate()} ${MESES_ABREV[data.getMonth()].toLowerCase()}`
}

export function formatarDataNota(data) {
  return `${data.getDate()} ${MESES_ABREV[data.getMonth()]} ${data.getFullYear()}`
}

export function formatarDataHoraNota(valor) {
  const data = valor instanceof Date ? valor : new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  const hora = `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`
  return `${formatarDataNota(data)}, ${hora}`
}

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

export function deslocamentoInicioMes(data) {
  return new Date(data.getFullYear(), data.getMonth(), 1).getDay()
}
