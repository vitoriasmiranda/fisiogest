export const TAMANHO_MINIMO_SENHA = 8

/** Valida a nova senha. Devolve uma mensagem de erro ou null. */
export function validarNovaSenha(senha, confirmacao) {
  if (!senha) return 'Digite a nova senha.'
  if (senha.length < TAMANHO_MINIMO_SENHA) return `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`
  if (!/[a-zA-Z]/.test(senha) || !/\d/.test(senha)) return 'Use letras e números na senha.'
  if (senha !== confirmacao) return 'As senhas não são iguais.'
  return null
}

/** Traduz os erros do Supabase Auth mais comuns ao trocar a senha. */
export function mensagemErroSenha(error) {
  const codigo = error?.code ?? ''
  const texto = error?.message ?? ''
  if (codigo === 'same_password' || /different from the old/i.test(texto)) return 'A nova senha precisa ser diferente da atual.'
  if (codigo === 'weak_password' || /weak|at least/i.test(texto)) return 'Senha muito fraca. Use mais caracteres, misturando letras e números.'
  if (/session|jwt|expired/i.test(texto)) return 'O link expirou. Peça um novo em "Esqueci minha senha".'
  return 'Não foi possível alterar a senha. Tente novamente.'
}
