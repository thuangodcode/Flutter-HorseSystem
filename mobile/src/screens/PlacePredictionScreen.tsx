import { useEffect, useState } from 'react'
import { Alert, Button, FlatList, Text, TextInput } from 'react-native'
import { getRaces, getRaceHorses, checkRaceOpenForPrediction, placePrediction } from '../api'
import { Screen } from '../components/Screen'

export function PlacePredictionScreen() {
  const [races, setRaces] = useState<any[]>([])
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState<boolean | null>(null)
  const [horses, setHorses] = useState<Array<{ id: string; name: string }>>([])
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { getRaces().then(setRaces).catch(() => setRaces([])) }, [])

  useEffect(() => {
    if (!selectedRaceId) return
    setIsOpen(null); setHorses([]); setSelectedHorseId(null)
    checkRaceOpenForPrediction(selectedRaceId).then((d) => setIsOpen(d.isOpen))
    getRaceHorses(selectedRaceId).then(setHorses)
  }, [selectedRaceId])

  async function handlePlace() {
    if (!selectedRaceId || !selectedHorseId || !betAmount) { Alert.alert('Error', 'Vui lòng chọn đầy đủ'); return }
    setLoading(true)
    try {
      await placePrediction(selectedRaceId, selectedHorseId, parseInt(betAmount))
      Alert.alert('Success', 'Đặt dự đoán thành công!')
      setSelectedRaceId(null); setBetAmount('')
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Screen>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Place Prediction</Text>
      <Text style={{ color: '#666' }}>Chọn cuộc đua và ngựa để đặt dự đoán.</Text>
      <Text style={{ fontWeight: '600', marginTop: 12 }}>1. Chọn cuộc đua:</Text>
      <FlatList data={races} keyExtractor={(r) => r.id} renderItem={({ item }) => (
        <Text style={{ padding: 6, color: selectedRaceId === item.id ? '#1a7' : '#333' }} onPress={() => setSelectedRaceId(item.id)}>
          {selectedRaceId === item.id ? '✓ ' : ''}{item.name} ({item.status})
        </Text>
      )} />
      {selectedRaceId && isOpen === false ? <Text style={{ color: 'red', marginTop: 8 }}>Cuộc đua đã đóng cược.</Text> : null}
      {selectedRaceId && isOpen && horses.length > 0 ? (
        <>
          <Text style={{ fontWeight: '600', marginTop: 12 }}>2. Chọn ngựa:</Text>
          <FlatList data={horses} keyExtractor={(h) => h.id} renderItem={({ item }) => (
            <Text style={{ padding: 6, color: selectedHorseId === item.id ? '#1a7' : '#333' }} onPress={() => setSelectedHorseId(item.id)}>
              {selectedHorseId === item.id ? '✓ ' : ''}{item.name}
            </Text>
          )} />
          <Text style={{ fontWeight: '600', marginTop: 12 }}>3. Số tiền (100,000 - 10,000,000):</Text>
          <TextInput value={betAmount} onChangeText={setBetAmount} keyboardType="numeric" placeholder="500000"
            style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginTop: 4 }} />
          <Button title={loading ? 'Đang đặt...' : 'Đặt dự đoán'} onPress={handlePlace} disabled={loading || !selectedHorseId || !betAmount} />
        </>
      ) : null}
    </Screen>
  )
}
