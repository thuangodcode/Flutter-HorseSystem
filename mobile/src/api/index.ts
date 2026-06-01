import axios from 'axios'
import type { Invite, Prediction, Race, Role, Session, Tournament, Horse } from '../types'
import { demoUsers, horses, invites, predictions, races, tournaments } from './mockData'
import { loadSession } from '../storage/session'

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL

const http = axios.create({
  baseURL: baseURL ?? '',
  headers: { 'Content-Type': 'application/json' },
})

// In-memory token cache
let cachedToken: string | null = null

export function setCachedToken(token: string | null) {
  cachedToken = token
}

// JWT interceptor
http.interceptors.request.use(async (config) => {
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`
  } else {
    try {
      const session = await loadSession()
      if (session?.token) {
        cachedToken = session.token
        config.headers.Authorization = `Bearer ${session.token}`
      }
    } catch { /* ignore */ }
  }
  return config
})

function useMock() {
  return !baseURL
}

export async function login(params: { email: string; password: string; role: Role }): Promise<Session> {
  if (useMock()) return { token: 'dev-token', user: demoUsers[params.role] }
  const res = await http.post(`${baseURL}/auth/login`, { email: params.email, password: params.password })
  const data = res.data
  const session: Session = {
    token: data.accessToken,
    user: { id: data.user.userId, name: data.user.fullName, role: data.user.role, email: params.email },
  }
  setCachedToken(session.token)
  return session
}

export async function register(params: { name: string; email: string; password: string; role: Role }): Promise<Session> {
  if (useMock()) return { token: 'dev-token', user: { ...demoUsers[params.role], name: params.name, email: params.email } }
  await http.post(`${baseURL}/auth/register`, { email: params.email, password: params.password, fullName: params.name, role: params.role })
  return login({ email: params.email, password: params.password, role: params.role })
}

export async function getTournaments(): Promise<Tournament[]> {
  if (useMock()) return tournaments
  const res = await http.get(`${baseURL}/tournaments`)
  const list = res.data.tournaments || res.data
  return (Array.isArray(list) ? list : []).map((t: any) => ({
    id: t._id, name: t.name, location: t.venue || t.location || '',
    startDate: t.startDate ? t.startDate.split('T')[0] : '', endDate: t.endDate ? t.endDate.split('T')[0] : '',
  }))
}

export async function getRaces(): Promise<Race[]> {
  if (useMock()) return races
  const res = await http.get(`${baseURL}/races`)
  const list = res.data.races || res.data
  return (Array.isArray(list) ? list : []).map((r: any) => ({
    id: r._id, tournamentId: r.tournamentId?._id || r.tournamentId || '',
    name: r.name, scheduledAt: r.scheduledAt, status: r.status,
  }))
}

export async function getHorses(): Promise<Horse[]> {
  if (useMock()) return horses
  const res = await http.get('/api/horses')
  return res.data as Horse[]
}

export async function getInvites(): Promise<Invite[]> {
  if (useMock()) return invites
  const res = await http.get('/api/invites')
  return res.data as Invite[]
}

export async function getPredictions(): Promise<Prediction[]> {
  if (useMock()) return predictions
  const res = await http.get(`${baseURL}/me/predictions`)
  const list = res.data.predictions || res.data
  return (Array.isArray(list) ? list : []).map((p: any) => ({
    id: p._id, raceId: p.raceId?._id || p.raceId || '',
    pickedHorseName: p.horseId?.name || '',
    status: p.status === 'OPEN' ? 'PENDING' : p.status === 'CLOSED' ? 'PENDING' : p.status,
    betAmount: p.betAmount, raceName: p.raceId?.name || '',
  }))
}

export async function getAdminUsers(): Promise<Array<{ id: string; name: string; role: Role }>> {
  if (useMock()) return Object.values(demoUsers)
  const res = await http.get('/api/admin/users')
  return res.data as Array<{ id: string; name: string; role: Role }>
}

export async function getRefereeRaces(): Promise<Race[]> {
  if (useMock()) return races
  const res = await http.get('/api/referee/races')
  return res.data as Race[]
}

// ============================================================================
// SPECTATOR-SPECIFIC APIs
// ============================================================================

export async function checkRaceOpenForPrediction(raceId: string): Promise<{ isOpen: boolean; raceName: string }> {
  if (useMock()) return { isOpen: true, raceName: 'Mock Race' }
  const res = await http.get(`${baseURL}/races/${raceId}/predictions/open`)
  return res.data
}

export async function placePrediction(raceId: string, horseId: string, betAmount: number): Promise<any> {
  const res = await http.post(`${baseURL}/races/${raceId}/predictions`, { horseId, betAmount })
  return res.data
}

export async function getRaceHorses(raceId: string): Promise<Array<{ id: string; name: string }>> {
  if (useMock()) return horses.map(h => ({ id: h.id, name: h.name }))
  const res = await http.get(`${baseURL}/races/${raceId}/horses`)
  const list = res.data.horses || res.data
  return (Array.isArray(list) ? list : []).map((item: any) => ({
    id: item.horse?._id || item.horseId?._id || '', name: item.horse?.name || item.horseId?.name || '',
  }))
}

export async function getRaceResults(raceId: string): Promise<any> {
  const res = await http.get(`${baseURL}/races/${raceId}/results`)
  return res.data
}

export async function getNotifications(): Promise<any[]> {
  if (useMock()) return []
  const res = await http.get(`${baseURL}/me/notifications`)
  return res.data.notifications || res.data || []
}

export async function getTournamentLeaderboard(tournId: string): Promise<any> {
  const res = await http.get(`${baseURL}/tournaments/${tournId}/leaderboard`)
  return res.data
}
