import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Prediction, Race } from '../../types'
import { checkPredictionOpen, getMyPredictions, getPublicRaces, getPublicTournaments, getRaceHorses, placePrediction } from '@/api'
import { AnimatedTable, type ColumnDef } from '@/components/ui/animated-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { getStatusClassName, getStatusLabel, PREDICTION_STATUS_OPTIONS } from '@/lib/status'
import { useSession } from '../../auth/SessionContext'
import { NumberCounter } from '@/components/ui/number-counter'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { BadgeDollarSign, CheckCircle2, Clock, History, RefreshCw, Sparkles, Target, Trophy, TrendingUp, Zap } from 'lucide-react'
import '@/styles/spectator.css'

/* ── Helpers ─────────────────────────────────────── */
function statusBadge(s: string) {
  return (
    <Badge variant="outline" className={`${getStatusClassName(s, 'prediction')} font-bold`}>
      {getStatusLabel(s, 'prediction')}
    </Badge>
  )
}

function formatMoney(n?: number) {
  if (n === undefined || n === null) return '—'
  if (n === 0) return '0 VND'
  return `${new Intl.NumberFormat('vi-VN').format(n)} VND`
}

function formatMoneyInput(value: string) {
  const digits = value.replace(/[^\d]/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('en-US')
}

function parseMoneyInput(value: string) {
  const digits = value.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('vi-VN')
}

const HISTORY_TIME_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: '7d', label: '7 ngày gần đây' },
  { value: '30d', label: '30 ngày gần đây' },
  { value: '90d', label: '90 ngày gần đây' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
]

function getOptionLabel(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((option) => (option.value || 'all') === value)?.label || value
}

function isWithinWindow(dateValue: string, window: string) {
  if (window === 'all') return true
  const now = Date.now()
  const createdAt = new Date(dateValue).getTime()
  const windows: Record<string, number> = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  }
  return now - createdAt <= windows[window]
}

function normalizeHorse(horse: any) {
  if (!horse) return null
  if (horse.horse) return horse.horse
  if (horse.horseId) return horse.horseId
  return horse
}

function findHorseById(horses: any[], horseId: string) {
  for (const horse of horses) {
    const item = normalizeHorse(horse)
    if (item?._id === horseId) return item
  }
  return null
}

