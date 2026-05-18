import { useEffect, useState } from 'react'
import { FlatList, Text } from 'react-native'
import type { Role } from '../types'
import { getAdminUsers } from '../api'
import { Screen } from '../components/Screen'

export function AdminUsersScreen() {
  const [items, setItems] = useState<Array<{ id: string; name: string; role: Role }> | null>(null)

  useEffect(() => {
    getAdminUsers().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <Screen>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>User Management (Admin)</Text>
      <Text style={{ color: '#666' }}>Placeholder: quản lý tài khoản & phân quyền.</Text>
      {!items ? <Text style={{ color: '#666' }}>Loading…</Text> : null}
      {items ? (
        <FlatList data={items} keyExtractor={(u) => u.id} renderItem={({ item }) => <Text>{item.name} — {item.role}</Text>} />
      ) : null}
    </Screen>
  )
}
