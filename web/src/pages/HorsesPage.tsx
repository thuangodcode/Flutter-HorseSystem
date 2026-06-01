import { useEffect, useState, startTransition } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Magnetic } from '@/components/ui/magnetic'
import { useAnimatedToast } from '@/components/ui/animated-toast'
import { CalendarRange, Search, Filter, Trophy, Star, Activity, FileCheck, Check, X, Users, History, TrendingUp, AlertTriangle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'my-horses' | 'race-registration' | 'hire-jockey' | 'invitations' | 'my-registrations'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function horseAvatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg,#059669,#047857)',
    'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    'linear-gradient(135deg,#f59e0b,#d97706)',
    'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    'linear-gradient(135deg,#f97316,#ea580c)',
    'linear-gradient(135deg,#06b6d4,#0e7490)',
    'linear-gradient(135deg,#ec4899,#be185d)',
    'linear-gradient(135deg,#10b981,#059669)',
  ]
  const idx = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % colors.length
  return colors[idx]
}

function statusConfig(status: string) {
  const map: Record<string, { cls: string; label: string; icon: any }> = {
    PENDING:  { cls: 'border-amber-500/30 bg-amber-500/10 text-amber-600',  label: 'Chờ duyệt', icon: <AlertTriangle className="w-3 h-3 mr-1" /> },
    APPROVED: { cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600', label: 'Đã duyệt', icon: <Check className="w-3 h-3 mr-1" /> },
    REJECTED: { cls: 'border-red-500/30 bg-red-500/10 text-red-600', label: 'Bị từ chối', icon: <X className="w-3 h-3 mr-1" /> },
  }
  return map[status] ?? { cls: 'border-slate-500/30 bg-slate-500/10 text-slate-400', label: status, icon: null }
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
  const [registrations, setRegistrations] = useState<{ race: Race; horseId: string; horseName: string; status: string; rejectionReason?: string; confirmedByOwner?: boolean }[]>([])

  // Pagination
  const [horsePage, setHorsePage] = useState(1)
  const PAGE_SIZE = 6

  const [showHorseModal, setShowHorseModal] = useState(false)
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null)
  const [horseForm, setHorseForm] = useState({
    name: '', breed: '', age: 3, weight: 450, color: '', gender: 'MALE' as 'MALE' | 'FEMALE', origin: '', healthCertUrl: '',
  })

  // Horse Results Modal
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [horseResults, setHorseResults] = useState<any>(null)
  const [loadingResults, setLoadingResults] = useState(false)

  const { addToast } = useAnimatedToast()
  
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    addToast({ message, type })
  }

  useEffect(() => { loadData() }, [activeTab])

  useEffect(() => {
    if (activeTab === 'invitations' && selectedHorseId) {
      getHorseJockeys(selectedHorseId).then(setInvitations).catch(() => setInvitations([]))
    }
  }, [selectedHorseId, activeTab])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const hList = await getHorses()
      setHorses(hList)
      if (hList.length > 0) {
        const firstId = String(hList[0].id || hList[0]._id || '')
        setSelectedHorseId((prev) => {
          const prevStr = String(prev || '')
          return prevStr && hList.some((h) => String(h.id || h._id) === prevStr) ? prevStr : firstId
        })
      }

      if (activeTab === 'race-registration') {
        const rList = await getRaces()
        setRaces(rList.filter((r) => r.status === 'SCHEDULED'))
      } else if (activeTab === 'hire-jockey') {
        const [jList, rList] = await Promise.all([searchJockeys(), getRaces()])
        setJockeys(jList)
        setRaces(rList)
      } else if (activeTab === 'invitations' && selectedHorseId) {
        const iList = await getHorseJockeys(selectedHorseId)
        setInvitations(iList)
      } else if (activeTab === 'my-registrations') {
        const rList = await getRaces()
        const myHorseIds = new Set(hList.map((h) => String(h.id || h._id)))
        const regs: { race: Race; horseId: string; horseName: string; status: string; rejectionReason?: string; confirmedByOwner?: boolean }[] = []
        await Promise.all(
          rList.map(async (race) => {
            try {
              const raceHorsesRes = await getRaceHorses(race.id)
              const matched = raceHorsesRes.horses || (Array.isArray(raceHorsesRes) ? raceHorsesRes : [])
              matched.forEach((entry: any) => {
                const horseId = String(entry.horseId || entry.horse?._id || entry.horse?.id || '')
                if (myHorseIds.has(horseId)) {
                  const matchedHorse = hList.find((h) => String(h.id || h._id) === horseId)
                  regs.push({
                    race,
                    horseId,
                    horseName: matchedHorse?.name || entry.horse?.name || 'Ngựa',
                    status: entry.status || entry.registrationStatus || 'PENDING',
                    confirmedByOwner: entry.confirmedByOwner,
                  })
                }
              })
            } catch { /* skip races with errors */ }
          })
        )
        setRegistrations(regs)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Horse CRUD ──────────────────────────────────────────────────────────────
  const openHorseModal = (h: Horse | null) => {
    setSelectedHorse(h)
    setHorseForm(
      h
        ? { name: h.name, breed: h.breed || '', age: h.age || 0, weight: h.weight || 0, color: h.color || '', gender: h.gender || 'MALE', origin: h.origin || '', healthCertUrl: h.healthCertUrl || '' }
        : { name: '', breed: '', age: 3, weight: 450, color: '', gender: 'MALE', origin: '', healthCertUrl: '' },
    )
    setShowHorseModal(true)
  }

  const handleSaveHorse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedHorse) {
        await updateHorse(selectedHorse.id, horseForm)
        showToast(`Đã cập nhật thông tin ngựa ${horseForm.name}`)
      } else {
        await createHorse(horseForm)
        showToast(`Đã thêm ngựa ${horseForm.name} — Đang chờ Admin duyệt`)
      }
      setShowHorseModal(false)
      loadData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi lưu hồ sơ ngựa', 'error')
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
    try {
      await sendJockeyInvitation(selectedHorseId, jockeyId, inviteRaceId, 'Mời bạn cưỡi ngựa của tôi')
      showToast(`Đã gửi lời mời đến Jockey ${jockeyName}`)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể gửi lời mời', 'error')
    }
  }

  const handleConfirmJockey = async (jockeyId: string, raceId: string, jockeyName: string) => {
    if (!selectedHorseId) return
    try {
      await confirmJockey(selectedHorseId, jockeyId, raceId)
      showToast(`Đã chốt Jockey ${jockeyName} thành công!`)
      loadData()
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

  const filteredJockeys = jockeys.filter((j) => {
    const name = (j.userId?.fullName || j.userId?.name || '').toLowerCase()
    return name.includes(jockeySearch.toLowerCase())
  })
  const selectedHorseObj = horses.find((h) => String(h.id || h._id) === selectedHorseId)

  return (
    <div className="space-y-6">
      {/* Header section */}
      <ScrollReveal direction="up" distance={60} duration={0.8}>
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--primary-light)] p-3 ring-1 ring-[var(--primary-ring)]">
                <Trophy className="h-8 w-8 text-[var(--primary)]" />
              </div>
              <h1 className="text-4xl font-black text-[var(--text)] m-0">Quản Lý Ngựa</h1>
            </div>
            <p className="text-[var(--muted)] font-semibold text-sm max-w-xl">
              Thêm mới hồ sơ ngựa, đăng ký đua và tìm kiếm Jockey chuyên nghiệp cho đội của bạn.
            </p>
          </div>
          {activeTab === 'my-horses' && (
            <Magnetic intensity={0.2}>
              <Button onClick={() => openHorseModal(null)} className="h-11 px-6 font-bold bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 shadow-lg shadow-[var(--primary)]/20">
                + Thêm Ngựa Mới
              </Button>
            </Magnetic>
          )}
        </div>
      </ScrollReveal>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 p-4 font-semibold text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v: any) => startTransition(() => setActiveTab(v))}>
        <ScrollReveal direction="up" distance={20} duration={0.5} delay={0.1}>
          <TabsList className="bg-[var(--surface)] border border-[var(--border)] p-1 rounded-xl shadow-sm mb-6 flex-wrap h-auto">
            <TabsTrigger value="my-horses" className="py-2.5 px-4 rounded-lg"><Trophy className="w-4 h-4 mr-2" /> Hồ Sơ Ngựa</TabsTrigger>
            <TabsTrigger value="race-registration" className="py-2.5 px-4 rounded-lg"><Activity className="w-4 h-4 mr-2" /> Đăng Ký Đua</TabsTrigger>
            <TabsTrigger value="my-registrations" className="py-2.5 px-4 rounded-lg"><FileCheck className="w-4 h-4 mr-2" /> Đã Đăng Ký</TabsTrigger>
            <TabsTrigger value="hire-jockey" className="py-2.5 px-4 rounded-lg"><Users className="w-4 h-4 mr-2" /> Tuyển Jockey</TabsTrigger>
            <TabsTrigger value="invitations" className="py-2.5 px-4 rounded-lg"><History className="w-4 h-4 mr-2" /> Lời Mời Jockey</TabsTrigger>
          </TabsList>
        </ScrollReveal>

        {/* ── TAB 1: My Horses ── */}
        <TabsContent value="my-horses">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="card p-6 h-64 skeleton rounded-2xl" />)}
            </div>
          ) : horses.length === 0 ? (
            <Card className="border-[var(--border)] bg-[var(--surface)] text-center py-20">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg2)] mb-4 shadow-inner text-4xl">🐴</div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-2">Chưa có ngựa nào</h3>
              <p className="text-[var(--muted)] max-w-sm mx-auto font-medium mb-6">Bạn cần thêm hồ sơ ngựa để có thể đăng ký tham gia các giải đấu hấp dẫn.</p>
              <Button onClick={() => openHorseModal(null)} variant="outline" className="border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-light)]">
                Thêm ngựa ngay
              </Button>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {horses.slice((horsePage - 1) * PAGE_SIZE, horsePage * PAGE_SIZE).map((h, index) => {
                  const sc = statusConfig(h.status || 'PENDING')
                  return (
                    <ScrollReveal key={h.id} direction="up" distance={40} duration={0.6} delay={index * 0.1}>
                      <Card className="h-full border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/30 hover:shadow-xl hover:shadow-[var(--primary)]/5 transition-all overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-[var(--border)] flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0" style={{ background: horseAvatarColor(h.name) }}>🐎</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-bold text-lg text-[var(--text)] truncate">{h.name}</h3>
                              <Badge variant="outline" className={sc.cls}>{sc.icon}{sc.label}</Badge>
                            </div>
                            <p className="text-xs text-[var(--muted)] font-medium truncate">{h.breed} · {h.origin}</p>
                            <div className="flex gap-2 mt-3">
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-none text-xs"><Activity className="w-3 h-3 mr-1" /> {(h as any).stats?.races ?? 0} trận</Badge>
                              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-none text-xs"><Star className="w-3 h-3 mr-1" /> {(h as any).stats?.wins ?? 0} thắng</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-2 bg-[var(--bg2)]/50">
                          <div className="text-center p-2 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                            <div className="font-bold text-[var(--text)] text-sm">{h.age}</div>
                            <div className="text-[10px] uppercase text-[var(--muted)] font-semibold mt-0.5">Tuổi</div>
                          </div>
                          <div className="text-center p-2 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                            <div className="font-bold text-[var(--text)] text-sm">{h.weight}</div>
                            <div className="text-[10px] uppercase text-[var(--muted)] font-semibold mt-0.5">Kg</div>
                          </div>
                          <div className="text-center p-2 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                            <div className="font-bold text-[var(--text)] text-sm">{h.gender === 'MALE' ? 'Đực' : 'Cái'}</div>
                            <div className="text-[10px] uppercase text-[var(--muted)] font-semibold mt-0.5">Giới Tính</div>
                          </div>
                        </div>
                        <div className="mt-auto p-4 flex items-center justify-between border-t border-[var(--border)]">
                          {h.healthCertUrl ? (
                            <a href={h.healthCertUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-500 hover:underline flex items-center">
                              <FileCheck className="w-3 h-3 mr-1" /> Sức Khỏe
                            </a>
                          ) : (
                            <span className="text-xs font-bold text-red-500 flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> Thiếu</span>
                          )}
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold" onClick={() => openHorseResults(h.id, h.name)}><TrendingUp className="w-3.5 h-3.5 mr-1" /> KQ</Button>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold" onClick={() => openHorseModal(h)}>Sửa</Button>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={() => handleDeleteHorse(h.id, h.name)}>Xóa</Button>
                          </div>
                        </div>
                      </Card>
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

        {/* ── TAB 2: Race Registration ── */}
        <TabsContent value="race-registration">
          <Card className="border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl font-black text-[var(--text)]">Đăng Ký Đua</CardTitle>
              <CardDescription className="font-semibold mt-1">Chọn ngựa đã duyệt và ghi danh vào các cuộc đua sắp tới.</CardDescription>
            </CardHeader>
            <div className="flex items-center gap-4 mb-8 bg-[var(--bg2)] p-4 rounded-xl border border-[var(--border)] flex-wrap">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ background: selectedHorseObj ? horseAvatarColor(selectedHorseObj.name) : 'var(--border)' }}>{selectedHorseObj ? '🐎' : '?'}</div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">Chọn Ngựa Tham Gia</label>
                <select 
                  className="w-full h-10 bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 text-sm font-semibold text-[var(--text)] focus:border-[var(--primary)] outline-none transition-colors"
                  value={selectedHorseId} 
                  onChange={(e) => setSelectedHorseId(e.target.value)}
                >
                  <option value="">— Chọn ngựa —</option>
                  {horses.map((h) => <option key={h.id} value={String(h.id || h._id)}>{h.name} {h.status === 'APPROVED' ? '✅' : '❌'}</option>)}
                </select>
              </div>
              {selectedHorseObj && selectedHorseObj.status !== 'APPROVED' && (
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500"><AlertTriangle className="w-3 h-3 mr-1" /> Chưa duyệt</Badge>
              )}
            </div>

            {loading ? <div className="text-center p-8 text-[var(--muted)] font-medium">Đang tải cuộc đua...</div> : races.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg2)]/30">
                <div className="text-4xl mb-3">🏁</div>
                <h3 className="text-lg font-bold">Không có cuộc đua nào khả dụng</h3>
              </div>
            ) : (
              <div className="grid gap-4">
                {races.map((r, idx) => (
                  <ScrollReveal key={r.id} direction="up" distance={20} delay={idx * 0.05}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/30 transition-all">
                      <div>
                        <h4 className="font-bold text-[var(--text)] text-lg mb-2">{r.name}</h4>
                        <div className="flex flex-wrap gap-3">
                          <Badge variant="secondary" className="bg-[var(--bg2)] font-semibold"><CalendarRange className="w-3 h-3 mr-1"/> {new Date(r.scheduledAt).toLocaleString('vi-VN')}</Badge>
                          <Badge variant="secondary" className="bg-[var(--bg2)] font-semibold">📏 {r.distance}m</Badge>
                          <Badge variant="secondary" className="bg-[var(--bg2)] font-semibold">👥 Max {r.maxHorses}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0">
                        <div className="text-amber-500 font-bold text-sm bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                          🥇 {r.prizeFirst?.toLocaleString('vi-VN')} VND
                        </div>
                        <Button onClick={() => handleRegisterRace(r)} className="font-bold shadow-md shadow-[var(--primary)]/20">
                          Ghi Danh Ngay
                        </Button>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── TAB 3: My Registrations ── */}
        <TabsContent value="my-registrations">
          <Card className="border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl font-black text-[var(--text)]">Đăng Ký Của Tôi</CardTitle>
              <CardDescription className="font-semibold mt-1">Theo dõi tình trạng phê duyệt của Admin cho các cuộc đua đã đăng ký.</CardDescription>
            </CardHeader>
            {loading ? <div className="text-center p-8 text-[var(--muted)] font-medium">Đang tải...</div> : registrations.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg2)]/30">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="text-lg font-bold">Chưa có đăng ký nào</h3>
              </div>
            ) : (
              <div className="grid gap-4">
                {registrations.map((reg, idx) => {
                  const sc = statusConfig(reg.status)
                  return (
                    <ScrollReveal key={idx} direction="up" distance={20} delay={idx * 0.05}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/20 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-xl shrink-0 border border-[var(--primary-ring)]">🐎</div>
                          <div>
                            <h4 className="font-bold text-[var(--text)] text-lg">{reg.horseName}</h4>
                            <div className="text-sm font-semibold text-[var(--muted)] mt-1 flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5" /> {reg.race.name}
                            </div>
                            <div className="text-xs text-[var(--muted)] mt-2 font-medium">📅 {new Date(reg.race.scheduledAt).toLocaleString('vi-VN')}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                          <Badge variant="outline" className={sc.cls}>{sc.icon} {reg.status}</Badge>
                          <div className="text-xs font-semibold text-[var(--muted)]">
                            {reg.status === 'PENDING' ? 'Chờ Admin duyệt' : reg.status === 'APPROVED' ? (reg.confirmedByOwner ? 'Đã xác nhận' : 'Cần chốt tham gia') : reg.status === 'CONFIRMED' ? 'Đã chốt danh sách' : 'Bị từ chối'}
                          </div>
                          {reg.status === 'REJECTED' && reg.rejectionReason && (
                            <div className="text-xs font-bold text-red-500 mt-1">Lý do: {reg.rejectionReason}</div>
                          )}
                          {reg.status === 'APPROVED' && !reg.confirmedByOwner && (
                            <Button size="sm" onClick={() => handleConfirmRace(reg.horseId, reg.race.id)} className="mt-1 shadow-md">✓ Xác Nhận Tham Gia</Button>
                          )}
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── TAB 4: Hire Jockey ── */}
        <TabsContent value="hire-jockey">
          <Card className="border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl font-black text-[var(--text)]">Tuyển Jockey</CardTitle>
              <CardDescription className="font-semibold mt-1">Tìm kiếm và gửi lời mời đến các kỵ sĩ xuất sắc nhất cho ngựa của bạn.</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-[var(--bg2)] p-4 rounded-xl border border-[var(--border)]">
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">Ngựa của bạn</label>
                <select className="w-full h-10 bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)]" value={selectedHorseId} onChange={(e) => setSelectedHorseId(e.target.value)}>
                  <option value="">— Chọn ngựa —</option>
                  {horses.map((h) => <option key={h.id} value={String(h.id || h._id)}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">Cuộc đua</label>
                <select className="w-full h-10 bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)]" value={inviteRaceId} onChange={(e) => setInviteRaceId(e.target.value)}>
                  <option value="">— Chọn cuộc đua —</option>
                  {races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">Tìm Jockey</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                  <input placeholder="Nhập tên..." className="w-full h-10 bg-[var(--surface)] border border-[var(--border)] rounded-md pl-9 pr-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)]" value={jockeySearch} onChange={(e) => setJockeySearch(e.target.value)} />
                </div>
              </div>
            </div>

            {loading ? <div className="text-center p-8 text-[var(--muted)] font-medium">Đang tìm kỵ sĩ...</div> : filteredJockeys.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg2)]/30">
                <div className="text-4xl mb-3">🏇</div>
                <h3 className="text-lg font-bold">Không tìm thấy Jockey</h3>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredJockeys.map((j, idx) => {
                  const name = j.userId?.fullName || j.userId?.name || 'Jockey'
                  const winRate = j.winRate ?? 0
                  return (
                    <ScrollReveal key={j.id} direction="up" distance={20} delay={idx * 0.05}>
                      <div className="flex gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/30 transition-all">
                        <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-xl shrink-0 border border-blue-500/20">
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-[var(--text)] truncate text-lg">{name}</h4>
                            <Badge variant="outline" className={j.status === 'AVAILABLE' ? 'border-emerald-500/30 text-emerald-500' : 'border-slate-500/30 text-slate-400'}>{j.status}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="secondary" className="bg-[var(--bg2)] text-xs font-semibold"><History className="w-3 h-3 mr-1" /> {j.experience} năm KN</Badge>
                            <Badge variant="secondary" className="bg-[var(--bg2)] text-xs font-semibold text-amber-500"><Trophy className="w-3 h-3 mr-1" /> {winRate}% Win</Badge>
                          </div>
                          <Button size="sm" className="w-full font-bold shadow-md" onClick={() => handleInviteJockey(j.id, name)} disabled={j.status !== 'AVAILABLE'}>
                            ✉️ Gửi Lời Mời
                          </Button>
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── TAB 5: Invitations ── */}
        <TabsContent value="invitations">
          <Card className="border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl font-black text-[var(--text)]">Quản Lý Lời Mời</CardTitle>
              <CardDescription className="font-semibold mt-1">Theo dõi phản hồi và chốt Jockey chính thức cho ngựa đua.</CardDescription>
            </CardHeader>
            <div className="mb-8 max-w-sm">
              <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">Lọc Theo Ngựa</label>
              <select className="w-full h-10 bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)]" value={selectedHorseId} onChange={(e) => setSelectedHorseId(e.target.value)}>
                <option value="">— Chọn ngựa —</option>
                {horses.map((h) => <option key={h.id} value={String(h.id || h._id)}>{h.name}</option>)}
              </select>
            </div>

            {invitations.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg2)]/30">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="text-lg font-bold">Chưa có lời mời nào</h3>
              </div>
            ) : (
              <div className="grid gap-4">
                {invitations.map((inv, idx) => {
                  const jockeyName = inv.jockeyId?.fullName || inv.jockeyId?.name || 'Jockey'
                  const statusMap: Record<string, { cls: string; label: string; icon: any }> = {
                    PENDING:   { cls: 'border-amber-500/30 text-amber-500 bg-amber-500/10', label: 'Chờ phản hồi', icon: <AlertTriangle className="w-3 h-3 mr-1" /> },
                    ACCEPTED:  { cls: 'border-blue-500/30 text-blue-500 bg-blue-500/10', label: 'Jockey Đồng Ý', icon: <Check className="w-3 h-3 mr-1" /> },
                    REJECTED:  { cls: 'border-red-500/30 text-red-500 bg-red-500/10', label: 'Bị Từ Chối', icon: <X className="w-3 h-3 mr-1" /> },
                    CONFIRMED: { cls: 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10', label: 'Chốt Thành Công', icon: <Check className="w-3 h-3 mr-1" /> },
                  }
                  const sc = statusMap[inv.status] ?? { cls: 'border-slate-500/30', label: inv.status, icon: null }

                  return (
                    <ScrollReveal key={inv._id || inv.id} direction="up" distance={20} delay={idx * 0.05}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/20 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-lg shrink-0 border border-blue-500/20">{jockeyName.slice(0, 2).toUpperCase()}</div>
                          <div>
                            <h4 className="font-bold text-[var(--text)] text-lg">{jockeyName}</h4>
                            <div className="text-sm font-semibold text-[var(--muted)] mt-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Giải đua: {inv.raceId?.name || '—'}</div>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary" className="bg-[var(--bg2)] text-[10px]">Win Rate: {inv.jockeyId?.winRate ?? 0}%</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                          <Badge variant="outline" className={sc.cls}>{sc.icon} {sc.label}</Badge>
                          {inv.status === 'ACCEPTED' && (
                            <Button size="sm" className="mt-2 font-bold shadow-md shadow-[var(--primary)]/20" onClick={() => handleConfirmJockey(inv.jockeyId?._id || inv.jockeyId, inv.raceId?._id || inv.raceId, jockeyName)}>
                              ✓ Chốt Jockey Này
                            </Button>
                          )}
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Modal: Horse Results ── */}
      {showResultsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowResultsModal(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg2)]/50">
              <h2 className="text-xl font-black flex items-center gap-2"><Trophy className="text-amber-500 w-5 h-5" /> Kết Quả: {horseResults?.horseName}</h2>
              <button className="text-[var(--muted)] hover:text-[var(--text)] rounded-full p-1" onClick={() => setShowResultsModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {loadingResults ? <div className="text-center p-8 text-[var(--muted)]">Đang tải kết quả...</div> : horseResults?.results?.length > 0 ? (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[var(--bg2)] p-4 rounded-xl text-center border border-[var(--border)]"><div className="text-xs uppercase font-bold text-[var(--muted)] mb-1">Số Trận</div><div className="text-2xl font-black">{horseResults.stats.totalRaces}</div></div>
                    <div className="bg-[var(--bg2)] p-4 rounded-xl text-center border border-amber-500/20 text-amber-500"><div className="text-xs uppercase font-bold mb-1">Thắng</div><div className="text-2xl font-black">{horseResults.stats.wins}</div></div>
                    <div className="bg-[var(--bg2)] p-4 rounded-xl text-center border border-emerald-500/20 text-emerald-500"><div className="text-xs uppercase font-bold mb-1">Top 3</div><div className="text-2xl font-black">{horseResults.stats.topThree}</div></div>
                    <div className="bg-[var(--bg2)] p-4 rounded-xl text-center border border-blue-500/20 text-blue-500"><div className="text-xs uppercase font-bold mb-1">Tiền Thưởng</div><div className="text-lg font-black">{horseResults.stats.totalPrizes.toLocaleString('vi-VN')} đ</div></div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[var(--bg2)] text-[var(--muted)] text-xs uppercase font-bold">
                        <tr><th className="p-4 border-b border-[var(--border)]">Giải / Ngày</th><th className="p-4 border-b border-[var(--border)] text-center">Vị Trí</th><th className="p-4 border-b border-[var(--border)] text-right">Tiền Thưởng</th></tr>
                      </thead>
                      <tbody>
                        {horseResults.results.map((r: any, i: number) => (
                          <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg2)]/50 transition-colors">
                            <td className="p-4"><div className="font-bold text-[var(--text)]">{r.raceName}</div><div className="text-xs text-[var(--muted)]">{new Date(r.date).toLocaleDateString('vi-VN')}</div></td>
                            <td className="p-4 text-center"><Badge variant="outline" className={r.position === 1 ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' : 'border-[var(--border)]'}>#{r.position}</Badge></td>
                            <td className="p-4 text-right font-bold text-emerald-500">{r.prize.toLocaleString('vi-VN')} đ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : <div className="text-center p-8 text-[var(--muted)] font-medium">Chưa có kết quả thi đấu nào.</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Form Thêm/Sửa Ngựa ── */}
      {showHorseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowHorseModal(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg2)]/50">
              <h2 className="text-xl font-black">{selectedHorse ? 'Chỉnh Sửa Ngựa' : 'Thêm Ngựa Mới'}</h2>
              <button className="text-[var(--muted)] hover:text-[var(--text)] rounded-full p-1" onClick={() => setShowHorseModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveHorse} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">Tên ngựa</label>
                <input required className="w-full h-10 bg-[var(--bg2)] border border-[var(--border)] rounded-lg px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]" value={horseForm.name} onChange={(e) => setHorseForm({ ...horseForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">Giống</label>
                  <input className="w-full h-10 bg-[var(--bg2)] border border-[var(--border)] rounded-lg px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]" value={horseForm.breed} onChange={(e) => setHorseForm({ ...horseForm, breed: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">Màu sắc</label>
                  <input className="w-full h-10 bg-[var(--bg2)] border border-[var(--border)] rounded-lg px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]" value={horseForm.color} onChange={(e) => setHorseForm({ ...horseForm, color: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">Tuổi</label>
                  <input type="number" className="w-full h-10 bg-[var(--bg2)] border border-[var(--border)] rounded-lg px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]" value={horseForm.age} onChange={(e) => setHorseForm({ ...horseForm, age: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">Cân nặng (kg)</label>
                  <input type="number" className="w-full h-10 bg-[var(--bg2)] border border-[var(--border)] rounded-lg px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]" value={horseForm.weight} onChange={(e) => setHorseForm({ ...horseForm, weight: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">Giới tính</label>
                  <select className="w-full h-10 bg-[var(--bg2)] border border-[var(--border)] rounded-lg px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]" value={horseForm.gender} onChange={(e) => setHorseForm({ ...horseForm, gender: e.target.value as any })}>
                    <option value="MALE">Đực</option>
                    <option value="FEMALE">Cái</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">Xuất xứ</label>
                  <input className="w-full h-10 bg-[var(--bg2)] border border-[var(--border)] rounded-lg px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]" value={horseForm.origin} onChange={(e) => setHorseForm({ ...horseForm, origin: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1 block">URL Giấy khám sức khỏe</label>
                <input className="w-full h-10 bg-[var(--bg2)] border border-[var(--border)] rounded-lg px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]" value={horseForm.healthCertUrl} onChange={(e) => setHorseForm({ ...horseForm, healthCertUrl: e.target.value })} />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
                <Button type="button" variant="ghost" onClick={() => setShowHorseModal(false)}>Hủy</Button>
                <Button type="submit" className="font-bold shadow-md shadow-[var(--primary)]/20">Lưu Thông Tin</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
