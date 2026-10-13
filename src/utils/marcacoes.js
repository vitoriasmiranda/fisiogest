import { formatarDataCurta, formatarDataISO, normalizarHora } from './datas'

export function existeConflito(marcacoes, nova, idIgnorar = null) {
  const hora = normalizarHora(nova.hora)
  return marcacoes.some(
    (m) => m.id !== idIgnorar && m.data === nova.data && normalizarHora(m.hora) === hora,
  )
}

export function marcacoesDoDia(marcacoes, dataISO) {
  return marcacoes
    .filter((m) => m.data === dataISO)
    .sort((a, b) => normalizarHora(a.hora).localeCompare(normalizarHora(b.hora)))
}

export function marcacoesNoBloco(marcacoes, dataISO, horaBloco) {
  const prefixo = normalizarHora(horaBloco).slice(0, 2)
  return marcacoesDoDia(marcacoes, dataISO).filter((m) => normalizarHora(m.hora).startsWith(prefixo))
}

export function marcacoesForaDoHorario(marcacoes, dataISO, blocos) {
  const prefixos = new Set(blocos.map((b) => normalizarHora(b).slice(0, 2)))
  return marcacoesDoDia(marcacoes, dataISO).filter((m) => !prefixos.has(normalizarHora(m.hora).slice(0, 2)))
}

export function temMarcacaoNaData(marcacoes, dataISO) {
  return marcacoes.some((m) => m.data === dataISO)
}

export function contarMarcacoesNaData(marcacoes, dataISO) {
  return marcacoes.filter((m) => m.data === dataISO).length
}

export function obterProximaMarcacao(marcacoes, pacienteId, agora = new Date()) {
  const hojeISO = formatarDataISO(agora)
  const futuras = marcacoes
    .filter((m) => String(m.pacienteId) === String(pacienteId) && m.data >= hojeISO)
    .sort((a, b) =>
      a.data === b.data
        ? normalizarHora(a.hora).localeCompare(normalizarHora(b.hora))
        : a.data.localeCompare(b.data),
    )
  return futuras[0] ?? null
}

export function descreverProximaSessao(marcacao, agora = new Date()) {
  if (!marcacao) return 'Por agendar'
  const hora = normalizarHora(marcacao.hora)
  if (marcacao.data === formatarDataISO(agora)) return `Hoje, ${hora}`
  return `${formatarDataCurta(marcacao.data)}, ${hora}`
}

export function validarMarcacao({ pacienteId, data, hora, motivo }, agora = new Date(), dataOriginal = null) {
  if (!pacienteId) return 'Selecione um paciente.'
  if (!data) return 'Informe a data da sessão.'
  if (!hora) return 'Informe o horário da sessão.'
  if (!motivo || !motivo.trim()) return 'Informe o motivo da sessão.'
  if (data < formatarDataISO(agora) && data !== dataOriginal) return 'Não é possível agendar sessões no passado.'
  return null
}
