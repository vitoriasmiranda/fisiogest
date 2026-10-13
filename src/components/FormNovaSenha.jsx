import { useState } from 'react'
import { supabase } from '../supabase'
import MensagemErro from './MensagemErro'
import { mensagemErroSenha, TAMANHO_MINIMO_SENHA, validarNovaSenha } from '../utils/senha'
import './Login.css'
import './FormNovaSenha.css'

function FormNovaSenha({ textoBotao = 'Salvar nova senha', aoConcluir }) {
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const salvar = async (e) => {
    e.preventDefault()
    setSucesso(false)
    const mensagem = validarNovaSenha(senha, confirmacao)
    if (mensagem) {
      setErro(mensagem)
      return
    }

    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)

    if (error) {
      console.error('Erro ao alterar senha:', error)
      setErro(mensagemErroSenha(error))
      return
    }
    setErro(null)
    setSenha('')
    setConfirmacao('')
    setSucesso(true)
    aoConcluir?.()
  }

  return (
    <form className="form-nova-senha" onSubmit={salvar} noValidate>
      <MensagemErro mensagem={erro} />
      {sucesso && (
        <p className="mensagem-sucesso" role="status">Senha alterada com sucesso.</p>
      )}

      <div className="form-group">
        <label htmlFor="nova-senha">Nova senha</label>
        <input
          id="nova-senha"
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <span className="helper-text">Pelo menos {TAMANHO_MINIMO_SENHA} caracteres, com letras e números.</span>
      </div>

      <div className="form-group">
        <label htmlFor="confirmar-senha">Confirmar nova senha</label>
        <input
          id="confirmar-senha"
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-login" disabled={salvando}>
        {salvando ? 'Salvando...' : textoBotao}
      </button>
    </form>
  )
}

export default FormNovaSenha
