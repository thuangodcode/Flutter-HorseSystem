import { useEffect, useState } from 'react'
import { FlatList, Text } from 'react-native'
import type { Race } from '../types'
import { getRaces } from '../api'
import { Screen } from '../components/Screen'

export function RacesScreen() {
  const [items, setItems] = useState<Race[] | null>(null)

  useEffect(() => {
    getRaces().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <Screen>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Races</Text>
      {!items ? <Text style={{ color: '#666' }}>Loading…</Text> : null}
      {items ? (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <Text>{item.name} ({item.status})</Text>}
        />
      ) : null}
    </Screen>
  )
}
