import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Role, Session } from '../types'
import { clearSession, loadSession, saveSession } from './sessionStorage'
import * as api from '@/api'

const DEFAULT_BALANCE = 10_000_000
const RESTORE_THRESHOLD = 100_000
const RESTORE_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000 // 3 days in ms

type SessionContextValue = {
  session: Session | null
  login: (params: { email: string; password: string; role?: Role }) => Promise<void>
  register: (params: { name: string; email: string; password: string; role: Role }) => Promise<void>
  logout: () => void
  balance: number
  updateBalance: (newBalance: number) => void
}

/** Check if balance should be auto-restored to default */
function shouldRestoreBalance(currentBalance: number): boolean {
  if (currentBalance >= RESTORE_THRESHOLD) return false
  const lastReset = localStorage.getItem('lastBalanceReset')
  if (!lastReset) return true // never reset before → restore
  const elapsed = Date.now() - Number(lastReset)
  return elapsed >= RESTORE_COOLDOWN_MS
}

function loadPersistedBalance(): number {
  try {
    const saved = localStorage.getItem('spectator_balance')
    if (saved !== null) {
      const parsed = Number(saved)
      if (!isNaN(parsed) && parsed >= 0) return parsed
    }
  } catch {}
  return DEFAULT_BALANCE
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider(props: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [balance, setBalance] = useState<number>(() => {
    const persisted = loadPersistedBalance()
    // Check auto-restore on initial load
    if (shouldRestoreBalance(persisted)) {
      localStorage.setItem('spectator_balance', String(DEFAULT_BALANCE))
      localStorage.setItem('lastBalanceReset', String(Date.now()))
      return DEFAULT_BALANCE
    }
    return persisted
  })

  // Persist balance to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('spectator_balance', String(balance))
  }, [balance])

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      login: async (params) => {
        const next = await api.login(params)
        saveSession(next)
        setSession(next)
        // Check auto-restore on login
        const currentBal = loadPersistedBalance()
        if (shouldRestoreBalance(currentBal)) {
          setBalance(DEFAULT_BALANCE)
          localStorage.setItem('spectator_balance', String(DEFAULT_BALANCE))
          localStorage.setItem('lastBalanceReset', String(Date.now()))
        } else {
          setBalance(currentBal)
        }
      },
      register: async (params) => {
        const next = await api.register(params)
        saveSession(next)
        setSession(next)
        // New user gets default balance
        setBalance(DEFAULT_BALANCE)
        localStorage.setItem('spectator_balance', String(DEFAULT_BALANCE))
        localStorage.setItem('lastBalanceReset', String(Date.now()))
      },
      logout: () => {
        clearSession()
        setSession(null)
      },
      balance,
      updateBalance: (newBalance: number) => {
        setBalance(newBalance)
        localStorage.setItem('spectator_balance', String(newBalance))
        // If balance dropped below threshold, record for future auto-restore check
        if (newBalance < RESTORE_THRESHOLD) {
          // Auto-restore will happen on next login if 3 days have passed
        }
      },
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

