import { useEffect, useState } from 'react'
import { getJockeySchedule } from '@/api'

export function JockeySchedulePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { getJockeySchedule().then(setData).catch(() => setError('Failed to load schedule')) }, [])

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>My Schedule (Jockey)</h2>
      <p className="muted">Lịch thi đấu sắp tới.</p>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {!data && !error ? <p className="muted">Loading…</p> : null}
      {data && data.count === 0 ? <p className="muted">Không có lịch thi đấu nào.</p> : null}
      {data && data.data && data.data.length > 0 ? (
        <ul>
          {data.data.map((s: any) => (
            <li key={s._id} style={{ marginBottom: 8 }}>
              <strong>{s.raceName}</strong><span className="muted"> — {s.location} ({s.status})</span>
              {s.scheduledTime ? <span className="muted" style={{ display: 'block', fontSize: '0.85em' }}>{new Date(s.scheduledTime).toLocaleString()}</span> : null}
              {s.distance ? <span className="muted" style={{ display: 'block', fontSize: '0.85em' }}>Cự ly: {s.distance}m | Loại: {s.raceType}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
