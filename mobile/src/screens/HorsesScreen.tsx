import { useEffect, useState } from 'react'
import { FlatList, Text } from 'react-native'
import type { Horse } from '../types'
import { getHorses } from '../api'
import { Screen } from '../components/Screen'

export function HorsesScreen() {
  const [items, setItems] = useState<Horse[] | null>(null)

  useEffect(() => {
    getHorses().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <Screen>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Horses (Owner)</Text>
      <Text style={{ color: '#666' }}>Placeholder: quản lý thông tin ngựa, đăng ký, chọn/thuê jockey…</Text>
      {!items ? <Text style={{ color: '#666' }}>Loading…</Text> : null}
      {items ? (
        <FlatList data={items} keyExtractor={(h) => h.id} renderItem={({ item }) => <Text>{item.name}</Text>} />
      ) : null}
    </Screen>
  )
}
