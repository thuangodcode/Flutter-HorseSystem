import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Race } from '../types'
import { getRace } from '../api'

export function RaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<Race | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getRace(id)
      .then(setItem)
      .catch(() => setError('Race not found'))
  }, [id])

  return (
    <div className="card">
      <p>
        <Link to="/races">← Back</Link>
      </p>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {!item ? <p className="muted">Loading…</p> : null}

      {item ? (
        <>
          <h2 style={{ marginTop: 0 }}>{item.name}</h2>
          <p className="muted">Status: {item.status}</p>
          <p>Scheduled at: {new Date(item.scheduledAt).toLocaleString()}</p>
        </>
      ) : null}
    </div>
  )
}
