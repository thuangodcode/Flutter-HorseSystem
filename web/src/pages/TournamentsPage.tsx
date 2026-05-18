import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Tournament } from '../types'
import { getTournaments } from '../api'

export function TournamentsPage() {
  const [items, setItems] = useState<Tournament[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getTournaments()
      .then(setItems)
      .catch(() => setError('Failed to load tournaments'))
  }, [])

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Tournaments</h2>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {!items ? <p className="muted">Loading…</p> : null}

      {items ? (
        <ul>
          {items.map((t) => (
            <li key={t.id}>
              <Link to={`/tournaments/${t.id}`}>{t.name}</Link> <span className="muted">({t.location})</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
