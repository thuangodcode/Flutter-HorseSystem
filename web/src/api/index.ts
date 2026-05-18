import { http } from './http'
import type { Invite, Prediction, Race, Role, Session, Tournament, Horse } from '../types'

export async function login(params: { email: string; password: string; role: Role }): Promise<Session> {
  const res = await http.post('/api/auth/login', params)
  return res.data as Session
}

export async function register(params: { name: string; email: string; password: string; role: Role }): Promise<Session> {
  const res = await http.post('/api/auth/register', params)
  return res.data as Session
}

export async function getTournaments(): Promise<Tournament[]> {
  const res = await http.get('/api/tournaments')
  return res.data as Tournament[]
}

export async function getTournament(id: string): Promise<Tournament> {
  const res = await http.get(`/api/tournaments/${id}`)
  return res.data as Tournament
}

export async function getRaces(): Promise<Race[]> {
  const res = await http.get('/api/races')
  return res.data as Race[]
}

export async function getRace(id: string): Promise<Race> {
  const res = await http.get(`/api/races/${id}`)
  return res.data as Race
}

export async function getHorses(): Promise<Horse[]> {
  const res = await http.get('/api/horses')
  return res.data as Horse[]
}

export async function getInvites(): Promise<Invite[]> {
  const res = await http.get('/api/invites')
  return res.data as Invite[]
}

export async function getPredictions(): Promise<Prediction[]> {
  const res = await http.get('/api/predictions')
  return res.data as Prediction[]
}

export async function getAdminUsers(): Promise<Array<{ id: string; name: string; role: Role }>> {
  const res = await http.get('/api/admin/users')
  return res.data as Array<{ id: string; name: string; role: Role }>
}

export async function getRefereeRaces(): Promise<Race[]> {
  const res = await http.get('/api/referee/races')
  return res.data as Race[]
}
