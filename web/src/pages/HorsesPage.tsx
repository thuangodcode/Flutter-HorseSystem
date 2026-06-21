import { useEffect, useState, startTransition, useMemo } from 'react'
import type { Horse, Race, Jockey } from '../types'
import {
  getHorses,
  createHorse,
  updateHorse,
  deleteHorse,
  getRaces,
  getRaceHorses,
  registerHorseRace,
  searchJockeys,
  sendJockeyInvitation,
  getHorseJockeys,
  confirmJockey,
  confirmRaceParticipation,
  getHorseResults
} from '@/api'
import { Pagination } from '@/components/ui/Pagination'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Magnetic } from '@/components/ui/magnetic'
import { useAnimatedToast } from '@/components/ui/animated-toast'
import { AnimatedTable, type SortDirection } from '@/components/ui/animated-table'
import {
  CalendarRange, Search, Trophy, Activity, FileCheck, Check, X, Users,
  TrendingUp, AlertTriangle, Edit, Trash2, Plus, ShieldCheck, RefreshCw,
  Sparkles, Zap, Clock, MapPin, Star, Send, UserCheck, Award
} from 'lucide-react'
import '@/styles/horse-management.css'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'my-horses' | 'race-registration' | 'hire-jockey' | 'invitations' | 'my-registrations'

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function horseAvatarUrl(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % 50;
  return `https://loremflickr.com/400/400/horse?lock=${idx}`;
}

