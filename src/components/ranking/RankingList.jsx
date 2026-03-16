import React from 'react';
import { getInitials } from '../../utils/helpers';

export function RankingList({ items, isDuo = false }) {
  const listItems = items.slice(3);
  if (listItems.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {listItems.map((item, idx) => {
        const rank = idx + 4;
        return (
          <div key={isDuo ? item.name : item.player_name} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-3">
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
                <div className="text-[10px] text-gray-sub font-bold uppercase">{rank}º - {item.wins} Vitórias</div>
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
