export type Role = 'ADMIN' | 'OWNER' | 'JOCKEY' | 'REFEREE' | 'SPECTATOR'

export type User = {
  id: string
  name: string
  role: Role
  email?: string
}

export type Session = {
  token: string
  user: User
}

export type Tournament = {
  id: string
  name: string
  location: string
  startDate: string
  endDate: string
}

export type Race = {
  id: string
  tournamentId: string
  name: string
  scheduledAt: string
  status: 'SCHEDULED' | 'RUNNING' | 'FINISHED'
}

export type Horse = {
  id: string
  name: string
  ownerId: string
}

export type Invite = {
  id: string
  horseId: string
  horseName: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
}

export type Prediction = {
  id: string
  raceId: string
  pickedHorseName: string
  status: 'PENDING' | 'WON' | 'LOST'
}
