import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Magnetic } from '@/components/ui/magnetic'
import { ShutterText } from '@/components/ui/shutter-text'
import { GradientCard } from '@/components/ui/gradient-card'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { AdminDashboard } from './admin/AdminDashboard'
import { getPublicTournaments } from '@/api'
import type { Tournament } from '@/types'
import { CalendarRange, Trophy } from 'lucide-react'

export function DashboardPage() {
  const { session } = useSession()
  const role = session?.user.role
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([])

  useEffect(() => {
    if (role === 'SPECTATOR') {
      getPublicTournaments()
        .then((data: any) => {
          const list = Array.isArray(data) ? data : (data?.tournaments || [])
          const active = list
            .filter((t: Tournament) => {
              if (!['ONGOING', 'ACTIVE', 'PUBLISHED', 'SCHEDULED'].includes(t.status || '')) return false
              const endDate = new Date(t.endDate)
              endDate.setHours(23, 59, 59, 999)
              return endDate.getTime() >= Date.now()
            })
            .sort((a: Tournament, b: Tournament) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          setActiveTournaments(active.slice(0, 3))
        })
        .catch(() => {})
    }
  }, [role])

  if (role === 'ADMIN') {
    return <AdminDashboard />
  }

  const useShutter = role === 'SPECTATOR' || role === 'REFEREE'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: '12px 0' }}>
      {/* Header section with custom reveal animations */}
      <ScrollReveal direction="down" duration={0.8}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {useShutter ? (
              <ShutterText text="DASHBOARD" trigger="auto" className="text-xs font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase" />
            ) : (
              <span className="text-xs font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">DASHBOARD</span>
            )}
          </div>
          {useShutter ? (
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>👋</span>
              <ShutterText text={`Xin chào, ${session?.user.name || ''}`} trigger="auto" />
            </h1>
          ) : (
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, color: 'var(--text)' }}>
              👋 Xin chào, <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>{session?.user.name}</span>
            </h1>
          )}
          <p className="muted text-sm font-bold">
            Chào mừng bạn quay lại hệ thống. Vai trò của bạn: <strong style={{ color: 'var(--primary)', fontWeight: 800 }}>{role}</strong>
          </p>
        </div>
      </ScrollReveal>

      {/* Grid containing action cards with magnetic interaction */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScrollReveal className="h-full [&>div]:h-full" direction="up" duration={0.8} delay={0.1}>
          <Magnetic className="h-full" intensity={0.2} range={100}>
            <Link to="/app/tournaments" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
              {role === 'SPECTATOR' ? (
                <GradientCard>
                  <Card className="card border-0 bg-transparent transition-all duration-300 shadow-lg h-full" style={{ cursor: 'pointer', padding: '32px 28px' }}>
                    <CardHeader style={{ padding: 0 }}>
                      <div style={{ marginBottom: 16 }}>
                        <img src="/trophy.gif" style={{ width: '48px', height: '48px', objectFit: 'contain' }} alt="Trophy" />
                      </div>
                      <CardTitle className="text-2xl font-black text-(--text)">
                        {useShutter ? (
                          <ShutterText text="Xem Giải Đấu" trigger="auto" />
                        ) : (
                          "Xem Giải Đấu"
                        )}
                      </CardTitle>
                      <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                        Khám phá các giải đấu đua ngựa hấp dẫn đang diễn ra, xem chi tiết lịch thi đấu và bảng xếp hạng thành tích.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </GradientCard>
              ) : (
                <div className="h-full">
                  <Card className="card card-hover border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg h-full" style={{ cursor: 'pointer', padding: '32px 28px' }}>
                    <CardHeader style={{ padding: 0 }}>
                      <div style={{ marginBottom: 16 }}>
                        <img src="/trophy.gif" style={{ width: '48px', height: '48px', objectFit: 'contain' }} alt="Trophy" />
                      </div>
                      <CardTitle className="text-2xl font-black text-(--text)">
                        {useShutter ? (
                          <ShutterText text="Xem Giải Đấu" trigger="auto" />
                        ) : (
                          "Xem Giải Đấu"
                        )}
                      </CardTitle>
                      <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                        Khám phá các giải đấu đua ngựa hấp dẫn đang diễn ra, xem chi tiết lịch thi đấu và bảng xếp hạng thành tích.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              )}
            </Link>
          </Magnetic>
        </ScrollReveal>

        <ScrollReveal className="h-full [&>div]:h-full" direction="up" duration={0.8} delay={0.2}>
          <Magnetic className="h-full" intensity={0.2} range={100}>
            <Link to="/app/races" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
              {role === 'SPECTATOR' ? (
                <GradientCard>
                  <Card className="card border-0 bg-transparent transition-all duration-300 shadow-lg h-full" style={{ cursor: 'pointer', padding: '32px 28px' }}>
                    <CardHeader style={{ padding: 0 }}>
                      <div style={{ marginBottom: 16 }}>
                        <img src="/race.gif" style={{ width: '48px', height: '48px', objectFit: 'contain' }} alt="Race" />
                      </div>
                      <CardTitle className="text-2xl font-black text-(--text)">
                        {useShutter ? (
                          <ShutterText text="Xem Cuộc Đua" trigger="auto" />
                        ) : (
                          "Xem Cuộc Đua"
                        )}
                      </CardTitle>
                      <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                        Cập nhật danh sách các cuộc đua, thông tin cự ly, thời gian xuất phát và theo dõi diễn biến kết quả thi đấu.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </GradientCard>
              ) : (
                <div className="h-full">
                  <Card className="card card-hover border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg h-full" style={{ cursor: 'pointer', padding: '32px 28px' }}>
                    <CardHeader style={{ padding: 0 }}>
                      <div style={{ marginBottom: 16 }}>
                        <img src="/race.gif" style={{ width: '48px', height: '48px', objectFit: 'contain' }} alt="Race" />
                      </div>
                      <CardTitle className="text-2xl font-black text-(--text)">
                        {useShutter ? (
                          <ShutterText text="Xem Cuộc Đua" trigger="auto" />
                        ) : (
                          "Xem Cuộc Đua"
                        )}
                      </CardTitle>
                      <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                        Cập nhật danh sách các cuộc đua, thông tin cự ly, thời gian xuất phát và theo dõi diễn biến kết quả thi đấu.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              )}
            </Link>
          </Magnetic>
        </ScrollReveal>

        {role === 'OWNER' && (
          <ScrollReveal className="h-full [&>div]:h-full" direction="up" duration={0.8} delay={0.3}>
            <Magnetic className="h-full" intensity={0.2} range={100}>
              <Link to="/app/horses" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <Card className="card card-hover border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg" style={{ cursor: 'pointer', height: '100%', padding: '32px 28px' }}>
                  <CardHeader style={{ padding: 0 }}>
                    <div style={{ fontSize: '44px', marginBottom: 16 }}>🐎</div>
                    <CardTitle className="text-2xl font-black text-(--text)">Ngựa Của Tôi</CardTitle>
                    <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                      Quản lý đội ngựa thi đấu cá nhân, đăng ký tham gia các vòng đua mới và gửi lời mời thuê nài ngựa (Jockey).
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Magnetic>
          </ScrollReveal>
        )}

        {role === 'JOCKEY' && (
          <ScrollReveal className="h-full [&>div]:h-full" direction="up" duration={0.8} delay={0.3}>
            <Magnetic className="h-full" intensity={0.2} range={100}>
              <Link to="/app/invites" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <Card className="card card-hover border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg" style={{ cursor: 'pointer', height: '100%', padding: '32px 28px' }}>
                  <CardHeader style={{ padding: 0 }}>
                    <div style={{ fontSize: '44px', marginBottom: 16 }}>✉️</div>
                    <CardTitle className="text-2xl font-black text-(--text)">Lời Mời Của Tôi</CardTitle>
                    <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                      Xem và phản hồi các yêu cầu mời điều khiển ngựa từ những chủ ngựa khác, theo dõi lịch trình nhận việc.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Magnetic>
          </ScrollReveal>
        )}

        {role === 'SPECTATOR' && (
          <ScrollReveal className="h-full [&>div]:h-full" direction="up" duration={0.8} delay={0.3}>
            <Magnetic className="h-full" intensity={0.2} range={100}>
              <Link to="/app/predictions" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <GradientCard>
                  <Card className="card border-0 bg-transparent transition-all duration-300 shadow-lg h-full" style={{ cursor: 'pointer', padding: '32px 28px' }}>
                    <CardHeader style={{ padding: 0 }}>
                    <div style={{ marginBottom: 16 }}>
                      <img src="/prediction.gif" style={{ width: '48px', height: '48px', objectFit: 'contain' }} alt="Prediction" />
                    </div>
                      <CardTitle className="text-2xl font-black text-(--text)">
                        <ShutterText text="Dự Đoán Kết Quả" trigger="auto" />
                      </CardTitle>
                      <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                        Sử dụng điểm thưởng ảo để tham gia dự đoán kết quả những chú ngựa chiến thắng và nhận phần quà hấp dẫn.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </GradientCard>
              </Link>
            </Magnetic>
          </ScrollReveal>
        )}

        {role === 'REFEREE' && (
          <ScrollReveal className="h-full [&>div]:h-full" direction="up" duration={0.8} delay={0.3}>
            <Magnetic className="h-full" intensity={0.2} range={100}>
              <Link to="/app/referee/races" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <Card className="card card-hover border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg" style={{ cursor: 'pointer', height: '100%', padding: '32px 28px' }}>
                  <CardHeader style={{ padding: 0 }}>
                    <div style={{ fontSize: '44px', marginBottom: 16 }}>⚖️</div>
                    <CardTitle className="text-2xl font-black text-(--text)">
                      <ShutterText text="Bảng Trọng Tài" trigger="auto" />
                    </CardTitle>
                    <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                      Giám sát cuộc đua được phân công, ghi nhận vi phạm, kiểm tra an toàn ngựa đua và công bố kết quả chính thức.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Magnetic>
          </ScrollReveal>
        )}
      </div>

      {role === 'SPECTATOR' && (
        <ScrollReveal direction="up" duration={0.8} delay={0.4}>
          <div style={{ paddingTop: '80px' }}>
            <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-3" style={{ marginBottom: '48px' }}>
              <Trophy className="w-7 h-6 text-amber-400" /> Giải Đấu Đang Nổi Bật
            </h2>
            {activeTournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '32px' }}>
                {activeTournaments.map(t => (
                  <Link key={t._id || t.id} to={`/app/tournaments/${t._id || t.id}`} className="block h-full">
                    <SpotlightCard className="h-full">
                      <Card className="card border-0 bg-transparent p-5 h-full flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-[var(--text)] mb-2 truncate">{t.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-1">
                            <CalendarRange className="w-4 h-4" />
                            {new Date(t.startDate).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <div className="mt-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            {t.status === 'ONGOING' ? 'Đang diễn ra' : 'Sắp tới'}
                          </span>
                        </div>
                      </Card>
                    </SpotlightCard>
                  </Link>
                ))}
              </div>
            ) : (
              <SpotlightCard>
                <Card className="card border-0 bg-transparent p-8 text-center text-[var(--muted)]">
                  Chưa có giải đấu nào đang diễn ra.
                </Card>
              </SpotlightCard>
            )}
          </div>
        </ScrollReveal>
      )}
    </div>
  )
}
