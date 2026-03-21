import React from 'react';
import { getInitials } from '../../utils/helpers';

export function RankingList({ items, isDuo = false, matchHistory = [], onPlayerClick }) {
  const listItems = items.slice(3);
  if (listItems.length === 0) return null;

  // E-6: Calculate current streak for a player from most-recent matchHistory
  const getStreak = (playerName) => {
    if (!matchHistory || !playerName) return null;
    let streak = 0;
    let streakType = null;
    for (const m of matchHistory) {
      const won = m.winner_1 === playerName || m.winner_2 === playerName;
      const lost = m.loser_1 === playerName || m.loser_2 === playerName;
      if (!won && !lost) continue;
      const thisType = won ? 'win' : 'loss';
      if (streakType === null) { streakType = thisType; streak = 1; }
      else if (thisType === streakType) streak++;
      else break;
    }
    return streakType && streak >= 2 ? { type: streakType, count: streak } : null;
  };

  return (
    <div className="flex flex-col gap-2">
      {listItems.map((item, idx) => {
        const rank = idx + 4;
        const streak = !isDuo ? getStreak(item.player_name) : null;
        return (
          <div
            key={isDuo ? item.name : item.player_name}
            onClick={() => !isDuo && onPlayerClick?.(item.player_name)}
            className={`flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-3 ${!isDuo ? 'cursor-pointer hover:bg-white/10 active:scale-[0.98] transition-all' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex ${isDuo ? 'avatar-stack' : ''}`}>
                 {isDuo ? item.players.map((p, i) => (
                    <div key={p} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-card text-white text-xs font-bold" style={{ zIndex: 10 - i }}>
                      {getInitials(p)}
                    </div>
                 )) : (
                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-card text-white text-xs font-bold">
                      {getInitials(item.player_name)}
                    </div>
                 )}
              </div>
              <div>
                <div className="text-[10px] text-gray-sub font-bold uppercase flex items-center gap-1.5">
                  {rank}º - {item.wins} Vitórias
                  {streak && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${streak.type === 'win' ? 'text-[var(--neon-green)] border-[var(--neon-green)]/30 bg-[var(--neon-green)]/10' : 'text-red-400 border-red-400/30 bg-red-400/10'}`}>
                      {streak.type === 'win' ? '🔥' : '🧊'}{streak.count}
                    </span>
                  )}
                </div>
                <div className="text-xs md:text-sm font-bold text-white uppercase">{isDuo ? item.name : item.player_name}</div>
              </div>
            </div>
            <div className="text-[var(--neon-blue)] font-black text-lg">
              {isDuo ? `${item.games > 0 ? Math.round((item.wins/item.games)*100) : 0}%` : item.wins}
            </div>
          </div>
        );
      })}
    </div>
  );
}


