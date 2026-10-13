import { useState } from 'react'
import { X, Lock, UserPlus, Save } from 'lucide-react'
import MensagemErro from './MensagemErro'
import { calcularIdade, formatarDataISO } from '../utils/datas'
import {
  criarPaciente,
  dadosDoFormulario,
  formularioDoPaciente,
  LIMITE_HISTORICO,
  validarPaciente,
} from '../utils/pacientes'
import './ModalPaciente.css'

const estiloErro = { color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }

function ModalPaciente({ aoFechar, aoGuardar, paciente = null }) {
  const editando = Boolean(paciente)
  const [form, setForm] = useState(() => formularioDoPaciente(paciente))
  const [erros, setErros] = useState({})
  const [aGuardar, setAGuardar] = useState(false)
  const [erroGuardar, setErroGuardar] = useState(null)
  const [hoje] = useState(() => formatarDataISO(new Date()))

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
    const erro = await aoGuardar(editando ? dadosDoFormulario(form) : criarPaciente(form))
    setAGuardar(false)
  
    if (erro) setErroGuardar(erro)
    else aoFechar()
  }

  const mostrarErro = (campo) =>
    erros[campo] ? <span role="alert" style={estiloErro}>{erros[campo]}</span> : null

  const idadeCalculada =
    form.dataNascimento && !erros.dataNascimento ? calcularIdade(form.dataNascimento) : null

  return (
    <div className="modal-overlay">
      <div className="modal-content large" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-paciente">
        <div className="modal-header">
          <div>
            <h2 id="titulo-modal-paciente">{editando ? 'Editar paciente' : 'Adicionar novo paciente'}</h2>
            <p className="modal-subtitle">
              {editando ? 'Atualize os dados do paciente.' : 'Preencha a ficha de admissão.'} Os campos marcados com{' '}
              <span className="required">*</span> são obrigatórios.
            </p>
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
              placeholder="Nome completo do paciente"
              value={form.nome}
              onChange={alterar('nome')}
              aria-invalid={!!erros.nome}
            />
            {mostrarErro('nome')}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="paciente-nascimento">Data de nascimento <span className="required">*</span></label>
              <input
                id="paciente-nascimento"
                type="date"
                max={hoje}
                value={form.dataNascimento}
                onChange={alterar('dataNascimento')}
                aria-invalid={!!erros.dataNascimento}
              />
              {erros.dataNascimento ? (
                mostrarErro('dataNascimento')
              ) : (
                <span className="helper-text">
                  {idadeCalculada !== null ? `${idadeCalculada} ${idadeCalculada === 1 ? 'ano' : 'anos'}` : 'A idade é calculada automaticamente.'}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="paciente-contato">Telefone <span className="required">*</span></label>
              <input
                id="paciente-contato"
                type="tel"
                placeholder="(31) 99999-9999"
                value={form.contato}
                onChange={alterar('contato')}
                aria-invalid={!!erros.contato}
              />
              {erros.contato ? mostrarErro('contato') : <span className="helper-text">Usado para os lembretes das sessões.</span>}
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
              placeholder="Adicione observações clínicas relevantes..."
              value={form.historico}
              onChange={alterar('historico')}
            ></textarea>
            <div className="textarea-footer">
              <span className="helper-text">Inclua doenças anteriores, cirurgias, medicamentos em uso e alergias.</span>
              <span className="char-count">{form.historico.length} / {LIMITE_HISTORICO}</span>
            </div>
          </div>

          <div className="modal-footer-extended">
            <div className="privacy-notice">
              <Lock size={14} color="#64748b" />
              <span>Os dados clínicos são usados apenas pela equipe da clínica.</span>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancelar" onClick={aoFechar}>Cancelar</button>
              <button type="submit" className="btn-guardar" disabled={aGuardar}>
                {editando ? <Save size={18} /> : <UserPlus size={18} />}
                {aGuardar ? 'Salvando...' : editando ? 'Salvar alterações' : 'Salvar paciente'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalPaciente
