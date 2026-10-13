import { useCallback, useState } from 'react'
import DialogoConfirmacao from '../components/DialogoConfirmacao'

/**
 * Substituto do window.confirm que usa a janela da app.
 *
 * Uso:
 *   const [dialogo, confirmar] = useConfirmacao()
 *
 *   const apagar = async () => {
 *     const ok = await confirmar({ titulo: 'Apagar?', textoConfirmar: 'Apagar', perigoso: true })
 *     if (!ok) return
 *     ...
 *   }
 *
 *   return <>... {dialogo}</>
 */
export function useConfirmacao() {
  const [pedido, setPedido] = useState(null)

  const confirmar = useCallback(
    (opcoes) => new Promise((resolve) => setPedido({ ...opcoes, resolve })),
    [],
  )

  const responder = useCallback(
    (resposta) => {
      pedido?.resolve(resposta)
      setPedido(null)
    },
    [pedido],
  )

  const aoConfirmar = useCallback(() => responder(true), [responder])
  const aoCancelar = useCallback(() => responder(false), [responder])

  const dialogo = pedido ? (
    <DialogoConfirmacao
      titulo={pedido.titulo}
      mensagem={pedido.mensagem}
      textoConfirmar={pedido.textoConfirmar}
      textoCancelar={pedido.textoCancelar}
      perigoso={pedido.perigoso}
      aoConfirmar={aoConfirmar}
      aoCancelar={aoCancelar}
    />
  ) : null

  return [dialogo, confirmar]
}
