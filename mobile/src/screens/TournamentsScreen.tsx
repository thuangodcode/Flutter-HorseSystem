import { useEffect, useState } from 'react'
import { FlatList, Text } from 'react-native'
import type { Tournament } from '../types'
import { getTournaments } from '../api'
import { Screen } from '../components/Screen'

export function TournamentsScreen() {
  const [items, setItems] = useState<Tournament[] | null>(null)

  useEffect(() => {
    getTournaments().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <Screen>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Tournaments</Text>
      {!items ? <Text style={{ color: '#666' }}>Loading…</Text> : null}
      {items ? (
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <Text>
              {item.name} ({item.location})
            </Text>
          )}
        />
      ) : null}
    </Screen>
  )
}
