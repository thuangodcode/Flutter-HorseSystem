import { useState } from 'react'
import { Button, Text, TextInput, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/types'
import type { Role } from '../types'
import { Screen } from '../components/Screen'

const roles: Array<{ value: Role; label: string }> = [
  { value: 'OWNER', label: 'Horse Owner' },
  { value: 'JOCKEY', label: 'Jockey' },
  { value: 'REFEREE', label: 'Race Referee' },
  { value: 'SPECTATOR', label: 'Spectator' },
  { value: 'ADMIN', label: 'Admin' },
]

type Props = NativeStackScreenProps<RootStackParamList, 'Login'> & {
  onLogin: (params: { email: string; password: string; role: Role }) => Promise<void>
}

export function LoginScreen({ navigation, onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('SPECTATOR')
  const [loading, setLoading] = useState(false)

  return (
    <Screen>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>Login</Text>
      <Text style={{ color: '#666' }}>Dev mode: chọn role để mô phỏng đăng nhập.</Text>

      <Text>Email</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8 }} />

      <Text>Password</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8 }} />

      <Text>Role</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {roles.map((r) => (
          <View key={r.value} style={{ marginRight: 8, marginBottom: 8 }}>
            <Button title={r.value === role ? `✓ ${r.label}` : r.label} onPress={() => setRole(r.value)} />
          </View>
        ))}
      </View>

      <Button
        title={loading ? 'Logging in…' : 'Login'}
        onPress={async () => {
          setLoading(true)
          try {
            await onLogin({ email, password, role })
          } finally {
            setLoading(false)
          }
        }}
      />

      <Button title="Register" onPress={() => navigation.navigate('Register')} />
    </Screen>
  )
}
