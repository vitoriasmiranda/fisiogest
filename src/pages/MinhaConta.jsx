import { UserCircle } from 'lucide-react'
import FormNovaSenha from '../components/FormNovaSenha'

function MinhaConta({ email }) {
  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ margin: 0, color: '#0f172a' }}>Minha conta</h1>
      <p style={{ color: '#64748b', marginTop: '5px' }}>Dados de acesso ao FisioGest.</p>

      <div
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 24,
          marginTop: 24,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <UserCircle size={36} color="#0d9488" />
        <div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Conectado como</div>
          <strong style={{ color: '#0f172a', wordBreak: 'break-all' }}>{email}</strong>
        </div>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 24,
          marginTop: 16,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h2 style={{ fontSize: 18, margin: '0 0 4px', color: '#0f172a' }}>Alterar senha</h2>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>
          Se você recebeu uma senha provisória, troque-a aqui por uma que só você saiba.
        </p>
        <FormNovaSenha />
      </div>
    </div>
  )
}

export default MinhaConta
