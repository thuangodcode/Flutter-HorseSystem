import type { Horse, Invite, Prediction, Race, Role, Tournament, User } from '../types'

export const demoUsers: Record<Role, User> = {
  ADMIN: { id: 'u_admin', name: 'Admin', role: 'ADMIN' },
  OWNER: { id: 'u_owner', name: 'Horse Owner', role: 'OWNER' },
  JOCKEY: { id: 'u_jockey', name: 'Jockey', role: 'JOCKEY' },
  REFEREE: { id: 'u_ref', name: 'Referee', role: 'REFEREE' },
  SPECTATOR: { id: 'u_spec', name: 'Spectator', role: 'SPECTATOR' },
}

export const tournaments: Tournament[] = [
  { id: 't1', name: 'Spring Derby', location: 'Hanoi', startDate: '2026-06-01', endDate: '2026-06-10' },
  { id: 't2', name: 'Summer Cup', location: 'Da Nang', startDate: '2026-07-05', endDate: '2026-07-12' },
]

export const races: Race[] = [
  { id: 'r1', tournamentId: 't1', name: 'Race 1', scheduledAt: '2026-06-02T09:00:00Z', status: 'SCHEDULED' },
  { id: 'r2', tournamentId: 't1', name: 'Race 2', scheduledAt: '2026-06-03T09:00:00Z', status: 'SCHEDULED' },
  { id: 'r3', tournamentId: 't2', name: 'Final', scheduledAt: '2026-07-12T10:00:00Z', status: 'SCHEDULED' },
]

export const horses: Horse[] = [
  { id: 'h1', name: 'Thunder', ownerId: 'u_owner' },
  { id: 'h2', name: 'Blaze', ownerId: 'u_owner' },
]

export const invites: Invite[] = [
  { id: 'i1', horseId: 'h1', horseName: 'Thunder', status: 'PENDING' },
  { id: 'i2', horseId: 'h2', horseName: 'Blaze', status: 'ACCEPTED' },
]

export const predictions: Prediction[] = [
  { id: 'p1', raceId: 'r1', pickedHorseName: 'Thunder', status: 'PENDING' },
  { id: 'p2', raceId: 'r2', pickedHorseName: 'Blaze', status: 'LOST' },
]
