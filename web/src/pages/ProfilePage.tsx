import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyProfile, getJockeyProfile, updateJockeyProfile, getPredictions } from '@/api'
import { useSession } from '@/auth/SessionContext'
import { useAnimatedToast } from '@/components/ui/animated-toast'
import { 
  User, 
  Mail, 
  Shield, 
  Wallet, 
  Award, 
  Trophy, 
  Activity, 
  Calendar, 
  Save, 
  X, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2,
  BookOpen,
  Settings,
  Key,
  Clock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react'

// Custom CSS Animations injected dynamically
const ANIMATIONS_STYLE = `
@keyframes meteor {
  0% {
    transform: rotate(215deg) translateX(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: rotate(215deg) translateX(-600px);
    opacity: 0;
  }
}
@keyframes ripple {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
}
@keyframes shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-meteor {
  animation: meteor 5s linear infinite;
}
.animate-ripple-1 {
  animation: ripple 4s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.animate-ripple-2 {
  animation: ripple 4s cubic-bezier(0, 0, 0.2, 1) infinite 1.3s;
}
.animate-ripple-3 {
  animation: ripple 4s cubic-bezier(0, 0, 0.2, 1) infinite 2.6s;
}
.animate-shine {
  position: relative;
  overflow: hidden;
}
.animate-shine::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 50%; height: 100%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent);
  transform: skewX(-25deg);
  animation: shine 4s ease-in-out infinite;
}
.animate-gradient-shift {
  background-size: 200% 200%;
  animation: gradient-shift 6s ease infinite;
}
`

// Meteors Background Component (subtle dark star effect, mostly visible in dark mode)
function Meteors({ number = 20 }: { number?: number }) {
  const [meteorStyles, setMeteorStyles] = useState<Array<React.CSSProperties>>([])

  useEffect(() => {
    const styles = [...Array(number)].map(() => ({
      top: "-5px",
      left: Math.floor(Math.random() * 800) - 100 + "px",
      animationDelay: Math.random() * 8 + "s",
      animationDuration: Math.floor(Math.random() * 6 + 4) + "s",
    }))
    setMeteorStyles(styles)
  }, [number])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40 dark:opacity-80">
      {meteorStyles.map((style, idx) => (
        <span
          key={idx}
          className="absolute h-[1.5px] w-[1.5px] rounded-full bg-slate-400 dark:bg-slate-300 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg] animate-meteor"
          style={style}
        >
          <div className="absolute top-1/2 -translate-y-1/2 left-0 h-[1px] w-[60px] bg-gradient-to-r from-slate-400/80 to-transparent"></div>
        </span>
      ))}
    </div>
  )
}

