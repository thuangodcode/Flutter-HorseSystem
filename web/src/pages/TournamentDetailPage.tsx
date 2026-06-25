import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import type { Tournament, Race, LeaderboardEntry } from '../types'
import { getPublicTournament, getPublicRaces, getTournamentLeaderboard, getTournamentBracket } from '@/api'
import { AnimatedTable } from '../components/ui/animated-table'
import { Badge } from '@/components/ui/badge'
import { getStatusClassName, getStatusLabel } from '@/lib/status'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { ArrowLeft, CalendarRange, MapPin, Medal, Trophy, Users } from 'lucide-react'
import '@/styles/spectator.css'

function statusBadge(s?: string) {
  if (!s) return null
  return (
    <Badge variant="outline" className={getStatusClassName(s, 'tournament')}>
      {getStatusLabel(s, 'tournament')}
    </Badge>
  )
}

function raceStatusBadge(s?: string) {
  if (!s) return null
  return (
    <Badge variant="outline" className={getStatusClassName(s, 'race')}>
      {getStatusLabel(s, 'race')}
    </Badge>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('vi-VN')
}

function formatMoney(n?: number) {
  if (!n) return '—'
  return n.toLocaleString('vi-VN') + ' VND'
}

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [races, setRaces] = useState<Race[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bracket, setBracket] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'races' | 'leaderboard' | 'bracket'>('bracket')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getPublicTournament(id).catch(() => null),
      getPublicRaces({ tournamentId: id }).catch(() => [] as any),
      getTournamentLeaderboard(id).catch(() => [] as any),
      getTournamentBracket(id).catch(() => null),
    ])
      .then(([t, r, lb, br]) => {
        if (!t) {
          setError('Không tìm thấy giải đấu')
        } else {
          setTournament(t)
        }
        const raceList = Array.isArray(r) ? r : (r?.races || r?.data || [])
        setRaces(raceList)
        const lbList = Array.isArray(lb) ? lb : (lb?.data || lb?.leaderboard || [])
        setLeaderboard(lbList)
        setBracket(br?.bracket || br?.data || br || null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="space-y-6">
      <div className="spectator-shimmer h-10 w-48" />
      <div className="spectator-shimmer h-64 w-full" />
      <div className="spectator-shimmer h-48 w-full" />
    </div>
  )

  if (error) return (
    <div className="spectator-card">
      <div className="alert alert-error mb-4">⚠️ {error}</div>
      <Link to="/tournaments" className="flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách giải
      </Link>
    </div>
  )

  if (!tournament) return null

  /* ── Table Columns ── */
  const racesColumns = [
    {
      id: 'name',
      header: 'Cuộc đua',
      cell: (r: Race) => <span className="font-bold text-[var(--text)]">{r.name}</span>,
    },
    {
      id: 'distance',
      header: 'Khoảng cách',
      cell: (r: Race) => <span className="font-semibold text-[var(--muted)]">{r.distance ? `${r.distance}m` : '—'}</span>,
    },
    {
      id: 'scheduledAt',
      header: 'Thời gian',
      cell: (r: Race) => <span className="font-semibold text-[var(--muted)] text-sm">{formatDateTime(r.scheduledAt)}</span>,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (r: Race) => raceStatusBadge(r.status),
    },
    {
      id: 'prizeFirst',
      header: 'Giải thưởng',
      align: 'right' as const,
      cell: (r: Race) => <span className="font-bold text-amber-400">{r.prizeFirst ? formatMoney(r.prizeFirst) : '—'}</span>,
    },
  ]

  const leaderboardColumns = [
    {
      id: 'rank',
      header: '#',
      cell: (_: LeaderboardEntry, idx: number) => (
        <span className="font-bold">
          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Tên',
      cell: (entry: LeaderboardEntry) => <span className="font-bold text-[var(--text)]">{entry.horseName || entry.jockeyName || '—'}</span>,
    },
    {
      id: 'races',
      header: 'Số trận',
      cell: (entry: LeaderboardEntry) => <span className="font-semibold text-[var(--muted)]">{entry.races ?? '—'}</span>,
    },
    {
      id: 'wins',
      header: 'Thắng',
      cell: (entry: LeaderboardEntry) => <span className="font-bold text-emerald-400">{entry.wins ?? '—'}</span>,
    },
    {
      id: 'totalPoints',
      header: 'Tổng điểm',
      cell: (entry: LeaderboardEntry) => <span className="font-black text-[var(--text)]">{entry.totalPoints ?? '—'}</span>,
    },
    {
      id: 'totalPrize',
      header: 'Giải thưởng',
      align: 'right' as const,
      cell: (entry: LeaderboardEntry) => <span className="font-bold text-amber-400">{formatMoney(entry.totalPrize)}</span>,
    },
  ]

  const racesWithId = races.map((r) => ({ ...r, id: r.id || r._id || '' }))
  const leaderboardWithId = leaderboard.map((entry, idx) => ({ ...entry, id: entry.id || entry._id || String(idx) }))

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link to="/tournaments" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-emerald-400 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách giải
      </Link>

      {/* ══ Tournament Hero ══ */}
      <ScrollReveal direction="up" distance={40} duration={0.7} delay={0.05}>
        <div className="spectator-hero">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/25 flex items-center justify-center text-2xl">
                  🏆
                </div>
                <h1 className="text-3xl font-black text-[var(--text)] tracking-tight m-0">{tournament.name}</h1>
              </div>
              {tournament.description && (
                <p className="text-[var(--muted)] text-sm font-medium max-w-2xl ml-[60px]">{tournament.description}</p>
              )}
            </div>
            <div className="shrink-0 ml-[60px] md:ml-0">
              {statusBadge(tournament.status || 'DRAFT')}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
            <div className="spectator-stat-card">
              <div className="spectator-stat-icon spectator-stat-icon-blue">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="spectator-stat-label">Địa điểm</div>
                <div className="spectator-stat-value text-base">{tournament.venue}</div>
              </div>
            </div>

            <div className="spectator-stat-card">
              <div className="spectator-stat-icon spectator-stat-icon-emerald">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <div className="spectator-stat-label">Thời gian</div>
                <div className="spectator-stat-value text-sm">{formatDate(tournament.startDate)} → {formatDate(tournament.endDate)}</div>
              </div>
            </div>

            <div className="spectator-stat-card">
              <div className="spectator-stat-icon spectator-stat-icon-amber">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="spectator-stat-label">Tổng giải thưởng</div>
                <div className="spectator-stat-value text-base text-amber-400">{formatMoney(tournament.prizePool)}</div>
              </div>
            </div>

            <div className="spectator-stat-card">
              <div className="spectator-stat-icon spectator-stat-icon-purple">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="spectator-stat-label">Số cuộc đua</div>
                <div className="spectator-stat-value text-base">{races.length}</div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ══ Tabs + Content ══ */}
      <ScrollReveal direction="up" distance={40} duration={0.7} delay={0.1}>
        <div className="spectator-card">
          {/* Tab Buttons */}
          <div className="spectator-tabs mb-6">
            <button
              className={`spectator-tab ${activeTab === 'bracket' ? 'spectator-tab-active' : ''}`}
              onClick={() => setActiveTab('bracket')}
            >
              <Trophy className="w-4 h-4" />
              Sơ Đồ Thi Đấu
            </button>
            <button
              className={`spectator-tab ${activeTab === 'races' ? 'spectator-tab-active' : ''}`}
              onClick={() => setActiveTab('races')}
            >
              <CalendarRange className="w-4 h-4" />
              Lịch Đua ({races.length})
            </button>
            <button
              className={`spectator-tab ${activeTab === 'leaderboard' ? 'spectator-tab-active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              <Medal className="w-4 h-4" />
              Bảng Xếp Hạng
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'bracket' && (
            <TournamentBracketView bracket={bracket} />
          )}
          {activeTab === 'races' && (
            <AnimatedTable
              data={racesWithId}
              columns={racesColumns}
              onRowClick={(r: any) => navigate(`/races/${r._id}`)}
              emptyMessage={
                <div className="spectator-empty">
                  <div className="spectator-empty-icon">📅</div>
                  <div className="text-base font-bold text-[var(--text)]">Chưa có cuộc đua nào trong giải</div>
                  <p className="text-sm text-[var(--muted)] font-medium mt-1">Cuộc đua sẽ được thêm khi ban tổ chức cập nhật lịch thi đấu.</p>
                </div>
              }
            />
          )}

          {activeTab === 'leaderboard' && (
            <AnimatedTable
              data={leaderboardWithId}
              columns={leaderboardColumns as any}
              emptyMessage={
                <div className="spectator-empty">
                  <div className="spectator-empty-icon">🥇</div>
                  <div className="text-base font-bold text-[var(--text)]">Chưa có dữ liệu bảng xếp hạng</div>
                  <p className="text-sm text-[var(--muted)] font-medium mt-1">Bảng xếp hạng sẽ cập nhật sau khi có kết quả cuộc đua.</p>
                </div>
              }
            />
          )}
        </div>
      </ScrollReveal>
    </div>
  )
}

function TournamentBracketView({ bracket }: { bracket: any }) {
  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="spectator-empty">
        <div className="spectator-empty-icon">🌳</div>
        <div className="text-base font-bold text-[var(--text)]">Sơ đồ chưa được tạo</div>
        <p className="text-sm text-[var(--muted)] font-medium mt-1">Sơ đồ thi đấu sẽ được hiển thị sau khi đóng đăng ký hoặc phân chia bảng.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="flex gap-12 min-w-max p-4 justify-center">
        {bracket.rounds.map((round: any, rIdx: number) => (
          <div key={rIdx} className="flex flex-col justify-around gap-6">
            <div className="text-center font-bold text-[var(--text)] mb-2 uppercase tracking-widest text-xs opacity-70">
              Vòng {rIdx + 1}
            </div>
            {round.matches.map((match: any, mIdx: number) => {
              const h1Winner = match.winnerId && match.winnerId === match.horse1Id
              const h2Winner = match.winnerId && match.winnerId === match.horse2Id
              return (
                <div key={mIdx} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3 w-56 shadow-md flex flex-col gap-2 relative transition-all hover:border-[var(--primary)]/50">
                  <div className={`flex justify-between items-center text-sm px-2 py-1 rounded-md ${h1Winner ? 'bg-emerald-500/10 font-bold text-emerald-500' : 'text-[var(--text)]'}`}>
                    <span className="truncate">{match.horse1Name || '---'}</span>
                    {h1Winner && <span className="text-xs">🏆</span>}
                  </div>
                  <div className="h-[1px] w-full bg-[var(--border)]"></div>
                  <div className={`flex justify-between items-center text-sm px-2 py-1 rounded-md ${h2Winner ? 'bg-emerald-500/10 font-bold text-emerald-500' : 'text-[var(--text)]'}`}>
                    <span className="truncate">{match.horse2Name || '---'}</span>
                    {h2Winner && <span className="text-xs">🏆</span>}
                  </div>
                  {match.raceId && (
                    <Link to={`/races/${typeof match.raceId === 'object' ? match.raceId._id || match.raceId.id : match.raceId}`} className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[var(--surface-strong)] border border-[var(--border)] text-[var(--muted)] text-[10px] px-3 py-1 rounded-full hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-colors font-semibold uppercase tracking-wider whitespace-nowrap z-10 shadow-sm">
                      Chi tiết Race
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
