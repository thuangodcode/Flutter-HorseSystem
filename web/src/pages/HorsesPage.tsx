import { useEffect, useState, startTransition, useMemo } from 'react'
import type { Horse, Race, Jockey, Tournament } from '../types'
import {
  getHorses,
  createHorse,
  updateHorse,
  deleteHorse,
  getRaces,
  getRaceHorses,
  registerHorseForTournament,
  getTournaments,
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
  const [tournaments, setTournaments] = useState<Tournament[]>([])
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

  // Filter for Invitations tab
  const [invFilterStatus, setInvFilterStatus] = useState<string>('')
  const [invFilterTournament, setInvFilterTournament] = useState<string>('')

  const derivedTournaments = useMemo(() => {
    const map = new Map<string, string>()
    tournaments.forEach(t => {
      const id = String(t.id || t._id || '')
      if (id && t.name) map.set(id, t.name)
    })
    races.forEach(r => {
      const t = r.tournamentId as any
      if (t?.id && t?.name) map.set(t.id, t.name)
      else if (t?._id && t?.name) map.set(t._id, t.name)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [races, tournaments])

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

      // Load tournaments & races song song
      const [tList, rList] = await Promise.all([
        getTournaments().catch(() => { partialErrors.push('Không tải được danh sách giải đấu'); return [] as Tournament[] }),
        getRaces().catch(() => { partialErrors.push('Không tải được danh sách vòng đua'); return [] as Race[] }),
      ])
      // Chỉ hiển thị giải đấu đang mở đăng ký (PUBLISHED / ONGOING)
      const openTournaments = tList.filter((t) => ['PUBLISHED', 'ONGOING', 'DRAFT'].includes(t.status?.toUpperCase?.() || ''))
      setTournaments(openTournaments)

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

      if (activeTab === 'hire-jockey') {
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
  /**
   * Đăng ký ngựa vào một Giải Đấu (Tournament).
   * FE tự động đăng ký ngựa vào tất cả các Race SCHEDULED thuộc giải đó.
   * Admin sau đó sẽ phân bổ ngựa vào các vòng đấu cụ thể.
   */
  const handleRegisterTournament = async (tournament: Tournament) => {
    if (!selectedHorseId) return showToast('Vui lòng chọn ngựa', 'warning')
    const horse = horses.find((h) => String(h.id || h._id) === selectedHorseId)
    if (horse?.status !== 'APPROVED') return showToast('Chỉ ngựa đã được Admin duyệt mới có thể đăng ký giải', 'warning')
    try {
      const result = await registerHorseForTournament(selectedHorseId, String(tournament.id))
      const totalNew = result.success.length
      const totalAlready = result.alreadyRegistered.length
      const totalFailed = result.failed.length
      if (totalNew > 0) {
        showToast(`Đã gửi đăng ký tham gia giải "${tournament.name}". Admin sẽ phân bổ vào vòng đấu phù hợp.`, 'success')
      } else if (totalAlready > 0 && totalNew === 0) {
        showToast(`Ngựa đã có đăng ký trong giải "${tournament.name}" trước đó rồi.`, 'info')
      } else if (totalFailed > 0 && totalNew === 0) {
        showToast(`Không thể đăng ký ngựa vào giải "${tournament.name}". Vui lòng thử lại.`, 'error')
        return
      }
      loadData()
    } catch (err: any) {
      showToast(err.message || err.response?.data?.message || 'Không thể đăng ký giải đấu', 'error')
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

  const getRegistrationTournamentId = (reg: { race: Race }) => {
    const tournament = reg.race?.tournamentId as any
    return String(tournament?.id || tournament?._id || tournament || '')
  }

  const getRegistrationTournamentName = (reg: { race: Race }) => {
    const tournament = reg.race?.tournamentId as any
    const tournamentId = getRegistrationTournamentId(reg)
    return tournament?.name || tournaments.find((t) => String(t.id || t._id) === tournamentId)?.name || 'Giải đấu'
  }

  // Filtered registrations for My Registrations tab
  const filteredRegistrations = registrations.filter(reg => {
    if (regFilterHorse && String(reg.horseId).trim() !== regFilterHorse) return false
    if (regFilterStatus) {
      const normalizedStatus = reg.status === 'PENDING_APPROVAL' ? 'PENDING' : reg.status
      if (reg.status !== regFilterStatus && normalizedStatus !== regFilterStatus) return false
    }
    if (regFilterTournament) {
      const tId = getRegistrationTournamentId(reg)
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

  // Giải đấu hiển thị trong tab Đăng Ký Giải
  const filteredTournaments = tournaments

  // registrationsByTournament: map tournamentId -> trạng thái đăng ký của selectedHorse
  const registrationsByTournament = useMemo(() => {
    if (!selectedHorseId) return {}
    const map: Record<string, { status: string; raceCount: number; approvedCount: number; pendingCount: number; rejectedCount: number; confirmedCount: number }> = {}
    registrations
      .filter((r) => String(r.horseId).trim() === String(selectedHorseId).trim())
      .forEach((r) => {
        const tId = String(r.race?.tournamentId?.id || r.race?.tournamentId?._id || r.race?.tournamentId || '')
        if (!tId) return
        if (!map[tId]) map[tId] = { status: 'PENDING_APPROVAL', raceCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0, confirmedCount: 0 }
        map[tId].raceCount++
        const s = String(r.status || '').toUpperCase()
        if (s === 'APPROVED') map[tId].approvedCount++
        else if (s === 'PENDING' || s === 'PENDING_APPROVAL') map[tId].pendingCount++
        else if (s === 'REJECTED') map[tId].rejectedCount++
        else if (s === 'CONFIRMED') map[tId].confirmedCount++
      })
    // Tính status tổng hợp
    Object.keys(map).forEach((tId) => {
      const m = map[tId]
      if (m.confirmedCount > 0) m.status = 'CONFIRMED'
      else if (m.approvedCount > 0) m.status = 'APPROVED'
      else if (m.pendingCount > 0) m.status = 'PENDING_APPROVAL'
      else if (m.rejectedCount === m.raceCount) m.status = 'REJECTED'
    })
    return map
  }, [registrations, selectedHorseId])

  const registeredTournamentGroups = useMemo(() => {
    type Group = {
      key: string
      tournamentId: string
      tournamentName: string
      horseId: string
      horseName: string
      registrations: typeof filteredRegistrations
      status: string
      pendingCount: number
      approvedCount: number
      confirmedCount: number
      rejectedCount: number
    }

    const map = new Map<string, Group>()
    filteredRegistrations.forEach((reg) => {
      const tournamentId = getRegistrationTournamentId(reg) || `race-${reg.race?.id || reg.raceId}`
      const horseId = String(reg.horseId || '')
      const key = `${tournamentId}:${horseId}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          tournamentId,
          tournamentName: getRegistrationTournamentName(reg),
          horseId,
          horseName: reg.horseName,
          registrations: [],
          status: 'PENDING_APPROVAL',
          pendingCount: 0,
          approvedCount: 0,
          confirmedCount: 0,
          rejectedCount: 0,
        })
      }
      map.get(key)!.registrations.push(reg)
    })

    const groups = Array.from(map.values()).map((group) => {
      group.registrations.forEach((reg) => {
        const status = String(reg.status || '').toUpperCase()
        if (status === 'CONFIRMED') group.confirmedCount += 1
        else if (status === 'APPROVED') group.approvedCount += 1
        else if (status === 'REJECTED') group.rejectedCount += 1
        else group.pendingCount += 1
      })

      if (group.confirmedCount > 0) group.status = 'CONFIRMED'
      else if (group.approvedCount > 0) group.status = 'APPROVED'
      else if (group.pendingCount > 0) group.status = 'PENDING_APPROVAL'
      else if (group.rejectedCount === group.registrations.length) group.status = 'REJECTED'

      return group
    })

    return groups.sort((a, b) => {
      const aDate = Math.min(...a.registrations.map((reg) => reg.race?.scheduledAt ? new Date(reg.race.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER))
      const bDate = Math.min(...b.registrations.map((reg) => reg.race?.scheduledAt ? new Date(reg.race.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER))
      return aDate - bDate
    })
  }, [filteredRegistrations, tournaments])

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
              <TabsTrigger value="race-registration" className="py-2.5 px-4 rounded-xl font-bold transition-all text-sm text-[var(--text-2)] data-active:!bg-[var(--surface)] data-active:!text-[var(--primary)] data-active:!shadow-sm"><Zap className="w-4 h-4 mr-2" /> Đăng Ký Giải</TabsTrigger>
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
            TAB 2: Đăng Ký Giải Đấu (Tournament Registration)
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

              {/* Info Panel */}
              <div className="hm-glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Cách Thức Đăng Ký</span>
                </div>
                <div className="space-y-2.5 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  <div className="flex items-start gap-2">
                    <span className="text-violet-400 font-black shrink-0 mt-0.5">1.</span>
                    <span>Chọn ngựa đã được Admin duyệt hồ sơ (<span className="text-emerald-400 font-bold">APPROVED</span>)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-violet-400 font-black shrink-0 mt-0.5">2.</span>
                    <span>Chọn giải đấu muốn tham gia và nhấn <span className="text-violet-400 font-bold">Đăng Ký Tham Gia Giải</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-violet-400 font-black shrink-0 mt-0.5">3.</span>
                    <span>Admin sẽ xét duyệt và <span className="text-amber-400 font-bold">tự động phân bổ</span> ngựa vào các vòng đấu phù hợp</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-violet-400 font-black shrink-0 mt-0.5">4.</span>
                    <span>Theo dõi trạng thái ở tab <span className="text-sky-400 font-bold">Đã Đăng Ký</span></span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Showcase: Tournaments Grid */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded bg-violet-500" />
                  <h3 className="text-lg font-black text-[color:var(--text)] tracking-tight">Danh Sách Giải Đấu Đang Mở</h3>
                </div>
                <div className="text-xs font-bold text-[color:var(--text-2)] bg-[var(--surface-3)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                  Có <span className="text-violet-400 font-extrabold">{filteredTournaments.length}</span> giải đấu
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="hm-skeleton h-56 rounded-2xl" />)}
                </div>
              ) : filteredTournaments.length === 0 ? (
                <div className="hm-empty">
                  <div className="hm-empty-icon">🏆</div>
                  <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">Không có giải đấu nào đang mở</h3>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Hiện tại chưa có giải đấu nào đang nhận đăng ký. Vui lòng quay lại sau.</p>
                  {error && <div className="text-red-400 text-xs mt-3 font-semibold">{error}</div>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTournaments.map((t, idx) => {
                    const tId = String(t.id)
                    const regInfo = registrationsByTournament[tId]
                    const isRegistered = !!regInfo
                    const regStatus = regInfo?.status || ''

                    // Status badge for the tournament registration
                    let statusBadge: React.ReactNode = null
                    if (!isRegistered) {
                      statusBadge = null
                    } else if (regStatus === 'CONFIRMED') {
                      statusBadge = <span className="hm-badge hm-badge-confirmed text-[9.5px]"><Check className="w-3 h-3 mr-0.5" /> Đã chốt</span>
                    } else if (regStatus === 'APPROVED') {
                      statusBadge = <span className="hm-badge hm-badge-approved text-[9.5px]"><Check className="w-3 h-3 mr-0.5" /> Đã duyệt</span>
                    } else if (regStatus === 'PENDING_APPROVAL') {
                      statusBadge = <span className="hm-badge hm-badge-pending text-[9.5px]"><Clock className="w-3 h-3 mr-0.5" /> Chờ duyệt</span>
                    } else if (regStatus === 'REJECTED') {
                      statusBadge = <span className="hm-badge hm-badge-rejected text-[9.5px]"><X className="w-3 h-3 mr-0.5" /> Bị từ chối</span>
                    }

                    return (
                      <ScrollReveal key={tId} direction="up" distance={16} delay={idx * 0.04}>
                        <div className="hm-race-card-modern">
                          {/* Header */}
                          <div className="hm-race-card-badge-container">
                            <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
                              🏆 Giải Đấu
                            </span>
                            {isRegistered && statusBadge}
                          </div>

                          {/* Title */}
                          <h4 className="hm-race-card-title truncate" title={t.name}>
                            {t.name}
                          </h4>

                          {/* Description */}
                          {t.description && (
                            <p className="text-[11px] font-medium mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{t.description}</p>
                          )}

                          {/* Stats Grid */}
                          <div className="hm-race-card-stats">
                            <div className="hm-race-card-stat-item">
                              <div className="hm-race-card-stat-icon-wrapper">
                                <CalendarRange className="w-3.5 h-3.5" />
                              </div>
                              <div className="hm-race-card-stat-text">
                                <span className="hm-race-card-stat-label">Bắt đầu</span>
                                <span className="hm-race-card-stat-value">{new Date(t.startDate).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>

                            <div className="hm-race-card-stat-item">
                              <div className="hm-race-card-stat-icon-wrapper" style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.15)' }}>
                                <MapPin className="w-3.5 h-3.5" />
                              </div>
                              <div className="hm-race-card-stat-text">
                                <span className="hm-race-card-stat-label">Địa điểm</span>
                                <span className="hm-race-card-stat-value truncate">{t.venue || t.location || 'Chưa rõ'}</span>
                              </div>
                            </div>

                            <div className="hm-race-card-stat-item" style={{ gridColumn: 'span 2' }}>
                              <div className="hm-race-card-stat-icon-wrapper" style={{ color: '#fb923c', background: 'rgba(251,146,60,0.1)', borderColor: 'rgba(251,146,60,0.15)' }}>
                                <Trophy className="w-3.5 h-3.5" />
                              </div>
                              <div className="hm-race-card-stat-text">
                                <span className="hm-race-card-stat-label">Tổng giải thưởng</span>
                                <span className="hm-race-card-stat-value text-amber-400 font-extrabold">
                                  {t.prizePool?.toLocaleString('vi-VN')} {t.currency || 'VND'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Registration progress (if registered) */}
                          {isRegistered && regInfo && (
                            <div className="mt-3 p-2.5 rounded-xl bg-[var(--surface-3)] border border-[var(--border)] text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                              <div className="flex justify-between items-center mb-1.5">
                                <span>Trạng thái đăng ký vòng đua</span>
                                <span className="text-violet-400">{regInfo.raceCount} vòng</span>
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                {regInfo.pendingCount > 0 && <span className="hm-badge hm-badge-pending text-[8px] py-0.5">{regInfo.pendingCount} chờ duyệt</span>}
                                {regInfo.approvedCount > 0 && <span className="hm-badge hm-badge-approved text-[8px] py-0.5">{regInfo.approvedCount} đã duyệt</span>}
                                {regInfo.confirmedCount > 0 && <span className="hm-badge hm-badge-confirmed text-[8px] py-0.5">{regInfo.confirmedCount} đã chốt</span>}
                                {regInfo.rejectedCount > 0 && <span className="hm-badge hm-badge-rejected text-[8px] py-0.5">{regInfo.rejectedCount} từ chối</span>}
                              </div>
                            </div>
                          )}

                          {/* Action Button */}
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
                              <button onClick={() => handleRegisterTournament(t)} className="hm-btn-cta w-full">
                                <Zap className="w-4 h-4 mr-1" /> Đăng Ký Tham Gia Giải
                              </button>
                            ) : regStatus === 'PENDING_APPROVAL' ? (
                              <div className="flex flex-col items-center justify-center w-full gap-1">
                                <span className="hm-badge hm-badge-pending w-full justify-center"><Clock className="w-3.5 h-3.5 mr-1" /> Đang chờ Admin phân bổ vòng đua</span>
                              </div>
                            ) : regStatus === 'APPROVED' ? (
                              <div className="flex flex-col items-center justify-center w-full gap-1">
                                <span className="hm-badge hm-badge-approved w-full justify-center"><Check className="w-3.5 h-3.5 mr-1" /> Đã được xếp vào vòng đua</span>
                              </div>
                            ) : regStatus === 'CONFIRMED' ? (
                              <div className="flex flex-col items-center justify-center w-full gap-1">
                                <span className="hm-badge hm-badge-confirmed w-full justify-center"><Check className="w-3.5 h-3.5 mr-1" /> Đã chốt tham gia giải</span>
                              </div>
                            ) : regStatus === 'REJECTED' ? (
                              <div className="flex flex-col items-center justify-center w-full gap-1">
                                <span className="hm-badge hm-badge-rejected w-full justify-center"><X className="w-3.5 h-3.5 mr-1" /> Đăng ký bị từ chối</span>
                                <button onClick={() => handleRegisterTournament(t)} className="hm-btn-cta text-xs py-1.5 px-3 w-full justify-center">
                                  <Zap className="w-3.5 h-3.5 mr-1" /> Đăng ký lại
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => handleRegisterTournament(t)} className="hm-btn-cta w-full">
                                <Zap className="w-4 h-4 mr-1" /> Đăng Ký Tham Gia Giải
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
                  Có <span className="text-violet-400 font-extrabold">{registeredTournamentGroups.length}</span> giải đăng ký
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="hm-skeleton h-36 rounded-2xl" />)}
                </div>
              ) : registeredTournamentGroups.length === 0 ? (
                <div className="hm-empty">
                  <div className="hm-empty-icon">📋</div>
                  <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">Chưa có đăng ký nào</h3>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Đăng ký ngựa vào giải đấu ở tab "Đăng Ký Giải" để xem tại đây.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registeredTournamentGroups.map((group, idx) => {
                    const sc = statusConfig(group.status === 'PENDING_APPROVAL' ? 'PENDING' : group.status)
                    const confirmableReg = group.registrations.find((reg) => reg.status === 'APPROVED' && !reg.confirmedByOwner)
                    const assignedRegs = group.registrations.filter((reg) => reg.status === 'APPROVED' || reg.status === 'CONFIRMED')
                    const pendingRegs = group.registrations.filter((reg) => reg.status === 'PENDING' || reg.status === 'PENDING_APPROVAL')
                    const rejectedRegs = group.registrations.filter((reg) => reg.status === 'REJECTED')

                    return (
                      <ScrollReveal key={group.key} direction="up" distance={16} delay={idx * 0.04}>
                        <div className="hm-glass-card hm-glass-card-hover p-5 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex items-start gap-4 mb-3">
                              <img src={horseAvatarUrl(group.horseName)} alt={group.horseName} className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/10" />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                  <h4 className="font-extrabold text-[color:var(--text)] text-sm truncate m-0">{group.horseName}</h4>
                                  <span className={`hm-badge ${sc.badgeCls} text-[9px] shrink-0`}>
                                    <span className={`hm-status-dot ${sc.dotCls}`} style={{ width: 6, height: 6 }} /> {sc.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-violet-400 truncate">
                                  🏆 {group.tournamentName}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--border)]">
                              <div className="p-2 rounded-lg bg-[var(--surface-3)] border border-[var(--border)]">
                                <span className="block text-[8px] font-extrabold uppercase text-[color:var(--text-muted)] tracking-wider">Đã xếp vòng</span>
                                <span className="text-[10px] font-bold text-[color:var(--text-2)] truncate block">{assignedRegs.length} vòng đua</span>
                              </div>
                              <div className="p-2 rounded-lg bg-[var(--surface-3)] border border-[var(--border)]">
                                <span className="block text-[8px] font-extrabold uppercase text-[color:var(--text-muted)] tracking-wider">Chờ phân bổ</span>
                                <span className="text-[10px] font-bold text-[color:var(--text-2)] block">{pendingRegs.length} vòng đua</span>
                              </div>
                            </div>

                            <div className="mt-3 space-y-1.5">
                              {assignedRegs.map((reg) => (
                                <div key={reg.registrationId || reg.race.id} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                  Được xếp vào: {reg.race.name} ({new Date(reg.race.scheduledAt).toLocaleDateString('vi-VN')})
                                </div>
                              ))}
                              {pendingRegs.length > 0 && (
                                <div className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                  Đang chờ Admin tự phân bổ vòng đua
                                </div>
                              )}
                              {rejectedRegs.length > 0 && assignedRegs.length === 0 && (
                                <div className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                                  Đăng ký giải bị từ chối hoặc chưa được xếp vòng phù hợp
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status detail + actions */}
                          <div className="mt-4 pt-3 border-t border-[var(--border)]">
                            <div className="text-[10px] font-bold text-[color:var(--text-muted)] flex items-center justify-between">
                              <span>Trạng thái:</span>
                              <span className="text-[color:var(--text-2)]">
                                {group.status === 'PENDING_APPROVAL' && 'Đang chờ Admin phân bổ'}
                                {group.status === 'APPROVED' && (confirmableReg ? 'Cần xác nhận tham gia vòng đã xếp' : 'Đã được xếp vòng đua')}
                                {group.status === 'CONFIRMED' && 'Đã chốt danh sách'}
                                {group.status === 'REJECTED' && 'Đăng ký bị từ chối'}
                              </span>
                            </div>

                            {confirmableReg && (
                              <button onClick={() => handleConfirmRace(confirmableReg.horseId, confirmableReg.race.id)} className="hm-btn-cta mt-3 w-full text-xs py-2 hm-attention-pulse">
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
