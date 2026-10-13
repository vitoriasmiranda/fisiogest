import { Activity } from 'lucide-react'
import FormNovaSenha from './FormNovaSenha'
import './Login.css'

/** Tela mostrada quando a pessoa chega pelo link de "Esqueci minha senha". */
function RedefinirSenha({ aoConcluir }) {
  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <Activity size={40} color="#0d9488" />
          <h1>FisioGest</h1>
          <p>Crie uma nova senha</p>
        </div>
        <FormNovaSenha textoBotao="Salvar e entrar" aoConcluir={aoConcluir} />
      </div>
    </div>
  )
}

export default RedefinirSenha
