import { useEffect, useState } from 'react'
import { FlatList, Text } from 'react-native'
import type { Invite } from '../types'
import { getInvites } from '../api'
import { Screen } from '../components/Screen'

export function InvitesScreen() {
  const [items, setItems] = useState<Invite[] | null>(null)

  useEffect(() => {
    getInvites().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <Screen>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Invites (Jockey)</Text>
      <Text style={{ color: '#666' }}>Placeholder: nhận lời mời, xác nhận/từ chối…</Text>
      {!items ? <Text style={{ color: '#666' }}>Loading…</Text> : null}
      {items ? (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <Text>{item.horseName} — {item.status}</Text>}
        />
      ) : null}
    </Screen>
  )
}
