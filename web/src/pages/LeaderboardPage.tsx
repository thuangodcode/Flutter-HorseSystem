import { useState, useEffect } from 'react'
import { Trophy, Medal } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { getPublicTournaments, getTournamentLeaderboard } from '@/api'

export function LeaderboardPage() {
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loadingTours, setLoadingTours] = useState(false)
  const [selectedTour, setSelectedTour] = useState('')
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)

  useEffect(() => {
    setLoadingTours(true)
    getPublicTournaments()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.tournaments || data?.data || [])
        setTournaments(list)
        if (list.length > 0) {
          setSelectedTour(list[0]._id || list[0].id)
        }
      })
      .catch(() => setTournaments([]))
      .finally(() => setLoadingTours(false))
  }, [])

  useEffect(() => {
    if (!selectedTour) {
      setLeaderboard([])
      return
    }
    setLoadingLeaderboard(true)
    getTournamentLeaderboard(selectedTour)
      .then((data: any) => {
        setLeaderboard(Array.isArray(data) ? data : [])
      })
      .catch(() => setLeaderboard([]))
      .finally(() => setLoadingLeaderboard(false))
  }, [selectedTour])

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[var(--text)] m-0 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Bảng Xếp Hạng
          </h1>
          <p className="text-sm font-semibold text-[var(--muted)] mt-1">Thứ hạng và giải thưởng theo từng giải đấu.</p>
        </div>
        <div className="w-full md:w-64">
          <Select value={selectedTour} onValueChange={(val) => setSelectedTour(val ?? '')}>
            <SelectTrigger className="bg-[var(--bg2)]/80 border-[var(--border)] text-[var(--text)] font-bold">
              {loadingTours ? 'Đang tải...' : (
                tournaments.find(t => (t._id || t.id) === selectedTour)?.name || '— Chọn giải đấu —'
              )}
            </SelectTrigger>
            <SelectContent>
              {tournaments.map(t => (
                <SelectItem key={t._id || t.id} value={t._id || t.id} className="font-semibold">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <Card className="border-[var(--border)] bg-[var(--surface)] shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-[var(--border)] bg-[var(--bg2)]/40 p-5">
          <CardTitle className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-500" /> Top Chiến Mã
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingLeaderboard ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[var(--bg2)] rounded-xl animate-pulse" />)}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center p-12">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-bold text-[var(--text)]">Chưa có bảng xếp hạng</h3>
              <p className="text-sm font-medium text-[var(--muted)] mt-1">Bảng xếp hạng sẽ hiển thị khi có dữ liệu trận đấu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg2)]/60 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="p-4 w-20 text-center">Hạng</th>
                    <th className="p-4">Chiến Mã</th>
                    <th className="p-4 text-center">Số Trận Thắng</th>
                    <th className="p-4 text-right">Tổng Thưởng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/50">
                  {leaderboard.map((item, index) => {
                    const isTop3 = index < 3;
                    const rankStr = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                    return (
                      <tr key={index} className="hover:bg-[var(--bg2)]/30 transition-colors">
                        <td className="p-4 text-center font-black text-xl">
                          <span className={isTop3 ? 'drop-shadow-md' : 'text-[var(--muted)] text-base'}>{rankStr}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-[var(--text)] text-base">{item.horseName || '—'}</div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className="font-bold border-amber-500/30 text-amber-500 bg-amber-500/10">
                            {item.wins || 0} trận
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-block px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black tracking-wide text-sm">
                            {Number(item.totalPrize || 0).toLocaleString('vi-VN')} đ
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
