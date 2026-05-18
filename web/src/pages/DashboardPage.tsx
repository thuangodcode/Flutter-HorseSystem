import { Link } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'

export function DashboardPage() {
  const { session } = useSession()

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Dashboard</h2>
      <p className="muted">Chào {session?.user.name}. Role: {session?.user.role}</p>

      <div className="row" style={{ marginTop: 10 }}>
        <Link className="btn" to="/tournaments">Xem giải đấu</Link>
        <Link className="btn" to="/races">Xem cuộc đua</Link>

        {session?.user.role === 'OWNER' ? <Link className="btn" to="/horses">Quản lý ngựa</Link> : null}
        {session?.user.role === 'JOCKEY' ? <Link className="btn" to="/invites">Lời mời điều khiển</Link> : null}
        {session?.user.role === 'SPECTATOR' ? <Link className="btn" to="/predictions">Dự đoán</Link> : null}
        {session?.user.role === 'REFEREE' ? <Link className="btn" to="/referee/races">Trọng tài</Link> : null}
        {session?.user.role === 'ADMIN' ? (
          <>
            <Link className="btn" to="/admin/users">Quản lý tài khoản</Link>
            <Link className="btn" to="/admin/scheduling">Lập lịch</Link>
          </>
        ) : null}
      </div>
    </div>
  )
}
