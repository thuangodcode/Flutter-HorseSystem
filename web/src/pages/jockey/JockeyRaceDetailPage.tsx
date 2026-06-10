import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getJockeyRaceDetail } from '@/api'
import { Card } from '@/components/ui/card'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, MapPin, Ruler, Info, Sparkles, User, Phone, Mail } from 'lucide-react'
import { getStatusClassName, getStatusLabel } from '@/lib/status'

export function JockeyRaceDetailPage() {
  const { raceId } = useParams<{ raceId: string }>()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!raceId) return
    setLoading(true)
    getJockeyRaceDetail(raceId)
      .then(setData)
      .catch(() => setError('Không tìm thấy cuộc đua hoặc bạn không được phân công ở cuộc đua này.'))
      .finally(() => setLoading(false))
  }, [raceId])

  const formatDateTime = (d: string) => {
    return new Date(d).toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const raceDetail = data as any

  return (
    <div className="space-y-6">
      {/* Back button */}
      <ScrollReveal direction="right" distance={40} duration={0.6}>
        <Link to="/app/jockey/races" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách cuộc đua
        </Link>
      </ScrollReveal>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="card p-6 h-64 skeleton rounded-xl animate-pulse" />
      ) : raceDetail ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-6">
            <ScrollReveal direction="up" distance={60} duration={0.7}>
              <SpotlightCard className="border-[var(--border)] bg-[var(--surface)] p-6 rounded-2xl shadow-xl space-y-6">
                <div className="border-b border-[var(--border)] pb-4 flex justify-between items-start gap-4 flex-wrap">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Thông tin chi tiết</span>
                    <h2 className="text-3xl font-black text-[var(--text)] m-0 leading-tight">
                      {raceDetail.raceName}
                    </h2>
                  </div>
                  <Badge variant="outline" className={getStatusClassName(raceDetail.status, 'race')}>
                    {raceDetail.status === 'ONGOING' && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />}
                    {getStatusLabel(raceDetail.status, 'race')}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Clock className="h-4.5 w-4.5 text-amber-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Thời gian</span>
                      <span className="text-sm font-bold text-[var(--text)] truncate">{raceDetail.scheduledTime ? formatDateTime(raceDetail.scheduledTime) : 'Chưa cập nhật'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <MapPin className="h-4.5 w-4.5 text-blue-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Địa điểm</span>
                      <span className="text-sm font-bold text-[var(--text)] truncate">{raceDetail.location || 'Chưa xác định'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Ruler className="h-4.5 w-4.5 text-emerald-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Cự ly</span>
                      <span className="text-sm font-bold text-[var(--text)] truncate">{raceDetail.distance ? `${raceDetail.distance}m` : 'Chưa xác định'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Info className="h-4.5 w-4.5 text-purple-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Loại hình & Trạng thái đường đua</span>
                      <span className="text-sm font-bold text-[var(--text)] truncate">{raceDetail.raceType || '—'} · {raceDetail.trackCondition || 'Bình thường'}</span>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </ScrollReveal>

            {/* Assigned Horse Card */}
            {raceDetail.horse && (
              <ScrollReveal direction="up" distance={60} duration={0.7} delay={0.1}>
                <Card className="border-[var(--border)] bg-[var(--surface)] p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-xl font-bold text-[var(--text)] flex items-center gap-2 border-b border-[var(--border)] pb-3 m-0">
                    <Sparkles className="w-5 h-5 text-amber-500" /> Ngựa được phân công điều khiển
                  </h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-xl bg-[var(--bg2)]/40 border border-[var(--border)]/30 text-center">
                      <div className="text-xs uppercase font-extrabold text-[var(--muted)] mb-1">Tên ngựa</div>
                      <div className="text-lg font-black text-white">{raceDetail.horse.name}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg2)]/40 border border-[var(--border)]/30 text-center">
                      <div className="text-xs uppercase font-extrabold text-[var(--muted)] mb-1">Giống ngựa</div>
                      <div className="text-lg font-black text-white">{raceDetail.horse.breed || 'Chưa rõ'}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg2)]/40 border border-[var(--border)]/30 text-center">
                      <div className="text-xs uppercase font-extrabold text-[var(--muted)] mb-1">Giới tính</div>
                      <div className="text-lg font-black text-white">{raceDetail.horse.gender === 'MALE' ? 'Đực' : raceDetail.horse.gender === 'FEMALE' ? 'Cái' : '—'}</div>
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            )}
          </div>

          {/* Owner details card */}
          {raceDetail.owner && (
            <div className="space-y-6">
              <ScrollReveal direction="left" distance={60} duration={0.7} delay={0.2}>
                <Card className="border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface)]/90 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-xl font-bold text-[var(--text)] flex items-center gap-2 border-b border-[var(--border)] pb-3 m-0">
                    <User className="w-5 h-5 text-[var(--primary)]" /> Chủ ngựa liên hệ
                  </h3>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-extrabold shrink-0 border border-[var(--primary)]/20 shadow-inner">
                        {raceDetail.owner.fullName ? raceDetail.owner.fullName.slice(0, 2).toUpperCase() : 'CO'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider">Họ và tên</div>
                        <div className="font-extrabold text-white text-base truncate">{raceDetail.owner.fullName}</div>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-[var(--border)]/60">
                      {raceDetail.owner.phone && (
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300">
                          <Phone className="w-4 h-4 text-[var(--primary)] shrink-0" />
                          <span>{raceDetail.owner.phone}</span>
                        </div>
                      )}
                      {raceDetail.owner.email && (
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300">
                          <Mail className="w-4 h-4 text-[var(--primary)] shrink-0" />
                          <span className="truncate">{raceDetail.owner.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
