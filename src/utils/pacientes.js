export const ESTADOS = ['Em avaliação', 'Em tratamento', 'Em pausa', 'Alta médica']

export const LIMITE_HISTORICO = 2000
export const LIMITE_NOTA = 1000

/**
 * "Maria da Silva" -> "MS" (primeiro + último nome).
 * Antes dava "MD" e espaços duplos geravam letras vazias.
 */
export function gerarIniciais(nome) {
  const partes = String(nome ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

/** Só dígitos, espaços, +, -, ( e ), com 9 a 15 dígitos (cobre PT e BR). */
export function contactoValido(contacto) {
  const texto = String(contacto ?? '').trim()
  if (!/^[\d\s+()-]+$/.test(texto)) return false
  const digitos = texto.replace(/\D/g, '')
  return digitos.length >= 9 && digitos.length <= 15
}

/** Valida a ficha de admissão. Devolve { campo: mensagem } — vazio quando está tudo certo. */
export function validarPaciente({ nome, idade, contacto, condicao, historico = '' }) {
  const erros = {}
  if (!nome || !nome.trim()) erros.nome = 'O nome é obrigatório.'
  else if (nome.trim().length < 3) erros.nome = 'O nome é demasiado curto.'

  const idadeNum = Number(idade)
  if (idade === '' || idade === null || idade === undefined) erros.idade = 'A idade é obrigatória.'
  else if (!Number.isInteger(idadeNum) || idadeNum < 0 || idadeNum > 120) erros.idade = 'Idade inválida (0 a 120).'

  if (!contacto || !contacto.trim()) erros.contacto = 'O contacto é obrigatório.'
  else if (!contactoValido(contacto)) erros.contacto = 'Contacto inválido.'

  if (!condicao || !condicao.trim()) erros.condicao = 'O motivo da consulta é obrigatório.'

  if (historico.length > LIMITE_HISTORICO) erros.historico = `Máximo de ${LIMITE_HISTORICO} caracteres.`
  return erros
}

/** Monta o objeto que vai para a tabela `pacientes` (sem id: o Supabase gera). */
export function criarPaciente({ nome, idade, contacto, condicao, historico = '' }) {
  return {
    nome: nome.trim(),
    iniciais: gerarIniciais(nome),
    idade: Number(idade),
    contacto: contacto.trim(),
    condicao: condicao.trim(),
    historico: historico.trim(),
    estado: 'Em avaliação',
  }
}

/** Pesquisa por nome ou condição, sem diferenciar maiúsculas nem acentos ("joao" encontra "João"). */
export function filtrarPacientes(pacientes, termo) {
  const normalizar = (s) =>
    String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const t = normalizar(termo).trim()
  if (!t) return pacientes
  return pacientes.filter((p) => normalizar(p.nome).includes(t) || normalizar(p.condicao).includes(t))
}

/** Classe CSS do badge por estado (antes todos eram verdes). */
export function classeBadgeEstado(estado) {
  return (
    {
      'Em avaliação': 'badge-blue',
      'Em tratamento': 'badge-green',
      'Em pausa': 'badge-amber',
      'Alta médica': 'badge-gray',
    }[estado] ?? 'badge-gray'
  )
}