function statusConfig(status: string) {
  const map: Record<string, { cls: string; label: string; icon: any; dotCls: string; badgeCls: string }> = {
    PENDING:  { cls: 'border-amber-500/30 bg-amber-500/10 text-amber-600',  label: 'Chờ duyệt', icon: <AlertTriangle className="w-3 h-3 mr-1" />, dotCls: 'pending', badgeCls: 'hm-badge-pending' },
    APPROVED: { cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600', label: 'Đã duyệt', icon: <Check className="w-3 h-3 mr-1" />, dotCls: 'approved', badgeCls: 'hm-badge-approved' },
    REJECTED: { cls: 'border-red-500/30 bg-red-500/10 text-red-600', label: 'Bị từ chối', icon: <X className="w-3 h-3 mr-1" />, dotCls: 'rejected', badgeCls: 'hm-badge-rejected' },
    CONFIRMED: { cls: 'border-violet-500/30 bg-violet-500/10 text-violet-400', label: 'Đã chốt', icon: <Check className="w-3 h-3 mr-1" />, dotCls: 'confirmed', badgeCls: 'hm-badge-confirmed' },
  }
  return map[status] ?? { cls: 'border-slate-500/30 bg-slate-500/10 text-slate-400', label: status, icon: null, dotCls: '', badgeCls: 'hm-badge-muted' }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function HorsesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('my-horses')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [horses, setHorses] = useState<Horse[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [jockeys, setJockeys] = useState<Jockey[]>([])
  const [invitations, setInvitations] = useState<any[]>([])

  const [selectedHorseId, setSelectedHorseId] = useState<string>('')
  const [jockeySearch, setJockeySearch] = useState<string>('')
  const [inviteRaceId, setInviteRaceId] = useState<string>('')
  const [registrations, setRegistrations] = useState<{ race: Race; horseId: string; horseName: string; status: string; rejectionReason?: string; confirmedByOwner?: boolean; registrationId?: string; jockeyId?: any; raceId?: string; id?: string; _id?: string }[]>([])
  // Races that the selected horse has APPROVED registration for (used in hire-jockey tab)
  const [horseRegisteredRaces, setHorseRegisteredRaces] = useState<{ raceId: string; raceName: string; status: string }[]>([])

  // Pagination
  const [horsePage, setHorsePage] = useState(1)
  const PAGE_SIZE = 6
  
  const [jockeyPage, setJockeyPage] = useState(1)
  const JOCKEY_PAGE_SIZE = 20

  const [occupiedJockeys, setOccupiedJockeys] = useState<Set<string>>(new Set())

  // Update occupied jockeys when the selected race or horse changes
  useEffect(() => {
    if (!inviteRaceId) {
      setOccupiedJockeys(new Set())
      return
    }
    let isMounted = true
    getRaceHorses(inviteRaceId)
      .then(list => {
        if (!isMounted) return
        const busy = new Set<string>()
        list.forEach((entry: any) => {
          // If a jockey is confirmed for a horse that is NOT the currently selected horse
          if (entry.jockeyId && String(entry.horseId).trim() !== String(selectedHorseId).trim()) {
            if (entry.status === 'CONFIRMED' || entry.registrationStatus === 'CONFIRMED') {
              busy.add(String(entry.jockeyId).trim())
              if (entry.jockey?.userId?._id) busy.add(String(entry.jockey.userId._id).trim())
              if (entry.jockey?.userId?.id) busy.add(String(entry.jockey.userId.id).trim())
              if (typeof entry.jockey?.userId === 'string') busy.add(String(entry.jockey.userId).trim())
            }
          }
        })
        setOccupiedJockeys(busy)
      })
      .catch(console.error)
    return () => { isMounted = false }
  }, [inviteRaceId, selectedHorseId])

  const [showHorseModal, setShowHorseModal] = useState(false)
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null)
  const [horseForm, setHorseForm] = useState({
    name: '', breed: '', age: 3, weight: 450, color: '', gender: 'MALE' as 'MALE' | 'FEMALE', origin: '', healthCertUrl: '',
  })

  // Horse Results Modal
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [horseResults, setHorseResults] = useState<any>(null)
  const [loadingResults, setLoadingResults] = useState(false)
  const [resultsSortColumn, setResultsSortColumn] = useState<string | undefined>()
  const [resultsSortDirection, setResultsSortDirection] = useState<SortDirection>(null)
  const [resultsFilters, setResultsFilters] = useState<Record<string, string>>({})
  const [resultsPage, setResultsPage] = useState(1)

  // Filters for My Registrations tab
  const [regFilterHorse, setRegFilterHorse] = useState<string>('')
  const [regFilterStatus, setRegFilterStatus] = useState<string>('')
  const [regFilterTournament, setRegFilterTournament] = useState<string>('')

  // Filter for Race Registration tab
  const [raceFilterTournament, setRaceFilterTournament] = useState<string>('')

  // Filter for Invitations tab
  const [invFilterStatus, setInvFilterStatus] = useState<string>('')
  const [invFilterTournament, setInvFilterTournament] = useState<string>('')

  const derivedTournaments = useMemo(() => {
    const map = new Map<string, string>()
    races.forEach(r => {
      const t = r.tournamentId as any
      if (t?.id && t?.name) map.set(t.id, t.name)
      else if (t?._id && t?.name) map.set(t._id, t.name)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [races])

  const handleResultsSort = (columnId: string, direction: SortDirection) => {
    setResultsSortColumn(columnId)
    setResultsSortDirection(direction)
  }

  const handleResultsFilterChange = (columnId: string, value: string) => {
    setResultsFilters(prev => ({ ...prev, [columnId]: value }))
    setResultsPage(1)
  }

  const { addToast } = useAnimatedToast()
  
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    addToast({ message, type })
  }

  useEffect(() => { loadData() }, [activeTab])

  useEffect(() => {
    if ((activeTab === 'invitations' || activeTab === 'hire-jockey') && selectedHorseId) {
      getHorseJockeys(selectedHorseId).then(setInvitations).catch(() => setInvitations([]))
    }
  }, [selectedHorseId, activeTab])

  // When horse changes in hire-jockey tab, load the races that horse is approved for
  useEffect(() => {
    if (activeTab !== 'hire-jockey' || !selectedHorseId) {
      setHorseRegisteredRaces([])
      setInviteRaceId('')
      return
    }
    
    // Filter registrations for the selected horse
    const approved = registrations
      .filter((r) => String(r.horseId).trim() === String(selectedHorseId).trim())
      .map((r) => ({
        raceId: r.race.id,
        raceName: r.race.name,
        status: r.status,
      }))
    
    setHorseRegisteredRaces(approved)
    if (approved.length > 0) {
      setInviteRaceId(approved[0].raceId)
    } else {
      setInviteRaceId('')
    }
  }, [selectedHorseId, activeTab, registrations])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    const partialErrors: string[] = []
    try {
      const hList = await getHorses().catch(() => { partialErrors.push('Không tải được danh sách ngựa'); return [] })
      setHorses(hList)
      
      const rList = await getRaces().catch(() => { partialErrors.push('Không tải được danh sách giải đấu'); return [] })
      const jList = await searchJockeys({ limit: 100 }).catch(() => { partialErrors.push('Không tải được danh sách nài ngựa'); return [] })
      setJockeys(jList)
      
      // Load registrations for our horses in all races for synchronization
      const myHorseIds = new Set(hList.map((h) => String(h.id || h._id)))
      const regs: { race: Race; horseId: string; horseName: string; status: string; rejectionReason?: string; confirmedByOwner?: boolean; registrationId?: string; jockeyId?: any }[] = []
      
      await Promise.all(
        rList.map(async (race) => {
          try {
            const matched = await getRaceHorses(race.id)
            matched.forEach((entry: any) => {
              const horseId = String(entry.horseId || '').trim()
              if (myHorseIds.has(horseId)) {
                const matchedHorse = hList.find((h) => String(h.id || h._id) === horseId)
                regs.push({
                  race,
                  horseId,
                  horseName: matchedHorse?.name || entry.horse?.name || 'Ngựa',
                  status: entry.status || entry.registrationStatus || 'PENDING',
                  confirmedByOwner: entry.confirmedByOwner,
                  rejectionReason: entry.rejectionReason,
                  registrationId: entry.registrationId || entry.id || entry._id,
                  jockeyId: entry.jockeyId || entry.jockey?._id || entry.jockey?.id || entry.jockey
                })
              }
            })
          } catch {
            console.warn(`Error loading horses for race ${race.id}`)
            partialErrors.push(`Lỗi tải dữ liệu cho giải đấu: ${race.name}`)
          }
        })
      )
      setRegistrations(regs)

      if (hList.length > 0) {
        const firstId = String(hList[0].id || hList[0]._id || '')
        setSelectedHorseId((prev) => {
          const prevStr = String(prev || '')
          return prevStr && hList.some((h) => String(h.id || h._id) === prevStr) ? prevStr : firstId
        })
      }

      if (activeTab === 'race-registration') {
        setRaces(rList.filter((r) => r.status === 'SCHEDULED'))
      } else if (activeTab === 'hire-jockey') {
        const availableRaces = rList.filter((race) => ['SCHEDULED', 'CONFIRMED', 'UPCOMING'].includes(race.status?.toUpperCase() || ''))
        setRaces(availableRaces)
        if (availableRaces.length > 0 && !inviteRaceId) {
          setInviteRaceId(String(availableRaces[0].id || availableRaces[0]._id))
        }
        if (selectedHorseId) {
          const iList = await getHorseJockeys(selectedHorseId).catch(() => { partialErrors.push('Không tải được lời mời'); return [] })
          setInvitations(iList)
        }
      } else if (activeTab === 'invitations' && selectedHorseId) {
        const iList = await getHorseJockeys(selectedHorseId).catch(() => { partialErrors.push('Không tải được lời mời'); return [] })
        setInvitations(iList)
        setRaces(rList)
      } else {
        setRaces(rList)
      }

      if (partialErrors.length > 0) {
        const uniqueErrors = Array.from(new Set(partialErrors))
        setError(`Đã xảy ra một số lỗi: ${uniqueErrors.join(', ')}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Horse CRUD ──────────────────────────────────────────────────────────────
  const [formError, setFormError] = useState<string | null>(null)

  const openHorseModal = (h: Horse | null) => {
    setSelectedHorse(h)
    setFormError(null)
    setHorseForm(
      h
        ? { name: h.name, breed: h.breed || '', age: h.age || 0, weight: h.weight || 0, color: h.color || '', gender: h.gender || 'MALE', origin: h.origin || '', healthCertUrl: h.healthCertUrl || '' }
        : { name: '', breed: '', age: 3, weight: 450, color: '', gender: 'MALE', origin: '', healthCertUrl: '' },
    )
    setShowHorseModal(true)
  }

  const handleSaveHorse = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (horseForm.name.trim().length < 2) {
      setFormError('Tên ngựa phải có ít nhất 2 ký tự')
      return
    }
    if (horseForm.age < 1 || horseForm.age > 30) {
      setFormError('Tuổi ngựa phải từ 1 đến 30')
      return
    }
    if (horseForm.weight < 200 || horseForm.weight > 700) {
      setFormError('Cân nặng phải từ 200kg đến 700kg')
      return
    }

    try {
      const payload = { ...horseForm };
      if (!payload.healthCertUrl || payload.healthCertUrl.trim() === '') {
        payload.healthCertUrl = 'https://example.com/no-cert-provided.pdf';
      }

      if (selectedHorse) {
        await updateHorse(selectedHorse.id, payload)
        showToast(`Đã cập nhật thông tin ngựa ${horseForm.name}`)
      } else {
        await createHorse(payload)
        showToast(`Đã thêm ngựa ${horseForm.name} — Đang chờ Admin duyệt`)
      }
      setShowHorseModal(false)
      loadData()
    } catch (err: any) {
      let errorMsg = err.response?.data?.message;
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.join(', ');
      }
      showToast(errorMsg || 'Lỗi khi lưu hồ sơ ngựa', 'error')
    }
  }

  const handleDeleteHorse = async (id: string, name: string) => {
    if (!window.confirm(`Xóa ngựa "${name}"?`)) return
    try {
      await deleteHorse(id)
      showToast(`Đã xóa ngựa ${name}`)
      loadData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa (Ngựa đang tham gia cuộc đua)', 'error')
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleRegisterRace = async (race: Race) => {
    if (!selectedHorseId) return showToast('Vui lòng chọn ngựa', 'warning')
    const horse = horses.find((h) => String(h.id || h._id) === selectedHorseId)
    if (horse?.status !== 'APPROVED') return showToast('Chỉ ngựa đã được Admin duyệt mới có thể đăng ký', 'warning')
    try {
      await registerHorseRace(selectedHorseId, race.id)
      showToast(`Đã đăng ký ngựa vào "${race.name}"`)
      loadData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể đăng ký cuộc đua', 'error')
    }
  }

  const handleInviteJockey = async (jockeyId: string, jockeyName: string) => {
    if (!selectedHorseId) return showToast('Vui lòng chọn ngựa', 'warning')
    if (!inviteRaceId) return showToast('Vui lòng chọn cuộc đua', 'warning')

    const cleanHorseId = String(selectedHorseId).trim()
    const cleanRaceId = String(inviteRaceId).trim()
    const cleanJockeyId = String(jockeyId).trim()

    const horse = horses.find((h) => String(h.id || h._id).trim() === cleanHorseId)
    const race = races.find((r) => String(r.id || r._id).trim() === cleanRaceId)
    const registeredRace = horseRegisteredRaces.find((r) => r.raceId === cleanRaceId)
    
    if (!horse) return showToast('Ngựa không hợp lệ. Vui lòng chọn ngựa khác.', 'error')
    if (!race && !registeredRace) return showToast('Cuộc đua không hợp lệ. Vui lòng chọn lại cuộc đua.', 'error')

    let registeredEntry: any = undefined
    try {
      const raceHorses = await getRaceHorses(cleanRaceId)
      const entries = Array.isArray(raceHorses) ? raceHorses : (raceHorses.horses || [])

      registeredEntry = entries.find((entry: any) => {
        const entryHorseId = String(
          entry.horseId ||
          (entry.horse && (entry.horse._id || entry.horse.id)) ||
          entry._id ||
          entry.id ||
          ''
        ).trim()
        return entryHorseId === cleanHorseId
      })

      if (!registeredEntry) {
        return showToast('Ngựa chưa đăng ký cuộc đua này. Vui lòng đăng ký (tab Đăng Ký Đua) trước khi mời Jockey.', 'warning')
      }

      const regStatus = String(registeredEntry.status || registeredEntry.registrationStatus || '').toUpperCase()
      if (regStatus === 'PENDING' || regStatus === 'PENDING_APPROVAL') {
        return showToast('Đăng ký đang chờ Admin duyệt. Vui lòng đợi Admin duyệt trước khi mời Jockey.', 'warning')
      }
      if (regStatus === 'REJECTED') {
        return showToast('Đăng ký đã bị từ chối. Bạn không thể mời Jockey cho cuộc đua này.', 'error')
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        return 
      }
      const errMsg = error?.response?.data?.message || error?.message || 'Lỗi kiểm tra đăng ký'
      return showToast(`Không thể xác minh trạng thái đăng ký: ${errMsg}. Vui lòng đăng ký ngựa vào cuộc đua trước.`, 'error')
    }

    try {
      const regId = registeredEntry?.registrationId || registeredEntry?.id || ''
      const raceNameStr = race?.name || registeredEntry?.raceName || ''
      const fullMessage = `Mời bạn cưỡi ngựa của tôi|RACE_ID:${cleanRaceId}`
      await sendJockeyInvitation(cleanHorseId, cleanJockeyId, cleanRaceId, fullMessage, regId, raceNameStr)
      showToast(`Đã gửi lời mời đến Jockey ${jockeyName}`)
      
      // Cập nhật UI ngay lập tức (Optimistic update)
      setInvitations(prev => {
        const exists = prev.find(i => String(i.jockeyId?._id || i.jockeyId) === cleanJockeyId && String(i.raceId?._id || i.raceId) === cleanRaceId)
        if (exists) return prev;
        return [...prev, {
          id: 'temp-' + Date.now(),
          jockeyId: cleanJockeyId,
          raceId: cleanRaceId,
          status: 'PENDING'
        } as any]
      })
      
      // Tải lại danh sách lời mời ngầm để đảm bảo đồng bộ
      getHorseJockeys(cleanHorseId).then(setInvitations).catch(() => {})
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Không thể gửi lời mời. Vui lòng kiểm tra lại trạng thái ngựa và cuộc đua.'
      showToast(msg, 'error')
    }
  }

  const handleConfirmJockey = async (jockeyId: string, raceId: string, jockeyName: string, inviteId: string) => {
    if (!selectedHorseId) return
    try {
      await confirmJockey(selectedHorseId, jockeyId, raceId)
      showToast(`Đã chốt Jockey ${jockeyName} thành công!`)
      
      // OPTIMISTIC UPDATE: Update UI instantly without waiting for backend cache
      setInvitations(prev => prev.map(inv => {
        if (String(inv.id || inv._id) === String(inviteId)) {
          return { ...inv, status: 'CONFIRMED' }
        }
        return inv
      }))
      
      setRegistrations(prev => prev.map(reg => {
        if (String(reg.horseId).trim() === String(selectedHorseId).trim() && 
            (String(reg.race?.id || reg.race?._id || reg.raceId || '').trim() === raceId || 
             String(reg.registrationId || reg.id || reg._id).trim() === raceId)) {
          return { ...reg, jockeyId: jockeyId }
        }
        return reg
      }))

      // Wait briefly to allow backend DB transactions and hooks to finish
      await new Promise(resolve => setTimeout(resolve, 500))
      await loadData()
      const newInvites = await getHorseJockeys(selectedHorseId)
      
      // Merge optimistic status into fresh data in case of backend cache delay
      setInvitations(prevOpt => {
        return newInvites.map(newInv => {
          const oldInv = prevOpt.find(i => i.id === newInv.id)
          if (oldInv && oldInv.status === 'CONFIRMED' && newInv.status !== 'CONFIRMED') {
            return { ...newInv, status: 'CONFIRMED' }
          }
          return newInv
        })
      })
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể chốt Jockey', 'error')
    }
  }

  const handleConfirmRace = async (horseId: string, raceId: string) => {
    try {
      setLoading(true)
      await confirmRaceParticipation(horseId, raceId)
      showToast('Đã xác nhận tham gia đua thành công!')
      loadData()
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const openHorseResults = async (horseId: string, horseName: string) => {
    setShowResultsModal(true)
    setLoadingResults(true)
    setHorseResults({ horseName, stats: null, results: [] })
    try {
      const data = await getHorseResults(horseId)
      setHorseResults(data)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể tải kết quả', 'error')
    } finally {
      setLoadingResults(false)
    }
  }

  const filteredJockeys = jockeys
    .filter((j) => {
      const name = (j.userId?.fullName || j.userId?.name || '').toLowerCase()
      if (!name.includes(jockeySearch.toLowerCase())) return false
      
      const jockeyIdStr = String(j.id).trim()
      const userIdStr1 = String(j.userId?._id || '').trim()
      const userIdStr2 = String(j.userId?.id || '').trim()
      const userIdStr3 = String(j.userId || '').trim()
      
      if (occupiedJockeys.has(jockeyIdStr) || 
          (userIdStr1 && occupiedJockeys.has(userIdStr1)) || 
          (userIdStr2 && occupiedJockeys.has(userIdStr2)) || 
          (userIdStr3 && occupiedJockeys.has(userIdStr3))) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      if (dateA !== dateB) return dateB - dateA
      return String(b.id).localeCompare(String(a.id))
    })

  const selectedHorseObj = horses.find((h) => String(h.id || h._id) === selectedHorseId)

  // Filtered registrations for My Registrations tab
  const filteredRegistrations = registrations.filter(reg => {
    if (regFilterHorse && String(reg.horseId).trim() !== regFilterHorse) return false
    if (regFilterStatus && reg.status !== regFilterStatus) return false
    if (regFilterTournament) {
      const tId = String(reg.race?.tournamentId?.id || reg.race?.tournamentId?._id || '')
      if (tId !== regFilterTournament) return false
    }
    return true
  })

  // Filtered invitations for Invitations tab
  const filteredInvitations = invitations.filter(inv => {
    if (invFilterStatus && inv.status !== invFilterStatus) return false
    if (invFilterTournament) {
      const tId = inv.raceId?.tournamentId?.id || inv.raceId?.tournamentId?._id || inv.race?.tournamentId?.id || inv.race?.tournamentId?._id
      if (tId && String(tId) !== invFilterTournament) return false
    }
    return true
  })

  // Filtered races for Race Registration tab
  const filteredRaces = races
    .filter(r => {
      const scheduledTime = new Date(r.scheduledAt).getTime()
      const now = Date.now()
      if (scheduledTime < now) return false
      
      if (!raceFilterTournament) return true
      const tId = String(r.tournamentId?.id || r.tournamentId?._id || '')
      return tId === raceFilterTournament
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="hm-page space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <ScrollReveal direction="up" distance={60} duration={0.8}>
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(16,185,129,0.15))', border: '1px solid rgba(139,92,246,0.25)' }}>
                <Sparkles className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[color:var(--text)] m-0 tracking-tight">Quản Lý Ngựa</h1>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Quản lý đàn ngựa, đăng ký thi đấu và tuyển Jockey chuyên nghiệp
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'my-horses' && (
              <Magnetic intensity={0.2}>
                <button onClick={() => openHorseModal(null)} className="hm-btn-cta violet">
                  <Plus className="w-4 h-4" /> Thêm Ngựa Mới
                </button>
              </Magnetic>
            )}
            <button onClick={loadData} disabled={loading} className="hm-btn-cta bg-[var(--surface-3)] text-[var(--text-2)] shadow-none border border-[var(--border)] hover:bg-[var(--surface-2)]">
              <RefreshCw className={`w-4 h-4 text-[var(--text-2)] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v: any) => startTransition(() => setActiveTab(v))}>
        <ScrollReveal direction="up" distance={20} duration={0.5} delay={0.1}>
          <div className="mb-8">
            <TabsList className="!bg-[var(--surface-2)] border border-[var(--border)] p-1.5 rounded-2xl shadow-inner flex flex-wrap gap-1 h-auto w-fit m-0 backdrop-blur-md">
              <TabsTrigger value="my-horses" className="py-2.5 px-4 rounded-xl font-bold transition-all text-sm text-[var(--text-2)] data-active:!bg-[var(--surface)] data-active:!text-[var(--primary)] data-active:!shadow-sm"><Trophy className="w-4 h-4 mr-2" /> Hồ Sơ Ngựa</TabsTrigger>
              <TabsTrigger value="race-registration" className="py-2.5 px-4 rounded-xl font-bold transition-all text-sm text-[var(--text-2)] data-active:!bg-[var(--surface)] data-active:!text-[var(--primary)] data-active:!shadow-sm"><Zap className="w-4 h-4 mr-2" /> Đăng Ký Đua</TabsTrigger>
              <TabsTrigger value="my-registrations" className="py-2.5 px-4 rounded-xl font-bold transition-all text-sm text-[var(--text-2)] data-active:!bg-[var(--surface)] data-active:!text-[var(--primary)] data-active:!shadow-sm">
                <FileCheck className="w-4 h-4 mr-2" /> Đã Đăng Ký
                {registrations.length > 0 && <span className="hm-tab-count">{registrations.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="hire-jockey" className="py-2.5 px-4 rounded-xl font-bold transition-all text-sm text-[var(--text-2)] data-active:!bg-[var(--surface)] data-active:!text-[var(--primary)] data-active:!shadow-sm"><Users className="w-4 h-4 mr-2" /> Tuyển Jockey</TabsTrigger>
              <TabsTrigger value="invitations" className="py-2.5 px-4 rounded-xl font-bold transition-all text-sm text-[var(--text-2)] data-active:!bg-[var(--surface)] data-active:!text-[var(--primary)] data-active:!shadow-sm">
                <Send className="w-4 h-4 mr-2" /> Lời Mời
                {invitations.length > 0 && <span className="hm-tab-count">{invitations.length}</span>}
              </TabsTrigger>
            </TabsList>
          </div>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: Hồ Sơ Ngựa (My Horses)
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="my-horses">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="hm-skeleton h-72 rounded-2xl" />
              ))}
            </div>
          ) : horses.length === 0 ? (
            <div className="hm-empty">
              <div className="hm-empty-icon">🐴</div>
              <h3 className="text-xl font-bold text-[color:var(--text)] mb-2">Chưa có ngựa nào</h3>
              <p className="text-sm font-medium mb-6" style={{ color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto 24px' }}>Bạn cần thêm hồ sơ ngựa để có thể đăng ký tham gia các giải đấu hấp dẫn.</p>
              <button onClick={() => openHorseModal(null)} className="hm-btn-cta violet">
                <Plus className="w-4 h-4" /> Thêm ngựa ngay
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {horses.slice((horsePage - 1) * PAGE_SIZE, horsePage * PAGE_SIZE).map((h, index) => {
                  const sc = statusConfig(h.status || 'PENDING')
                  return (
                    <ScrollReveal key={h.id} direction="up" distance={40} duration={0.6} delay={index * 0.08}>
                      <div className="hm-glass-card hm-glass-card-hover h-full flex flex-col group">
                        {/* Horse Header */}
                        <div className="p-5 flex items-start gap-4">
                          <img src={horseAvatarUrl(h.name)} alt={h.name} className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform duration-300" style={{ border: '2px solid var(--text-muted)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h3 className="font-extrabold text-lg text-[color:var(--text)] truncate m-0">{h.name}</h3>
                              <span className={`hm-badge ${sc.badgeCls} text-[10px]`}>
                                <span className={`hm-status-dot ${sc.dotCls}`} /> {sc.label}
                              </span>
                            </div>
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-muted)' }}>{h.breed || 'Không rõ giống'} · {h.origin || 'Không rõ xuất xứ'}</p>
                            <div className="flex gap-2 mt-3">
                              <span className="hm-badge hm-badge-info text-[10px] py-0.5 px-2"><Activity className="w-3 h-3 mr-0.5" /> {(h as any).stats?.races ?? 0} trận</span>
                              <span className="hm-badge hm-badge-pending text-[10px] py-0.5 px-2"><Trophy className="w-3 h-3 mr-0.5" /> {(h as any).stats?.wins ?? 0} thắng</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="px-5 pb-3">
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { val: h.age, label: 'Tuổi' },
                              { val: `${h.weight}`, label: 'Kg' },
                              { val: h.gender === 'MALE' ? 'Đực' : 'Cái', label: 'Giới Tính' },
                            ].map((s, si) => (
                              <div key={si} className="text-center py-2 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                                <div className="font-extrabold text-sm text-[color:var(--text)]">{s.val}</div>
                                <div className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--text-muted)]">{s.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-auto px-5 py-3.5 flex items-center justify-between" style={{ borderTop: '1px solid var(--text-muted)' }}>
                          {h.healthCertUrl ? (
                            <a href={h.healthCertUrl} target="_blank" rel="noreferrer" className="text-xs font-bold flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: '#34d399' }}>
                              <ShieldCheck className="w-4 h-4" /> Sức Khỏe
                            </a>
                          ) : (
                            <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#fbbf24' }}><AlertTriangle className="w-4 h-4" /> Chưa duyệt</span>
                          )}
                          <div className="flex gap-1.5">
                            <button className="p-1.5 rounded-lg transition-all hover:scale-110" style={{ color: '#a78bfa', background: 'rgba(139,92,246,0.08)' }} onClick={() => openHorseResults(h.id, h.name)} title="Kết quả">
                              <TrendingUp className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded-lg transition-all hover:scale-110" style={{ color: '#60a5fa', background: 'rgba(59,130,246,0.08)' }} onClick={() => openHorseModal(h)} title="Chỉnh sửa">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded-lg transition-all hover:scale-110" style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)' }} onClick={() => handleDeleteHorse(h.id, h.name)} title="Xóa">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
              {horses.length > PAGE_SIZE && (
                <div className="mt-8 flex justify-center">
                  <Pagination total={horses.length} page={horsePage} pageSize={PAGE_SIZE} onChange={setHorsePage} />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: Đăng Ký Đua (Race Registration)
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="race-registration">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Sidebar Control Panel */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-[90px]">
              
              {/* Horse Selector Section */}
              <div className="hm-glass-card p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Chọn Ngựa Tham Gia</span>
                  </div>
                  {selectedHorseObj && selectedHorseObj.status !== 'APPROVED' && (
                    <span className="hm-badge hm-badge-rejected text-[10px]"><AlertTriangle className="w-3 h-3" /> Chưa Duyệt</span>
                  )}
                </div>

                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 hm-sidebar-horses">
                  {horses.map((h) => {
                    const isActive = String(h.id || h._id) === selectedHorseId
                    const sc = statusConfig(h.status || 'PENDING')
                    return (
                      <div
                        key={h.id}
                        className={`hm-horse-vertical-item ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedHorseId(String(h.id || h._id))}
                      >
                        <img src={horseAvatarUrl(h.name)} alt={h.name} className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/10" />
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-sm text-[color:var(--text)] truncate">{h.name}</div>
                          <div className="text-[10.5px] font-medium text-[color:var(--text-muted)] truncate mb-0.5">{h.breed || 'Không rõ giống'}</div>
                          <div className="flex items-center gap-1.5">
                            <span className={`hm-status-dot ${sc.dotCls}`} style={{ width: 6, height: 6 }} />
                            <span className="text-[10px] font-bold text-[color:var(--text-muted)]">{sc.label}</span>
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/40 shrink-0">
                            <Check className="w-3 h-3 text-violet-400" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Tournament Filter Section */}
              <div className="hm-glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Giải Đấu</span>
                </div>
                <select 
                  className="hm-sidebar-select" 
                  value={raceFilterTournament} 
                  onChange={(e) => setRaceFilterTournament(e.target.value)}
                >
                  <option value="">🏆 Tất cả giải đấu</option>
                  {derivedTournaments.map((t) => (
                    <option key={t.id} value={t.id}>🏁 {t.name}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Right Showcase: Races Grid */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded bg-violet-500" />
                  <h3 className="text-lg font-black text-[color:var(--text)] tracking-tight">Danh Sách Cuộc Đua Sắp Tới</h3>
                </div>
                <div className="text-xs font-bold text-[color:var(--text-2)] bg-[var(--surface-3)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                  Có <span className="text-violet-400 font-extrabold">{filteredRaces.length}</span> cuộc đua
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="hm-skeleton h-48 rounded-2xl" />)}
                </div>
              ) : filteredRaces.length === 0 ? (
                <div className="hm-empty">
                  <div className="hm-empty-icon">🏁</div>
                  <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">Không có cuộc đua nào khả dụng</h3>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Hiện không có cuộc đua nào đang trong trạng thái mở đăng ký theo bộ lọc này.</p>
                  {error && <div className="text-red-400 text-xs mt-3 font-semibold">{error}</div>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRaces.map((r, idx) => {
                    const reg = registrations.find((reg) => reg.race.id === r.id && String(reg.horseId).trim() === String(selectedHorseId).trim())
                    const isRegistered = !!reg
                    const status = String(reg?.status || '').toUpperCase()

                    return (
                      <ScrollReveal key={r.id} direction="up" distance={16} delay={idx * 0.04}>
                        <div className="hm-race-card-modern">
                          {/* Header / Tournament */}
                          <div className="hm-race-card-badge-container">
                            {r.tournamentId?.name ? (
                              <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20 truncate max-w-[70%]">
                                🏆 {r.tournamentId.name}
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-[color:var(--text-muted)] bg-[var(--surface-3)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                                Giải đấu lẻ
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-[color:var(--text-muted)]">
                              Max: {r.maxHorses} 🐴
                            </span>
                          </div>

                          {/* Race Title */}
                          <h4 className="hm-race-card-title truncate" title={r.name}>
                            {r.name}
                          </h4>

                          {/* Stats Grid */}
                          <div className="hm-race-card-stats">
                            <div className="hm-race-card-stat-item">
                              <div className="hm-race-card-stat-icon-wrapper">
                                <CalendarRange className="w-3.5 h-3.5" />
                              </div>
                              <div className="hm-race-card-stat-text">
                                <span className="hm-race-card-stat-label">Thời gian</span>
                                <span className="hm-race-card-stat-value truncate" title={new Date(r.scheduledAt).toLocaleString('vi-VN')}>
                                  {new Date(r.scheduledAt).toLocaleDateString('vi-VN')} {new Date(r.scheduledAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            </div>

                            <div className="hm-race-card-stat-item">
                              <div className="hm-race-card-stat-icon-wrapper" style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.15)' }}>
                                <MapPin className="w-3.5 h-3.5" />
                              </div>
                              <div className="hm-race-card-stat-text">
                                <span className="hm-race-card-stat-label">Quãng đường</span>
                                <span className="hm-race-card-stat-value">{r.distance}m</span>
                              </div>
                            </div>

                            <div className="hm-race-card-stat-item" style={{ gridColumn: 'span 2' }}>
                              <div className="hm-race-card-stat-icon-wrapper" style={{ color: '#fb923c', background: 'rgba(251,146,60,0.1)', borderColor: 'rgba(251,146,60,0.15)' }}>
                                <Trophy className="w-3.5 h-3.5" />
                              </div>
                              <div className="hm-race-card-stat-text">
                                <span className="hm-race-card-stat-label">Giải thưởng thứ nhất</span>
                                <span className="hm-race-card-stat-value text-amber-400 font-extrabold">
                                  {r.prizeFirst?.toLocaleString('vi-VN')} đ
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button at the bottom */}
                          <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center justify-end w-full">
                            {!selectedHorseId ? (
                              <button disabled className="hm-btn-cta w-full" style={{ opacity: 0.3, cursor: 'not-allowed', background: 'var(--text-muted)', boxShadow: 'none' }}>
                                Chọn ngựa trước
                              </button>
                            ) : selectedHorseObj && selectedHorseObj.status !== 'APPROVED' ? (
                              <span className="hm-badge hm-badge-rejected text-[11px] w-full justify-center">
                                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Yêu cầu ngựa đã duyệt
                              </span>
                            ) : !isRegistered ? (
                              <button onClick={() => handleRegisterRace(r)} className="hm-btn-cta w-full">
                                <Zap className="w-4 h-4 mr-1" /> Ghi Danh Ngay
                              </button>
                            ) : (status === 'PENDING' || status === 'PENDING_APPROVAL') ? (
                              <div className="flex flex-col items-center justify-center w-full gap-1">
                                <span className="hm-badge hm-badge-pending w-full justify-center"><Clock className="w-3.5 h-3.5 mr-1" /> Đang chờ duyệt</span>
                              </div>
                            ) : status === 'APPROVED' && !reg.confirmedByOwner ? (
                              <div className="flex flex-col items-center w-full gap-1.5">
                                <span className="hm-badge hm-badge-approved w-full justify-center"><Check className="w-3.5 h-3.5 mr-1" /> Đã duyệt (Chờ xác nhận)</span>
                                <button onClick={() => handleConfirmRace(selectedHorseId, r.id)} className="hm-btn-cta hm-attention-pulse text-xs py-1.5 px-3 w-full justify-center">
                                  <Check className="w-3.5 h-3.5 mr-1" /> Xác nhận đua
                                </button>
                              </div>
                            ) : status === 'CONFIRMED' || (status === 'APPROVED' && reg.confirmedByOwner) ? (
                              <div className="flex flex-col items-center justify-center w-full gap-1">
                                <span className="hm-badge hm-badge-confirmed w-full justify-center"><Check className="w-3.5 h-3.5 mr-1" /> Đã chốt đua</span>
                              </div>
                            ) : status === 'REJECTED' ? (
                              <div className="flex flex-col items-center justify-center w-full gap-1">
                                <span className="hm-badge hm-badge-rejected w-full justify-center"><X className="w-3.5 h-3.5 mr-1" /> Bị từ chối</span>
                                {reg.rejectionReason && (
                                  <span className="text-[10px] font-semibold truncate max-w-full text-red-400" title={reg.rejectionReason}>
                                    Lý do: {reg.rejectionReason}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button onClick={() => handleRegisterRace(r)} className="hm-btn-cta w-full">
                                <Zap className="w-4 h-4 mr-1" /> Ghi Danh Ngay
                              </button>
                            )}
                          </div>
                        </div>
                      </ScrollReveal>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: Đã Đăng Ký (My Registrations)
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="my-registrations">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Sidebar Control Panel */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-[90px]">
              
              {/* Horse Selector Section */}
              <div className="hm-glass-card p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Lọc Theo Ngựa</span>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 hm-sidebar-horses">
                  {/* Option for All Horses */}
                  <div
                    className={`hm-horse-vertical-item ${regFilterHorse === '' ? 'active' : ''}`}
                    onClick={() => setRegFilterHorse('')}
                  >
                    <div className="w-11 h-11 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shrink-0">
                      <Activity className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-sm text-[color:var(--text)] truncate">Tất cả ngựa</div>
                      <div className="text-[10.5px] font-bold text-[color:var(--text-muted)]">Hiển thị mọi hồ sơ</div>
                    </div>
                    {regFilterHorse === '' && (
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/40 shrink-0">
                        <Check className="w-3 h-3 text-violet-400" />
                      </div>
                    )}
                  </div>

                  {horses.map((h) => {
                    const isActive = String(h.id || h._id) === regFilterHorse
                    return (
                      <div
                        key={h.id}
                        className={`hm-horse-vertical-item ${isActive ? 'active' : ''}`}
                        onClick={() => setRegFilterHorse(String(h.id || h._id))}
                      >
                        <img src={horseAvatarUrl(h.name)} alt={h.name} className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/10" />
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-sm text-[color:var(--text)] truncate">{h.name}</div>
                          <div className="text-[10.5px] font-medium text-[color:var(--text-muted)] truncate mb-0.5">{h.breed || 'Không rõ giống'}</div>
                        </div>
                        {isActive && (
                          <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/40 shrink-0">
                            <Check className="w-3 h-3 text-violet-400" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Filters Panel */}
              <div className="hm-glass-card p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Giải Đấu</span>
                  </div>
                  <select 
                    className="hm-sidebar-select" 
                    value={regFilterTournament} 
                    onChange={(e) => setRegFilterTournament(e.target.value)}
                  >
                    <option value="">🏆 Tất cả giải đấu</option>
                    {derivedTournaments.map((t) => (
                      <option key={t.id} value={t.id}>🏁 {t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Trạng Thái</span>
                  </div>
                  <select 
                    className="hm-sidebar-select" 
                    value={regFilterStatus} 
                    onChange={(e) => setRegFilterStatus(e.target.value)}
                  >
                    <option value="">⏳ Tất cả trạng thái</option>
                    <option value="PENDING">Chờ duyệt</option>
                    <option value="APPROVED">Đã duyệt</option>
                    <option value="CONFIRMED">Đã chốt</option>
                    <option value="REJECTED">Bị từ chối</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Right Panel: Content Grid */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded bg-violet-500" />
                  <h3 className="text-lg font-black text-[color:var(--text)] tracking-tight">Lịch Sử Đăng Ký Của Bạn</h3>
                </div>
                <div className="text-xs font-bold text-[color:var(--text-2)] bg-[var(--surface-3)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                  Có <span className="text-violet-400 font-extrabold">{filteredRegistrations.length}</span> lượt đăng ký
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="hm-skeleton h-36 rounded-2xl" />)}
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="hm-empty">
                  <div className="hm-empty-icon">📋</div>
                  <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">Chưa có đăng ký nào</h3>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Đăng ký ngựa vào cuộc đua ở tab "Đăng Ký Đua" để xem tại đây.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRegistrations.map((reg, idx) => {
                    const sc = statusConfig(reg.status)
                    const isPending = reg.status === 'PENDING' || reg.status === 'PENDING_APPROVAL'
                    const isApproved = reg.status === 'APPROVED'
                    const isConfirmed = reg.status === 'CONFIRMED'
                    const isRejected = reg.status === 'REJECTED'

                    return (
                      <ScrollReveal key={idx} direction="up" distance={16} delay={idx * 0.04}>
                        <div className="hm-glass-card hm-glass-card-hover p-5 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex items-start gap-4 mb-3">
                              <img src={horseAvatarUrl(reg.horseName)} alt={reg.horseName} className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/10" />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                  <h4 className="font-extrabold text-[color:var(--text)] text-sm truncate m-0">{reg.horseName}</h4>
                                  <span className={`hm-badge ${sc.badgeCls} text-[9px] shrink-0`}>
                                    <span className={`hm-status-dot ${sc.dotCls}`} style={{ width: 6, height: 6 }} /> {sc.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-violet-400 truncate">
                                  🏆 {reg.race.name}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--border)]">
                              <div className="p-2 rounded-lg bg-[var(--surface-3)] border border-[var(--border)]">
                                <span className="block text-[8px] font-extrabold uppercase text-[color:var(--text-muted)] tracking-wider">Thời gian</span>
                                <span className="text-[10px] font-bold text-[color:var(--text-2)] truncate block">
                                  {new Date(reg.race.scheduledAt).toLocaleDateString('vi-VN')} {new Date(reg.race.scheduledAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-[var(--surface-3)] border border-[var(--border)]">
                                <span className="block text-[8px] font-extrabold uppercase text-[color:var(--text-muted)] tracking-wider">Quãng đường</span>
                                <span className="text-[10px] font-bold text-[color:var(--text-2)] block">{reg.race.distance}m</span>
                              </div>
                            </div>
                          </div>

                          {/* Status detail + actions */}
                          <div className="mt-4 pt-3 border-t border-[var(--border)]">
                            <div className="text-[10px] font-bold text-[color:var(--text-muted)] flex items-center justify-between">
                              <span>Trạng thái:</span>
                              <span className="text-[color:var(--text-2)]">
                                {isPending && '⏳ Đang chờ Admin duyệt'}
                                {isApproved && (reg.confirmedByOwner ? '✅ Đã xác nhận tham gia' : '⚠️ Cần xác nhận tham gia')}
                                {isConfirmed && '🏆 Đã chốt danh sách'}
                                {isRejected && '❌ Đăng ký bị từ chối'}
                              </span>
                            </div>

                            {isRejected && reg.rejectionReason && (
                              <div className="mt-2 text-[10px] font-bold px-2.5 py-1.5 rounded-lg text-red-400 bg-red-500/10 border border-red-500/20 max-w-full truncate" title={reg.rejectionReason}>
                                Lý do: {reg.rejectionReason}
                              </div>
                            )}

                            {isApproved && !reg.confirmedByOwner && (
                              <button onClick={() => handleConfirmRace(reg.horseId, reg.race.id)} className="hm-btn-cta mt-3 w-full text-xs py-2 hm-attention-pulse">
                                <Check className="w-3.5 h-3.5 mr-1" /> Xác Nhận Tham Gia
                              </button>
                            )}
                          </div>
                        </div>
                      </ScrollReveal>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 4: Tuyển Jockey (Hire Jockey)
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="hire-jockey">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Sidebar Control Panel */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-[90px]">
              
              {/* Horse Selector Section */}
              <div className="hm-glass-card p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Chọn Ngựa Tuyển Jockey</span>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 hm-sidebar-horses">
                  {horses.map((h) => {
                    const isActive = String(h.id || h._id) === selectedHorseId
                    const sc = statusConfig(h.status || 'PENDING')
                    return (
                      <div
                        key={h.id}
                        className={`hm-horse-vertical-item ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedHorseId(String(h.id || h._id))}
                      >
                        <img src={horseAvatarUrl(h.name)} alt={h.name} className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/10" />
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-sm text-[color:var(--text)] truncate">{h.name}</div>
                          <div className="text-[10.5px] font-medium text-[color:var(--text-muted)] truncate mb-0.5">{h.breed || 'Không rõ giống'}</div>
                          <div className="flex items-center gap-1.5">
                            <span className={`hm-status-dot ${sc.dotCls}`} style={{ width: 6, height: 6 }} />
                            <span className="text-[10px] font-bold text-[color:var(--text-muted)]">{sc.label}</span>
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/40 shrink-0">
                            <Check className="w-3 h-3 text-violet-400" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Controls Panel */}
              <div className="hm-glass-card p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Cuộc Đua Đã Đăng Ký</span>
                  </div>
                  {loading ? (
                    <div className="flex items-center text-xs font-semibold h-10 px-3 rounded-xl bg-slate-900/60 border border-white/10 text-white/40">Đang tải...</div>
                  ) : !selectedHorseId ? (
                    <div className="flex items-center text-xs font-semibold h-10 px-3 rounded-xl bg-slate-900/60 border border-white/10 text-white/40">Chọn ngựa trước</div>
                  ) : horseRegisteredRaces.length === 0 ? (
                    <div className="flex items-center text-xs font-bold h-auto px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Ngựa chưa có cuộc đua được duyệt
                    </div>
                  ) : (
                    <select 
                      className="hm-sidebar-select"
                      value={inviteRaceId} 
                      onChange={(e) => setInviteRaceId(e.target.value)}
                    >
                      <option value="">— Chọn cuộc đua —</option>
                      {horseRegisteredRaces.map((r) => (
                        <option key={r.raceId} value={r.raceId}>
                          🏁 {r.raceName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Tìm Jockey</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      placeholder="Tìm theo tên kỵ sĩ..."
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-slate-900/60 text-sm font-semibold outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                      value={jockeySearch}
                      onChange={(e) => { setJockeySearch(e.target.value); setJockeyPage(1); }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Panel: Showcase Grid */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded bg-violet-500" />
                  <h3 className="text-lg font-black text-[color:var(--text)] tracking-tight">Tìm Kiếm Jockey Chuyên Nghiệp</h3>
                </div>
                <div className="text-xs font-bold text-[color:var(--text-2)] bg-[var(--surface-3)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                  Có <span className="text-violet-400 font-extrabold">{filteredJockeys.length}</span> kỵ sĩ trống lịch
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="hm-skeleton h-56 rounded-2xl" />)}
                </div>
              ) : filteredJockeys.length === 0 ? (
                <div className="hm-empty">
                  <div className="hm-empty-icon">🏇</div>
                  <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">Không tìm thấy Jockey</h3>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Thử nhập tên tìm kiếm khác hoặc đổi lịch cuộc đua.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredJockeys.slice((jockeyPage - 1) * JOCKEY_PAGE_SIZE, jockeyPage * JOCKEY_PAGE_SIZE).map((j, idx) => {
                      const name = j.userId?.fullName || j.userId?.name || 'Jockey'
                      const winRate = j.winRate ?? 0
                      const isAvailable = j.status === 'AVAILABLE'

                      const existingInvite = invitations.find((inv) => {
                        const jockeyMatch = String(inv.jockeyId) === String(j.id) || String(inv.jockeyId) === String(j.userId?._id || j.userId?.id || j.userId);
                        const raceMatch = String(inv.raceId) === String(inviteRaceId);
                        return jockeyMatch && raceMatch;
                      });

                      let inviteState: 'none' | 'pending' | 'accepted' | 'rejected' | 'confirmed' | 'sent' = 'none'
                      if (existingInvite) {
                        if (existingInvite.status === 'PENDING') inviteState = 'pending'
                        else if (existingInvite.status === 'ACCEPTED') inviteState = 'accepted'
                        else if (existingInvite.status === 'REJECTED') inviteState = 'rejected'
                        else if (existingInvite.status === 'CONFIRMED') inviteState = 'confirmed'
                        else inviteState = 'sent'
                      }

                      return (
                        <ScrollReveal key={j.id} direction="up" distance={16} delay={idx * 0.03}>
                          <div className="hm-glass-card hm-glass-card-hover p-5 h-full flex flex-col justify-between items-center text-center">
                            <div className="w-full flex flex-col items-center">
                              {/* Avatar */}
                              <div className={`hm-jockey-avatar ${isAvailable ? 'available' : 'unavailable'} mb-3`}>
                                {name.slice(0, 2).toUpperCase()}
                                <span className={`hm-status-dot ${isAvailable ? 'approved' : ''}`} style={{ position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, border: '2px solid rgba(15,23,42,0.9)' }} />
                              </div>

                              {/* Name + Status */}
                              <div className="w-full min-w-0 mb-3">
                                <h4 className="font-extrabold text-[color:var(--text)] text-sm truncate m-0 mb-0.5">{name}</h4>
                                <span className={`hm-badge ${isAvailable ? 'hm-badge-approved' : 'hm-badge-muted'} text-[9px] py-0.5 px-2`}>
                                  {isAvailable ? 'Sẵn sàng' : 'Bận'}
                                </span>
                              </div>

                              {/* Experience */}
                              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold w-full mb-4" style={{ color: 'var(--text-muted)' }}>
                                <Star className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                {j.experience} năm kinh nghiệm
                              </div>

                              {/* Win Rate */}
                              <div className="w-full mb-3 pt-3 border-t border-[var(--border)]">
                                <div className="flex justify-between text-[10px] font-bold mb-1">
                                  <span style={{ color: 'var(--text-muted)' }}>Tỉ lệ thắng</span>
                                  <span style={{ color: '#fbbf24' }}>{winRate}%</span>
                                </div>
                                <div className="hm-winrate-bar">
                                  <div className="hm-winrate-fill" style={{ width: `${winRate}%` }} />
                                </div>
                                <div className="text-[9px] font-bold mt-1.5 flex justify-between" style={{ color: 'var(--text-muted)' }}>
                                  <span>{j.wins ?? 0}/{j.races ?? 0} thắng</span>
                                  <span>Win Rate</span>
                                </div>
                              </div>
                            </div>

                            {/* Invite Button / State Badge */}
                            <div className="w-full mt-2 pt-3 border-t border-[var(--border)]">
                              {inviteState === 'none' ? (
                                <button
                                  className="hm-btn-cta w-full text-xs py-2"
                                  onClick={() => handleInviteJockey(j.id, name)}
                                  disabled={!isAvailable}
                                  style={!isAvailable ? { opacity: 0.3, cursor: 'not-allowed', background: 'var(--text-muted)', boxShadow: 'none' } : {}}
                                >
                                  <Send className="w-3.5 h-3.5 mr-1" /> Gửi Lời Mời
                                </button>
                              ) : inviteState === 'pending' ? (
                                <span className="hm-badge hm-badge-pending w-full justify-center py-2 text-[10px]"><Clock className="w-3.5 h-3.5 mr-1" /> Chờ phản hồi</span>
                              ) : inviteState === 'accepted' ? (
                                <span className="hm-badge hm-badge-info w-full justify-center py-2 text-[10px]"><Check className="w-3.5 h-3.5 mr-1" /> Đã chấp nhận</span>
                              ) : inviteState === 'rejected' ? (
                                <span className="hm-badge hm-badge-rejected w-full justify-center py-2 text-[10px]"><X className="w-3.5 h-3.5 mr-1" /> Bị từ chối</span>
                              ) : inviteState === 'confirmed' ? (
                                <span className="hm-badge hm-badge-confirmed w-full justify-center py-2 text-[10px]"><UserCheck className="w-3.5 h-3.5 mr-1" /> Đã chốt</span>
                              ) : (
                                <span className="hm-badge hm-badge-muted w-full justify-center py-2 text-[10px]">Đã gửi lời mời</span>
                              )}
                            </div>
                          </div>
                        </ScrollReveal>
                      )
                    })}
                  </div>
                  {filteredJockeys.length > JOCKEY_PAGE_SIZE && (
                    <div className="mt-8 flex justify-center">
                      <Pagination total={filteredJockeys.length} page={jockeyPage} pageSize={JOCKEY_PAGE_SIZE} onChange={setJockeyPage} />
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 5: Lời Mời Jockey (Jockey Invites)
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="invitations">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Sidebar Control Panel */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-[90px]">
              
              {/* Horse Selector Section */}
              <div className="hm-glass-card p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Chọn Ngựa Xem Lời Mời</span>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 hm-sidebar-horses">
                  {horses.map((h) => {
                    const isActive = String(h.id || h._id) === selectedHorseId
                    const sc = statusConfig(h.status || 'PENDING')
                    return (
                      <div
                        key={h.id}
                        className={`hm-horse-vertical-item ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedHorseId(String(h.id || h._id))}
                      >
                        <img src={horseAvatarUrl(h.name)} alt={h.name} className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/10" />
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-sm text-[color:var(--text)] truncate">{h.name}</div>
                          <div className="text-[10.5px] font-medium text-[color:var(--text-muted)] truncate mb-0.5">{h.breed || 'Không rõ giống'}</div>
                          <div className="flex items-center gap-1.5">
                            <span className={`hm-status-dot ${sc.dotCls}`} style={{ width: 6, height: 6 }} />
                            <span className="text-[10px] font-bold text-[color:var(--text-muted)]">{sc.label}</span>
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/40 shrink-0">
                            <Check className="w-3 h-3 text-violet-400" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Controls Panel */}
              <div className="hm-glass-card p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Giải Đấu</span>
                  </div>
                  <select 
                    className="hm-sidebar-select" 
                    value={invFilterTournament} 
                    onChange={(e) => setInvFilterTournament(e.target.value)}
                  >
                    <option value="">🏆 Tất cả giải đấu</option>
                    {derivedTournaments.map((t) => (
                      <option key={t.id} value={t.id}>🏁 {t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Trạng Thái</span>
                  </div>
                  <select 
                    className="hm-sidebar-select" 
                    value={invFilterStatus} 
                    onChange={(e) => setInvFilterStatus(e.target.value)}
                  >
                    <option value="">⏳ Tất cả trạng thái</option>
                    <option value="PENDING">Chờ phản hồi</option>
                    <option value="ACCEPTED">Đã chấp nhận</option>
                    <option value="REJECTED">Từ chối</option>
                    <option value="CONFIRMED">Đã chốt</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Right Panel: Showcase Grid */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded bg-violet-500" />
                  <h3 className="text-lg font-black text-[color:var(--text)] tracking-tight">Danh Sách Lời Mời Jockey</h3>
                </div>
                <div className="text-xs font-bold text-[color:var(--text-2)] bg-[var(--surface-3)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                  Có <span className="text-violet-400 font-extrabold">{filteredInvitations.length}</span> lời mời
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <div key={i} className="hm-skeleton h-56 rounded-2xl" />)}
                </div>
              ) : filteredInvitations.length === 0 ? (
                <div className="hm-empty">
                  <div className="hm-empty-icon">📭</div>
                  <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">Chưa có lời mời nào</h3>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Chọn ngựa đã đăng ký giải để gửi lời mời ở tab "Tuyển Jockey".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredInvitations.map((inv, idx) => {
                    // Calculate actualJockeyId
                    let actualJockeyId = '';
                    if (typeof inv.jockeyId === 'string') {
                      actualJockeyId = inv.jockeyId.trim();
                    } else if (typeof inv.jockeyId?._id) {
                      actualJockeyId = String(inv.jockeyId._id).trim();
                    } else if (typeof inv.jockeyId?.id) {
                      actualJockeyId = String(inv.jockeyId.id).trim();
                    } else if (typeof inv.jockey === 'string') {
                      actualJockeyId = inv.jockey.trim();
                    } else if (typeof inv.jockey?._id) {
                      actualJockeyId = String(inv.jockey._id).trim();
                    } else if (typeof inv.jockey?.id) {
                      actualJockeyId = String(inv.jockey.id).trim();
                    }
                    const matchedJockey = jockeys.find(j => String(j.id || j._id).trim() === actualJockeyId);
                    const jockeyName = matchedJockey?.userId?.fullName || matchedJockey?.userId?.name || inv.jockeyId?.fullName || inv.jockeyId?.name || inv.jockey?.fullName || inv.jockey?.name || 'Jockey';
                    const winRate = matchedJockey?.winRate ?? inv.jockeyId?.winRate ?? 0;

                    const statusMap: Record<string, { badgeCls: string; label: string; icon: any }> = {
                      PENDING:   { badgeCls: 'hm-badge-pending', label: 'Chờ phản hồi', icon: <Clock className="w-3.5 h-3.5" /> },
                      ACCEPTED:  { badgeCls: 'hm-badge-info', label: 'Đã chấp nhận', icon: <Check className="w-3.5 h-3.5" /> },
                      REJECTED:  { badgeCls: 'hm-badge-rejected', label: 'Từ chối', icon: <X className="w-3.5 h-3.5" /> },
                      CONFIRMED: { badgeCls: 'hm-badge-confirmed', label: 'Chốt thành công', icon: <UserCheck className="w-3.5 h-3.5" /> },
                      OTHER_CONFIRMED: { badgeCls: 'hm-badge-muted', label: 'Đã chốt Jockey khác', icon: <X className="w-3.5 h-3.5" /> },
                    }
                    
                    let inviteRaceId = '';
                    if (inv.raceId) inviteRaceId = String(inv.raceId?._id || inv.raceId?.id || inv.raceId || '').trim();
                    else if (inv.race) inviteRaceId = String(inv.race?._id || inv.race?.id || inv.race || '').trim();
                    
                    if (inviteRaceId) {
                      const regFallback = registrations.find((r: any) => String(r.registrationId || r.id || r._id) === inviteRaceId);
                      if (regFallback && regFallback.race) {
                        inviteRaceId = String(regFallback.race.id || regFallback.race._id).trim();
                      }
                    } else if (inv.registrationId) {
                      const matchedReg = registrations.find((r: any) => String(r.registrationId || r.id || r._id) === String(inv.registrationId));
                      if (matchedReg?.race) inviteRaceId = String(matchedReg.race.id || matchedReg.race._id).trim();
                    }

                    const matchedRace = races.find(r => String(r.id || r._id).trim() === inviteRaceId)
                    
                    let displayRaceName = matchedRace?.name || inv.raceId?.name || inv.race?.name;
                    if (!displayRaceName) {
                      const horseRegistrations = registrations.filter(r => String(r.horseId) === String(selectedHorseId));
                      displayRaceName = horseRegistrations.length > 0 ? horseRegistrations.map(r => r.race?.name).join(', ') : '—';
                      if (!inviteRaceId && horseRegistrations.length > 0) {
                        inviteRaceId = String(horseRegistrations[0].race?.id || horseRegistrations[0].race?._id || '').trim();
                      }
                    }
                    
                    const matchedReg = registrations.find(
                      (reg: any) =>
                        String(reg.horseId).trim() === String(selectedHorseId).trim() &&
                        String(reg.race?.id || reg.race?._id || reg.raceId || '').trim() === inviteRaceId
                    ) as any
                    
                    const rawJockeyId = matchedReg ? (matchedReg.jockeyId || '') : '';
                    const regJockeyId = typeof rawJockeyId === 'object' ? String(rawJockeyId?._id || rawJockeyId?.id || '').trim() : String(rawJockeyId).trim();
                    
                    const currentJockeyUserId = matchedJockey ? String(matchedJockey.userId?._id || matchedJockey.userId?.id || matchedJockey.userId || '').trim() : ''
                    const jockeyIdentifiers = new Set<string>();
                    if (actualJockeyId) jockeyIdentifiers.add(actualJockeyId);
                    if (currentJockeyUserId) jockeyIdentifiers.add(currentJockeyUserId);
                    if (matchedJockey?.id) jockeyIdentifiers.add(String(matchedJockey.id).trim());
                    if (matchedJockey?._id) jockeyIdentifiers.add(String(matchedJockey._id).trim());

                    const isThisJockeyConfirmed = (regJockeyId && jockeyIdentifiers.has(regJockeyId)) || inv.status === 'CONFIRMED'
                    
                    const hasConfirmedInvite = invitations.some(i => {
                      let iRaceId = '';
                      if (i.raceId) iRaceId = String(i.raceId?._id || i.raceId?.id || i.raceId || '').trim();
                      else if (i.race) iRaceId = String(i.race?._id || i.race?.id || i.race || '').trim();
                      else if (i.registrationId) {
                        const mReg = registrations.find((r: any) => String(r.registrationId || r.id || r._id) === String(i.registrationId));
                        if (mReg?.race) iRaceId = String(mReg.race.id || mReg.race._id).trim();
                      }
                      
                      if (!iRaceId) {
                        const horseRegistrations = registrations.filter(r => String(r.horseId) === String(selectedHorseId));
                        if (horseRegistrations.length > 0) {
                          iRaceId = String(horseRegistrations[0].race?.id || horseRegistrations[0].race?._id || '').trim();
                        }
                      }
                      
                      return iRaceId === inviteRaceId && i.status === 'CONFIRMED';
                    });

                    const isRaceAlreadyConfirmed = !!regJockeyId || hasConfirmedInvite

                    let displayStatus = inv.status || 'PENDING'
                    if (isThisJockeyConfirmed) {
                      displayStatus = 'CONFIRMED'
                    } else if (isRaceAlreadyConfirmed && displayStatus !== 'REJECTED') {
                      displayStatus = 'OTHER_CONFIRMED'
                    }
                    
                    const sc = statusMap[displayStatus] ?? { badgeCls: 'hm-badge-muted', label: displayStatus, icon: null }

                    return (
                      <ScrollReveal key={inv._id || inv.id} direction="up" distance={16} delay={idx * 0.03}>
                        <div className="hm-glass-card hm-glass-card-hover p-5 h-full flex flex-col justify-between items-center text-center">
                          <div className="w-full flex flex-col items-center">
                            {/* Avatar */}
                            <div className="hm-jockey-avatar available mb-3">
                              {jockeyName.slice(0, 2).toUpperCase()}
                            </div>

                            {/* Name + Title */}
                            <div className="w-full min-w-0 mb-3">
                              <h4 className="font-extrabold text-[color:var(--text)] text-sm truncate m-0 mb-0.5">{jockeyName}</h4>
                              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-violet-400 mt-1 truncate" title={displayRaceName}>
                                🏁 {displayRaceName}
                              </div>
                            </div>

                            {/* Win Rate */}
                            <div className="w-full mb-3 pt-3 border-t border-[var(--border)]">
                              <div className="flex justify-between text-[10px] font-bold mb-1">
                                <span style={{ color: 'var(--text-muted)' }}>Tỉ lệ thắng</span>
                                <span style={{ color: '#fbbf24' }}>{winRate}%</span>
                              </div>
                              <div className="hm-winrate-bar">
                                <div className="hm-winrate-fill" style={{ width: `${winRate}%` }} />
                              </div>
                              <div className="text-[9px] font-bold mt-1.5 flex justify-between" style={{ color: 'var(--text-muted)' }}>
                                <span>{matchedJockey?.experience ? `${matchedJockey.experience} năm KN` : 'Chưa rõ KN'}</span>
                                <span>{matchedJockey?.wins ?? 0}/{matchedJockey?.races ?? 0} thắng</span>
                              </div>
                            </div>
                          </div>

                          {/* Status + Action */}
                          <div className="w-full mt-2 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
                            <span className={`hm-badge ${sc.badgeCls} w-full justify-center py-2 text-[10px]`}>{sc.icon} <span className="ml-1">{sc.label}</span></span>
                            {displayStatus === 'ACCEPTED' && (
                              <button
                                disabled={isRaceAlreadyConfirmed}
                                className={`hm-btn-cta w-full text-xs py-2 ${isRaceAlreadyConfirmed ? '' : 'hm-attention-pulse'}`}
                                style={isRaceAlreadyConfirmed ? { opacity: 0.4, cursor: 'not-allowed', background: 'var(--text-muted)', boxShadow: 'none' } : {}}
                                onClick={() => handleConfirmJockey(inv.jockeyId?._id || inv.jockeyId, inviteRaceId, jockeyName, String(inv.id || inv._id))}
                              >
                                {isRaceAlreadyConfirmed ? 'Đã chốt người khác' : <><UserCheck className="w-3.5 h-3.5 mr-1" /> Chốt Jockey</>}
                              </button>
                            )}
                          </div>
                        </div>
                      </ScrollReveal>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════════════
          Modal: Horse Results
      ═══════════════════════════════════════════════════════════════════════ */}
      {showResultsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={() => setShowResultsModal(false)}>
          <div className="hm-glass-card w-full max-w-2xl" style={{ animation: 'hm-scale-in 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 flex justify-between items-center border-b border-[var(--border)]">
              <h2 className="text-xl font-black flex items-center gap-2 text-[color:var(--text)] m-0"><Trophy className="w-5 h-5 text-amber-400" /> Kết Quả: {horseResults?.horseName}</h2>
              <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} onClick={() => setShowResultsModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {loadingResults ? (
                <div className="text-center p-8" style={{ color: 'var(--text-muted)' }}>
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Đang tải kết quả...
                </div>
              ) : horseResults?.results?.length > 0 ? (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'Số Trận', value: horseResults.stats.totalRaces, color: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.2)', textColor: '#a78bfa' },
                      { label: 'Thắng', value: horseResults.stats.wins, color: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)', textColor: '#fbbf24' },
                      { label: 'Top 3', value: horseResults.stats.topThree, color: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', textColor: '#34d399' },
                      { label: 'Tiền Thưởng', value: `${horseResults.stats.totalPrizes.toLocaleString('vi-VN')} đ`, color: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)', textColor: '#60a5fa', small: true },
                    ].map((s, si) => (
                      <div key={si} className="p-4 rounded-xl text-center" style={{ background: s.color, border: `1px solid ${s.borderColor}` }}>
                        <div className="text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                        <div className={`font-black ${(s as any).small ? 'text-base' : 'text-2xl'}`} style={{ color: s.textColor }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl overflow-hidden border border-[var(--border)]">
                    <AnimatedTable
                      data={(() => {
                        let res = [...horseResults.results].map((r, i) => ({ ...r, id: i }))
                        res = res.filter(r => {
                          if (resultsFilters.raceName && !r.raceName.toLowerCase().includes(resultsFilters.raceName.toLowerCase())) return false
                          if (resultsFilters.position && String(r.position) !== resultsFilters.position) return false
                          return true
                        })
                        if (resultsSortColumn && resultsSortDirection) {
                          res.sort((a, b) => {
                            let aVal = a[resultsSortColumn]
                            let bVal = b[resultsSortColumn]
                            if (resultsSortColumn === 'date') {
                              aVal = new Date(a.date).getTime()
                              bVal = new Date(b.date).getTime()
                            }
                            if (typeof aVal === 'string' && typeof bVal === 'string') {
                              return resultsSortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
                            }
                            return resultsSortDirection === 'asc' ? aVal - bVal : bVal - aVal
                          })
                        }
                        return res
                      })().slice((resultsPage - 1) * 5, resultsPage * 5)}
                      columns={[
                        {
                          id: 'raceName',
                          header: 'Giải / Ngày',
                          sortable: true,
                          filterable: true,
                          filterType: 'text',
                          cell: (row: any) => (
                            <div>
                              <div className="font-bold text-[color:var(--text)]">{row.raceName}</div>
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(row.date).toLocaleDateString('vi-VN')}</div>
                            </div>
                          )
                        },
                        {
                          id: 'position',
                          header: 'Vị Trí',
                          align: 'center',
                          sortable: true,
                          filterable: true,
                          filterType: 'text',
                          cell: (row: any) => (
                            <span className={`hm-badge ${row.position === 1 ? 'hm-badge-pending' : 'hm-badge-muted'} text-[11px]`}>#{row.position}</span>
                          )
                        },
                        {
                          id: 'prize',
                          header: 'Tiền Thưởng',
                          align: 'right',
                          sortable: true,
                          cell: (row: any) => (
                            <span className="font-bold" style={{ color: '#34d399' }}>{row.prize.toLocaleString('vi-VN')} đ</span>
                          )
                        }
                      ]}
                      sortColumn={resultsSortColumn}
                      sortDirection={resultsSortDirection}
                      onSort={handleResultsSort}
                      columnFilters={resultsFilters}
                      onColumnFilterChange={handleResultsFilterChange}
                      pagination={{
                        page: resultsPage,
                        pageSize: 5,
                        totalItems: (() => {
                          let res = horseResults.results
                          if (resultsFilters.raceName) res = res.filter((r: any) => r.raceName.toLowerCase().includes(resultsFilters.raceName.toLowerCase()))
                          if (resultsFilters.position) res = res.filter((r: any) => String(r.position) === resultsFilters.position)
                          return res.length
                        })(),
                        onPageChange: setResultsPage,
                        pageSizeOptions: [5, 10, 20]
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 font-medium" style={{ color: 'var(--text-muted)' }}>Chưa có kết quả thi đấu nào.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          Modal: Horse CRUD
      ═══════════════════════════════════════════════════════════════════════ */}
      {showHorseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={() => setShowHorseModal(false)}>
          <div className="hm-glass-card w-full max-w-md" style={{ animation: 'hm-scale-in 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 flex justify-between items-center border-b border-[var(--border)]">
              <h2 className="text-xl font-black text-[color:var(--text)] flex items-center gap-2 m-0">
                {selectedHorse ? <><Edit className="w-5 h-5 text-violet-400" /> Chỉnh Sửa Ngựa</> : <><Plus className="w-5 h-5 text-violet-400" /> Thêm Ngựa Mới</>}
              </h2>
              <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} onClick={() => setShowHorseModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveHorse} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2" style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <X className="w-4 h-4 shrink-0" /> {formError}
                </div>
              )}
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Tên ngựa <span style={{ color: '#f87171' }}>*</span></label>
                <input required placeholder="Nhập tên chú ngựa..." value={horseForm.name} onChange={(e) => setHorseForm({ ...horseForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Giống</label>
                  <input placeholder="Thoroughbred..." value={horseForm.breed} onChange={(e) => setHorseForm({ ...horseForm, breed: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Màu sắc</label>
                  <input placeholder="Nâu đen..." value={horseForm.color} onChange={(e) => setHorseForm({ ...horseForm, color: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Tuổi</label>
                  <input type="number" min="1" max="30" value={horseForm.age} onChange={(e) => setHorseForm({ ...horseForm, age: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Cân nặng (kg)</label>
                  <input type="number" min="200" max="700" value={horseForm.weight} onChange={(e) => setHorseForm({ ...horseForm, weight: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Giới tính</label>
                  <select value={horseForm.gender} onChange={(e) => setHorseForm({ ...horseForm, gender: e.target.value as any })}>
                    <option value="MALE">Đực</option>
                    <option value="FEMALE">Cái</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Xuất xứ</label>
                  <input placeholder="Anh Quốc..." value={horseForm.origin} onChange={(e) => setHorseForm({ ...horseForm, origin: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>URL Giấy khám sức khỏe</label>
                <input placeholder="https://example.com/certificate.pdf" value={horseForm.healthCertUrl} onChange={(e) => setHorseForm({ ...horseForm, healthCertUrl: e.target.value })} />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
                <button type="button" onClick={() => setShowHorseModal(false)} className="px-4 py-2 rounded-xl text-sm font-bold transition-all text-[var(--text-2)] hover:bg-[var(--surface-2)] bg-transparent">Hủy</button>
                <button type="submit" className="hm-btn-cta violet">Lưu Thông Tin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
