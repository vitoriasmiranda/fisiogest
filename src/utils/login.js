export const MENSAGEM_CREDENCIAIS = 'E-mail ou senha incorretos. Verifique e tente novamente.'
export const MENSAGEM_CONEXAO =
  'Não foi possível conectar ao sistema. Tente novamente em alguns minutos. Se continuar, fale com a Vitória.'
export const MENSAGEM_MUITAS_TENTATIVAS = 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'

/**
 * Traduz o erro do login do Supabase para uma mensagem clara.
 * Só diz "senha incorreta" quando o Supabase confirmou isso. Qualquer outro problema
 * (sem internet, servidor fora do ar, projeto pausado) vira uma mensagem de conexão.
 */
export function mensagemErroLogin(error) {
  if (!error) return null
  const codigo = error.code ?? ''
  const texto = error.message ?? ''
  const status = error.status ?? 0

  if (codigo === 'invalid_credentials' || /invalid login credentials/i.test(texto)) return MENSAGEM_CREDENCIAIS
  if (codigo === 'over_request_rate_limit' || status === 429 || /rate limit/i.test(texto)) return MENSAGEM_MUITAS_TENTATIVAS
  return MENSAGEM_CONEXAO
}
