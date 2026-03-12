import React, { useState, useMemo } from 'react';

export function RankingScreen({ h }) {
  const [confirmReset, setConfirmReset] = useState(false);
  
  // Sort players by wins
  const sortedPlayers = [...h.rankingRows].sort((a,b) => b.wins - a.wins);

  // Derive Duo rankings from matchHistory
  const duoRankings = useMemo(() => {
    const duoStats = {};
    h.matchHistory.forEach(m => {
      // Create a consistent key for the winning duo (alphabetical)
      const duo = [m.winner_1, m.winner_2].sort().join(" / ");
      if (!duoStats[duo]) {
        duoStats[duo] = { name: duo, players: [m.winner_1, m.winner_2].sort(), wins: 0, games: 0 };
      }
      duoStats[duo].wins += 1;
      
      // Also map losers for game count if we wanted winrate, but for simple ranking we just count wins
      const loserDuo = [m.loser_1, m.loser_2].sort().join(" / ");
      if (!duoStats[loserDuo]) {
        duoStats[loserDuo] = { name: loserDuo, players: [m.loser_1, m.loser_2].sort(), wins: 0, games: 0 };
      }
      duoStats[duo].games += 1;
      duoStats[loserDuo].games += 1;
    });

    return Object.values(duoStats)
      .filter(d => d.wins > 0) // Only rank duos that have won at least once
      .sort((a,b) => b.wins - a.wins);
  }, [h.matchHistory]);

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderPodium = (items, isDuo = false) => {
    if (items.length === 0) return <div className="text-gray-500 text-center py-4 italic">Sem dados suficientes</div>;

    const first = items[0];
    const second = items[1];
    const third = items[2];

    return (
      <div className="flex items-end justify-center gap-2 md:gap-4 mb-8 mt-4">
        {/* 2nd Place */}
        {second && (
          <div className="bg-card border border-white/10 rounded-3xl p-3 flex flex-col items-center w-28 md:w-32 shadow-lg mb-4">
            <div className="text-[9px] text-gray-sub tracking-widest font-bold mb-2 uppercase">2nd - {second.wins} VTs</div>
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
            {isDuo && <div className="mt-2 text-[10px] text-[var(--neon-blue)] font-bold">WR {Math.round((second.wins/second.games)*100)}%</div>}
          </div>
        )}

        {/* 1st Place */}
        {first && (
          <div className="bg-[#0a0a0a] border border-[var(--neon-green)] rounded-3xl p-4 flex flex-col items-center w-32 md:w-36 shadow-[0_0_25px_rgba(198,255,0,0.15)] relative -translate-y-2">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl">👑</div>
            <div className="text-[10px] text-[var(--neon-green)] tracking-widest font-bold mb-3 uppercase">1st - {first.wins} VTs</div>
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
            {isDuo && <div className="mt-2 text-[11px] bg-[var(--neon-green)] text-black px-3 py-0.5 rounded-full font-black">WR {Math.round((first.wins/first.games)*100)}%</div>}
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="bg-card border border-white/10 rounded-3xl p-3 flex flex-col items-center w-28 md:w-32 shadow-lg mb-2">
            <div className="text-[9px] text-gray-sub tracking-widest font-bold mb-2 uppercase">3rd - {third.wins} VTs</div>
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
            {isDuo && <div className="mt-2 text-[10px] text-white/50 font-bold">WR {Math.round((third.wins/third.games)*100)}%</div>}
          </div>
        )}
      </div>
    );
  };

  const renderList = (items, isDuo = false) => {
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
                  <div className="text-[10px] text-gray-sub font-bold uppercase">{rank}TH - {item.wins} VTs</div>
                  <div className="text-xs md:text-sm font-bold text-white uppercase">{isDuo ? item.name : item.player_name}</div>
                </div>
              </div>
              <div className="text-[var(--neon-blue)] font-black text-lg">
                {isDuo ? `${Math.round((item.wins/item.games)*100)}%` : item.wins}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24 flex flex-col pt-8 text-white relative z-10 w-full max-w-lg mx-auto">
      
      {/* Header */}
      <header className="mb-8 flex flex-col items-center gap-2 relative">
        <h1 className="text-4xl font-black italic tracking-widest text-glow-cyan uppercase">Ranking</h1>
        <span className="material-symbols-outlined crown-icon text-4xl mt-2">workspace_premium</span>
        
        {/* Reset Button Positioned Absolute */}
        <div className="absolute right-0 top-0">
          {!confirmReset ? (
            <button className="bg-white/10 hover:bg-white/20 p-2 text-xs font-bold rounded-xl transition-colors text-white/50 hover:text-white" onClick={() => setConfirmReset(true)}>Reset</button>
          ) : (
            <div className="flex gap-2">
              <button className="bg-red-900/80 hover:bg-red-700 text-white p-2 text-xs font-bold rounded-xl transition-colors" onClick={() => { h.resetRanking(); setConfirmReset(false); }}>Confirmar</button>
              <button className="bg-white/10 hover:bg-white/20 p-2 text-xs font-bold rounded-xl transition-colors" onClick={() => setConfirmReset(false)}>X</button>
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-col gap-6">
        
        {/* Jogadores Ranking Card */}
        <section className="bg-card rounded-[2rem] p-4 shadow-2xl border border-white/5">
          <div className="text-xs font-bold text-neon-green tracking-wide mb-2 px-2">JOGADORES</div>
          {renderPodium(sortedPlayers, false)}
          {renderList(sortedPlayers, false)}
        </section>

        {/* Duplas Ranking Card */}
        <section className="bg-card rounded-[2rem] p-4 shadow-2xl border border-white/5">
          <div className="text-xs font-bold text-neon-orange tracking-wide mb-2 px-2">DUPLAS</div>
          {renderPodium(duoRankings, true)}
          {renderList(duoRankings, true)}
        </section>

        {/* Historico Card */}
        <section className="bg-card rounded-[2rem] p-5 shadow-2xl border border-white/5">
          <div className="text-xs font-bold text-white tracking-wide mb-4">HISTÓRICO DE PARTIDAS</div>
          {h.matchHistory.length === 0 ? (
            <div className="text-gray-500 text-sm italic py-2">Nenhuma partida registrada hoje.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {h.matchHistory.map((m, i) => (
                <div key={m.id ?? i} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="flex flex-col gap-1">
                    <div className="text-xs font-black text-[var(--neon-green)] flex items-center gap-1 uppercase">
                      <span className="material-symbols-outlined text-[14px]">emoji_events</span>
                      <span>{m.winner_1} <span className="text-[10px] text-white/50 text-normal">&</span> {m.winner_2}</span>
                    </div>
                    <div className="text-[10px] text-gray-sub font-bold uppercase pl-5">
                      VS {m.loser_1} & {m.loser_2}
                    </div>
                  </div>
                  <div className="bg-black/50 px-3 py-1 rounded-xl border border-white/10 flex items-center gap-1">
                    <span className="text-[var(--neon-green)] font-black text-sm">{m.sets_winner}</span>
                    <span className="text-white/30 text-[10px]">x</span>
                    <span className="text-white font-black text-sm">{m.sets_loser}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
