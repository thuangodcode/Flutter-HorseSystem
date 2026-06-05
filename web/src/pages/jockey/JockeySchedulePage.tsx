import { useEffect, useState } from 'react'
import { getJockeySchedule, getInvites, getRaces, getRaceHorses } from '@/api'
import { Card } from '@/components/ui/card'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Ruler, Inbox, ArrowRight, Zap, Info, ShieldAlert } from 'lucide-react'
import { getStatusClassName, getStatusLabel } from '@/lib/status'
import { Link } from 'react-router-dom'

export function JockeySchedulePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    
    const loadScheduleData = async () => {
      try {
        // 1. Fetch official schedule
        const schedRes = await getJockeySchedule()
        const officialItems = schedRes?.data || []
        
        // 2. Fetch invitations
        const invites = await getInvites()
        const acceptedInvites = invites.filter(inv => inv.status === 'ACCEPTED')
        
        // 3. Fetch all races to resolve details
        const allRaces = await getRaces()
        
        // 4. Fetch registrations for all races to get horse details
        const registrations = await Promise.all(
          allRaces.map(async (race) => {
            try {
              const horses = await getRaceHorses(race.id)
              return { race, horses }
            } catch {
              return { race, horses: [] }
            }
          })
        )
        
        // 5. Enrich accepted invites
        const enrichedInvites = acceptedInvites.map((inv) => {
          const targetHorseId = typeof inv.horseId === 'object' && inv.horseId !== null
            ? (inv.horseId._id || inv.horseId.id)
            : inv.horseId
            
          if (!targetHorseId) return null
          
          let matchedReg: any = null
          let matchedRace: any = null
          
          for (const reg of registrations) {
            const found = reg.horses.find((h: any) => String(h.horseId) === String(targetHorseId))
            if (found) {
              matchedReg = found
              matchedRace = reg.race
              break
            }
          }
          
          if (matchedReg && matchedRace) {
            const horseObj = matchedReg.horse || {}
            
            // Check if this registration is confirmed by the owner/admin
            const isConfirmed = matchedReg.status === 'CONFIRMED' || matchedReg.registrationStatus === 'CONFIRMED'
            
            return {
              _id: `accepted-${inv.id}`,
              registrationId: matchedReg.registrationId || matchedReg.id,
              raceId: matchedRace.id,
              raceName: matchedRace.name,
              scheduledTime: matchedRace.scheduledAt,
              distance: matchedRace.distance,
              location: matchedRace.location || matchedRace.venue || 'Trường đua Phú Thọ',
              status: isConfirmed ? 'CONFIRMED' : 'ACCEPTED_PENDING_CONFIRMATION',
              horse: {
                id: horseObj._id || horseObj.id,
                name: horseObj.name,
                breed: horseObj.breed,
                weight: horseObj.weight
              }
            }
          }
          return null
        }).filter(Boolean) as any[]
        
        // 6. Merge and deduplicate by raceId
        const mergedItems = [...officialItems]
        
        enrichedInvites.forEach((inv) => {
          const exists = officialItems.some((off: any) => String(off.raceId) === String(inv.raceId))
          if (!exists) {
            mergedItems.push(inv)
          }
        })
        
        setData({ data: mergedItems })
      } catch (err) {
        console.error('Failed to load schedule data', err)
        setError('Không thể tải lịch thi đấu. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }
    
    loadScheduleData()
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

  const renderStatusBadge = (status: string) => {
    if (status === 'ACCEPTED_PENDING_CONFIRMATION') {
      return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400 font-semibold px-2.5 py-1 text-xs shrink-0">
          ⏳ Chờ chủ ngựa chốt
        </Badge>
      )
    }
    if (status === 'CONFIRMED') {
      return (
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 text-xs shrink-0">
          ✅ Đã chốt nài
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className={getStatusClassName(status, 'race') + ' shrink-0'}>
        {status === 'ONGOING' && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />}
        {getStatusLabel(status, 'race')}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <ScrollReveal direction="up" distance={60} duration={0.8}>
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--primary-light)] p-3 ring-1 ring-[var(--primary-ring)]">
              <Calendar className="h-8 w-8 text-[var(--primary)]" />
            </div>
            <h1 className="text-4xl font-black text-[var(--text)] m-0">Lịch Thi Đấu Của Tôi</h1>
          </div>
          <p className="text-[var(--muted)] font-semibold max-w-2xl text-sm" style={{ lineHeight: 1.6 }}>
            Xem danh sách các trận đấu sắp diễn ra mà bạn đã đồng ý hoặc được chỉ định điều khiển ngựa đua. Hãy theo dõi thời gian và địa điểm thi đấu để chuẩn bị tốt nhất.
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
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Chưa có lịch thi đấu nào</h3>
            <p className="text-[var(--muted)] max-w-sm mx-auto font-medium">Bạn hiện chưa có lịch thi đấu nào. Chấp nhận các lời mời từ chủ ngựa để cập nhật lịch thi đấu nhé!</p>
          </Card>
        </ScrollReveal>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((s: any, idx: number) => (
            <ScrollReveal key={s._id} direction="up" distance={60} duration={0.6} delay={idx * 0.1}>
              <SpotlightCard className="h-full border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/30 hover:shadow-xl hover:shadow-[var(--primary)]/5 transition-all duration-300 flex flex-col">
                <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                  {/* Title & Badge */}
                  <div className="border-b border-[var(--border)] pb-4 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Trận Đấu
                      </div>
                      <h3 className="text-2xl font-black text-[var(--text)] leading-tight m-0">
                        {s.raceName}
                      </h3>
                    </div>
                    {renderStatusBadge(s.status)}
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] text-[var(--muted)] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-500" /> Thời Gian
                      </div>
                      <div className="font-bold text-sm text-[var(--text)]">
                        {s.scheduledTime ? formatDateTime(s.scheduledTime) : 'Chưa cập nhật'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-[var(--muted)] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" /> Địa Điểm
                      </div>
                      <div className="font-bold text-sm text-[var(--text)] line-clamp-1">
                        {s.location || 'Chưa xác định'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-[var(--muted)] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5 text-emerald-500" /> Cự Ly
                      </div>
                      <div className="font-bold text-sm text-[var(--text)]">
                        {s.distance ? `${s.distance}m` : '—'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-[var(--muted)] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-purple-500" /> Ngựa thi đấu
                      </div>
                      <div className="font-bold text-sm text-[var(--text)] truncate">
                        {s.horse ? `${s.horse.name} (${s.horse.breed || 'Chưa rõ'})` : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Warning message if pending owner confirmation */}
                  {s.status === 'ACCEPTED_PENDING_CONFIRMATION' && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-500 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Bạn đã đồng ý. Cuộc đua sẽ chính thức hiển thị khi chủ ngựa chốt nài.</span>
                    </div>
                  )}

                  {/* Footer link to Race details if available */}
                  {s.raceId && (
                    <div className="pt-4 border-t border-[var(--border)] mt-auto flex justify-end">
                      <Link to={`/app/races/${s.raceId}`} className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-dark)] flex items-center gap-1 group/link transition-colors">
                        Xem chi tiết cuộc đua <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  )}
                </div>
              </SpotlightCard>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  )
}
