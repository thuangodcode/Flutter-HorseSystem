import { useEffect, useState } from 'react'
import { FlatList, Text } from 'react-native'
import { getRaces, getRaceResults } from '../api'
import { Screen } from '../components/Screen'

export function RaceResultsScreen() {
  const [races, setRaces] = useState<any[]>([])
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)

  useEffect(() => { getRaces().then(setRaces).catch(() => setRaces([])) }, [])

  useEffect(() => {
    if (!selectedRaceId) return
    setResults(null)
    getRaceResults(selectedRaceId).then(setResults).catch(() => setResults({ results: [] }))
  }, [selectedRaceId])

  return (
    <Screen>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Race Results</Text>
      <Text style={{ color: '#666' }}>Chọn cuộc đua để xem kết quả.</Text>
      <FlatList data={races} keyExtractor={(r) => r.id} renderItem={({ item }) => (
        <Text style={{ padding: 6, color: selectedRaceId === item.id ? '#1a7' : '#333' }} onPress={() => setSelectedRaceId(item.id)}>
          {selectedRaceId === item.id ? '✓ ' : ''}{item.name} ({item.status})
        </Text>
      )} />
      {selectedRaceId && results ? (
        <>
          <Text style={{ fontWeight: '700', marginTop: 12 }}>Kết quả: {results.raceName}</Text>
          {results.results && results.results.length > 0 ? (
            <FlatList data={results.results} keyExtractor={(r: any) => r._id} renderItem={({ item }: any) => (
              <Text>#{item.position} — {item.horseId?.name || 'N/A'} ({item.jockeyId?.fullName || 'N/A'})</Text>
            )} />
          ) : <Text style={{ color: '#666' }}>Chưa có kết quả.</Text>}
        </>
      ) : null}
    </Screen>
  )
}
