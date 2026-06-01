import { useEffect, useState } from 'react'
import { FlatList, Text } from 'react-native'
import { getTournaments, getTournamentLeaderboard } from '../api'
import { Screen } from '../components/Screen'

export function LeaderboardScreen() {
  const [tournaments, setTournaments] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<any>(null)

  useEffect(() => { getTournaments().then(setTournaments).catch(() => setTournaments([])) }, [])

  useEffect(() => {
    if (!selectedId) return
    setLeaderboard(null)
    getTournamentLeaderboard(selectedId).then(setLeaderboard).catch(() => setLeaderboard({ leaderboard: [] }))
  }, [selectedId])

  return (
    <Screen>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Leaderboard</Text>
      <Text style={{ color: '#666' }}>Bảng xếp hạng theo giải đấu.</Text>
      <Text style={{ fontWeight: '600', marginTop: 12 }}>Chọn giải đấu:</Text>
      <FlatList data={tournaments} keyExtractor={(t) => t.id} renderItem={({ item }) => (
        <Text style={{ padding: 6, color: selectedId === item.id ? '#1a7' : '#333' }} onPress={() => setSelectedId(item.id)}>
          {selectedId === item.id ? '✓ ' : ''}{item.name}
        </Text>
      )} />
      {selectedId && leaderboard ? (
        <>
          <Text style={{ fontWeight: '700', marginTop: 12 }}>Xếp hạng:</Text>
          {leaderboard.leaderboard && leaderboard.leaderboard.length > 0 ? (
            <FlatList data={leaderboard.leaderboard} keyExtractor={(_: any, idx: number) => idx.toString()} renderItem={({ item, index }: any) => (
              <Text>#{index + 1} {item.horseName} — Wins: {item.wins} | Prize: {item.totalPrize?.toLocaleString()}</Text>
            )} />
          ) : <Text style={{ color: '#666' }}>Chưa có dữ liệu.</Text>}
        </>
      ) : null}
    </Screen>
  )
}
