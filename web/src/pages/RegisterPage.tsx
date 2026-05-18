import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Role } from '../types'
import { useSession } from '../auth/SessionContext'

const roles: Array<{ value: Role; label: string }> = [
  { value: 'OWNER', label: 'Horse Owner' },
  { value: 'JOCKEY', label: 'Jockey' },
  { value: 'REFEREE', label: 'Race Referee' },
  { value: 'SPECTATOR', label: 'Spectator' },
]

export function RegisterPage() {
  const { register } = useSession()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('SPECTATOR')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHero">
          <div className="authHeroContent">
            <div className="authHeroBadge">
              <span className="authHeroDot" />
              <span style={{ fontWeight: 700 }}>Join the season</span>
            </div>
            <h1 style={{ margin: '14px 0 6px', color: '#f8fafc' }}>Horse Racing</h1>
            <p style={{ margin: 0, color: 'rgba(248,250,252,0.85)' }}>
              Tạo tài khoản để theo dõi giải đấu và tham gia dự đoán.
            </p>
          </div>
        </div>

        <div className="authForm">
          <h2 className="authTitle">Register</h2>
          <p className="muted authSubtitle">Tạo tài khoản demo (mock).</p>

          <div className="row">
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div className="field">
              <label>Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btnPrimary"
              disabled={loading}
              onClick={async () => {
                setLoading(true)
                setError(null)
                try {
                  await register({ name, email, password, role })
                  navigate('/dashboard')
                } catch {
                  setError('Register failed')
                } finally {
                  setLoading(false)
                }
              }}
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>
            <span className="muted">
              Đã có tài khoản? <Link to="/login">Login</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
