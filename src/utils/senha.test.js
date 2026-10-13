import { describe, expect, it } from 'vitest'
import { mensagemErroSenha, validarNovaSenha } from './senha'

describe('validarNovaSenha', () => {
  it('aceita senha com 8+ caracteres, letras e números, igual à confirmação', () => {
    expect(validarNovaSenha('fisio2026', 'fisio2026')).toBeNull()
  })

  it.each([
    ['', '', /Digite/],
    ['abc123', 'abc123', /pelo menos 8/],
    ['somenteletras', 'somenteletras', /letras e números/],
    ['12345678', '12345678', /letras e números/],
    ['fisio2026', 'fisio2027', /não são iguais/],
  ])('rejeita "%s" / "%s"', (senha, confirmacao, mensagem) => {
    expect(validarNovaSenha(senha, confirmacao)).toMatch(mensagem)
  })
})

describe('mensagemErroSenha', () => {
  it('senha igual à anterior', () => {
    expect(mensagemErroSenha({ code: 'same_password' })).toMatch(/diferente da atual/)
    expect(mensagemErroSenha({ message: 'New password should be different from the old password.' })).toMatch(/diferente/)
  })

  it('senha fraca', () => {
    expect(mensagemErroSenha({ code: 'weak_password' })).toMatch(/fraca/)
  })

  it('link expirado', () => {
    expect(mensagemErroSenha({ message: 'Auth session missing!' })).toMatch(/expirou/)
  })

  it('qualquer outro erro', () => {
    expect(mensagemErroSenha({ message: '???' })).toMatch(/Não foi possível/)
  })
})
