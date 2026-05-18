import { useEffect, useState } from 'react'
import { FlatList, Text } from 'react-native'
import type { Prediction } from '../types'
import { getPredictions } from '../api'
import { Screen } from '../components/Screen'

export function PredictionsScreen() {
  const [items, setItems] = useState<Prediction[] | null>(null)

  useEffect(() => {
    getPredictions().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <Screen>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Predictions (Spectator)</Text>
      <Text style={{ color: '#666' }}>Placeholder: dự đoán, theo dõi kết quả, nhận thưởng…</Text>
      {!items ? <Text style={{ color: '#666' }}>Loading…</Text> : null}
      {items ? (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <Text>Race {item.raceId}: {item.pickedHorseName} — {item.status}</Text>}
        />
      ) : null}
    </Screen>
  )
}
