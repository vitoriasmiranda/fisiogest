import { useState } from 'react'
import { X, Lock, UserPlus } from 'lucide-react'
import './ModalPaciente.css'

function ModalPaciente({ aoFechar, aoGuardar }) {
  const [nome, setNome] = useState('')
  const [idade, setIdade] = useState('')
  const [contato, setContato] = useState('')
  const [condicao, setCondicao] = useState('')
  const [historico, setHistorico] = useState('')

  const lidarComGuarda = () => {
    if (!nome || !idade || !contato || !condicao) {
      alert("Por favor, preencha todos os campos obrigatórios (*).")
      return
    }

    const iniciais = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

    const novoPaciente = {
      id: Date.now(), 
      iniciais: iniciais,
      nome: nome,
      idade: idade,
      condicao: condicao,
      proximaSessao: 'Por agendar',
      contacto: contato,
      estado: 'Em avaliação',
      historico: historico
    }

    aoGuardar(novoPaciente)
    aoFechar()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <div>
            <h2>Adicionar Novo Paciente</h2>
            <p className="modal-subtitle">Preencha a ficha de admissão. Os campos assinalados com <span className="required">*</span> são obrigatórios.</p>
          </div>
          <button className="btn-fechar" onClick={aoFechar}><X size={24} /></button>
        </div>

        <form className="modal-form">
          <div className="form-group">
            <label>Nome <span className="required">*</span></label>
            <input 
              type="text" 
              placeholder="Introduza o nome completo do paciente" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Idade <span className="required">*</span></label>
              <input 
                type="number" 
                placeholder="Anos" 
                value={idade} 
                onChange={(e) => setIdade(e.target.value)} 
              />
              <span className="helper-text">Anos completados.</span>
            </div>

            <div className="form-group">
              <label>Contato telefónico <span className="required">*</span></label>
              <input 
                type="text" 
                placeholder="Número de telefone ou telemóvel" 
                value={contato} 
                onChange={(e) => setContato(e.target.value)} 
              />
              <span className="helper-text">Usado para os lembretes das sessões.</span>
            </div>
          </div>

          <div className="form-group">
            <label>Motivo da consulta <span className="required">*</span></label>
            <input 
              type="text" 
              placeholder="Condição clínica ou diagnóstico principal" 
              value={condicao} 
              onChange={(e) => setCondicao(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>Histórico clínico</label>
            <textarea 
              rows="4" 
              placeholder="Adicione notas clínicas ou observações relevantes..." 
              value={historico} 
              onChange={(e) => setHistorico(e.target.value)}
            ></textarea>
            <div className="textarea-footer">
              <span className="helper-text">Inclua doenças anteriores, cirurgias, medicação atual e alergias.</span>
              <span className="char-count">{historico.length} / 2000</span>
            </div>
          </div>

          <div className="modal-footer-extended">
            <div className="privacy-notice">
              <Lock size={14} color="#64748b" />
              <span>Os dados clínicos são usados apenas pela equipa da clínica.</span>
            </div>
            
            <div className="modal-actions">
              <button type="button" className="btn-cancelar" onClick={aoFechar}>Cancelar</button>
              <button type="button" className="btn-guardar" onClick={lidarComGuarda}>
                <UserPlus size={18} />
                Guardar paciente
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalPaciente