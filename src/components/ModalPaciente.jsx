import { useState } from 'react'
import { X, Lock, UserPlus } from 'lucide-react'
import MensagemErro from './MensagemErro'
import { criarPaciente, LIMITE_HISTORICO, validarPaciente } from '../utils/pacientes'
import './ModalPaciente.css'

const estiloErro = { color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }

function ModalPaciente({ aoFechar, aoGuardar }) {
  const [form, setForm] = useState({ nome: '', idade: '', contacto: '', condicao: '', historico: '' })
  const [erros, setErros] = useState({})
  const [aGuardar, setAGuardar] = useState(false)
  const [erroGuardar, setErroGuardar] = useState(null)

  const alterar = (campo) => (e) => {
    setForm((atual) => ({ ...atual, [campo]: e.target.value }))
    if (erros[campo]) setErros((atuais) => ({ ...atuais, [campo]: undefined }))
  }

  const lidarComGuarda = async (e) => {
    e.preventDefault()
    const novosErros = validarPaciente(form)
    setErros(novosErros)
    if (Object.keys(novosErros).length > 0) return

    setAGuardar(true)
    setErroGuardar(null)
    const erro = await aoGuardar(criarPaciente(form))
    setAGuardar(false)
    // Só fecha quando o Supabase confirmou — se falhar, os dados escritos não se perdem.
    if (erro) setErroGuardar(erro)
    else aoFechar()
  }

  const mostrarErro = (campo) =>
    erros[campo] ? <span role="alert" style={estiloErro}>{erros[campo]}</span> : null

  return (
    <div className="modal-overlay">
      <div className="modal-content large" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-paciente">
        <div className="modal-header">
          <div>
            <h2 id="titulo-modal-paciente">Adicionar Novo Paciente</h2>
            <p className="modal-subtitle">Preencha a ficha de admissão. Os campos assinalados com <span className="required">*</span> são obrigatórios.</p>
          </div>
          <button className="btn-fechar" onClick={aoFechar} aria-label="Fechar"><X size={24} /></button>
        </div>

        <form className="modal-form" onSubmit={lidarComGuarda} noValidate>
          <MensagemErro mensagem={erroGuardar} />
          <div className="form-group">
            <label htmlFor="paciente-nome">Nome <span className="required">*</span></label>
            <input
              id="paciente-nome"
              type="text"
              placeholder="Introduza o nome completo do paciente"
              value={form.nome}
              onChange={alterar('nome')}
              aria-invalid={!!erros.nome}
            />
            {mostrarErro('nome')}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="paciente-idade">Idade <span className="required">*</span></label>
              <input
                id="paciente-idade"
                type="number"
                min="0"
                max="120"
                placeholder="Anos"
                value={form.idade}
                onChange={alterar('idade')}
                aria-invalid={!!erros.idade}
              />
              {erros.idade ? mostrarErro('idade') : <span className="helper-text">Anos completados.</span>}
            </div>

            <div className="form-group">
              <label htmlFor="paciente-contacto">Contato telefónico <span className="required">*</span></label>
              <input
                id="paciente-contacto"
                type="tel"
                placeholder="Número de telefone ou telemóvel"
                value={form.contacto}
                onChange={alterar('contacto')}
                aria-invalid={!!erros.contacto}
              />
              {erros.contacto ? mostrarErro('contacto') : <span className="helper-text">Usado para os lembretes das sessões.</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="paciente-condicao">Motivo da consulta <span className="required">*</span></label>
            <input
              id="paciente-condicao"
              type="text"
              placeholder="Condição clínica ou diagnóstico principal"
              value={form.condicao}
              onChange={alterar('condicao')}
              aria-invalid={!!erros.condicao}
            />
            {mostrarErro('condicao')}
          </div>

          <div className="form-group">
            <label htmlFor="paciente-historico">Histórico clínico</label>
            <textarea
              id="paciente-historico"
              rows="4"
              maxLength={LIMITE_HISTORICO}
              placeholder="Adicione notas clínicas ou observações relevantes..."
              value={form.historico}
              onChange={alterar('historico')}
            ></textarea>
            <div className="textarea-footer">
              <span className="helper-text">Inclua doenças anteriores, cirurgias, medicação atual e alergias.</span>
              <span className="char-count">{form.historico.length} / {LIMITE_HISTORICO}</span>
            </div>
          </div>

          <div className="modal-footer-extended">
            <div className="privacy-notice">
              <Lock size={14} color="#64748b" />
              <span>Os dados clínicos são usados apenas pela equipa da clínica.</span>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancelar" onClick={aoFechar}>Cancelar</button>
              <button type="submit" className="btn-guardar" disabled={aGuardar}>
                <UserPlus size={18} />
                {aGuardar ? 'A guardar...' : 'Guardar paciente'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalPaciente
