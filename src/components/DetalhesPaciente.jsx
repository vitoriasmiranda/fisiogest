import { ArrowLeft, Phone, Calendar, FileText, Plus } from 'lucide-react'
import './DetalhesPaciente.css'

function DetalhesPaciente({ paciente, aoVoltar, aoAtualizar }) {
  if (!paciente) return null;

  return (
    <div className="detalhes-page">
      {}
      <button className="btn-voltar" onClick={aoVoltar}>
        <ArrowLeft size={16} /> Voltar aos pacientes
      </button>

      {}
      <div className="detalhes-header">
        <div className="detalhes-header-left">
          <div className="avatar large">{paciente.iniciais}</div>
          <div>
            <h2>{paciente.nome}</h2>
            <p className="subtitle">{paciente.idade} anos · {paciente.condicao}</p>
          </div>
        </div>
        <select 
          className="badge-select"
          value={paciente.estado}
          onChange={(e) => {
            const pacienteAtualizado = { ...paciente, estado: e.target.value }
            aoAtualizar(pacienteAtualizado)
          }}
        >
          <option value="Em avaliação">Em avaliação</option>
          <option value="Em tratamento">Em tratamento</option>
          <option value="Em pausa">Em pausa</option>
          <option value="Alta médica">Alta médica</option>
        </select>
      </div>

      <div className="detalhes-grid">
        {}
        <div className="detalhes-col-esq">
          <div className="card-seccao">
            <div className="card-titulo">
              <FileText size={18} color="#64748b" />
              <h3>Dados do paciente</h3>
            </div>
            <div className="dados-lista">
              <div className="dado-item">
                <Phone size={16} color="#64748b" />
                <span>{paciente.contacto}</span>
              </div>
              <div className="dado-item">
                <Calendar size={16} color="#64748b" />
                <span>Próxima sessão: {paciente.proximaSessao}</span>
              </div>
            </div>
          </div>

          <div className="card-seccao">
            <div className="card-titulo">
              <FileText size={18} color="#64748b" />
              <h3>Histórico clínico</h3>
            </div>
            <p className="texto-corrido">
              {paciente.historico ? paciente.historico : "Nenhum histórico registado na admissão."}
            </p>
          </div>
        </div>

        {}
        <div className="detalhes-col-dir">
          <div className="card-seccao altura-total">
            <h3>Notas de evolução</h3>
            
            <div className="adicionar-nota">
              <label>Adicionar nota da sessão</label>
              <textarea 
                rows="4" 
                placeholder="Descreva a evolução do paciente nesta sessão..."
              ></textarea>
              <div className="nota-footer">
                <span className="ajuda">A nota fica registada com a data de hoje.</span>
                <span className="contador">0/1000</span>
              </div>
              <button className="btn-registar-nota">
                <Plus size={16} /> Registar nota
              </button>
            </div>

            <div className="lista-notas">
              {}
              <div className="nota-item">
                <span className="nota-data">HOJE</span>
                <p>Sessão inicial concluída. Paciente apresenta boa tolerância aos exercícios base.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default DetalhesPaciente