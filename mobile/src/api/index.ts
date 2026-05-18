import axios from 'axios'
import type { Invite, Prediction, Race, Role, Session, Tournament, Horse } from '../types'
import { demoUsers, horses, invites, predictions, races, tournaments } from './mockData'

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL

const http = axios.create({
  baseURL: baseURL ?? '',
  headers: { 'Content-Type': 'application/json' },
})

function useMock() {
  return !baseURL
}

export async function login(params: { email: string; password: string; role: Role }): Promise<Session> {
  if (useMock()) return { token: 'dev-token', user: demoUsers[params.role] }
  const res = await http.post('/api/auth/login', params)
  return res.data as Session
}

export async function register(params: { name: string; email: string; password: string; role: Role }): Promise<Session> {
  if (useMock()) return { token: 'dev-token', user: { ...demoUsers[params.role], name: params.name, email: params.email } }
  const res = await http.post('/api/auth/register', params)
  return res.data as Session
}

export async function getTournaments(): Promise<Tournament[]> {
  if (useMock()) return tournaments
  const res = await http.get('/api/tournaments')
  return res.data as Tournament[]
}

export async function getRaces(): Promise<Race[]> {
  if (useMock()) return races
  const res = await http.get('/api/races')
  return res.data as Race[]
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
  const res = await http.get('/api/predictions')
  return res.data as Prediction[]
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
