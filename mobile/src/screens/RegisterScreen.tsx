import { useState } from 'react'
import { Button, Text, TextInput } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/types'
import type { Role } from '../types'
import { Screen } from '../components/Screen'

const roles: Array<{ value: Role; label: string }> = [
  { value: 'OWNER', label: 'Horse Owner' },
  { value: 'JOCKEY', label: 'Jockey' },
  { value: 'REFEREE', label: 'Race Referee' },
  { value: 'SPECTATOR', label: 'Spectator' },
]

type Props = NativeStackScreenProps<RootStackParamList, 'Register'> & {
  onRegister: (params: { name: string; email: string; password: string; role: Role }) => Promise<void>
}

export function RegisterScreen({ navigation, onRegister }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('SPECTATOR')
  const [loading, setLoading] = useState(false)

  return (
    <Screen>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>Register</Text>

      <Text>Name</Text>
      <TextInput value={name} onChangeText={setName} style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8 }} />

      <Text>Email</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8 }} />

      <Text>Password</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8 }} />

      <Text>Role</Text>
      {roles.map((r) => (
        <Button key={r.value} title={r.value === role ? `✓ ${r.label}` : r.label} onPress={() => setRole(r.value)} />
      ))}

      <Button
        title={loading ? 'Creating…' : 'Create account'}
        onPress={async () => {
          setLoading(true)
          try {
            await onRegister({ name, email, password, role })
          } finally {
            setLoading(false)
          }
        }}
      />

      <Button title="Back to login" onPress={() => navigation.navigate('Login')} />
    </Screen>
  )
}
