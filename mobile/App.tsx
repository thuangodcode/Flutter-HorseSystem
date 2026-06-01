import { useEffect, useMemo, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { RootStackParamList } from './src/navigation/types'
import type { Role, Session } from './src/types'
import { LoginScreen } from './src/screens/LoginScreen'
import { RegisterScreen } from './src/screens/RegisterScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { TournamentsScreen } from './src/screens/TournamentsScreen'
import { RacesScreen } from './src/screens/RacesScreen'
import { HorsesScreen } from './src/screens/HorsesScreen'
import { InvitesScreen } from './src/screens/InvitesScreen'
import { PredictionsScreen } from './src/screens/PredictionsScreen'
import { PlacePredictionScreen } from './src/screens/PlacePredictionScreen'
import { RaceResultsScreen } from './src/screens/RaceResultsScreen'
import { NotificationsScreen } from './src/screens/NotificationsScreen'
import { LeaderboardScreen } from './src/screens/LeaderboardScreen'
import { AdminUsersScreen } from './src/screens/AdminUsersScreen'
import { AdminSchedulingScreen } from './src/screens/AdminSchedulingScreen'
import { RefereeRacesScreen } from './src/screens/RefereeRacesScreen'
import { RefereeReportScreen } from './src/screens/RefereeReportScreen'
import * as api from './src/api'
import { setCachedToken } from './src/api'
import { clearSession, loadSession, saveSession } from './src/storage/session'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    loadSession()
      .then((s) => {
        setSession(s)
        if (s?.token) setCachedToken(s.token)
      })
      .finally(() => setBooted(true))
  }, [])

  const authActions = useMemo(
    () => ({
      onLogin: async (params: { email: string; password: string; role: Role }) => {
        const next = await api.login(params)
        setCachedToken(next.token)
        await saveSession(next)
        setSession(next)
      },
      onRegister: async (params: { name: string; email: string; password: string; role: Role }) => {
        const next = await api.register(params)
        setCachedToken(next.token)
        await saveSession(next)
        setSession(next)
      },
      onLogout: async () => {
        setCachedToken(null)
        await clearSession()
        setSession(null)
      },
    }),
    [],
  )

  if (!booted) return null

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!session ? (
          <>
            <Stack.Screen name="Login" options={{ title: 'Login' }}>
              {(props) => <LoginScreen {...props} onLogin={authActions.onLogin} />}
            </Stack.Screen>
            <Stack.Screen name="Register" options={{ title: 'Register' }}>
              {(props) => <RegisterScreen {...props} onRegister={authActions.onRegister} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Home" options={{ title: 'Home' }}>
              {(props) => <HomeScreen {...props} session={session} onLogout={authActions.onLogout} />}
            </Stack.Screen>
            <Stack.Screen name="Tournaments" component={TournamentsScreen} />
            <Stack.Screen name="Races" component={RacesScreen} />
            <Stack.Screen name="Horses" component={HorsesScreen} />
            <Stack.Screen name="Invites" component={InvitesScreen} />
            <Stack.Screen name="Predictions" component={PredictionsScreen} />
            <Stack.Screen name="PlacePrediction" component={PlacePredictionScreen} options={{ title: 'Place Prediction' }} />
            <Stack.Screen name="RaceResults" component={RaceResultsScreen} options={{ title: 'Race Results' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Leaderboard' }} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
            <Stack.Screen name="AdminScheduling" component={AdminSchedulingScreen} />
            <Stack.Screen name="RefereeRaces" component={RefereeRacesScreen} />
            <Stack.Screen name="RefereeReport" component={RefereeReportScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
