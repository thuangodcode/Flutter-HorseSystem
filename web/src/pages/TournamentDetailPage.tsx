import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Tournament } from '../types'
import { getTournament } from '../api'

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<Tournament | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getTournament(id)
      .then(setItem)
      .catch(() => setError('Tournament not found'))
  }, [id])

  return (
    <div className="card">
      <p>
        <Link to="/tournaments">← Back</Link>
      </p>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {!item ? <p className="muted">Loading…</p> : null}

      {item ? (
        <>
          <h2 style={{ marginTop: 0 }}>{item.name}</h2>
          <p className="muted">{item.location}</p>
          <p>
            {item.startDate} → {item.endDate}
          </p>
        </>
      ) : null}
    </div>
  )
}
