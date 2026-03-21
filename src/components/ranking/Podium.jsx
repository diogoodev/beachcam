import React from 'react';
import { getInitials } from '../../utils/helpers';

export function Podium({ items, isDuo = false, onPlayerClick }) {
  if (items.length === 0) return <div className="text-gray-500 text-center py-4 italic">Sem dados suficientes</div>;

  const first = items[0];
  const second = items[1];
  const third = items[2];

  return (
    <div className="flex items-end justify-center gap-2 md:gap-4 mb-8 mt-4">
      {/* 2nd Place */}
      {second && (
        <div
          onClick={() => !isDuo && onPlayerClick?.(second.player_name)}
          className={`bg-card border border-white/10 rounded-3xl p-3 flex flex-col items-center flex-1 max-w-28 md:max-w-32 shadow-lg mb-4 ${!isDuo ? 'cursor-pointer hover:border-white/30 active:scale-[0.97] transition-all' : ''}`}
        >
          <div className="text-[9px] text-gray-sub tracking-widest font-bold mb-2 uppercase">2º - {second.wins} Vitórias</div>
          <div className={`flex justify-center ${isDuo ? 'avatar-stack' : ''}`}>
             {isDuo ? second.players.map((p, i) => (
                <div key={p} className="w-10 h-10 rounded-full border-[1.5px] border-[var(--neon-blue)] flex items-center justify-center bg-card text-[var(--neon-blue)] text-xs font-bold shadow-[0_0_10px_rgba(0,245,255,0.2)]" style={{ zIndex: 10 - i }}>
                  {getInitials(p)}
                </div>
             )) : (
                <div className="w-12 h-12 rounded-full border-[2px] border-[var(--neon-blue)] flex items-center justify-center bg-card text-[var(--neon-blue)] text-sm font-bold shadow-[0_0_10px_rgba(0,245,255,0.2)]">
                  {getInitials(second.player_name)}
                </div>
             )}
          </div>
          <div className="mt-3 text-[10px] md:text-xs font-bold text-white text-center leading-tight uppercase line-clamp-2">
            {isDuo ? second.name : second.player_name}
          </div>
          {isDuo && <div className="mt-2 text-[10px] text-[var(--neon-blue)] font-bold">Taxa Vitória {second.games > 0 ? Math.round((second.wins/second.games)*100) : 0}%</div>}
        </div>
      )}

      {/* 1st Place */}
      {first && (
        <div
          onClick={() => !isDuo && onPlayerClick?.(first.player_name)}
          className={`bg-[#0a0a0a] border border-[var(--neon-green)] rounded-3xl p-4 flex flex-col items-center flex-1 max-w-32 md:max-w-36 shadow-[0_0_25px_rgba(198,255,0,0.15)] relative -translate-y-2 ${!isDuo ? 'cursor-pointer hover:shadow-[0_0_35px_rgba(198,255,0,0.25)] active:scale-[0.97] transition-all' : ''}`}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl">👑</div>
          <div className="text-[10px] text-[var(--neon-green)] tracking-widest font-bold mb-3 uppercase">1º - {first.wins} Vitórias</div>
          <div className={`flex justify-center ${isDuo ? 'avatar-stack' : ''}`}>
             {isDuo ? first.players.map((p, i) => (
                <div key={p} className="w-12 h-12 rounded-full border-[2px] border-[var(--neon-green)] flex items-center justify-center bg-[#0a0a0a] text-[var(--neon-green)] text-sm font-bold shadow-[0_0_15px_rgba(198,255,0,0.3)]" style={{ zIndex: 10 - i }}>
                  {getInitials(p)}
                </div>
             )) : (
                <div className="w-14 h-14 rounded-full border-[2px] border-[var(--neon-green)] flex items-center justify-center bg-[#0a0a0a] text-[var(--neon-green)] text-base font-bold shadow-[0_0_15px_rgba(198,255,0,0.3)]">
                  {getInitials(first.player_name)}
                </div>
             )}
          </div>
          <div className="mt-4 text-xs md:text-sm font-black text-white text-center leading-tight uppercase">
            {isDuo ? first.name : first.player_name}
          </div>
          {isDuo && <div className="mt-2 text-[11px] bg-[var(--neon-green)] text-black px-3 py-0.5 rounded-full font-black">Taxa Vitória {first.games > 0 ? Math.round((first.wins/first.games)*100) : 0}%</div>}
        </div>
      )}

      {/* 3rd Place */}
      {third && (
        <div
          onClick={() => !isDuo && onPlayerClick?.(third.player_name)}
          className={`bg-card border border-white/10 rounded-3xl p-3 flex flex-col items-center flex-1 max-w-28 md:max-w-32 shadow-lg mb-2 ${!isDuo ? 'cursor-pointer hover:border-white/30 active:scale-[0.97] transition-all' : ''}`}
        >
          <div className="text-[9px] text-gray-sub tracking-widest font-bold mb-2 uppercase">3º - {third.wins} Vitórias</div>
          <div className={`flex justify-center ${isDuo ? 'avatar-stack' : ''}`}>
             {isDuo ? third.players.map((p, i) => (
                <div key={p} className="w-10 h-10 rounded-full border-[1.5px] border-white/50 flex items-center justify-center bg-card text-white/80 text-xs font-bold" style={{ zIndex: 10 - i }}>
                  {getInitials(p)}
                </div>
             )) : (
                <div className="w-12 h-12 rounded-full border-[2px] border-white/50 flex items-center justify-center bg-card text-white/80 text-sm font-bold">
                  {getInitials(third.player_name)}
                </div>
             )}
          </div>
          <div className="mt-3 text-[10px] md:text-xs font-bold text-white text-center leading-tight uppercase line-clamp-2">
            {isDuo ? third.name : third.player_name}
          </div>
          {isDuo && <div className="mt-2 text-[10px] text-white/50 font-bold">Taxa Vitória {third.games > 0 ? Math.round((third.wins/third.games)*100) : 0}%</div>}
        </div>
      )}
    </div>
  );
}
