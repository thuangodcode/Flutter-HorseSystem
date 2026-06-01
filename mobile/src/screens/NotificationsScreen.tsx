import { useEffect, useState } from 'react'
import { FlatList, Text } from 'react-native'
import { getNotifications } from '../api'
import { Screen } from '../components/Screen'

export function NotificationsScreen() {
  const [items, setItems] = useState<any[] | null>(null)

  useEffect(() => { getNotifications().then(setItems).catch(() => setItems([])) }, [])

  return (
    <Screen>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Notifications</Text>
      <Text style={{ color: '#666' }}>Thông báo kết quả dự đoán và giải thưởng.</Text>
      {!items ? <Text style={{ color: '#666' }}>Loading…</Text> : null}
      {items && items.length === 0 ? <Text style={{ color: '#666' }}>Không có thông báo nào.</Text> : null}
      {items && items.length > 0 ? (
        <FlatList data={items} keyExtractor={(n: any) => n._id} renderItem={({ item }: any) => (
          <Text style={{ paddingVertical: 4 }}>{item.title || item.type} — {item.message}</Text>
        )} />
      ) : null}
    </Screen>
  )
}
