import { useEffect, useState } from 'react'
import type { NotificationItem } from '../../types'
import { getMyNotifications } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getNotificationTypeLabel } from '@/lib/status'
import { NumberCounter } from '@/components/ui/number-counter'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { BellRing, Clock3, RefreshCw, Search } from 'lucide-react'
import '@/styles/spectator.css'

function formatDate(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs} giờ trước`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

const TIME_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: '24h', label: '24 giờ gần đây' },
  { value: '7d', label: '7 ngày gần đây' },
  { value: '30d', label: '30 ngày gần đây' },
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
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }
  return now - createdAt <= windows[window]
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    getMyNotifications()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.data || data?.notifications || [])
        setItems(list)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [reloadKey])

  const unreadCount = items.filter((n) => !n.isRead).length

  const filteredItems = [...items]
    .filter((n) => {
      if (filter === 'unread' && n.isRead) return false
      if (filter === 'read' && !n.isRead) return false
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        if (!n.message?.toLowerCase().includes(query)) return false
      }
      return isWithinWindow(n.createdAt, timeFilter)
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortOrder === 'oldest' ? diff : -diff
    })

  return (
    <div className="space-y-8">

      {/* ══ Hero Header ══ */}
      <ScrollReveal direction="up" distance={40} duration={0.7} delay={0.05}>
        <div className="spectator-hero">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/15 ring-1 ring-blue-500/25 flex items-center justify-center">
                  <BellRing className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-[var(--text)] tracking-tight m-0">Thông báo</h1>
                  <p className="text-sm text-[var(--muted)] font-medium mt-1">
                    Cập nhật tin tức, kết quả dự đoán và thông báo hệ thống.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold">
                  Tổng <NumberCounter value={items.length} duration={1} easing="easeOut" />
                </Badge>
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold">
                  <NumberCounter value={unreadCount} duration={1} delay={0.1} easing="easeOut" /> chưa đọc
                </Badge>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2 relative z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  className="h-9 w-48 pl-9 border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] font-medium placeholder:text-[var(--muted)]/40 text-sm"
                />
              </div>
              <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value ?? 'all')}>
                <SelectTrigger className="h-9 w-40 border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] font-semibold text-sm">
                  {getOptionLabel(TIME_OPTIONS, timeFilter)}
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option: any) => (
                    <SelectItem key={option.value} value={option.value} className="font-semibold">{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value ?? 'newest')}>
                <SelectTrigger className="h-9 w-32 border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] font-semibold text-sm">
                  {getOptionLabel(SORT_OPTIONS, sortOrder)}
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option: any) => (
                    <SelectItem key={option.value} value={option.value} className="font-semibold">{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-9 font-semibold border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] hover:bg-[var(--surface-3)] gap-2 text-sm"
                onClick={() => setReloadKey(reloadKey + 1)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            <button className={`spectator-filter-pill ${filter === 'all' ? 'spectator-filter-pill-active' : ''}`} onClick={() => setFilter('all')}>
              Tất cả
            </button>
            <button className={`spectator-filter-pill ${filter === 'unread' ? 'spectator-filter-pill-active' : ''}`} onClick={() => setFilter('unread')}>
              Chưa đọc ({unreadCount})
            </button>
            <button className={`spectator-filter-pill ${filter === 'read' ? 'spectator-filter-pill-active' : ''}`} onClick={() => setFilter('read')}>
              Đã đọc
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* ══ Notification List ══ */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="spectator-shimmer h-20 w-full" />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="spectator-empty">
          <div className="spectator-empty-icon">🔔</div>
          <div className="text-lg font-bold text-[var(--text)]">
            {filter === 'unread' ? 'Không có thông báo chưa đọc' : filter === 'read' ? 'Không có thông báo đã đọc' : 'Chưa có thông báo nào'}
          </div>
          <p className="mt-2 text-sm text-[var(--muted)] font-medium">Hãy thay đổi bộ lọc hoặc kiểm tra lại sau.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((notification, index) => (
            <ScrollReveal key={notification._id} direction="up" distance={30} duration={0.5} delay={index * 0.04}>
              <div className={`spectator-notification ${!notification.isRead ? 'spectator-notification-unread' : ''}`}>
                <div className={`spectator-notification-dot ${notification.isRead ? 'spectator-notification-dot-read' : 'spectator-notification-dot-unread'}`} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start gap-2">
                    <p className="text-sm font-semibold text-[var(--text)] flex-1">{notification.message}</p>
                    <Badge variant="outline" className={notification.isRead
                      ? 'font-semibold border-slate-500/20 bg-slate-500/8 text-slate-400 text-[10px]'
                      : 'font-semibold border-amber-500/25 bg-amber-500/10 text-amber-400 text-[10px]'
                    }>
                      {notification.isRead ? 'Đã đọc' : 'Mới'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock3 className="h-3 w-3" />
                      {formatDate(notification.createdAt)}
                    </span>
                    {notification.type && (
                      <Badge variant="outline" className="font-medium border-[var(--border)] bg-transparent text-[var(--muted)] text-[10px]">
                        {getNotificationTypeLabel(notification.type)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  )
}
