import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJockeyRaces } from '@/api'
import { Card } from '@/components/ui/card'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Badge } from '@/components/ui/badge'
import { Zap, Clock, MapPin, Inbox, ChevronRight } from 'lucide-react'
import { getStatusClassName, getStatusLabel } from '@/lib/status'

export function JockeyRacesPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getJockeyRaces()
      .then(setData)
      .catch(() => setError('Không thể tải danh sách cuộc đua.'))
      .finally(() => setLoading(false))
  }, [])

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

  const items = data?.data || []

  return (
    <div className="space-y-6">
      {/* Header section */}
      <ScrollReveal direction="up" distance={60} duration={0.8}>
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--primary-light)] p-3 ring-1 ring-[var(--primary-ring)]">
              <Zap className="h-8 w-8 text-[var(--primary)]" />
            </div>
            <h1 className="text-4xl font-black text-[var(--text)] m-0">Cuộc Đua Của Tôi</h1>
          </div>
          <p className="text-[var(--muted)] font-semibold max-w-2xl text-sm" style={{ lineHeight: 1.6 }}>
            Xem danh sách các cuộc đua bạn đã đăng ký điều khiển ngựa và kết quả phân công chính thức từ Ban tổ chức.
          </p>
        </div>
      </ScrollReveal>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="card p-6 h-48 skeleton rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <ScrollReveal direction="up" distance={40}>
          <Card className="border-[var(--border)] bg-[var(--surface)] text-center py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg2)] mb-4 shadow-inner">
              <Inbox className="h-10 w-10 text-[var(--muted)] opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Chưa có cuộc đua nào</h3>
            <p className="text-[var(--muted)] max-w-sm mx-auto font-medium">Bạn hiện chưa được phân công cuộc đua nào. Hãy phản hồi các lời mời hoặc liên hệ chủ ngựa nhé!</p>
          </Card>
        </ScrollReveal>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((race: any, idx: number) => (
            <ScrollReveal key={race._id} direction="up" distance={60} duration={0.6} delay={idx * 0.1}>
              <Link to={`/app/jockey/races/${race.raceId}`} className="block h-full group">
                <SpotlightCard className="h-full border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/30 hover:shadow-xl hover:shadow-[var(--primary)]/5 transition-all duration-300 flex flex-col">
                  <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                    <div className="border-b border-[var(--border)] pb-4 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1">
                          ⚡ Cuộc Đua
                        </div>
                        <h3 className="text-2xl font-black text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-tight m-0">
                          {race.raceName}
                        </h3>
                      </div>
                      <Badge variant="outline" className={getStatusClassName(race.status, 'race')}>
                        {race.status === 'ONGOING' && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />}
                        {getStatusLabel(race.status, 'race')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-[10px] text-[var(--muted)] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-500" /> Thời Gian
                        </div>
                        <div className="font-bold text-sm text-[var(--text)]">
                          {race.scheduledTime ? formatDateTime(race.scheduledTime) : 'Chưa cập nhật'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-[var(--muted)] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" /> Địa Điểm
                        </div>
                        <div className="font-bold text-sm text-[var(--text)] line-clamp-1">
                          {race.location || 'Chưa xác định'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--border)] mt-auto flex justify-end items-center text-xs font-bold text-[var(--primary)] group-hover:text-[var(--primary-dark)] transition-colors">
                      Xem chi tiết cuộc đua <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </SpotlightCard>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  )
}
