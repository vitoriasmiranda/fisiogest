import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import './DialogoConfirmacao.css'

function DialogoConfirmacao({
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  perigoso = false,
  aoConfirmar,
  aoCancelar,
}) {
  const botaoCancelarRef = useRef(null)

  useEffect(() => {

    botaoCancelarRef.current?.focus()
    const aoPremirTecla = (e) => {
      if (e.key === 'Escape') aoCancelar()
    }
    document.addEventListener('keydown', aoPremirTecla)
    return () => document.removeEventListener('keydown', aoPremirTecla)
  }, [aoCancelar])

  return createPortal(
    <div className="dialogo-overlay" onClick={aoCancelar}>
      <div
        className="dialogo-caixa"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-mensagem"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`dialogo-icone ${perigoso ? 'perigo' : ''}`}>
          <AlertTriangle size={22} />
        </div>
        <h2 id="dialogo-titulo">{titulo}</h2>
        {mensagem && <p id="dialogo-mensagem">{mensagem}</p>}
        <div className="dialogo-acoes">
          <button ref={botaoCancelarRef} type="button" className="dialogo-btn secundario" onClick={aoCancelar}>
            {textoCancelar}
          </button>
          <button type="button" className={`dialogo-btn ${perigoso ? 'perigo' : 'principal'}`} onClick={aoConfirmar}>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default DialogoConfirmacao
