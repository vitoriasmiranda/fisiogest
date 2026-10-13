import { AlertCircle, X } from 'lucide-react'
import './DialogoConfirmacao.css'

/** Aviso de erro dentro da página (substitui o alert do navegador). Não mostra nada sem mensagem. */
function MensagemErro({ mensagem, aoFechar }) {
  if (!mensagem) return null
  return (
    <div className="mensagem-erro" role="alert">
      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{mensagem}</span>
      {aoFechar && (
        <button type="button" onClick={aoFechar} aria-label="Fechar aviso">
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export default MensagemErro
