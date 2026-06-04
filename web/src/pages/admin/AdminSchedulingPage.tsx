import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Tournament, Race, User, RaceRegistration, Horse, Jockey, Prediction } from '../../types'
import {
  getTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  getRaces,
  createRace,
  updateRace,
  createSchedule,
  assignReferee,
  getAdminUsers,
  getRaceRegistrations,
  approveRaceRegistration,
  rejectRaceRegistration,
  getAdminHorses,
  approveHorse,
  rejectHorse,
  getAdminJockeys,
  publishRaceResult,
  getAdminPredictions,
  closePredictions,
  settlePredictions,
  getPredictionStats,
} from '@/api'
import { http } from '../../api/http'

type Tab = 'dashboard' | 'tournaments' | 'registrations' | 'horses-jockeys' | 'referee-results' | 'predictions'

// ── Toast helper ──────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info'
type ToastItem = { id: number; type: ToastType; message: string }
let _tid = 0
function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const show = (message: string, type: ToastType = 'success') => {
    const id = ++_tid
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }
  return { toasts, show }
}
const toastIcon: Record<ToastType, string> = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }

export function AdminSchedulingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as Tab) || 'dashboard'
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ---------------------------------------------------------
  // DATA STATES
  // ---------------------------------------------------------
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [registrations, setRegistrations] = useState<RaceRegistration[]>([])
  const [horses, setHorses] = useState<Horse[]>([])
  const [jockeys, setJockeys] = useState<Jockey[]>([])
  const [referees, setReferees] = useState<User[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  
  // Dashboard Stats
  const [adminStats, setAdminStats] = useState({
    tournaments: 0,
    activeRaces: 0,
    pendingHorses: 0,
    pendingRegs: 0,
  })

  // ---------------------------------------------------------
  // MODAL STATES
  // ---------------------------------------------------------
  // Tournaments
  const [showTournModal, setShowTournModal] = useState(false)
  const [selectedTourn, setSelectedTourn] = useState<Tournament | null>(null)
  const [tournForm, setTournForm] = useState({
    name: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    prizePool: 0,
    maxHorses: 10,
    status: 'DRAFT',
  })

  // Races
  const [showRaceModal, setShowRaceModal] = useState(false)
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [raceForm, setRaceForm] = useState({
    tournamentId: '',
    name: '',
    distance: 1000,
    scheduledAt: '',
    maxHorses: 8,
    prizeFirst: 0,
    prizeSecond: 0,
    prizeThird: 0,
    refereeId: '',
  })

  // Schedule linking
  const [showSchedModal, setShowSchedModal] = useState(false)
  const [schedForm, setSchedForm] = useState({
    raceId: '',
    tournamentId: '',
    raceName: '',
    scheduledTime: '',
    location: '',
    distance: 1000,
    raceType: 'SPRINT',
    maxParticipants: 8,
    prizePool: 0,
    trackCondition: 'GOOD',
  })

  // Assign Referee
  const [showRefModal, setShowRefModal] = useState(false)
  const [refRaceId, setRefRaceId] = useState<string>('')
  const [selectedRefId, setSelectedRefId] = useState<string>('')

  // Publish Results
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultRace, setResultRace] = useState<Race | null>(null)
  const [raceHorses, setRaceHorses] = useState<any[]>([]) // list of confirmed horses for race
  const [resultRankings, setResultRankings] = useState<any[]>([]) // array of rankings inputs
  const [resultNotes, setResultNotes] = useState<string>('')

  // Prediction Stats
  const [showPredStatsModal, setShowPredStatsModal] = useState(false)
  const [predStats, setPredStats] = useState<any>(null)

  // ---------------------------------------------------------
  // INITIAL DATA LIFECYCLE
  // ---------------------------------------------------------
  useEffect(() => {
    loadTabData()
  }, [activeTab])

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const [tList, rList, hList, regList] = await Promise.all([
        getTournaments(),
        getRaces(),
        getAdminHorses(),
        getRaceRegistrations(),
      ])
      setAdminStats({
        tournaments: tList.length,
        activeRaces: rList.filter((r) => r.status === 'SCHEDULED' || r.status === 'ONGOING').length,
        pendingHorses: hList.filter((h) => h.status === 'PENDING').length,
        pendingRegs: regList.filter((r) => r.status === 'PENDING_APPROVAL').length,
      })
    } catch (err) {
      console.error('Failed to load admin stats', err)
    }
  }

  const loadTabData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'dashboard') {
        const tList = await getTournaments()
        const jList = await getAdminJockeys()
        setTournaments(tList)
        setJockeys(jList)
      } else if (activeTab === 'tournaments') {
        const list = await getTournaments()
        const refList = await getAdminUsers({ role: 'REFEREE' })
        setTournaments(list)
        setReferees(refList)
      } else if (activeTab === 'registrations') {
        const list = await getRaceRegistrations()
        setRegistrations(list)
      } else if (activeTab === 'horses-jockeys') {
        const hList = await getAdminHorses()
        const jList = await getAdminJockeys()
        setHorses(hList)
        setJockeys(jList)
      } else if (activeTab === 'referee-results') {
        const rList = await getRaces()
        const refList = await getAdminUsers({ role: 'REFEREE' })
        setRaces(rList)
        setReferees(refList)
      } else if (activeTab === 'predictions') {
        const pList = await getAdminPredictions()
        setPredictions(pList)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu từ máy chủ')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------
  // TOURNAMENT ACTIONS
  // ---------------------------------------------------------
  const openTournModal = (t: Tournament | null) => {
    setSelectedTourn(t)
    if (t) {
      setTournForm({
        name: t.name,
        description: t.description || '',
        venue: t.venue,
        startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
        endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '',
        prizePool: t.prizePool || 0,
        maxHorses: t.maxHorses || 10,
        status: t.status || 'DRAFT',
      })
    } else {
      setTournForm({
        name: '',
        description: '',
        venue: '',
        startDate: '',
        endDate: '',
        prizePool: 0,
        maxHorses: 10,
        status: 'DRAFT',
      })
    }
    setShowTournModal(true)
  }

  const handleSaveTourn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedTourn) {
        await updateTournament(selectedTourn.id, tournForm as any)
        showToast(`Đã cập nhật giải đấu ${tournForm.name}`)
      } else {
        await createTournament(tournForm as any)
        showToast(`Đã tạo giải đấu ${tournForm.name} thành công`)
      }
      setShowTournModal(false)
      loadTabData()
      loadDashboardStats()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể lưu giải đấu', 'error')
    }
  }

  const handleDeleteTourn = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa giải đấu "${name}"?`)) return
    try {
      await deleteTournament(id)
      showToast(`Đã xóa giải đấu ${name}`)
      loadTabData()
      loadDashboardStats()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa giải đấu', 'error')
    }
  }

  const handleQuickStatusChange = async (id: string, name: string, newStatus: string) => {
    try {
      await updateTournament(id, { status: newStatus } as any)
      const statusLabel: Record<string, string> = {
        DRAFT: 'Bản nháp',
        PUBLISHED: 'Đã công bố',
        ONGOING: 'Đang diễn ra',
        COMPLETED: 'Đã kết thúc',
        CANCELLED: 'Đã hủy',
      }
      showToast(`"${name}" → ${statusLabel[newStatus] || newStatus}`)
      loadTabData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể đổi trạng thái', 'error')
    }
  }

  // ---------------------------------------------------------
  // RACE ACTIONS
  // ---------------------------------------------------------
  const openRaceModal = (race: Race | null, tournId?: string) => {
    setSelectedRace(race)
    if (race) {
      setRaceForm({
        tournamentId: typeof race.tournamentId === 'object' ? race.tournamentId._id : race.tournamentId,
        name: race.name,
        distance: race.distance,
        scheduledAt: race.scheduledAt ? new Date(race.scheduledAt).toISOString().slice(0, 16) : '',
        maxHorses: race.maxHorses,
        prizeFirst: race.prizeFirst,
        prizeSecond: race.prizeSecond,
        prizeThird: race.prizeThird,
        refereeId: typeof race.refereeId === 'object' ? race.refereeId?._id : race.refereeId || '',
      })
    } else {
      setRaceForm({
        tournamentId: tournId || '',
        name: '',
        distance: 1000,
        scheduledAt: '',
        maxHorses: 8,
        prizeFirst: 0,
        prizeSecond: 0,
        prizeThird: 0,
        refereeId: '',
      })
    }
    setShowRaceModal(true)
  }

  const handleSaveRace = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedRace) {
        await updateRace(selectedRace.id, raceForm)
        showToast(`Đã cập nhật cuộc đua ${raceForm.name}`)
      } else {
        await createRace(raceForm)
        showToast(`Đã tạo cuộc đua ${raceForm.name} thành công`)
      }
      setShowRaceModal(false)
      loadTabData()
      loadDashboardStats()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể lưu cuộc đua', 'error')
    }
  }

  // ---------------------------------------------------------
  // SCHEDULE ACTIONS
  // ---------------------------------------------------------
  const openSchedModal = (race: Race) => {
    const tId = typeof race.tournamentId === 'object' ? race.tournamentId._id : race.tournamentId
    const tVenue = typeof race.tournamentId === 'object' ? race.tournamentId.venue : 'Trường đua'
    setSchedForm({
      raceId: race.id,
      tournamentId: tId,
      raceName: race.name,
      scheduledTime: race.scheduledAt,
      location: tVenue,
      distance: race.distance,
      raceType: 'SPRINT',
      maxParticipants: race.maxHorses,
      prizePool: race.prizeFirst + race.prizeSecond + race.prizeThird,
      trackCondition: 'GOOD',
    })
    setShowSchedModal(true)
  }

  const handleSaveSched = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSchedule(schedForm)
      showToast('Đã lập lịch thi đấu thành công!')
      setShowSchedModal(false)
      loadDashboardStats()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể lập lịch thi đấu', 'error')
    }
  }

  // ---------------------------------------------------------
  // REGISTRATION ACTIONS
  // ---------------------------------------------------------
  const handleApproveReg = async (regId: string) => {
    try {
      await approveRaceRegistration(regId)
      showToast('Đã duyệt đăng ký tham gia cuộc đua')
      loadTabData()
      loadDashboardStats()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Duyệt đăng ký thất bại', 'error')
    }
  }

  const handleRejectReg = async (regId: string) => {
    const reason = window.prompt('Nhập lý do từ chối đăng ký (có thể để trống):')
    if (reason === null) return // user cancelled
    try {
      await rejectRaceRegistration(regId, reason)
      showToast('Đã từ chối đăng ký', 'warning')
      loadTabData()
      loadDashboardStats()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Từ chối thất bại', 'error')
    }
  }

  // ---------------------------------------------------------
  // HORSE APPROVAL ACTIONS
  // ---------------------------------------------------------
  const handleApproveHorse = async (horseId: string) => {
    try {
      await approveHorse(horseId)
      showToast('Đã duyệt hồ sơ ngựa thành công')
      loadTabData()
      loadDashboardStats()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể duyệt ngựa', 'error')
    }
  }

  const handleRejectHorse = async (horseId: string) => {
    const reason = window.prompt('Nhập lý do từ chối hồ sơ ngựa (có thể để trống):')
    if (reason === null) return // user cancelled
    try {
      await rejectHorse(horseId, reason)
      showToast('Đã từ chối hồ sơ ngựa', 'warning')
      loadTabData()
      loadDashboardStats()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể từ chối ngựa', 'error')
    }
  }

  // ---------------------------------------------------------
  // REFEREE & RESULT ACTIONS
  // ---------------------------------------------------------
  const openRefModal = (raceId: string, currentRefId?: string) => {
    setRefRaceId(raceId)
    setSelectedRefId(currentRefId || '')
    setShowRefModal(true)
  }

  const handleSaveReferee = async () => {
    if (!selectedRefId) return
    try {
      await assignReferee(refRaceId, selectedRefId)
      showToast('Đã phân công trọng tài thành công')
      setShowRefModal(false)
      loadTabData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể phân công trọng tài', 'error')
    }
  }

  const openResultModal = async (race: Race) => {
    setResultRace(race)
    setResultNotes('')
    try {
      const res = await http.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/races/${race.id}/horses`)
      const horsesList = res.data.horses || []
      setRaceHorses(horsesList)

      const initialRankings = horsesList.map((h: any, idx: number) => ({
        horseId: h.horse?._id || h.horse?.id,
        jockeyId: h.horse?.ownerId?._id || h.horse?.ownerId,
        position: idx + 1,
        finishTime: 60 + idx * 2.5,
        status: 'FINISHED',
        prizeAmount: idx === 0 ? race.prizeFirst : idx === 1 ? race.prizeSecond : idx === 2 ? race.prizeThird : 0,
      }))
      setResultRankings(initialRankings)
      setShowResultModal(true)
    } catch (err: any) {
      alert('Không thể lấy danh sách ngựa đã đăng ký cho cuộc đua: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleSaveResult = async () => {
    if (!resultRace) return
    try {
      const resultsPayload = resultRankings.map((r) => ({
        horseId: r.horseId,
        jockeyId: r.jockeyId?._id || r.jockeyId || undefined,
        position: parseInt(r.position),
        finishTime: parseFloat(r.finishTime),
        status: r.status,
        prizeAmount: parseFloat(r.prizeAmount),
        notes: resultNotes,
      }))

      await publishRaceResult(resultRace.id, resultsPayload)
      showToast('Công bố kết quả cuộc đua thành công!')
      setShowResultModal(false)
      loadTabData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể công bố kết quả', 'error')
    }
  }

  // ---------------------------------------------------------
  // PREDICTION ACTIONS
  // ---------------------------------------------------------
  const handleClosePredictions = async (raceId: string) => {
    try {
      await closePredictions(raceId)
      showToast('Đã đóng cổng dự đoán cho cuộc đua này!')
      loadTabData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể đóng cổng dự đoán', 'error')
    }
  }

  const handleSettlePredictions = async (raceId: string) => {
    try {
      await settlePredictions(raceId)
      showToast('Đã tất toán dự đoán và gửi thông báo thắng/thua!')
      loadTabData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể tất toán dự đoán', 'error')
    }
  }

  const handleViewPredictionStats = async (raceId: string) => {
    setPredStats(null)
    try {
      const stats = await getPredictionStats(raceId)
      setPredStats(stats)
      setShowPredStatsModal(true)
    } catch (err: any) {
      showToast('Không thể lấy thống kê dự đoán: ' + (err.response?.data?.message || err.message), 'error')
    }
  }

  const { toasts, show: showToast } = useToast()

  // Get active tab info for header text
  const tabTitles: Record<Tab, { title: string; desc: string }> = {
    dashboard: { title: 'Bảng Điều Khiển Tổng Quan', desc: 'Chào mừng trở lại, đây là cập nhật mới nhất từ hệ thống quản lý giải đấu.' },
    tournaments: { title: 'Quản Lý Giải Đấu Đua Ngựa', desc: 'Tạo mới, chỉnh sửa thông tin giải đấu và các vòng đua tương ứng.' },
    registrations: { title: 'Duyệt Đăng Ký Tham Gia Cuộc Đua', desc: 'Xem các yêu cầu đăng ký đua ngựa của chủ ngựa và tiến hành duyệt hoặc từ chối.' },
    'horses-jockeys': { title: 'Quản Lý Hồ Sơ Ngựa & Jockeys', desc: 'Duyệt các hồ sơ chiến mã và theo dõi danh sách kỵ sĩ trong hệ thống.' },
    'referee-results': { title: 'Phân Công Trọng Tài & Công Bố Kết Quả', desc: 'Lựa chọn trọng tài điều khiển trận đấu và công bố kết quả chung cuộc.' },
    predictions: { title: 'Quản Lý Dự Đoán Kết Quả (Bets)', desc: 'Kiểm soát hoạt động cược dự đoán. Đóng cổng cược trước giờ đua và tất toán thưởng.' },
  }

  const featuredTourn = tournaments[0]; // use first tournament as featured hero

  return (
    <>
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{toastIcon[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ marginBottom: 8 }}>
          <div>
            <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight" style={{ color: '#0f172a' }}>
              {tabTitles[activeTab]?.title}
            </h2>
            <p className="text-on-surface-variant font-medium mt-1" style={{ color: '#64748b' }}>
              {tabTitles[activeTab]?.desc}
            </p>
          </div>
          <button className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all active:scale-95" onClick={() => openTournModal(null)}>
            <span className="material-symbols-outlined">add_circle</span>
            Thêm giải đấu
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-elevated p-6 rounded-2xl border-t border-white" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(14,165,233,0.12)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-500">
                <span className="material-symbols-outlined text-3xl">emoji_events</span>
              </div>
              <span className="text-[10px] font-bold text-sky-600 px-2 py-1 bg-sky-50 rounded-full border border-sky-100">+2 Tháng này</span>
            </div>
            <p className="text-on-surface-variant text-sm font-semibold" style={{ color: '#64748b' }}>Tổng giải đấu</p>
            <h3 className="text-4xl font-headline font-extrabold text-on-surface mt-1" style={{ color: '#0f172a' }}>{adminStats.tournaments}</h3>
          </div>

          <div className="glass-elevated p-6 rounded-2xl border-t border-white" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(14,165,233,0.12)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-500">
                <span className="material-symbols-outlined text-3xl">timer</span>
              </div>
              <span className="text-[10px] font-bold text-purple-600 px-2 py-1 bg-purple-50 rounded-full border border-purple-100">Đang diễn ra</span>
            </div>
            <p className="text-on-surface-variant text-sm font-semibold" style={{ color: '#64748b' }}>Cuộc đua đang chạy</p>
            <h3 className="text-4xl font-headline font-extrabold text-on-surface mt-1" style={{ color: '#0f172a' }}>{adminStats.activeRaces}</h3>
          </div>

          <div className="glass-elevated p-6 rounded-2xl border-t border-white" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(14,165,233,0.12)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                <span className="material-symbols-outlined text-3xl">person_add</span>
              </div>
              <span className="text-[10px] font-bold text-red-600 px-2 py-1 bg-red-50 rounded-full border border-red-100">Cần xử lý</span>
            </div>
            <p className="text-on-surface-variant text-sm font-semibold" style={{ color: '#64748b' }}>Đăng ký chờ duyệt</p>
            <h3 className="text-4xl font-headline font-extrabold text-on-surface mt-1" style={{ color: '#0f172a' }}>{adminStats.pendingRegs}</h3>
          </div>

          <div className="glass-elevated p-6 rounded-2xl border-t border-white" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(14,165,233,0.12)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-500">
                <span className="material-symbols-outlined text-3xl">pets</span>
              </div>
              <span className="text-[10px] font-bold text-teal-600 px-2 py-1 bg-teal-50 rounded-full border border-teal-100">Chờ duyệt</span>
            </div>
            <p className="text-on-surface-variant text-sm font-semibold" style={{ color: '#64748b' }}>Ngựa chờ duyệt</p>
            <h3 className="text-4xl font-headline font-extrabold text-on-surface mt-1" style={{ color: '#0f172a' }}>{adminStats.pendingHorses}</h3>
          </div>
        </div>

        {error && (
          <div className="card" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ---------------------------------------------------------
            TAB: DASHBOARD OVERVIEW
            --------------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            
            {/* Primary Table Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                <h3 className="text-xl font-headline font-bold text-on-surface" style={{ color: '#0f172a' }}>Quản lý Giải Đấu Ngựa</h3>
              </div>

              {featuredTourn ? (
                <div className="glass-elevated rounded-3xl overflow-hidden border border-outline-variant" style={{ background: 'rgba(255,255,255,0.8)' }}>
                  {/* Featured Tournament Hero */}
                  <div className="relative h-72 w-full">
                    <img
                      alt={featuredTourn.name}
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpYPCj3tsTP3IsrLf6g_qojI2kgd8Ufik8Om1FQO_K6HE-BecuO1fuPS6lk2iAdYyb1OQOuaWNNPRIx3V2pp2moyFuezVuD-F-Zuwue3Ywo96V4IGya5a21v9tG3Q_ARJKDa133CBT19A3OcCyXKG49hp68ECh7QAVutTbUpRWxLpIjXMRhAhu7LBKDfZ8ldH1-cl_ZvxeTudlzuOFNSMhve2UIHLZXou0HDFiHHm1Pe86RRlU9kZUAw6pDOCj8XvqcYfgL3bSu1_d"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
                      <div className="space-y-2">
                        <span className="bg-primary text-on-primary text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full">Giải Đấu Cao Cấp</span>
                        <h4 className="text-3xl font-headline font-extrabold text-on-surface" style={{ color: '#0f172a' }}>{featuredTourn.name}</h4>
                        <div className="flex flex-wrap items-center gap-6 text-on-surface-variant text-sm font-medium" style={{ color: '#475569' }}>
                          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">location_on</span> {featuredTourn.venue}</span>
                          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">calendar_today</span> {new Date(featuredTourn.startDate).toLocaleDateString('vi-VN')} - {new Date(featuredTourn.endDate).toLocaleDateString('vi-VN')}</span>
                          <span className="flex items-center gap-2 font-bold text-primary"><span className="material-symbols-outlined text-lg">payments</span> Quỹ thưởng: {featuredTourn.prizePool?.toLocaleString('vi-VN')} VND</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button className="bg-white/80 backdrop-blur-md hover:bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer" onClick={() => openTournModal(featuredTourn)}>
                          <span className="material-symbols-outlined text-sm">edit</span> Sửa
                        </button>
                        <button className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer" onClick={() => handleDeleteTourn(featuredTourn.id, featuredTourn.name)}>
                          <span className="material-symbols-outlined text-sm">delete</span> Xóa
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rounds Table */}
                  <div className="p-8" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}>
                    <div className="flex items-center justify-between mb-6">
                      <h5 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2" style={{ color: '#0f172a' }}>
                        <span className="material-symbols-outlined text-primary">format_list_bulleted</span>
                        Danh sách vòng đua (Rounds)
                      </h5>
                      <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline cursor-pointer" style={{ background: 'none', border: 'none' }} onClick={() => openRaceModal(null, featuredTourn.id)}>
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        Thêm cuộc đua
                      </button>
                    </div>
                    <RaceList tournamentId={featuredTourn.id} onEditRace={(race) => openRaceModal(race)} onSchedule={openSchedModal} />
                  </div>
                </div>
              ) : (
                <div className="card text-center p-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300">emoji_events</span>
                  <h4 className="font-bold text-slate-700 mt-4">Chưa có giải đấu nào được tạo</h4>
                  <p className="text-sm text-slate-500 mt-2">Nhấp "Thêm giải đấu" phía trên để tạo giải đấu đầu tiên của bạn.</p>
                </div>
              )}
            </section>

            {/* Secondary Sections Bento */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Upcoming Tournaments */}
              <div className="lg:col-span-2 glass-elevated p-8 rounded-3xl space-y-6" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(14,165,233,0.12)' }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-headline font-bold text-on-surface" style={{ color: '#0f172a' }}>Giải đấu sắp tới</h4>
                  <button className="text-primary text-xs font-bold hover:underline" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSearchParams({ tab: 'tournaments' })}>
                    Xem tất cả
                  </button>
                </div>
                <div className="space-y-4">
                  {tournaments.slice(1, 3).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-outline-variant hover:border-primary transition-all cursor-pointer group" onClick={() => setSearchParams({ tab: 'tournaments' })}>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 font-bold border border-slate-100">
                          🏆
                        </div>
                        <div>
                          <h5 className="font-bold text-on-surface group-hover:text-primary transition-colors" style={{ color: '#0f172a' }}>{t.name}</h5>
                          <p className="text-xs text-on-surface-variant font-medium mt-1" style={{ color: '#64748b' }}>{t.venue} • {new Date(t.startDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-primary">{t.prizePool?.toLocaleString('vi-VN')} VND</p>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase" style={{ color: '#94a3b8' }}>Tiền thưởng</p>
                      </div>
                    </div>
                  ))}
                  {tournaments.length <= 1 && (
                    <p className="text-xs text-slate-500 italic">Chưa có giải đấu tiếp theo.</p>
                  )}
                </div>
              </div>

              {/* Featured Jockeys */}
              <div className="glass-elevated p-8 rounded-3xl space-y-6" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(14,165,233,0.12)' }}>
                <h4 className="text-xl font-headline font-bold text-on-surface" style={{ color: '#0f172a' }}>Kỵ sĩ tiêu biểu</h4>
                <div className="space-y-6">
                  {jockeys.slice(0, 3).map((j) => (
                    <div key={j.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => setSearchParams({ tab: 'horses-jockeys' })}>
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
                        🏇
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors" style={{ color: '#0f172a' }}>{j.userId?.fullName || 'Kỵ sĩ'}</h5>
                        <p className="text-[10px] text-on-surface-variant font-medium" style={{ color: '#64748b' }}>Kinh nghiệm: {j.experience} năm • Win: {j.winRate}%</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    </div>
                  ))}
                  {jockeys.length === 0 && (
                    <p className="text-xs text-slate-500 italic">Chưa có kỵ sĩ đăng ký.</p>
                  )}
                  <button className="w-full py-3 bg-primary/5 text-primary text-xs font-bold rounded-xl border border-primary/10 hover:bg-primary hover:text-on-primary transition-all cursor-pointer" onClick={() => setSearchParams({ tab: 'horses-jockeys' })}>
                    Xem tất cả kỵ sĩ
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ---------------------------------------------------------
            TAB 1: TOURNAMENTS & RACES
            --------------------------------------------------------- */}
        {activeTab === 'tournaments' && (
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '20px', color: '#0f172a' }}>Quản Lý Giải Đấu Đua Ngựa</h2>
                <p className="muted">Tạo mới, chỉnh sửa thông tin giải đấu và các vòng đua tương ứng.</p>
              </div>
              <button className="btn btnPrimary" onClick={() => openTournModal(null)}>
                + Thêm giải đấu
              </button>
            </div>

            {loading ? (
              <p className="muted">Đang tải...</p>
            ) : tournaments.length === 0 ? (
              <p className="muted">Chưa có giải đấu nào được tạo.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {tournaments.map((t) => (
                  <div key={t.id} className="card card-light" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                    <div className="flex-between">
                      <div style={{ flex: 1 }}>
                        {/* Quick Status Changer */}
                        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Trạng thái:</span>
                          <select
                            value={t.status || 'DRAFT'}
                            onChange={(e) => handleQuickStatusChange(t.id, t.name, e.target.value)}
                            style={{
                              width: 'auto',
                              padding: '3px 28px 3px 8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              borderRadius: '999px',
                              border: '1.5px solid',
                              cursor: 'pointer',
                              background:
                                t.status === 'PUBLISHED' || t.status === 'ONGOING' ? 'rgba(16,185,129,0.12)' :
                                t.status === 'COMPLETED' ? 'rgba(16,185,129,0.08)' :
                                t.status === 'CANCELLED' ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.10)',
                              borderColor:
                                t.status === 'PUBLISHED' || t.status === 'ONGOING' ? '#10b981' :
                                t.status === 'COMPLETED' ? '#059669' :
                                t.status === 'CANCELLED' ? '#ef4444' : '#f59e0b',
                              color:
                                t.status === 'PUBLISHED' || t.status === 'ONGOING' ? '#059669' :
                                t.status === 'COMPLETED' ? '#047857' :
                                t.status === 'CANCELLED' ? '#dc2626' : '#d97706',
                            }}
                          >
                            <option value="DRAFT">📝 Bản nháp</option>
                            <option value="PUBLISHED">📢 Đã công bố</option>
                            <option value="ONGOING">🏁 Đang diễn ra</option>
                            <option value="COMPLETED">✅ Hoàn thành</option>
                            <option value="CANCELLED">❌ Đã hủy</option>
                          </select>
                        </div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>{t.name}</h3>
                        <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                          📍 Địa điểm: {t.venue} | 📅 Thời gian: {new Date(t.startDate).toLocaleDateString('vi-VN')} - {new Date(t.endDate).toLocaleDateString('vi-VN')}
                        </p>
                        <p className="muted" style={{ fontSize: '13px', marginTop: 4 }}>
                          💰 Quỹ thưởng: {t.prizePool?.toLocaleString('vi-VN')} VND | Ngựa tối đa: {t.maxHorses}
                        </p>
                        {t.description && <p style={{ fontSize: '14px', marginTop: 8, fontStyle: 'italic', color: '#475569' }}>{t.description}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn" onClick={() => openRaceModal(null, t.id)}>+ Thêm cuộc đua</button>
                        <button className="btn" onClick={() => openTournModal(t)}>Sửa</button>
                        <button className="btn" style={{ color: '#ef4444' }} onClick={() => handleDeleteTourn(t.id, t.name)}>Xóa</button>
                      </div>
                    </div>

                    {/* Nested Races Section */}
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Các cuộc đua / vòng đấu thuộc giải:</h4>
                      <RaceList tournamentId={t.id} onEditRace={(race) => openRaceModal(race)} onSchedule={openSchedModal} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------
            TAB 2: RACE REGISTRATIONS APPROVAL
            --------------------------------------------------------- */}
        {activeTab === 'registrations' && (
          <div className="card">
            <h2 style={{ color: '#0f172a' }}>Duyệt Đăng Ký Tham Gia Cuộc Đua</h2>
            <p className="muted">Xem các yêu cầu đăng ký đua ngựa của chủ ngựa và tiến hành duyệt hoặc từ chối.</p>

            {loading ? (
              <p className="muted">Đang tải...</p>
            ) : registrations.length === 0 ? (
              <p className="muted" style={{ padding: '20px 0' }}>Không có yêu cầu đăng ký tham gia nào cần duyệt.</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Giải đấu / Cuộc đua</th>
                      <th>Ngựa thi đấu</th>
                      <th>Chủ ngựa (Owner)</th>
                      <th>Trạng thái đăng ký</th>
                      <th>Ngày yêu cầu</th>
                      <th style={{ textAlign: 'right' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{reg.raceId?.name || 'Cuộc đua'}</div>
                          <div className="muted" style={{ fontSize: '12px' }}>Ngày đua: {reg.raceId?.scheduledAt ? new Date(reg.raceId.scheduledAt).toLocaleDateString('vi-VN') : ''}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{reg.horseId?.name || 'Ngựa'}</div>
                          <div className="muted" style={{ fontSize: '12px' }}>Giống: {reg.horseId?.breed} | Tuổi: {reg.horseId?.age}</div>
                        </td>
                        <td>
                          <div>{reg.horseId?.ownerId?.fullName}</div>
                          <div className="muted" style={{ fontSize: '12px' }}>📞 {reg.horseId?.ownerId?.phone}</div>
                        </td>
                        <td>
                          <span className={`badge ${reg.status === 'APPROVED' ? 'badge-approved' : reg.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
                            {reg.status}
                          </span>
                          {reg.status === 'REJECTED' && (reg as any).rejectionReason && (
                            <div className="text-xs" style={{ marginTop: 4, color: '#ef4444' }}>Lý do: {(reg as any).rejectionReason}</div>
                          )}
                        </td>
                        <td>{reg.createdAt ? new Date(reg.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button className="btn btnPrimary" style={{ fontSize: '13px', padding: '6px 10px' }} onClick={() => handleApproveReg(reg.id)}>
                              Duyệt
                            </button>
                            <button className="btn" style={{ fontSize: '13px', padding: '6px 10px', color: '#ef4444' }} onClick={() => handleRejectReg(reg.id)}>
                              Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------
            TAB 3: HORSES & JOCKEYS APPROVAL
            --------------------------------------------------------- */}
        {activeTab === 'horses-jockeys' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            {/* Horse profiles approval */}
            <div className="card">
              <h2 style={{ color: '#0f172a' }}>Duyệt Hồ Sơ Ngựa Trong Hệ Thống</h2>
              <p className="muted">Khi chủ ngựa khai báo ngựa mới, hồ sơ cần được duyệt (kiểm tra chứng nhận sức khỏe) trước khi có thể đăng ký thi đấu.</p>

              {loading ? (
                <p className="muted">Đang tải...</p>
              ) : horses.length === 0 ? (
                <p className="muted">Không có hồ sơ ngựa nào cần duyệt.</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tên ngựa</th>
                        <th>Giống & Đặc điểm</th>
                        <th>Chủ ngựa</th>
                        <th>Trạng thái</th>
                        <th>Hồ sơ sức khỏe</th>
                        <th style={{ textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {horses.map((h) => (
                        <tr key={h.id}>
                          <td style={{ fontWeight: 600 }}>{h.name}</td>
                          <td>
                            <div>Giống: {h.breed} | Màu: {h.color}</div>
                            <div className="muted" style={{ fontSize: '12px' }}>Nguồn gốc: {h.origin} | Tuổi: {h.age} | Cân nặng: {h.weight}kg</div>
                          </td>
                          <td>
                            <div>{h.ownerId?.fullName || 'Chủ ngựa'}</div>
                            <div className="muted" style={{ fontSize: '12px' }}>{h.ownerId?.email}</div>
                          </td>
                          <td>
                            <span className={`badge ${h.status === 'APPROVED' ? 'badge-approved' : h.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
                              {h.status}
                            </span>
                            {h.status === 'REJECTED' && (h as any).rejectionReason && (
                              <div className="text-xs" style={{ marginTop: 4, color: '#ef4444' }}>Lý do: {(h as any).rejectionReason}</div>
                            )}
                          </td>
                          <td>
                            {h.healthCertUrl ? (
                              <a href={h.healthCertUrl} target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', fontWeight: 600 }}>
                                Xem Health Cert 🔗
                              </a>
                            ) : (
                              <span className="danger-text">Thiếu hồ sơ</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {h.status === 'PENDING' && (
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button className="btn btnPrimary" style={{ fontSize: '12px', padding: '5px 8px' }} onClick={() => handleApproveHorse(h.id)}>
                                  Duyệt
                                </button>
                                <button className="btn" style={{ fontSize: '12px', padding: '5px 8px', color: '#ef4444' }} onClick={() => handleRejectHorse(h.id)}>
                                  Từ chối
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Jockeys Directory */}
            <div className="card">
              <h2 style={{ color: '#0f172a' }}>Danh Sách Jockey (Kỵ sĩ)</h2>
              <p className="muted">Danh sách tất cả kỵ sĩ đã đăng ký hoạt động trong hệ thống kèm tỉ lệ thắng và kinh nghiệm.</p>

              {loading ? (
                <p className="muted">Đang tải...</p>
              ) : jockeys.length === 0 ? (
                <p className="muted">Chưa có kỵ sĩ nào đăng ký.</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Kỵ sĩ</th>
                        <th>Kinh nghiệm</th>
                        <th>Tỉ lệ thắng (Win Rate)</th>
                        <th>Số trận đã tham gia</th>
                        <th>Số trận thắng</th>
                        <th>Sở trường</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jockeys.map((j) => (
                        <tr key={j.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{j.userId?.fullName || 'Kỵ sĩ'}</div>
                            <div className="muted" style={{ fontSize: '12px' }}>{j.userId?.email} | 📞 {j.userId?.phone}</div>
                          </td>
                          <td>{j.experience} năm</td>
                          <td style={{ fontWeight: 600, color: '#0ea5e9' }}>{j.winRate}%</td>
                          <td>{j.races} trận</td>
                          <td>{j.wins} trận</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {j.specialties?.map((s: string) => (
                                <span key={s} className="badge badge-scheduled" style={{ fontSize: '10px', padding: '2px 6px' }}>{s}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${j.status === 'AVAILABLE' ? 'badge-approved' : 'badge-rejected'}`}>
                              {j.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------
            TAB 4: REFEREE & RESULTS PUBLISHING
            --------------------------------------------------------- */}
        {activeTab === 'referee-results' && (
          <div className="card">
            <h2 style={{ color: '#0f172a' }}>Phân Công Trọng Tài & Công Bố Kết Quả</h2>
            <p className="muted">Lựa chọn trọng tài điều khiển trận đấu và công bố kết quả chung cuộc kèm tiền thưởng của các cuộc đua.</p>

            {loading ? (
              <p className="muted">Đang tải...</p>
            ) : races.length === 0 ? (
              <p className="muted">Chưa có cuộc đua nào được tạo.</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Giải đấu / Cuộc đua</th>
                      <th>Cự ly</th>
                      <th>Ngày giờ thi đấu</th>
                      <th>Trạng thái</th>
                      <th>Trọng tài phụ trách</th>
                      <th style={{ textAlign: 'right' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {races.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.name}</div>
                          <div className="muted" style={{ fontSize: '12px' }}>Giải: {typeof r.tournamentId === 'object' ? r.tournamentId.name : 'Giải đấu'}</div>
                        </td>
                        <td>{r.distance}m</td>
                        <td>{new Date(r.scheduledAt).toLocaleString('vi-VN')}</td>
                        <td>
                          <span className={`badge ${r.status === 'COMPLETED' ? 'badge-approved' : r.status === 'ONGOING' ? 'badge-ongoing' : r.status === 'CANCELLED' ? 'badge-rejected' : 'badge-scheduled'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          {r.refereeId ? (
                            <div style={{ fontWeight: 600 }}>
                              👤 {typeof r.refereeId === 'object' ? r.refereeId.fullName : r.refereeId}
                            </div>
                          ) : (
                            <span className="danger-text">⚠️ Chưa có trọng tài</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            {r.status === 'SCHEDULED' && (
                              <>
                                <button type="button" className="btn" style={{ fontSize: '12px', padding: '5px 8px' }} onClick={() => openRefModal(r.id, r.refereeId && typeof r.refereeId === 'object' ? r.refereeId._id : r.refereeId)}>
                                  Phân trọng tài
                                </button>
                                <button className="btn btnPrimary" style={{ fontSize: '12px', padding: '5px 8px' }} onClick={() => openSchedModal(r)}>
                                  Lập lịch (Schedule)
                                </button>
                              </>
                            )}
                            {r.status === 'ONGOING' && (
                              <button className="btn btnPrimary" style={{ fontSize: '12px', padding: '5px 8px' }} onClick={() => openResultModal(r)}>
                                Công bố kết quả
                              </button>
                            )}
                            {r.status === 'COMPLETED' && (
                              <span className="success-text" style={{ fontSize: '12px', fontWeight: 600 }}>✓ Đã hoàn thành</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------
            TAB 5: PREDICTIONS (BETTING CONTROL)
            --------------------------------------------------------- */}
        {activeTab === 'predictions' && (
          <div className="card">
            <h2 style={{ color: '#0f172a' }}>Quản Lý Dự Đoán Kết Quả (Bettings)</h2>
            <p className="muted">Kiểm soát hoạt động đặt cược dự đoán. Đóng cổng cược trước khi trận đấu bắt đầu và tiến hành trả thưởng (settle) sau khi có kết quả.</p>

            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: '16px', marginBottom: 12, color: '#0f172a' }}>Danh sách trận đấu đặt cược & Trạng thái:</h3>
              <PredictionRaceList
                onClosePred={handleClosePredictions}
                onSettlePred={handleSettlePredictions}
                onViewStats={handleViewPredictionStats}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: '16px', marginBottom: 12, color: '#0f172a' }}>Các giao dịch dự đoán gần đây:</h3>
              {loading ? (
                <p className="muted">Đang tải...</p>
              ) : predictions.length === 0 ? (
                <p className="muted">Chưa có lượt dự đoán nào.</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Khán giả</th>
                        <th>Cuộc đua</th>
                        <th>Ngựa chọn</th>
                        <th>Số tiền cược</th>
                        <th>Tiền thưởng có thể nhận</th>
                        <th>Trạng thái</th>
                        <th>Ngày đặt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{p.spectatorId?.fullName || p.spectatorId?.name || 'Khán giả'}</div>
                            <div className="muted" style={{ fontSize: '12px' }}>{p.spectatorId?.email}</div>
                          </td>
                          <td>{p.raceId?.name || 'Cuộc đua'}</td>
                          <td style={{ fontWeight: 600 }}>{p.horseId?.name || 'Ngựa'}</td>
                          <td>{p.betAmount?.toLocaleString('vi-VN')} VND</td>
                          <td style={{ color: '#0ea5e9', fontWeight: 600 }}>
                            {p.prizeAmount?.toLocaleString('vi-VN')} VND
                          </td>
                          <td>
                            <span className={`badge ${p.status === 'WON' ? 'badge-approved' : p.status === 'LOST' ? 'badge-rejected' : p.status === 'CLOSED' ? 'badge-inactive' : 'badge-pending'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------
            MODALS
            --------------------------------------------------------- */}

        {/* 1. Tournament Modal */}
        {showTournModal && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTournModal(false) }}>
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ color: '#0f172a' }}>🏆 {selectedTourn ? 'Chỉnh sửa Giải đấu' : 'Thêm Giải đấu mới'}</h3>
                <button className="modal-close" onClick={() => setShowTournModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSaveTourn}>
                <div className="modal-body">
                  <div className="form-group">
                    <label style={{ color: '#475569' }}>Tên giải đấu</label>
                    <input type="text" required value={tournForm.name} onChange={(e) => setTournForm({ ...tournForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label style={{ color: '#475569' }}>Mô tả giải đấu</label>
                    <input type="text" value={tournForm.description} onChange={(e) => setTournForm({ ...tournForm, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label style={{ color: '#475569' }}>Địa điểm tổ chức (Venue)</label>
                    <input type="text" required value={tournForm.venue} onChange={(e) => setTournForm({ ...tournForm, venue: e.target.value })} />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Ngày bắt đầu</label>
                      <input type="date" required value={tournForm.startDate} onChange={(e) => setTournForm({ ...tournForm, startDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Ngày kết thúc</label>
                      <input type="date" required value={tournForm.endDate} onChange={(e) => setTournForm({ ...tournForm, endDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Tổng tiền thưởng (VND)</label>
                      <input type="number" required value={tournForm.prizePool} onChange={(e) => setTournForm({ ...tournForm, prizePool: parseInt(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Số ngựa tối đa</label>
                      <input type="number" required value={tournForm.maxHorses} onChange={(e) => setTournForm({ ...tournForm, maxHorses: parseInt(e.target.value) })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ color: '#475569' }}>Trạng thái giải đấu</label>
                    <select value={tournForm.status} onChange={(e) => setTournForm({ ...tournForm, status: e.target.value })}>
                      <option value="DRAFT">📝 Bản nháp (DRAFT)</option>
                      <option value="PUBLISHED">📢 Đã công bố (PUBLISHED)</option>
                      <option value="ONGOING">🏁 Đang diễn ra (ONGOING)</option>
                      <option value="COMPLETED">✅ Đã kết thúc (COMPLETED)</option>
                      <option value="CANCELLED">❌ Đã hủy (CANCELLED)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={() => setShowTournModal(false)}>Hủy</button>
                  <button type="submit" className="btn btnPrimary">Lưu</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Race Modal */}
        {showRaceModal && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowRaceModal(false) }}>
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ color: '#0f172a' }}>🏁 {selectedRace ? 'Chỉnh sửa Cuộc đua' : 'Thêm Cuộc đua mới'}</h3>
                <button className="modal-close" onClick={() => setShowRaceModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSaveRace}>
                <div className="modal-body">
                  <div className="form-group">
                    <label style={{ color: '#475569' }}>Tên cuộc đua (Ví dụ: Vòng 1 — Nội dung 1200m)</label>
                    <input type="text" required value={raceForm.name} onChange={(e) => setRaceForm({ ...raceForm, name: e.target.value })} />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Cự ly (Meters)</label>
                      <input type="number" required value={raceForm.distance} onChange={(e) => setRaceForm({ ...raceForm, distance: parseInt(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Số ngựa tối đa</label>
                      <input type="number" required value={raceForm.maxHorses} onChange={(e) => setRaceForm({ ...raceForm, maxHorses: parseInt(e.target.value) })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ color: '#475569' }}>Ngày giờ bắt đầu</label>
                    <input type="datetime-local" required value={raceForm.scheduledAt} onChange={(e) => setRaceForm({ ...raceForm, scheduledAt: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label style={{ color: '#475569' }}>Trọng tài điều hành (Tùy chọn)</label>
                    <select value={raceForm.refereeId || ''} onChange={(e) => setRaceForm({ ...raceForm, refereeId: e.target.value })}>
                      <option value="">-- Chưa phân công --</option>
                      {referees.map((ref) => (
                        <option key={ref.id} value={ref.id}>
                          {ref.name} ({ref.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <h4 style={{ margin: '14px 0 8px', fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '4px', color: '#0f172a' }}>Cơ cấu giải thưởng (VND)</h4>
                  <div className="grid-3">
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Giải Nhất</label>
                      <input type="number" value={raceForm.prizeFirst} onChange={(e) => setRaceForm({ ...raceForm, prizeFirst: parseInt(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Giải Nhì</label>
                      <input type="number" value={raceForm.prizeSecond} onChange={(e) => setRaceForm({ ...raceForm, prizeSecond: parseInt(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Giải Ba</label>
                      <input type="number" value={raceForm.prizeThird} onChange={(e) => setRaceForm({ ...raceForm, prizeThird: parseInt(e.target.value) })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={() => setShowRaceModal(false)}>Hủy</button>
                  <button type="submit" className="btn btnPrimary">Lưu</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. Schedule Link Modal */}
        {showSchedModal && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSchedModal(false) }}>
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ color: '#0f172a' }}>📅 Lập Lịch Cuộc Đua</h3>
                <button className="modal-close" onClick={() => setShowSchedModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSaveSched}>
                <div className="modal-body">
                  <p className="muted" style={{ marginBottom: 14 }}>Tạo bản ghi lịch trình chung để các Jockey và Chủ ngựa có thể theo dõi và rút/xác nhận ngựa của họ.</p>
                  <div className="form-group">
                    <label style={{ color: '#475569' }}>Tên cuộc đua</label>
                    <input type="text" readOnly value={schedForm.raceName} />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Địa điểm</label>
                      <input type="text" required value={schedForm.location} onChange={(e) => setSchedForm({ ...schedForm, location: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Thời gian</label>
                      <input type="text" readOnly value={new Date(schedForm.scheduledTime).toLocaleString('vi-VN')} />
                    </div>
                  </div>
                  <div className="grid-3">
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Cự ly (m)</label>
                      <input type="number" readOnly value={schedForm.distance} />
                    </div>
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Số ngựa tối đa</label>
                      <input type="number" readOnly value={schedForm.maxParticipants} />
                    </div>
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Quỹ thưởng (VND)</label>
                      <input type="number" readOnly value={schedForm.prizePool} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Loại hình đua</label>
                      <select value={schedForm.raceType} onChange={(e) => setSchedForm({ ...schedForm, raceType: e.target.value })}>
                        <option value="SPRINT">Sprint (Đua tốc độ)</option>
                        <option value="LONG_DISTANCE">Long Distance (Đua đường dài)</option>
                        <option value="HANDICAP">Handicap (Đua chấp)</option>
                        <option value="STEEPLECHASE">Steeplechase (Đua vượt chướng ngại vật)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ color: '#475569' }}>Tình trạng đường đua</label>
                      <select value={schedForm.trackCondition} onChange={(e) => setSchedForm({ ...schedForm, trackCondition: e.target.value })}>
                        <option value="GOOD">Good (Tốt, khô ráo)</option>
                        <option value="YIELDING">Yielding (Ẩm nhẹ)</option>
                        <option value="SOFT">Soft (Mềm, trơn nhẹ)</option>
                        <option value="HEAVY">Heavy (Sũng nước, lầy)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={() => setShowSchedModal(false)}>Hủy</button>
                  <button type="submit" className="btn btnPrimary">Tạo lịch thi đấu</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. Assign Referee Modal */}
        {showRefModal && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowRefModal(false) }}>
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ color: '#0f172a' }}>⚖️ Phân Công Trọng Tài</h3>
                <button className="modal-close" onClick={() => setShowRefModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label style={{ color: '#475569' }}>Chọn Trọng tài điều hành trận đấu</label>
                  <select value={selectedRefId} onChange={(e) => setSelectedRefId(e.target.value)}>
                    <option value="">-- Lựa chọn trọng tài --</option>
                    {referees.map((ref) => (
                      <option key={ref.id} value={ref.id}>
                        {ref.name} ({ref.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={() => setShowRefModal(false)}>Hủy</button>
                <button className="btn btnPrimary" onClick={handleSaveReferee}>Lưu phân công</button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Publish Results Modal */}
        {showResultModal && resultRace && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowResultModal(false) }}>
            <div className="modal-content modal-content-lg">
              <div className="modal-header">
                <h3 style={{ color: '#0f172a' }}>🏆 Công bộ Kết quả: {resultRace.name}</h3>
                <button className="modal-close" onClick={() => setShowResultModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <p className="muted" style={{ marginBottom: 12 }}>Vui lòng thiết lập vị trí về đích, thời gian hoàn thành và giải thưởng thực tế cho từng chú ngựa tham gia.</p>

                {raceHorses.length === 0 ? (
                  <p className="danger-text">Cảnh báo: Không có ngựa nào được xác nhận tham gia cuộc đua này!</p>
                ) : (
                  <div className="admin-table-wrapper" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Tên ngựa</th>
                          <th style={{ width: '90px' }}>Thứ hạng</th>
                          <th style={{ width: '120px' }}>Thời gian về đích (s)</th>
                          <th>Trạng thái</th>
                          <th>Tiền thưởng (VND)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultRankings.map((rank, idx) => {
                          const horseObj = raceHorses.find(
                            (rh: any) => (rh.horse?._id || rh.horse?.id) === rank.horseId
                          )
                          return (
                            <tr key={rank.horseId}>
                              <td style={{ fontWeight: 600 }}>{horseObj?.horse?.name || 'Ngựa thi đấu'}</td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  max={raceHorses.length}
                                  value={rank.position}
                                  onChange={(e) => {
                                    const updated = [...resultRankings]
                                    updated[idx].position = parseInt(e.target.value)
                                    setResultRankings(updated)
                                  }}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={rank.finishTime}
                                  onChange={(e) => {
                                    const updated = [...resultRankings]
                                    updated[idx].finishTime = parseFloat(e.target.value)
                                    setResultRankings(updated)
                                  }}
                                />
                              </td>
                              <td>
                                <select
                                  value={rank.status}
                                  onChange={(e) => {
                                    const updated = [...resultRankings]
                                    updated[idx].status = e.target.value
                                    setResultRankings(updated)
                                  }}
                                >
                                  <option value="FINISHED">FINISHED</option>
                                  <option value="DISQUALIFIED">DISQUALIFIED</option>
                                  <option value="DNF">DNF (Bỏ cuộc)</option>
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={rank.prizeAmount}
                                  onChange={(e) => {
                                    const updated = [...resultRankings]
                                    updated[idx].prizeAmount = parseInt(e.target.value)
                                    setResultRankings(updated)
                                  }}
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: 16 }}>
                  <label style={{ color: '#475569' }}>Ghi chú chung của cuộc đua</label>
                  <textarea
                    style={{ width: '100%', height: '70px', padding: '8px', border: '1px solid var(--border)', borderRadius: '8px' }}
                    placeholder="Ghi chú về thời tiết, sự cố..."
                    value={resultNotes}
                    onChange={(e) => setResultNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={() => setShowResultModal(false)}>Hủy</button>
                <button className="btn btnPrimary" disabled={raceHorses.length === 0} onClick={handleSaveResult}>Công bố kết quả</button>
              </div>
            </div>
          </div>
        )}

        {/* 6. Prediction Stats Modal */}
        {showPredStatsModal && predStats && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPredStatsModal(false) }}>
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ color: '#0f172a' }}>📊 Thống Kê Dự Đoán Cuộc Đua</h3>
                <button className="modal-close" onClick={() => setShowPredStatsModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                  <div>Tổng số lượt dự đoán:</div>
                  <div style={{ fontWeight: 700, fontSize: '18px' }}>{predStats.totalPredictions || 0}</div>
                </div>
                <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                  <div>Tổng số tiền đặt cược:</div>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: '#0ea5e9' }}>
                    {(predStats.totalPool || 0).toLocaleString('vi-VN')} VND
                  </div>
                </div>

                <h4 style={{ margin: '16px 0 8px', fontSize: '14px', color: '#0f172a' }}>Chi tiết cược theo ngựa đua:</h4>
                <div className="admin-table-wrapper">
                  <table className="admin-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Ngựa đua</th>
                        <th>Lượt đặt</th>
                        <th>Tổng tiền cược</th>
                        <th>Tỉ lệ %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(predStats.breakdown || []).map((b: any) => (
                        <tr key={b.horseId}>
                          <td style={{ fontWeight: 600 }}>{b.horseName || b.horseId}</td>
                          <td>{b.count} lượt</td>
                          <td>{b.amount?.toLocaleString('vi-VN')} VND</td>
                          <td>{b.percentage}%</td>
                        </tr>
                      ))}
                      {(predStats.breakdown || []).length === 0 && (
                        <tr>
                          <td colSpan={4} className="muted" style={{ textAlign: 'center' }}>Chưa có lượt dự đoán nào cho các ngựa đua.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btnPrimary" onClick={() => setShowPredStatsModal(false)}>Đóng</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ---------------------------------------------------------
// INNER COMPONENT: RACELIST FOR TOURNAMENT
// ---------------------------------------------------------
function RaceList({
  tournamentId,
  onEditRace,
  onSchedule,
}: {
  tournamentId: string
  onEditRace: (race: Race) => void
  onSchedule: (race: Race) => void
}) {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRaces()
  }, [tournamentId])

  const loadRaces = () => {
    setLoading(true)
    getRaces(tournamentId)
      .then(setRaces)
      .catch(() => setRaces([]))
      .finally(() => setLoading(false))
  }

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateRace(id, { status: newStatus } as any)
      loadRaces()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể đổi trạng thái cuộc đua')
    }
  }

  if (loading) return <p className="muted" style={{ fontSize: '13px' }}>Đang tải danh sách cuộc đua...</p>
  if (races.length === 0) return <p className="muted" style={{ fontSize: '13px', fontStyle: 'italic' }}>Chưa có cuộc đua nào được thiết lập cho giải đấu này.</p>

  return (
    <div className="admin-table-wrapper" style={{ margin: 0 }}>
      <table className="admin-table" style={{ fontSize: '13px' }}>
        <thead>
          <tr>
            <th>Tên cuộc đua</th>
            <th>Cự ly</th>
            <th>Thời gian</th>
            <th>Số ngựa tối đa</th>
            <th>Giải thưởng (1st / 2nd / 3rd)</th>
            <th>Trạng thái</th>
            <th style={{ textAlign: 'right' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {races.map((r) => (
            <tr key={r.id}>
              <td style={{ fontWeight: 600 }}>{r.name}</td>
              <td>{r.distance}m</td>
              <td>{new Date(r.scheduledAt).toLocaleString('vi-VN')}</td>
              <td>{r.maxHorses} chú ngựa</td>
              <td>
                🥇 {r.prizeFirst?.toLocaleString('vi-VN')} | 🥈 {r.prizeSecond?.toLocaleString('vi-VN')} | 🥉 {r.prizeThird?.toLocaleString('vi-VN')}
              </td>
              <td>
                <select
                  value={r.status || 'SCHEDULED'}
                  onChange={(e) => handleQuickStatusChange(r.id, e.target.value)}
                  style={{
                    width: 'auto',
                    padding: '2px 24px 2px 6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '999px',
                    border: '1px solid',
                    cursor: 'pointer',
                    background:
                      r.status === 'ONGOING' ? 'rgba(16,185,129,0.12)' :
                      r.status === 'COMPLETED' ? 'rgba(16,185,129,0.08)' :
                      r.status === 'CANCELLED' ? 'rgba(239,68,68,0.10)' : 'rgba(59,130,246,0.10)',
                    borderColor:
                      r.status === 'ONGOING' ? '#10b981' :
                      r.status === 'COMPLETED' ? '#059669' :
                      r.status === 'CANCELLED' ? '#ef4444' : '#3b82f6',
                    color:
                      r.status === 'ONGOING' ? '#059669' :
                      r.status === 'COMPLETED' ? '#047857' :
                      r.status === 'CANCELLED' ? '#dc2626' : '#2563eb',
                  }}
                >
                  <option value="SCHEDULED">⏰ Đã lên lịch</option>
                  <option value="ONGOING">🏁 Đang diễn ra</option>
                  <option value="COMPLETED">✅ Hoàn thành</option>
                  <option value="CANCELLED">❌ Đã hủy</option>
                </select>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: 4 }}>
                  <button className="btn" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => onEditRace(r)}>
                    Sửa
                  </button>
                  {r.status === 'SCHEDULED' && (
                    <button className="btn btnPrimary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => onSchedule(r)}>
                      Lập lịch
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------
// INNER COMPONENT: PREDICTION RACE LIST
// ---------------------------------------------------------
function PredictionRaceList({
  onClosePred,
  onSettlePred,
  onViewStats,
}: {
  onClosePred: (raceId: string) => void
  onSettlePred: (raceId: string) => void
  onViewStats: (raceId: string) => void
}) {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getRaces()
      .then(setRaces)
      .catch(() => setRaces([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="muted">Đang tải danh sách cuộc đua đặt cược...</p>
  if (races.length === 0) return <p className="muted">Không có cuộc đua nào để cược.</p>

  return (
    <div className="admin-table-wrapper" style={{ margin: 0 }}>
      <table className="admin-table" style={{ fontSize: '13px' }}>
        <thead>
          <tr>
            <th>Cuộc đua / Giải đấu</th>
            <th>Thời gian thi đấu</th>
            <th>Trạng thái đua</th>
            <th style={{ textAlign: 'right' }}>Cổng dự đoán (Betting Controls)</th>
          </tr>
        </thead>
        <tbody>
          {races.map((r) => {
            const isCompleted = r.status === 'COMPLETED'
            return (
              <tr key={r.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div className="muted" style={{ fontSize: '11px' }}>
                    Giải: {typeof r.tournamentId === 'object' ? r.tournamentId.name : 'Giải đua ngựa'}
                  </div>
                </td>
                <td>{new Date(r.scheduledAt).toLocaleString('vi-VN')}</td>
                <td>
                  <span className={`badge ${r.status === 'COMPLETED' ? 'badge-approved' : r.status === 'ONGOING' ? 'badge-ongoing' : 'badge-scheduled'}`}>
                    {r.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button className="btn" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => onViewStats(r.id)}>
                      📊 Xem thống kê cược
                    </button>
                    {!isCompleted && (
                      <button className="btn" style={{ fontSize: '12px', padding: '4px 8px', color: '#d97706' }} onClick={() => onClosePred(r.id)}>
                        🔒 Đóng cổng cược
                      </button>
                    )}
                    {isCompleted && (
                      <button className="btn btnPrimary" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => onSettlePred(r.id)}>
                        🪙 Trả thưởng (Settle)
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
