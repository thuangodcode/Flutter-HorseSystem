import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJockeyRaces } from '@/api'

export function JockeyRacesPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { getJockeyRaces().then(setData).catch(() => setError('Failed to load races')) }, [])

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>My Races (Jockey)</h2>
      <p className="muted">Danh sách cuộc đua được phân công.</p>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {!data && !error ? <p className="muted">Loading…</p> : null}
      {data && data.data && data.data.length === 0 ? <p className="muted">Chưa có cuộc đua nào được phân công.</p> : null}
      {data && data.data && data.data.length > 0 ? (
        <ul>
          {data.data.map((race: any) => (
            <li key={race._id} style={{ marginBottom: 8 }}>
              <Link to={`/app/jockey/races/${race.raceId}`}><strong>{race.raceName}</strong></Link>
              <span className="muted"> — {race.location} ({race.status})</span>
              {race.scheduledTime ? <span className="muted" style={{ display: 'block', fontSize: '0.85em' }}>{new Date(race.scheduledTime).toLocaleString()}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
