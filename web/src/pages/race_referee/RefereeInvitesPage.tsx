import { useEffect, useState } from 'react'
import { getRefereeInvites, acceptRefereeInvite, rejectRefereeInvite } from '@/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Magnetic } from '@/components/ui/magnetic'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'
import { Mail, CalendarRange, Ruler, X, Inbox, ChevronRight, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'

export function RefereeInvitesPage() {
  const [items, setItems] = useState<any[] | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const invites = await getRefereeInvites()
      setItems(invites)
    } catch (e) {
      console.error('Failed to load referee invites', e)
      setItems([])
    }
  }

  const handleAction = async (inviteId: string, action: 'accept' | 'reject') => {
    setLoadingAction(inviteId)
    try {
      if (action === 'accept') {
        await acceptRefereeInvite(inviteId)
      } else {
        await rejectRefereeInvite(inviteId)
      }
      loadData()
    } catch (e) {
      console.error('Action failed', e)
      alert(`Không thể ${action === 'accept' ? 'chấp nhận' : 'từ chối'} lời mời. Vui lòng thử lại.`)
    } finally {
      setLoadingAction(null)
    }
  }

  const getStatusDisplay = (inv: any) => {
    switch (inv.status) {
      case 'PENDING':
        return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300">⏳ Chờ phản hồi</Badge>
      case 'ACCEPTED':
        return <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">✅ Đã đồng ý</Badge>
      case 'DECLINED':
      case 'REJECTED':
        return <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300">❌ Đã từ chối</Badge>
      case 'CONFIRMED':
        return <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300">🎉 Đã chốt (Chính thức)</Badge>
      default:
        return <Badge variant="outline">{inv.status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <ScrollReveal direction="up" distance={60} duration={0.8}>
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--primary-light)] p-3 ring-1 ring-[var(--primary-ring)]">
              <Mail className="h-8 w-8 text-[var(--primary)]" />
            </div>
            <h1 className="text-4xl font-black text-[var(--text)] m-0">Lời Mời Làm Trọng Tài</h1>
          </div>
          <p className="text-[var(--muted)] font-semibold max-w-2xl text-sm" style={{ lineHeight: 1.6 }}>
            Quản lý các yêu cầu phân công giám sát cuộc đua từ Ban tổ chức. Phản hồi nhanh chóng để ban tổ chức chốt lịch trình giải đấu.
          </p>
        </div>
      </ScrollReveal>

      {!items ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6 h-48 skeleton rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <ScrollReveal direction="up" distance={40}>
          <Card className="border-[var(--border)] bg-[var(--surface)] text-center py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg2)] mb-4 shadow-inner">
              <Inbox className="h-10 w-10 text-[var(--muted)] opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Chưa có lời mời nào</h3>
            <p className="text-[var(--muted)] max-w-sm mx-auto font-medium">Bạn hiện không có yêu cầu phân công nào từ Ban tổ chức. Vui lòng quay lại sau!</p>
          </Card>
        </ScrollReveal>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((inv, idx) => (
            <ScrollReveal key={inv.id} direction="up" distance={60} duration={0.6} delay={idx * 0.1}>
              <Card className="h-full border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/30 hover:shadow-xl hover:shadow-[var(--primary)]/5 transition-all duration-300 flex flex-col">
                <CardHeader className="border-b border-[var(--border)] bg-[var(--bg2)]/50 pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardDescription className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-1 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5" /> Phân công trọng tài
                      </CardDescription>
                      <CardTitle className="text-2xl font-black text-[var(--text)] flex items-center gap-2">
                        {inv.raceName || 'Cuộc đua chưa xác định'}
                      </CardTitle>
                    </div>
                    <div>{getStatusDisplay(inv)}</div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 flex-1 flex flex-col gap-6">
                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarRange className="h-3.5 w-3.5" /> Giải Đấu
                      </div>
                      <div className="font-bold text-sm line-clamp-1">{inv.tournamentName || 'Chưa xác định'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarRange className="h-3.5 w-3.5" /> Thời Gian
                      </div>
                      <div className="font-bold text-sm">{inv.raceScheduledAt ? new Date(inv.raceScheduledAt).toLocaleString('vi-VN') : '—'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5" /> Cự Ly
                      </div>
                      <div className="font-bold text-sm">{inv.raceDistance ? `${inv.raceDistance}m` : '—'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> Lời nhắn
                      </div>
                      <div className="font-medium text-sm text-[var(--muted)] italic line-clamp-1">"{inv.message || 'Mời làm trọng tài!'}"</div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
                    {inv.status === 'PENDING' ? (
                      <>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 cursor-pointer"
                          onClick={() => handleAction(inv.id, 'reject')}
                          disabled={loadingAction === inv.id}
                        >
                          {loadingAction === inv.id ? 'Đang xử lý...' : <><X className="w-4 h-4 mr-2" /> Từ Chối</>}
                        </Button>
                        <Magnetic intensity={0.2}>
                          <div className="flex-1">
                            <LiquidMetalButton 
                              label={loadingAction === inv.id ? 'Đang xử lý...' : '✓ Đồng Ý'}
                              onClick={() => handleAction(inv.id, 'accept')}
                            />
                          </div>
                        </Magnetic>
                      </>
                    ) : (
                      <Link to="/app/referee/races" className="w-full">
                        <Button className="w-full bg-[var(--bg2)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)] cursor-pointer">
                          Xem danh sách cuộc đua <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  )
}
