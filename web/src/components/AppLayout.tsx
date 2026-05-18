import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'

function roleNav(role: string) {
  const common = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/tournaments', label: 'Tournaments' },
    { to: '/races', label: 'Races' },
  ]

  if (role === 'OWNER') return [...common, { to: '/horses', label: 'Horses' }]
  if (role === 'JOCKEY') return [...common, { to: '/invites', label: 'Invites' }]
  if (role === 'SPECTATOR') return [...common, { to: '/predictions', label: 'Predictions' }]
  if (role === 'REFEREE') return [...common, { to: '/referee/races', label: 'Referee' }]
  if (role === 'ADMIN') return [...common, { to: '/admin/users', label: 'Users' }, { to: '/admin/scheduling', label: 'Scheduling' }]

  return common
}

export function AppLayout() {
  const { session, logout } = useSession()
  const navigate = useNavigate()

  return (
    <div>
      <div className="topbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', fontWeight: 800 }}>Horse Racing</Link>
          <div className="nav">
            {roleNav(session?.user.role ?? '').map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="muted">{session?.user.name} ({session?.user.role})</span>
            <button
              className="btn"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 16 }}>
        <Outlet />
      </div>
    </div>
  )
}
