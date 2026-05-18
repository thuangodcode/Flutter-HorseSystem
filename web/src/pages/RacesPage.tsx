import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Race } from '../types'
import { getRaces } from '../api'

export function RacesPage() {
  const [items, setItems] = useState<Race[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRaces()
      .then(setItems)
      .catch(() => setError('Failed to load races'))
  }, [])

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Races</h2>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {!items ? <p className="muted">Loading…</p> : null}

      {items ? (
        <ul>
          {items.map((r) => (
            <li key={r.id}>
              <Link to={`/races/${r.id}`}>{r.name}</Link> <span className="muted">({r.status})</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
