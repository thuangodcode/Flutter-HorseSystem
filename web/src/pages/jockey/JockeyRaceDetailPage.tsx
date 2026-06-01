import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getJockeyRaceDetail } from '@/api'

export function JockeyRaceDetailPage() {
  const { raceId } = useParams<{ raceId: string }>()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!raceId) return
    getJockeyRaceDetail(raceId).then(setData).catch(() => setError('Race not found or not assigned to you'))
  }, [raceId])

  return (
    <div className="card">
      <p><Link to="/app/jockey/races">← Back to My Races</Link></p>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {!data && !error ? <p className="muted">Loading…</p> : null}
      {data ? (
        <>
          <h2 style={{ marginTop: 0 }}>{data.raceName}</h2>
          <p className="muted">Status: {data.status}</p>
          <p>Thời gian: {data.scheduledTime ? new Date(data.scheduledTime).toLocaleString() : 'N/A'}</p>
          <p>Địa điểm: {data.location} | Cự ly: {data.distance}m | Loại: {data.raceType}</p>
          <p>Điều kiện đường đua: {data.trackCondition}</p>
          {data.horse ? (<><h3>Ngựa được phân công</h3><p><strong>{data.horse.name}</strong> — Giống: {data.horse.breed} | Giới tính: {data.horse.gender}</p></>) : null}
          {data.owner ? (<><h3>Chủ ngựa</h3><p>{data.owner.fullName} — {data.owner.phone || data.owner.email}</p></>) : null}
        </>
      ) : null}
    </div>
  )
}