// GlowCard Component (Border Beam / Neon Border effect)
function GlowCard({ 
  children, 
  className = "", 
  glowClass = "from-emerald-500 via-indigo-500 to-emerald-500" 
}: { 
  children: React.ReactNode; 
  className?: string; 
  glowClass?: string 
}) {
  return (
    <div className={`relative p-[1px] rounded-3xl overflow-hidden group/card ${className}`}>
      {/* Rotating / shifting gradient border */}
      <div className={`absolute inset-0 bg-gradient-to-r ${glowClass} animate-gradient-shift rounded-3xl opacity-20 dark:opacity-25 group-hover/card:opacity-90 transition-opacity duration-700`}></div>
      {/* Inner Card Content */}
      <div className="relative z-10 w-full h-full bg-[var(--surface)] backdrop-blur-xl rounded-[23px] overflow-hidden border border-[var(--border)]">
        {children}
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { session, balance } = useSession()
  const { addToast } = useAnimatedToast()
  const [profile, setProfile] = useState<any>(null)
  const [jockeyProfile, setJockeyProfile] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // Jockey Editing States
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ age: '', experience: '', bio: '', specialties: '' })
  const [saving, setSaving] = useState(false)

  // Settings Toggles
  const [notifsEnabled, setNotifsEnabled] = useState(true)
  const [confirmBets, setConfirmBets] = useState(true)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const data = await getMyProfile()
      setProfile(data)
      
      const role = data.role || session?.user.role
      if (role === 'JOCKEY') {
        const jData = await getJockeyProfile()
        setJockeyProfile(jData)
        setForm({
          age: jData.age?.toString() || '',
          experience: jData.experience?.toString() || '',
          bio: jData.bio || '',
          specialties: (jData.specialties || []).join(', ')
        })
      } else {
        // Fetch spectator/owner predictions history and stats
        const preds = await getPredictions()
        setPredictions(preds)
      }
    } catch (e) {
      setError('Không thể tải thông tin hồ sơ')
    }
  }

  async function handleSaveJockey() {
    setSaving(true)
    try {
      await updateJockeyProfile({
        age: form.age ? parseInt(form.age) : undefined,
        experience: form.experience ? parseInt(form.experience) : undefined,
        bio: form.bio || undefined,
        specialties: form.specialties ? form.specialties.split(',').map((s) => s.trim()) : undefined,
      })
      setEditing(false)
      loadProfile()
    } catch {
      addToast({ message: 'Không thể cập nhật hồ sơ Nài ngựa', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  function handlePasswordChange() {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      addToast({ message: 'Vui lòng điền đầy đủ các trường', type: 'warning' })
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      addToast({ message: 'Mật khẩu mới và xác nhận mật khẩu không khớp', type: 'warning' })
      return
    }
    addToast({ message: 'Mật khẩu của bạn đã được thay đổi thành công!', type: 'success' })
    setShowChangePassword(false)
    setPasswordForm({ current: '', new: '', confirm: '' })
  }

  if (!profile) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  )

  const isJockey = session?.user.role === 'JOCKEY'
  const userRole = profile.role || session?.user.role || 'SPECTATOR'
  const displayName = profile.fullName || session?.user.name || 'Người dùng'
  const displayEmail = profile.email || session?.user.email || 'chưa cập nhật email'

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  // Determine theme colors based on role
  const getRoleTheme = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          bg: 'from-purple-600 to-indigo-600',
          text: 'text-purple-600 dark:text-purple-400',
          border: 'border-purple-500/30',
          badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
          glow: 'bg-purple-500/10',
          glowColor: 'from-purple-500 via-indigo-500 to-purple-500',
          title: 'Quản trị viên'
        }
      case 'OWNER':
        return {
          bg: 'from-emerald-600 to-teal-600',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-500/30',
          badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
          glow: 'bg-emerald-500/10',
          glowColor: 'from-emerald-500 via-teal-500 to-emerald-500',
          title: 'Chủ ngựa'
        }
      case 'JOCKEY':
        return {
          bg: 'from-orange-500 to-amber-500',
          text: 'text-orange-600 dark:text-orange-400',
          border: 'border-orange-500/30',
          badgeBg: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
          glow: 'bg-orange-500/10',
          glowColor: 'from-orange-500 via-amber-500 to-orange-500',
          title: 'Nài ngựa'
        }
      case 'REFEREE':
        return {
          bg: 'from-blue-600 to-indigo-600',
          text: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-500/30',
          badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
          glow: 'bg-blue-500/10',
          glowColor: 'from-blue-500 via-sky-500 to-blue-500',
          title: 'Trọng tài'
        }
      default:
        return {
          bg: 'from-slate-600 to-slate-700',
          text: 'text-slate-600 dark:text-slate-400',
          border: 'border-slate-500/30',
          badgeBg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
          glow: 'bg-slate-500/10',
          glowColor: 'from-slate-500 via-slate-600 to-slate-500',
          title: 'Khán giả'
        }
    }
  }

  const theme = getRoleTheme(userRole)

  // Spectator stats calculations
  const totalPreds = predictions.length
  const wonPreds = predictions.filter(p => p.status === 'WON').length
  const winRate = totalPreds > 0 ? Math.round((wonPreds / totalPreds) * 100) : 0
  const totalPrizeWon = predictions
    .filter(p => p.status === 'WON')
    .reduce((sum, p) => sum + (p.prizeAmount || 0), 0)

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 px-4 md:px-0">
      
      {/* Inject styling animations */}
      <style>{ANIMATIONS_STYLE}</style>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 font-semibold text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ── PROFILE HERO BANNER WITH METEORS ── */}
      <div className="relative rounded-3xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] backdrop-blur-md shadow-2xl p-6 md:p-8">
        
        {/* Animated Meteors Background */}
        <Meteors number={25} />
        
        {/* Glow circles */}
        <div className={`absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-10 dark:opacity-20 ${theme.glow}`}></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl opacity-10 dark:opacity-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            
            {/* Avatar block with Ripple Effect */}
            <div className="relative flex items-center justify-center w-28 h-28">
              {/* Ripple Rings */}
              <div className="absolute top-1/2 left-1/2 w-full h-full rounded-full border border-emerald-500/20 bg-emerald-500/5 -translate-x-1/2 -translate-y-1/2 animate-ripple-1 pointer-events-none z-0"></div>
              <div className="absolute top-1/2 left-1/2 w-full h-full rounded-full border border-emerald-500/20 bg-emerald-500/5 -translate-x-1/2 -translate-y-1/2 animate-ripple-2 pointer-events-none z-0"></div>
              <div className="absolute top-1/2 left-1/2 w-full h-full rounded-full border border-emerald-500/20 bg-emerald-500/5 -translate-x-1/2 -translate-y-1/2 animate-ripple-3 pointer-events-none z-0"></div>

              {/* Main Initials Icon */}
              <div className={`relative z-10 w-20 h-20 rounded-3xl bg-gradient-to-tr ${theme.bg} shadow-lg flex items-center justify-center font-black text-3xl text-white select-none`}>
                {getInitials(displayName)}
              </div>
              <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 border-4 border-[var(--bg)] dark:border-slate-950 animate-pulse z-20"></div>
            </div>
            
            {/* User details summary */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <h1 className="text-2xl md:text-3xl font-black text-[var(--text)] tracking-tight m-0">{displayName}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${theme.badgeBg}`}>
                  {theme.title}
                </span>
              </div>
              <p className="text-sm text-[var(--text-2)]/70 dark:text-white/60 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-4 h-4 text-[var(--muted)]" />
                {displayEmail}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã xác minh
                </span>
              </div>
            </div>
          </div>

          {/* Wallet summary card */}
          <div className="self-center md:self-auto w-full md:w-auto min-w-[260px] bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Số dư khả dụng</p>
                <p className="text-2xl font-black text-amber-500 dark:text-amber-400 tracking-tight leading-tight mt-0.5">
                  {new Intl.NumberFormat('vi-VN').format(balance)}
                  <span className="text-sm font-bold text-amber-500/80 dark:text-amber-400/80 ml-1">Point</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Account Details */}
        <div className="lg:col-span-5 space-y-6">
          <GlowCard glowClass={theme.glowColor} className="h-full">
            <div className="p-6 space-y-5 h-full flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                  <h2 className="text-lg font-bold text-[var(--text)] tracking-tight">Hồ Sơ Hệ Thống</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl flex items-center justify-between hover:bg-[var(--surface-3)] transition-all">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-[var(--muted)]" />
                      <div>
                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Họ và Tên</p>
                        <p className="text-sm font-semibold text-[var(--text)] mt-0.5">{displayName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl flex items-center justify-between hover:bg-[var(--surface-3)] transition-all">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-[var(--muted)]" />
                      <div>
                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Địa chỉ Email</p>
                        <p className="text-sm font-semibold text-[var(--text)] mt-0.5">{displayEmail}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl flex items-center justify-between hover:bg-[var(--surface-3)] transition-all">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-[var(--muted)]" />
                      <div>
                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Vai trò tài khoản</p>
                        <p className="text-sm font-semibold text-[var(--text)] mt-0.5">{theme.title}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl flex items-center justify-between hover:bg-[var(--surface-3)] transition-all">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[var(--muted)]" />
                      <div>
                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Trạng thái hệ thống</p>
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                          Đang hoạt động
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* General Actions */}
              <div className="pt-6 border-t border-[var(--border)] mt-6 space-y-3">
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] font-semibold text-sm border border-[var(--border)] transition-all cursor-pointer hover:border-[var(--border-2)] active:scale-95 animate-shine"
                >
                  <Key className="w-4 h-4 text-amber-500" />
                  Đổi mật khẩu bảo mật
                </button>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Right Column: JOCKEY Bento Box OR SPECTATOR / OTHER Dashboard */}
        <div className="lg:col-span-7 space-y-6">
          
          {isJockey && jockeyProfile ? (
            /* =================================================================
               JOCKEY PROFILE SECTION
               ================================================================= */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h2 className="text-lg font-bold text-[var(--text)] tracking-tight">Hồ Sơ Nài Ngựa Chuyên Nghiệp</h2>
                </div>
                {!editing && (
                  <button 
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] font-semibold text-xs transition-all border border-[var(--border)] hover:border-[var(--border-2)] active:scale-95 cursor-pointer animate-shine"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-500" />
                    Chỉnh sửa
                  </button>
                )}
              </div>

              {!editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlowCard glowClass="from-emerald-500 via-teal-400 to-emerald-500">
                    <div className="p-5 relative overflow-hidden flex flex-col justify-between h-[155px]">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full"></div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Tỷ lệ thắng</span>
                        <Trophy className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{jockeyProfile.winRate}%</div>
                        <div className="w-full bg-slate-200 dark:bg-white/5 h-2 rounded-full overflow-hidden mt-3 border border-[var(--border)]">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: `${jockeyProfile.winRate}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </GlowCard>

                  <GlowCard glowClass="from-indigo-500 via-purple-500 to-indigo-500">
                    <div className="p-5 relative overflow-hidden flex flex-col justify-between h-[155px]">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full"></div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Kinh nghiệm</span>
                        <Award className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <div className="text-4xl font-black text-[var(--text)] tracking-tight">
                          {jockeyProfile.experience || 0}
                          <span className="text-lg font-bold text-indigo-500 ml-1.5">Năm</span>
                        </div>
                        <div className="text-xs text-[var(--muted)] font-medium mt-3">
                          Tuổi đời nài ngựa: {jockeyProfile.age || 'Chưa cập nhật'} tuổi
                        </div>
                      </div>
                    </div>
                  </GlowCard>

                  <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-3xl p-5 flex flex-col justify-between h-[140px] hover:border-[var(--border-2)] transition-all">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Trận thắng</span>
                      <Activity className="w-4 h-4 text-[var(--muted)]" />
                    </div>
                    <div>
                      <div className="text-3xl font-black text-[var(--text)] tracking-tight">{jockeyProfile.wins}</div>
                      <p className="text-xs text-[var(--muted)] mt-1 font-medium">Trận thắng chính thức được ghi nhận</p>
                    </div>
                  </div>

                  <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-3xl p-5 flex flex-col justify-between h-[140px] hover:border-[var(--border-2)] transition-all">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Tổng số trận</span>
                      <TrendingUp className="w-4 h-4 text-[var(--muted)]" />
                    </div>
                    <div>
                      <div className="text-3xl font-black text-[var(--text)] tracking-tight">{jockeyProfile.races}</div>
                      <p className="text-xs text-[var(--muted)] mt-1 font-medium">Tổng giải đấu đã tham gia tranh tài</p>
                    </div>
                  </div>

                  <GlowCard glowClass="from-amber-500 via-orange-500 to-amber-500" className="md:col-span-2">
                    <div className="p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full blur-xl"></div>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-[var(--muted)]" />
                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Tiểu sử cá nhân</span>
                      </div>
                      <p className="text-sm text-[var(--text)]/80 font-medium leading-relaxed italic">
                        "{jockeyProfile.bio || 'Chưa có tiểu sử.'}"
                      </p>
                    </div>
                  </GlowCard>

                  <div className="md:col-span-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-3xl p-6 shadow-sm hover:border-[var(--border-2)] transition-all">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-[var(--muted)]" />
                      <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Sở trường thi đấu</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(jockeyProfile.specialties?.length ? jockeyProfile.specialties : ['Chưa cập nhật']).map((spec: string, idx: number) => (
                        <span 
                          key={idx} 
                          className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all cursor-default hover:scale-105"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit Mode Form */
                <GlowCard glowClass="from-orange-500 via-amber-500 to-orange-500">
                  <div className="p-6 relative overflow-hidden">
                    <div className="relative z-10 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Tuổi đời</label>
                          <input 
                            type="number" 
                            className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 bg-[var(--surface-2)] text-[var(--text)] font-medium focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all" 
                            value={form.age} 
                            placeholder="Nhập tuổi của bạn"
                            onChange={(e) => setForm({ ...form, age: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Kinh nghiệm (năm)</label>
                          <input 
                            type="number" 
                            className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 bg-[var(--surface-2)] text-[var(--text)] font-medium focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all" 
                            value={form.experience} 
                            placeholder="Nhập số năm kinh nghiệm"
                            onChange={(e) => setForm({ ...form, experience: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Sở trường thi đấu (ngăn cách bằng dấu phẩy)</label>
                          <input 
                            className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 bg-[var(--surface-2)] text-[var(--text)] font-medium focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all" 
                            value={form.specialties} 
                            placeholder="Ví dụ: Đua cự ly ngắn, Chuyên gia bứt tốc..." 
                            onChange={(e) => setForm({ ...form, specialties: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Tiểu sử tóm tắt</label>
                          <textarea 
                            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 bg-[var(--surface-2)] text-[var(--text)] font-medium focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all resize-none" 
                            value={form.bio} 
                            onChange={(e) => setForm({ ...form, bio: e.target.value })} 
                            rows={4} 
                            placeholder="Viết vài dòng giới thiệu về bản thân..." 
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                        <button 
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-orange-500/20 animate-shine" 
                          onClick={handleSaveJockey} 
                          disabled={saving}
                        >
                          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                          {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                        </button>
                        <button 
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text)] font-bold transition-all active:scale-95 cursor-pointer" 
                          onClick={() => setEditing(false)}
                        >
                          <X className="w-4 h-4" />
                          Hủy bỏ
                        </button>
                      </div>
                    </div>
                  </div>
                </GlowCard>
              )}
            </div>
          ) : (
            /* =================================================================
               SPECTATOR / SYSTEM DASHBOARD SECTION
               ================================================================= */
            <div className="space-y-6">
              
              {/* Stat widgets for Spectator predictions */}
              {userRole === 'SPECTATOR' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <GlowCard glowClass="from-indigo-500 to-blue-500">
                    <div className="p-4 flex flex-col justify-between h-[120px]">
                      <div className="flex justify-between items-center text-[var(--muted)]">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Lượt dự đoán</span>
                        <Activity className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-3xl font-black text-[var(--text)] tracking-tight">{totalPreds}</p>
                        <p className="text-[10px] text-[var(--muted)] mt-1">Tổng cộng đã đặt</p>
                      </div>
                    </div>
                  </GlowCard>

                  <GlowCard glowClass="from-emerald-500 to-teal-500">
                    <div className="p-4 flex flex-col justify-between h-[120px]">
                      <div className="flex justify-between items-center text-[var(--muted)]">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Tỷ lệ thắng</span>
                        <Trophy className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{winRate}%</p>
                        <div className="w-full bg-slate-200 dark:bg-white/5 h-1.5 rounded-full overflow-hidden mt-1 border border-[var(--border)]">
                          <div className="bg-emerald-500 h-full" style={{ width: `${winRate}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </GlowCard>

                  <GlowCard glowClass="from-amber-500 to-orange-500">
                    <div className="p-4 flex flex-col justify-between h-[120px]">
                      <div className="flex justify-between items-center text-[var(--muted)]">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Tổng thưởng đã thắng</span>
                        <Wallet className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight truncate">
                          +{new Intl.NumberFormat('vi-VN').format(totalPrizeWon)}
                        </p>
                        <p className="text-[10px] text-[var(--muted)] mt-1">Tổng Point thắng cuộc</p>
                      </div>
                    </div>
                  </GlowCard>
                </div>
              )}

              {/* Recent Predictions list (Only for Spectator) */}
              {userRole === 'SPECTATOR' && (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--muted)]" />
                      <span className="text-sm font-bold text-[var(--text)] tracking-tight">Dự đoán gần đây</span>
                    </div>
                    <Link to="/app/predictions" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 hover:underline">
                      Xem tất cả
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {predictions.length > 0 ? (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {predictions.slice(0, 3).map((pred, idx) => (
                        <div key={idx} className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl flex items-center justify-between hover:bg-[var(--surface-3)] transition-all">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-[var(--text)]">{pred.pickedHorseName}</p>
                            <p className="text-[10px] text-[var(--muted)]">Số tiền: {new Intl.NumberFormat('vi-VN').format(pred.betAmount)} Point</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              pred.status === 'WON' 
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' 
                                : pred.status === 'LOST' 
                                ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' 
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                            }`}>
                              {pred.status === 'WON' ? 'THẮNG' : pred.status === 'LOST' ? 'THUA' : 'ĐANG CHỜ'}
                            </span>
                            <p className="text-[10px] font-semibold text-[var(--text)]/60 mt-1">
                              {pred.status === 'WON' ? `+${new Intl.NumberFormat('vi-VN').format(pred.prizeAmount)} Point` : '—'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-[var(--surface-2)] border border-dashed border-[var(--border)] rounded-2xl space-y-2">
                      <ShieldAlert className="w-8 h-8 text-[var(--muted)]/40 mx-auto" />
                      <p className="text-xs text-[var(--muted)] font-medium">Bạn chưa thực hiện lượt dự đoán nào.</p>
                      <Link to="/app/predictions" className="inline-block px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors">
                        Dự đoán ngay
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Preferences Configuration Widget */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[var(--muted)]" />
                  <span className="text-sm font-bold text-[var(--text)] tracking-tight">Cài đặt ứng dụng</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl hover:bg-[var(--surface-3)] transition-all">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[var(--text)]">Nhận thông báo trực tiếp</p>
                      <p className="text-[10px] text-[var(--muted)]">Gửi thông báo kết quả giải đua tức thì</p>
                    </div>
                    {/* Toggle Switch */}
                    <button 
                      onClick={() => setNotifsEnabled(!notifsEnabled)}
                      className={`w-11 h-6 rounded-full transition-colors cursor-pointer flex items-center p-0.5 ${notifsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifsEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl hover:bg-[var(--surface-3)] transition-all">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[var(--text)]">Xác nhận trước khi dự đoán</p>
                      <p className="text-[10px] text-[var(--muted)]">Luôn hiển thị hộp thoại xác nhận khi đặt cược</p>
                    </div>
                    {/* Toggle Switch */}
                    <button 
                      onClick={() => setConfirmBets(!confirmBets)}
                      className={`w-11 h-6 rounded-full transition-colors cursor-pointer flex items-center p-0.5 ${confirmBets ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${confirmBets ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick shortcuts */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 shadow-sm space-y-3">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest block mb-1">Lối tắt tính năng</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link to="/app/tournaments" className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl hover:bg-[var(--surface-3)] hover:border-[var(--border-2)] transition-all text-center flex flex-col items-center gap-1.5 active:scale-95 group">
                    <Trophy className="w-5 h-5 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-[var(--text)]/80">Giải đấu</span>
                  </Link>

                  <Link to="/app/races" className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl hover:bg-[var(--surface-3)] hover:border-[var(--border-2)] transition-all text-center flex flex-col items-center gap-1.5 active:scale-95 group">
                    <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-[var(--text)]/80">Cuộc đua</span>
                  </Link>

                  <Link to="/app/leaderboard" className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl hover:bg-[var(--surface-3)] hover:border-[var(--border-2)] transition-all text-center flex flex-col items-center gap-1.5 active:scale-95 group">
                    <Award className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-[var(--text)]/80">Xếp hạng</span>
                  </Link>

                  <Link to="/app/predictions" className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl hover:bg-[var(--surface-3)] hover:border-[var(--border-2)] transition-all text-center flex flex-col items-center gap-1.5 active:scale-95 group">
                    <TrendingUp className="w-5 h-5 text-pink-500 dark:text-pink-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-[var(--text)]/80">Dự đoán</span>
                  </Link>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ── CHANGE PASSWORD DIALOG MODAL ── */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-xl rounded-full"></div>
            
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                Đổi Mật Khẩu
              </h3>
              <button 
                onClick={() => setShowChangePassword(false)} 
                className="text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-2 bg-[var(--surface-2)] text-[var(--text)] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all" 
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Mật khẩu mới</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-2 bg-[var(--surface-2)] text-[var(--text)] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all" 
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-2 bg-[var(--surface-2)] text-[var(--text)] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all" 
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-3 border-t border-[var(--border)]">
              <button 
                onClick={handlePasswordChange}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all cursor-pointer text-sm animate-shine"
              >
                Cập nhật
              </button>
              <button 
                onClick={() => setShowChangePassword(false)}
                className="flex-1 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text)]/80 font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
