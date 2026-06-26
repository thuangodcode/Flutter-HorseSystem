import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getHorsesByRace } from '@/api'

export function TournamentBracketView({ bracket, races }: { bracket: any, races?: any[] }) {
  const [raceHorses, setRaceHorses] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!races || races.length === 0) return
    setLoading(true)
    const fetchHorses = async () => {
      const result: Record<string, any[]> = {}
      await Promise.all(
        races.map(async (r) => {
          try {
            const h = await getHorsesByRace(r._id || r.id)
            result[r._id || r.id] = h
          } catch (e) {
            console.error('Failed to fetch horses for race', r._id)
          }
        })
      )
      setRaceHorses(result)
      setLoading(false)
    }
    fetchHorses()
  }, [races])

  const hasBracket = bracket && bracket.rounds && bracket.rounds.length > 0
  const groupRaces = (races || [])
    .filter(r => r.name?.toLowerCase().includes('bảng') || r.name?.toLowerCase().includes('group'))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  const hasGroups = groupRaces.length > 0

  if (!hasBracket && !hasGroups) {
    return (
      <div className="spectator-empty">
        <div className="spectator-empty-icon">🌳</div>
        <div className="text-base font-bold text-[var(--text)]">Sơ đồ chưa được tạo</div>
        <p className="text-sm text-[var(--muted)] font-medium mt-1">Sơ đồ thi đấu sẽ được hiển thị sau khi đóng đăng ký hoặc phân chia bảng.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-12 pb-8">
      {hasGroups && (
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-amber-500/50"></div>
            <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
              Vòng Bảng
            </h3>
            <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-amber-500/50"></div>
          </div>
          
          {loading ? (
            <div className="flex justify-center p-8"><div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
              {groupRaces.map((race: any, idx: number) => {
                const horses = raceHorses[race._id || race.id] || []
                return (
                  <div key={idx} className="bg-[#18181b] rounded-2xl overflow-hidden shadow-2xl border border-[#3f3f46] flex flex-col transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(245,158,11,0.15)] hover:border-amber-700/50 group">
                    <div className="bg-gradient-to-b from-[#27272a] to-[#18181b] p-4 border-b border-[#3f3f46] flex justify-center items-center group-hover:from-amber-900/20 group-hover:to-[#18181b] transition-colors">
                      <h4 className="font-black text-amber-500 text-lg uppercase tracking-[0.15em] drop-shadow-sm">{race.name}</h4>
                    </div>
                    <div className="flex flex-col p-3 gap-2">
                      {horses.map((h: any, hIdx: number) => (
                        <div key={hIdx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group/item">
                          <div className="w-8 h-8 rounded-full bg-[#27272a] text-zinc-300 flex items-center justify-center font-bold text-sm shrink-0 border border-[#3f3f46] group-hover/item:border-amber-500/30 group-hover/item:text-amber-400 group-hover/item:scale-110 transition-all">
                            {hIdx + 1}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-zinc-100 font-bold truncate text-sm">{h.horse?.name || h.horseName || '---'}</span>
                            <span className="text-zinc-500 text-[11px] font-medium truncate uppercase tracking-wider mt-[2px]">
                              {h.jockeyName ? `Nài: ${h.jockeyName}` : 'Chưa xếp nài'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {horses.length === 0 && (
                        <div className="text-center p-6 text-zinc-600 text-sm italic">
                          Chưa có ngựa
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {hasBracket && (
        <div className="flex flex-col gap-8 mt-8">
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-blue-500/50"></div>
            <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] drop-shadow-[0_2px_10px_rgba(59,130,246,0.5)]">
              Vòng Loại Trực Tiếp
            </h3>
            <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-blue-500/50"></div>
          </div>
          
          <div className="overflow-x-auto pb-8">
            <div className="flex gap-12 min-w-max p-4 justify-center items-center">
              {bracket.rounds.map((round: any, rIdx: number) => {
                const totalRounds = bracket.rounds.length;
                const distanceToFinal = totalRounds - 1 - rIdx;
                
                let roundName = `Vòng ${rIdx + 1}`;
                let themeColor = 'blue';
                let shadowColor = 'rgba(59,130,246,0.15)';
                let borderColor = 'var(--border)';
                let hoverBorder = 'var(--primary)';
                
                if (distanceToFinal === 0) {
                  roundName = '🏆 Chung Kết';
                  themeColor = 'amber';
                  shadowColor = 'rgba(245,158,11,0.3)';
                  borderColor = 'rgba(245,158,11,0.4)';
                  hoverBorder = '#f59e0b';
                } else if (distanceToFinal === 1) {
                  roundName = '🥈 Bán Kết';
                  themeColor = 'cyan';
                  shadowColor = 'rgba(6,182,212,0.2)';
                  borderColor = 'rgba(6,182,212,0.3)';
                  hoverBorder = '#06b6d4';
                } else if (distanceToFinal === 2) {
                  roundName = '🥉 Tứ Kết';
                  themeColor = 'purple';
                  shadowColor = 'rgba(168,85,247,0.15)';
                  borderColor = 'rgba(168,85,247,0.3)';
                  hoverBorder = '#a855f7';
                }

                return (
                  <div key={rIdx} className="flex flex-col justify-around gap-8">
                    <div className={`text-center font-black uppercase tracking-widest text-sm drop-shadow-sm text-${themeColor}-400 mb-2`}>
                      {roundName}
                    </div>
                    <div className="flex flex-col justify-around gap-6 flex-1">
                      {round.matches.map((match: any, mIdx: number) => {
                        const h1Winner = match.winnerId && match.winnerId === match.horse1Id
                        const h2Winner = match.winnerId && match.winnerId === match.horse2Id
                        const isFinal = distanceToFinal === 0;
                        return (
                          <div 
                            key={mIdx} 
                            className={`bg-[var(--surface-2)] border rounded-xl p-3 shadow-md flex flex-col gap-2 relative transition-all group ${isFinal ? 'w-64 p-4' : 'w-56'} hover:-translate-y-1`}
                            style={{ borderColor, boxShadow: `0 4px 15px ${shadowColor}` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
                            <div className={`flex justify-between items-center text-sm px-3 py-2 rounded-lg transition-colors ${h1Winner ? 'bg-emerald-500/15 font-black text-emerald-400 border border-emerald-500/30 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]' : 'text-zinc-300 font-semibold border border-transparent'}`}>
                              <span className="truncate">{match.horse1Name || '---'}</span>
                              {h1Winner && <span className="text-base drop-shadow-md ml-2">🏆</span>}
                            </div>
                            <div className="flex items-center gap-2 px-2">
                              <div className="h-[1px] flex-1 bg-[var(--border)]"></div>
                              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">VS</span>
                              <div className="h-[1px] flex-1 bg-[var(--border)]"></div>
                            </div>
                            <div className={`flex justify-between items-center text-sm px-3 py-2 rounded-lg transition-colors ${h2Winner ? 'bg-emerald-500/15 font-black text-emerald-400 border border-emerald-500/30 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]' : 'text-zinc-300 font-semibold border border-transparent'}`}>
                              <span className="truncate">{match.horse2Name || '---'}</span>
                              {h2Winner && <span className="text-base drop-shadow-md ml-2">🏆</span>}
                            </div>
                            {match.raceId && (
                              <Link 
                                to={`/races/${typeof match.raceId === 'object' ? match.raceId._id || match.raceId.id : match.raceId}`} 
                                className={`absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#18181b] border text-zinc-400 text-[10px] px-4 py-1 rounded-full hover:text-white transition-all font-black uppercase tracking-wider whitespace-nowrap z-10 shadow-lg`}
                                style={{ borderColor: hoverBorder }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBorder; e.currentTarget.style.color = '#fff' }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#18181b'; e.currentTarget.style.color = '#a1a1aa' }}
                              >
                                Xem Race
                              </Link>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
