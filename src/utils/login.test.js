import { describe, expect, it } from 'vitest'
import { MENSAGEM_CONEXAO, MENSAGEM_CREDENCIAIS, MENSAGEM_MUITAS_TENTATIVAS, mensagemErroLogin } from './login'

describe('mensagemErroLogin', () => {
  it('sem erro devolve null', () => {
    expect(mensagemErroLogin(null)).toBeNull()
  })

  it('credenciais inválidas (pelo código ou pela mensagem)', () => {
    expect(mensagemErroLogin({ code: 'invalid_credentials' })).toBe(MENSAGEM_CREDENCIAIS)
    expect(mensagemErroLogin({ message: 'Invalid login credentials' })).toBe(MENSAGEM_CREDENCIAIS)
  })

  it('muitas tentativas', () => {
    expect(mensagemErroLogin({ status: 429 })).toBe(MENSAGEM_MUITAS_TENTATIVAS)
    expect(mensagemErroLogin({ code: 'over_request_rate_limit' })).toBe(MENSAGEM_MUITAS_TENTATIVAS)
  })

  it.each([
    [{ name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 }],
    [{ status: 503, message: 'Service Unavailable' }],
    [{ status: 540, message: 'Project paused' }],
    [new TypeError('Failed to fetch')],
    [{}],
  ])('qualquer outro problema é tratado como conexão: %o', (erro) => {
    expect(mensagemErroLogin(erro)).toBe(MENSAGEM_CONEXAO)
  })
})
