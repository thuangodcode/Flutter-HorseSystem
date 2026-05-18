import { useEffect, useState } from 'react'
import type { Prediction } from '../types'
import { getPredictions } from '../api'

export function PredictionsPage() {
  const [items, setItems] = useState<Prediction[] | null>(null)

  useEffect(() => {
    getPredictions().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Predictions (Spectator)</h2>
      <p className="muted">Dự đoán kết quả, theo dõi kết quả dự đoán, nhận thưởng… (placeholder)</p>

      {!items ? <p className="muted">Loading…</p> : null}
      {items ? (
        <ul>
          {items.map((p) => (
            <li key={p.id}>
              Race {p.raceId}: {p.pickedHorseName} — <span className="muted">{p.status}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
