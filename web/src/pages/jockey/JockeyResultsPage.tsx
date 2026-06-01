import { useEffect, useState } from 'react'
import { getJockeyResults } from '@/api'

export function JockeyResultsPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { getJockeyResults().then(setData).catch(() => setError('Failed to load results')) }, [])

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>My Results (Jockey)</h2>
      <p className="muted">Kết quả thi đấu của bạn.</p>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {!data && !error ? <p className="muted">Loading…</p> : null}
      {data && data.stats ? (
        <p>Tổng: <strong>{data.stats.totalRaces}</strong> | Thắng: <strong>{data.stats.wins}</strong> | Top 3: <strong>{data.stats.topThree}</strong> | Giải thưởng: <strong>{data.stats.totalPrizes?.toLocaleString()} VND</strong></p>
      ) : null}
      {data && data.results && data.results.length === 0 ? <p className="muted">Chưa có kết quả.</p> : null}
      {data && data.results && data.results.length > 0 ? (
        <ul>
          {data.results.map((r: any) => (
            <li key={r._id} style={{ marginBottom: 4 }}>
              <strong>{r.raceId?.name || 'Race'}</strong> — Vị trí: #{r.position} | Ngựa: {r.horseId?.name || 'N/A'}
              {r.prizeAmount ? ` | Giải: ${r.prizeAmount.toLocaleString()} VND` : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
