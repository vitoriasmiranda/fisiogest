import { calcularIdade, formatarDataISO } from './datas'

export const ESTADOS = ['Em avaliação', 'Em tratamento', 'Em pausa', 'Alta médica']

export const LIMITE_HISTORICO = 2000
export const LIMITE_NOTA = 1000


export function gerarIniciais(nome) {
  const partes = String(nome ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function contatoValido(contato) {
  const texto = String(contato ?? '').trim()
  if (!/^[\d\s+()-]+$/.test(texto)) return false
  const digitos = texto.replace(/\D/g, '')
  return digitos.length >= 9 && digitos.length <= 15
}


export function idadeDoPaciente(paciente, agora = new Date()) {
  if (paciente?.data_nascimento) return calcularIdade(paciente.data_nascimento, agora)
  const antiga = Number(paciente?.idade)
  return paciente?.idade !== null && paciente?.idade !== undefined && paciente?.idade !== '' && Number.isFinite(antiga)
    ? antiga
    : null
}


export function descreverIdade(paciente, agora = new Date()) {
  const idade = idadeDoPaciente(paciente, agora)
  if (idade === null) return 'Idade não informada'
  return idade === 1 ? '1 ano' : `${idade} anos`
}

export function validarPaciente({ nome, dataNascimento, contato, condicao, historico = '' }, agora = new Date()) {
  const erros = {}
  if (!nome || !nome.trim()) erros.nome = 'O nome é obrigatório.'
  else if (nome.trim().length < 3) erros.nome = 'O nome está muito curto.'

  if (!dataNascimento) erros.dataNascimento = 'A data de nascimento é obrigatória.'
  else if (dataNascimento > formatarDataISO(agora)) erros.dataNascimento = 'A data de nascimento não pode ser no futuro.'
  else if (calcularIdade(dataNascimento, agora) > 120) erros.dataNascimento = 'Data de nascimento inválida.'

  if (!contato || !contato.trim()) erros.contato = 'O telefone é obrigatório.'
  else if (!contatoValido(contato)) erros.contato = 'Telefone inválido.'

  if (!condicao || !condicao.trim()) erros.condicao = 'O motivo da consulta é obrigatório.'

  if (historico.length > LIMITE_HISTORICO) erros.historico = `Máximo de ${LIMITE_HISTORICO} caracteres.`
  return erros
}

export function dadosDoFormulario({ nome, dataNascimento, contato, condicao, historico = '' }) {
  return {
    nome: nome.trim(),
    iniciais: gerarIniciais(nome),
    data_nascimento: dataNascimento,
    contacto: contato.trim(),
    condicao: condicao.trim(),
    historico: historico.trim(),
  }
}

export function criarPaciente(form) {
  return { ...dadosDoFormulario(form), estado: 'Em avaliação' }
}

export function formularioDoPaciente(paciente) {
  return {
    nome: paciente?.nome ?? '',
    dataNascimento: paciente?.data_nascimento ?? '',
    contato: paciente?.contacto ?? '',
    condicao: paciente?.condicao ?? '',
    historico: paciente?.historico ?? '',
  }
}

export function filtrarPacientes(pacientes, termo) {
  const normalizar = (s) =>
    String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const t = normalizar(termo).trim()
  if (!t) return pacientes
  return pacientes.filter((p) => normalizar(p.nome).includes(t) || normalizar(p.condicao).includes(t))
}

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
