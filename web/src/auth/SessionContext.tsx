import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Role, Session } from '../types'
import { clearSession, loadSession, saveSession } from './sessionStorage'
import * as api from '@/api'

type SessionContextValue = {
  session: Session | null
  login: (params: { email: string; password: string; role?: Role }) => Promise<void>
  register: (params: { name: string; email: string; password: string; role: Role }) => Promise<void>
  logout: () => void
  balance: number
  updateBalance: (newBalance: number) => void
  refreshBalance: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider(props: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [balance, setBalance] = useState<number>(0)

  // Fetch balance from backend profile (points field)
  async function fetchBalanceFromBackend() {
    try {
      const profile = await api.getMyProfile()
      const pts = profile?.profile?.points ?? profile?.points ?? profile?.balance ?? profile?.virtualPoints ?? 0
      setBalance(pts)
    } catch (err) {
      console.warn('Could not fetch profile balance:', err)
    }
  }

  // On mount or session change, load balance from backend
  useEffect(() => {
    if (session?.token) {
      fetchBalanceFromBackend()
    }
  }, [session?.token])

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      login: async (params) => {
        const next = await api.login(params)
        saveSession(next)
        setSession(next)
        // Balance will be fetched automatically via the useEffect above
      },
      register: async (params) => {
        const next = await api.register(params)
        saveSession(next)
        setSession(next)
        // Balance will be fetched automatically via the useEffect above
      },
      logout: () => {
        clearSession()
        setSession(null)
        setBalance(0)
      },
      balance,
      updateBalance: (newBalance: number) => {
        setBalance(newBalance)
      },
      refreshBalance: fetchBalanceFromBackend,
    }),
    [session, balance],
  )

  return <SessionContext.Provider value={value}>{props.children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
