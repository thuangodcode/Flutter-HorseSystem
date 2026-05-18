import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Not Found</h2>
      <p>
        <Link to="/dashboard">Go to dashboard</Link>
      </p>
    </div>
  )
}