/* ── Main Component ──────────────────────────────── */
export function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all')
  const [historyTimeFilter, setHistoryTimeFilter] = useState('all')
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const [historySortOrder, setHistorySortOrder] = useState('newest')
  const [historyReloadKey, setHistoryReloadKey] = useState(0)
  const { balance, updateBalance } = useSession()

  const [races, setRaces] = useState<Race[]>([])
  const [tournaments, setTournaments] = useState<any[]>([])
  const [racesLoading, setRacesLoading] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState('')
  const [selectedRace, setSelectedRace] = useState('')
  const [horses, setHorses] = useState<any[]>([])
  const [horsesLoading, setHorsesLoading] = useState(false)
  const [selectedHorse, setSelectedHorse] = useState('')
  const [predictedPosition, setPredictedPosition] = useState('')
  const [betAmount, setBetAmount] = useState('')
  const [predLoading, setPredLoading] = useState(false)
  const [predMsg, setPredMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPredOpen, setIsPredOpen] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // Load prediction history
  useEffect(() => {
    setHistoryLoading(true)
    setHistoryError(null)
    getMyPredictions()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.predictions || data?.data || [])
        const mapped: Prediction[] = list.map((p: any, idx: number) => ({
          id: String(p._id || p.id || idx),
          _id: p._id || p.id,
          raceId: p.raceId,
          spectatorId: p.spectatorId,
          horseId: p.horseId || p.horse || null,
          pickedHorseName: p.pickedHorseName || p.horseName || (p.horse && p.horse.name) || undefined,
          betAmount: p.betAmount ?? p.bet_amount ?? 0,
          predictedPosition: p.predictedPosition ?? p.predicted_position,
          status: p.status ?? 'PENDING',
          prizeAmount: p.prizeAmount ?? p.prize_amount ?? p.payout ?? p.prize,
          actualPosition: p.actualPosition ?? p.actual_position,
          createdAt: p.createdAt || p.created_at || new Date().toISOString(),
        }))
        setPredictions(mapped)
      })
      .catch((err) => {
        console.error(err)
        setHistoryError('Không thể tải lịch sử dự đoán. Vui lòng thử lại.')
        setPredictions([])
      })
      .finally(() => setHistoryLoading(false))
  }, [historyReloadKey])

  // Load available races & tournaments
  useEffect(() => {
    setRacesLoading(true)
    Promise.all([
      getPublicTournaments().catch((err) => { console.error(err); return [] }),
      getPublicRaces({ status: 'SCHEDULED' }).catch((err) => { console.error(err); return [] }),
      getPublicRaces({ status: 'ONGOING' }).catch((err) => { console.error(err); return [] }),
    ])
      .then(([tourns, scheduled, ongoing]: [any, any, any]) => {
        const tList = Array.isArray(tourns) ? tourns : (tourns?.tournaments || tourns?.data || [])
        setTournaments(tList)
        
        const scheduledList: any[] = Array.isArray(scheduled) ? scheduled : (scheduled?.races || scheduled?.data || [])
        const ongoingList: any[] = Array.isArray(ongoing) ? ongoing : (ongoing?.races || ongoing?.data || [])
        const merged: any[] = [...scheduledList, ...ongoingList]
        const seen = new Set<string>()
        const unique = merged.filter((r: any) => {
          const key = r._id || r.id
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        setRaces(unique)
      })
      .catch((err) => {
        console.error(err)
        setRaces([])
        setPredMsg({ type: 'error', text: 'Không thể tải danh sách cuộc đua.' })
      })
      .finally(() => setRacesLoading(false))
  }, [])

  // Load horses when a race is selected
  useEffect(() => {
    if (!selectedRace) {
      setHorses([])
      setIsPredOpen(false)
      return
    }
    setHorsesLoading(true)
    Promise.all([
      getRaceHorses(selectedRace).catch(() => []),
      checkPredictionOpen(selectedRace).catch(() => ({ isOpen: null })),
    ])
      .then(([h, openStatus]) => {
        const horseList = Array.isArray(h) ? h : (h?.horses || h?.data || [])
        setHorses(horseList)
        
        let isOpen = false
        if (openStatus && typeof openStatus.isOpen === 'boolean') {
          // Trust BE entirely if API is successful
          isOpen = openStatus.isOpen
        } else {
          // Fallback check matching BE logic if API fails
          const raceObj = races.find((r: any) => (r._id || r.id) === selectedRace)
          if (raceObj && (raceObj.status === 'SCHEDULED' || raceObj.status === 'ONGOING')) {
            const nowUtc = new Date().getTime()
            const scheduledUtc = new Date(raceObj.scheduledAt).getTime()
            if (nowUtc < scheduledUtc) {
              isOpen = true
            }
          }
        }
        setIsPredOpen(isOpen)
      })
      .finally(() => setHorsesLoading(false))
  }, [selectedRace])

  async function handleSubmit() {
    const betValue = parseMoneyInput(betAmount)
    const positionValue = parseInt(predictedPosition, 10)
    if (!selectedRace || !selectedHorse || !betValue || !positionValue) return
    if (betValue < 100000 || betValue > 10000000) {
      setPredMsg({ type: 'error', text: 'Số tiền đặt cược phải từ 100,000 đến 10,000,000 VND' })
      return
    }
    if (betValue % 1000 !== 0) {
      setPredMsg({ type: 'error', text: 'Số tiền đặt cược phải là bội số của 1,000 VND' })
      return
    }
    if (balance < betValue) {
      setPredMsg({ type: 'error', text: 'Số dư tài khoản không đủ để đặt cược!' })
      return
    }
    setPredLoading(true)
    setPredMsg(null)
    try {
      await placePrediction(selectedRace, selectedHorse, betValue, positionValue)
      updateBalance(balance - betValue)
      setPredMsg({ type: 'success', text: 'Dự đoán thành công! 🎉' })
      setSelectedRace('')
      setSelectedHorse('')
      setPredictedPosition('')
      setBetAmount('')
      setHistoryReloadKey((value) => value + 1)
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || 'Không thể đặt dự đoán'
      setPredMsg({ type: 'error', text: msg })
    } finally {
      setPredLoading(false)
    }
  }

  const totalBet = predictions.reduce((sum, prediction) => sum + (prediction.betAmount || 0), 0)
  const wonCount = predictions.filter((prediction) => prediction.status === 'WON').length
  const totalPayout = predictions
    .filter((prediction) => prediction.status === 'WON')
    .reduce((sum, prediction) => sum + (prediction.payout || 0), 0)

  const filteredHistory = [...predictions]
    .filter((prediction) => {
      if (historyStatusFilter !== 'all' && prediction.status !== historyStatusFilter) return false
      if (historySearchQuery.trim() !== '') {
        const query = historySearchQuery.toLowerCase()
        const matchesRace = String(prediction.raceId?.name || prediction.raceId || '').toLowerCase().includes(query)
        const matchesHorse = String(prediction.horseId?.name || prediction.horseId || '').toLowerCase().includes(query)
        if (!matchesRace && !matchesHorse) return false
      }
      return isWithinWindow(prediction.createdAt ?? '', historyTimeFilter)
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt ?? '').getTime() - new Date(b.createdAt ?? '').getTime()
      return historySortOrder === 'oldest' ? diff : -diff
    })

  const predictionsColumns: ColumnDef<Prediction & { id: string }>[] = [
    {
      id: 'race',
      header: 'Cuộc đua',
      cell: (prediction: any) => (
        <span className="font-bold text-[var(--text)]">
          {prediction.raceId?.name || (typeof prediction.raceId === 'string' ? (
            <Link to={`/races/${prediction.raceId}`} className="text-emerald-400 hover:underline font-bold">Xem cuộc đua</Link>
          ) : '—')}
        </span>
      ),
    },
    {
      id: 'horse',
      header: 'Ngựa',
      cell: (prediction: any) => (
        <span className="font-bold text-[var(--text)]">
          {prediction.horseId?.name || '—'}
        </span>
      ),
    },
    {
      id: 'predictedPosition',
      header: 'Vị trí',
      cell: (prediction: any) => (
        <span className="font-bold text-amber-400">
          {prediction.predictedPosition ? `#${prediction.predictedPosition}` : '—'}
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Số tiền cược',
      cell: (prediction: any) => (
        <span className="font-bold text-amber-400">{formatMoney(prediction.betAmount)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (prediction: any) => statusBadge(prediction.status),
    },
    {
      id: 'payout',
      header: 'Tiền thưởng',
      cell: (prediction: any) => (
        <span className={prediction.status === 'WON' ? 'text-emerald-400 font-black' : 'text-[var(--muted)] font-bold'}>
          {prediction.status === 'WON' ? formatMoney(prediction.payout) : '—'}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Ngày đặt',
      cell: (prediction: any) => (
        <span className="font-semibold text-[var(--muted)] text-sm">{formatDate(prediction.createdAt)}</span>
      ),
    },
  ]

  const filteredHistoryWithId = filteredHistory.map((prediction, idx) => ({
    ...prediction,
    id: String(prediction._id || prediction.id || idx),
  }))

  return (
    <div className="space-y-8">

      {/* ════════════════════════════════════════════════════
          SECTION 1: Hero Header — Stats Overview
          ════════════════════════════════════════════════════ */}
      <ScrollReveal direction="up" distance={40} duration={0.7} delay={0.05}>
        <div className="spectator-hero">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: Title + Description */}
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/25 flex items-center justify-center">
                  <Target className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-[var(--text)] tracking-tight m-0">Dự đoán kết quả</h1>
                  <p className="text-sm text-[var(--muted)] font-medium mt-1 max-w-lg">
                    Đặt dự đoán cho các cuộc đua sắp diễn ra và theo dõi lịch sử cược của bạn.
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <div className="spectator-stat-card">
                  <div className="spectator-stat-icon spectator-stat-icon-amber">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="spectator-stat-label">Tổng cược</div>
                    <div className="spectator-stat-value text-lg"><NumberCounter value={predictions.length} duration={1} easing="easeOut" /></div>
                  </div>
                </div>
                <div className="spectator-stat-card">
                  <div className="spectator-stat-icon spectator-stat-icon-emerald">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="spectator-stat-label">Đã thắng</div>
                    <div className="spectator-stat-value text-lg text-emerald-400"><NumberCounter value={wonCount} duration={1} delay={0.1} easing="easeOut" /></div>
                  </div>
                </div>
                <div className="spectator-stat-card">
                  <div className="spectator-stat-icon spectator-stat-icon-blue">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="spectator-stat-label">Đã đặt</div>
                    <div className="spectator-stat-value text-sm">{formatMoney(totalBet)}</div>
                  </div>
                </div>
                <div className="spectator-stat-card">
                  <div className="spectator-stat-icon spectator-stat-icon-purple">
                    <BadgeDollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="spectator-stat-label">Tiền thưởng</div>
                    <div className="spectator-stat-value text-sm text-emerald-400">{formatMoney(totalPayout)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap gap-3 relative z-10 lg:mt-2">
              <Button
                variant="outline"
                className="h-10 font-semibold border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] hover:bg-[var(--surface-3)] gap-2"
                onClick={() => document.getElementById('history-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <History className="h-4 w-4" />
                Lịch sử
              </Button>
              <Button
                variant="outline"
                className="h-10 font-semibold border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] hover:bg-[var(--surface-3)] gap-2"
                onClick={() => setHistoryReloadKey((value) => value + 1)}
              >
                <RefreshCw className="h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ════════════════════════════════════════════════════
          SECTION 2: Prediction Form + Status Panel
          ════════════════════════════════════════════════════ */}
      <ScrollReveal direction="up" distance={40} duration={0.7} delay={0.1}>
        <div className="spectator-card">
          {/* Form Header */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text)] m-0">Tạo dự đoán mới</h2>
              <p className="text-xs text-[var(--muted)] font-medium mt-0.5">Chọn cuộc đua đang mở và đặt cược cho ngựa bạn tin tưởng.</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            {/* ── Left: Form Fields ── */}
            <div className="space-y-5">
              {/* Alert Message */}
              {predMsg && (
                <div className={`rounded-xl border px-4 py-3 text-sm font-semibold flex items-center gap-2 ${predMsg.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-300' : 'border-red-500/30 bg-red-500/8 text-red-300'}`}>
                  {predMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <span>⚠️</span>}
                  {predMsg.text}
                </div>
              )}

              {/* Tournament Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text)]">Chọn giải đấu</label>
                {racesLoading ? (
                  <div className="spectator-shimmer h-11 w-full" />
                ) : tournaments.length === 0 ? (
                  <div className="spectator-tip text-sm font-semibold text-amber-300">
                    ⚠️ Hiện không có giải đấu nào.
                  </div>
                ) : (
                  <Select value={selectedTournament} onValueChange={(value) => { setSelectedTournament(value ?? ''); setSelectedRace(''); setSelectedHorse('') }}>
                    <SelectTrigger className="h-11 w-full border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] font-semibold">
                      {selectedTournament
                        ? `${tournaments.find((t: any) => (t._id || t.id) === selectedTournament)?.name || '— Chọn giải đấu —'}`
                        : '— Chọn giải đấu —'}
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map((t: any) => (
                        <SelectItem key={t._id || t.id} value={t._id || t.id} className="font-semibold">
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Race Select */}
              {selectedTournament && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[var(--text)]">Chọn vòng đấu (cuộc đua)</label>
                  {(() => {
                    const filteredRaces = races.filter((r: any) => {
                      const tId = r.tournamentId?._id || r.tournamentId?.id || r.tournamentId
                      return tId === selectedTournament
                    })
                    
                    if (filteredRaces.length === 0) {
                      return (
                        <div className="spectator-tip text-sm font-semibold text-amber-300">
                          ⚠️ Giải đấu này hiện không có vòng đấu nào đang mở dự đoán.
                        </div>
                      )
                    }
                    
                    return (
                      <Select value={selectedRace} onValueChange={(value) => { setSelectedRace(value ?? ''); setSelectedHorse('') }}>
                        <SelectTrigger className="h-11 w-full border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] font-semibold">
                          {selectedRace
                            ? `${filteredRaces.find((race: any) => (race._id || race.id) === selectedRace)?.name || '— Chọn vòng đấu —'} (${getStatusLabel(filteredRaces.find((race: any) => (race._id || race.id) === selectedRace)?.status, 'race')})`
                            : '— Chọn vòng đấu —'}
                        </SelectTrigger>
                        <SelectContent>
                          {filteredRaces.map((race: any) => (
                            <SelectItem key={race._id || race.id} value={race._id || race.id} className="font-semibold">
                              {race.name} ({getStatusLabel(race.status, 'race')})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  })()}
                </div>
              )}

              {/* Warning: prediction not open */}
              {selectedRace && !isPredOpen && !horsesLoading && (
                <div className="spectator-tip text-sm font-semibold text-amber-300">
                  ⚠️ Cuộc đua này chưa mở hoặc đã đóng dự đoán
                </div>
              )}

              {/* Horse Select */}
              {selectedRace && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[var(--text)]">Chọn ngựa dự đoán thắng</label>
                  {horsesLoading ? (
                    <div className="spectator-shimmer h-11 w-full" />
                  ) : horses.length === 0 ? (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/6 px-4 py-3 text-sm text-red-300 font-semibold">
                      ⚠️ Cuộc đua này chưa có ngựa nào hoàn tất đăng ký. Vui lòng quay lại sau!
                    </div>
                  ) : (
                    <Select value={selectedHorse} onValueChange={(value) => setSelectedHorse(value ?? '')}>
                      <SelectTrigger className="h-11 w-full border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] font-semibold">
                        {selectedHorse ? (findHorseById(horses, selectedHorse)?.name || '— Chọn ngựa —') : '— Chọn ngựa —'}
                      </SelectTrigger>
                      <SelectContent>
                        {horses.map((horse: any) => {
                          const item = normalizeHorse(horse)
                          return (
                            <SelectItem key={item._id} value={item._id} className="font-semibold">
                              {item.name}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Predicted Position */}
              {selectedRace && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[var(--text)]">Dự đoán vị trí về đích</label>
                  <Select value={predictedPosition} onValueChange={(value) => setPredictedPosition(value ?? '')}>
                    <SelectTrigger className="h-11 w-full border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] font-semibold">
                      {predictedPosition ? `Vị trí thứ ${predictedPosition}` : '— Chọn vị trí —'}
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((pos) => (
                        <SelectItem key={pos} value={String(pos)} className="font-semibold">
                          Vị trí thứ {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Bet Amount */}
              {selectedRace && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[var(--text)]">Số tiền đặt cược</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={betAmount}
                    onChange={(event) => setBetAmount(formatMoneyInput(event.target.value))}
                    placeholder="Nhập số tiền..."
                    className="h-11 border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] placeholder:text-[var(--muted)]/40 font-semibold"
                  />
                  {/* Quick amount buttons */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[500000, 1000000, 2000000, 5000000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className="spectator-quick-bet"
                        onClick={() => setBetAmount(formatMoneyInput(String(amount)))}
                      >
                        {amount.toLocaleString('vi-VN')}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--muted)] font-medium mt-1">Giới hạn: 100,000 — 10,000,000 VND. Chỉ nhập bội số của 1,000 VND.</p>
                </div>
              )}

              {/* Submit */}
              {selectedRace && (
                <button
                  className="spectator-submit-btn"
                  disabled={!selectedHorse || !predictedPosition || !betAmount || predLoading || !isPredOpen}
                  onClick={handleSubmit}
                >
                  {predLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Xác nhận dự đoán
                    </>
                  )}
                </button>
              )}
            </div>

            {/* ── Right: Status Panel ── */}
            <div className="spectator-status-panel space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                <BadgeDollarSign className="h-4 w-4 text-emerald-400" />
                Trạng thái phiên đặt cược
              </div>

              <div className="space-y-3">
                <div className="spectator-status-row">
                  <span className="text-[var(--muted)] font-medium text-sm">Dự đoán</span>
                  <span className={isPredOpen ? 'text-emerald-400 font-bold text-sm' : 'text-amber-400 font-bold text-sm'}>
                    {isPredOpen ? '🟢 Đang mở' : '🟡 Chưa mở'}
                  </span>
                </div>
                <div className="spectator-status-row">
                  <span className="text-[var(--muted)] font-medium text-sm">Số ngựa</span>
                  <span className="font-bold text-[var(--text)] text-sm">{horses.length}</span>
                </div>
                <div className="spectator-status-row">
                  <span className="text-[var(--muted)] font-medium text-sm">Số dư hiện tại</span>
                  <span className="font-bold text-amber-400 text-sm">{formatMoney(balance)}</span>
                </div>
                <div className="spectator-status-row">
                  <span className="text-[var(--muted)] font-medium text-sm">Tổng thưởng</span>
                  <span className="font-bold text-emerald-400 text-sm">{formatMoney(totalPayout)}</span>
                </div>
              </div>

              {/* Tip Box */}
              <div className="spectator-tip">
                <div className="font-bold text-amber-400 text-xs mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Gợi ý
                </div>
                <p className="text-xs text-[var(--muted)] font-medium leading-relaxed">
                  Chọn cuộc đua <span className="text-[var(--text)] font-semibold">Đã lên lịch</span> hoặc <span className="text-[var(--text)] font-semibold">Đang diễn ra</span>, sau đó chọn ngựa và nhập số tiền.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ════════════════════════════════════════════════════
          SECTION 3: Prediction History
          ════════════════════════════════════════════════════ */}
      <div id="history-section">
        <ScrollReveal direction="up" distance={40} duration={0.7} delay={0.15}>
          <div className="spectator-card">
            {/* Header + Filters */}
            <div className="flex flex-col gap-4 mb-6 pb-5 border-b border-[var(--border)] md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/12 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text)] m-0">Lịch sử dự đoán</h2>
                  <p className="text-xs text-[var(--muted)] font-medium mt-0.5">Xem và lọc lịch sử đặt cược của bạn.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="h-9 w-44 border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] font-medium placeholder:text-[var(--muted)]/40 text-sm"
                />
                <Select value={historyStatusFilter} onValueChange={(value) => setHistoryStatusFilter(value ?? 'all')}>
                  <SelectTrigger className="h-9 w-36 border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] font-semibold text-sm">{getOptionLabel(PREDICTION_STATUS_OPTIONS, historyStatusFilter)}</SelectTrigger>
                  <SelectContent>
                    {PREDICTION_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value || 'all'} value={option.value || 'all'} className="font-semibold">{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={historyTimeFilter} onValueChange={(value) => setHistoryTimeFilter(value ?? 'all')}>
                  <SelectTrigger className="h-9 w-40 border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] font-semibold text-sm">{getOptionLabel(HISTORY_TIME_OPTIONS, historyTimeFilter)}</SelectTrigger>
                  <SelectContent>
                    {HISTORY_TIME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="font-semibold">{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={historySortOrder} onValueChange={(value) => setHistorySortOrder(value ?? 'newest')}>
                  <SelectTrigger className="h-9 w-32 border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] font-semibold text-sm">{getOptionLabel(SORT_OPTIONS, historySortOrder)}</SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="font-semibold">{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table Content */}
            {historyLoading ? (
              <div className="space-y-3 py-6">
                {[...Array(4)].map((_, i) => <div key={i} className="spectator-shimmer h-14 w-full" />)}
              </div>
            ) : historyError ? (
              <div className="spectator-empty">
                <div className="text-4xl mb-3">⚠️</div>
                <div className="text-lg font-bold text-red-400">{historyError}</div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="spectator-empty">
                <div className="spectator-empty-icon">🎯</div>
                <div className="text-lg font-bold text-[var(--text)]">Chưa có dự đoán phù hợp</div>
                <p className="mt-2 text-sm text-[var(--muted)] font-medium">Thay đổi bộ lọc để xem các dự đoán khác.</p>
              </div>
            ) : (
              <AnimatedTable
                data={filteredHistoryWithId}
                columns={predictionsColumns}
                emptyMessage="Không có dự đoán phù hợp"
              />
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}
