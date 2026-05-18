import { Button, Text } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/types'
import type { Role, Session } from '../types'
import { Screen } from '../components/Screen'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'> & {
  session: Session
  onLogout: () => Promise<void>
}

function roleButtons(role: Role): Array<keyof RootStackParamList> {
  const common: Array<keyof RootStackParamList> = ['Tournaments', 'Races']
  if (role === 'OWNER') return [...common, 'Horses']
  if (role === 'JOCKEY') return [...common, 'Invites']
  if (role === 'SPECTATOR') return [...common, 'Predictions']
  if (role === 'REFEREE') return [...common, 'RefereeRaces', 'RefereeReport']
  if (role === 'ADMIN') return [...common, 'AdminUsers', 'AdminScheduling']
  return common
}

export function HomeScreen({ navigation, session, onLogout }: Props) {
  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Horse Racing</Text>
      <Text style={{ color: '#666' }}>{session.user.name} ({session.user.role})</Text>

      {roleButtons(session.user.role).map((route) => (
        <Button key={route} title={route} onPress={() => navigation.navigate(route)} />
      ))}

      <Button title="Logout" onPress={onLogout} />
    </Screen>
  )
}
