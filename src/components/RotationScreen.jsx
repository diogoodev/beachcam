import React, { useState } from 'react';
import { getInitials } from '../utils/helpers';

export function RotationScreen({ h }) {
  const [showFullBench, setShowFullBench] = useState(false);

  // Bench sorting logic
  const sortedBenchDisplay = [...h.bench].sort((a,b) => {
    const d = (h.benchSince[b]??0) - (h.benchSince[a]??0);
    return d !== 0 ? d : (h.gamesPlayed[a]??0) - (h.gamesPlayed[b]??0);
  });

  // Next Duo Prediction
  const nextDuo = sortedBenchDisplay.slice(0, 2);

  // Player Stats for Highlight
  let topPlayer = null;
  let topWR = -1;
  let topWinsFallback = -1;

  h.rankingRows.forEach(row => {
    // Only consider players who are playing today (or simply all in db with games)
    if (row.games > 0) {
      const wr = Math.round((row.wins / row.games) * 100);
      if (wr > topWR || (wr === topWR && row.wins > topWinsFallback)) {
        topWR = wr;
        topWinsFallback = row.wins;
        topPlayer = row;
      }
    }
  });

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24 flex flex-col pt-8 text-white relative z-10">
      
      {/* Header */}
      <header className="mb-6 flex items-center gap-3">
        <button onClick={() => h.setScreen("game")} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center backdrop-blur-md">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Status da Partida</h1>
      </header>

      <main className="flex flex-col gap-4">
        
        {/* Top Card (Em Quadra) */}
        <section className="bg-card rounded-3xl p-5 flex flex-col gap-6 shadow-2xl border border-white/5">
          <div className="text-xs font-bold text-neon-green tracking-wide">EM QUADRA</div>
          <div className="flex justify-between items-end gap-2">
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neon-blue font-bold tracking-widest uppercase w-12 opacity-80">Dupla 1</span>
                <div className="flex avatar-stack">
                  {h.teamA.map((p, i) => (
                    <div key={p} className="w-12 h-12 rounded-full border-[2px] border-[var(--neon-blue)] flex items-center justify-center bg-card text-[var(--neon-blue)] text-sm font-bold shadow-[0_0_15px_rgba(0,245,255,0.2)]" style={{ zIndex: 10 - i }}>
                      {getInitials(p)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neon-green font-bold tracking-widest uppercase w-12 opacity-80">Dupla 2</span>
                <div className="flex avatar-stack">
                  {h.teamB.map((p, i) => (
                    <div key={p} className="w-12 h-12 rounded-full border-[2px] border-[var(--neon-green)] flex items-center justify-center bg-card text-[var(--neon-green)] text-sm font-bold shadow-[0_0_15px_rgba(198,255,0,0.2)]" style={{ zIndex: 10 - i }}>
                      {getInitials(p)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Score in Sets */}
            <div className="flex flex-col items-end">
              <div className="text-5xl text-white tracking-tighter leading-none mb-1 font-black flex items-center gap-1.5 bg-black/50 px-4 py-2 rounded-2xl border border-white/10">
                <span className="text-[var(--neon-blue)]">{h.setsA}</span>
                <span className="text-2xl text-white/30 mb-1">×</span>
                <span className="text-[var(--neon-green)]">{h.setsB}</span>
              </div>
              <div className="text-[10px] text-gray-sub uppercase font-medium tracking-wider mr-2 mt-1">Sets Ganhos</div>
            </div>
            
          </div>
        </section>

        {/* Middle Row */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Next Match Card */}
          <section className="bg-card rounded-3xl p-5 flex flex-col justify-between aspect-[4/5] shadow-xl border border-white/5">
            <div className="text-xs font-bold text-neon-orange tracking-wide">PRÓXIMA DUPLA</div>
            <div className="flex flex-col items-center justify-center text-center flex-1 py-1 mt-1">
              {nextDuo.length >= 2 ? (
                <div className="font-semibold text-white leading-snug">
                  <div>{nextDuo[0].split(" ")[0]}</div>
                  <div className="text-neon-orange text-[10px] my-0.5">&</div>
                  <div>{nextDuo[1].split(" ")[0]}</div>
                </div>
              ) : (
                <div className="text-xs text-gray-sub border border-white/10 px-3 py-1.5 rounded-full bg-white/5">Fila isolada</div>
              )}
            </div>
            <div className="flex justify-start pt-2">
              <button onClick={() => h.setScreen("setup")} className="text-[10px] flex items-center gap-1 text-white hover:text-black hover:bg-neon-orange transition-colors bg-white/10 py-1.5 px-3 rounded-full font-bold uppercase tracking-wider backdrop-blur-sm">
                <span className="material-symbols-outlined text-[14px]">edit</span> Alterar
              </button>
            </div>
          </section>

          {/* Player Highlight Card */}
          <section className="bg-card rounded-3xl p-5 flex flex-col items-center justify-between aspect-[4/5] shadow-xl border border-white/5">
            <div className="text-xs font-bold text-neon-green tracking-wide self-start w-full text-center">JOGADOR DESTAQUE</div>
            
            <div className="w-24 h-24 progress-ring flex items-center justify-center my-auto shadow-[0_0_25px_rgba(198,255,0,0.15)] mt-4">
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-3xl font-bold leading-none text-white">{topWR >= 0 ? topWR : 0}%</span>
                <span className="text-[9px] text-gray-sub font-bold uppercase tracking-widest mt-0.5">Win Rate</span>
              </div>
            </div>
            
            <div className="text-xs font-bold text-white max-w-full truncate mt-2 bg-white/10 px-3 py-1 rounded-full border border-white/5">
              {topPlayer ? topPlayer.player_name.split(" ")[0] : "Nenhum"}
            </div>
          </section>
        </div>

        {/* Bottom Card (Waitlist) */}
        <section className="bg-card rounded-3xl p-5 flex flex-col gap-5 shadow-xl border border-white/5 transition-all">
          <div className="flex justify-between items-center">
            <div className="text-xs font-bold text-white tracking-wide">FILA DE ESPERA</div>
            <button 
              onClick={() => setShowFullBench(!showFullBench)}
              className="text-xs text-neon-green flex items-center font-bold px-3 py-1.5 rounded-full bg-[#2A331E] hover:bg-[#3b472a] transition-colors"
            >
              {showFullBench ? "Recolher" : "Ver Tudo"}
              <span className={`material-symbols-outlined text-[14px] ml-1 transition-transform ${showFullBench ? "rotate-180" : ""}`}>expand_more</span>
            </button>
          </div>
          
          {!showFullBench ? (
            <div className="flex avatar-stack overflow-x-auto pb-1 custom-scrollbar">
              {sortedBenchDisplay.length > 0 ? sortedBenchDisplay.map((p, i) => (
                <div key={p} className="w-12 h-12 shrink-0 rounded-full border-[1.5px] border-white flex items-center justify-center bg-card text-white text-sm font-bold relative shadow-lg" style={{ zIndex: 50 - i }}>
                  {getInitials(p)}
                </div>
              )) : (
                <div className="text-sm text-gray-sub italic">Ninguém na fila</div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {sortedBenchDisplay.length > 0 ? sortedBenchDisplay.map((p, i) => (
                <div key={p} className="flex justify-between items-center border-b border-white/5 pb-2 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--neon-green)] text-xs font-bold w-4">#{i+1}</span>
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5 text-[10px] font-bold">
                      {getInitials(p)}
                    </div>
                    <span className="font-semibold text-sm">{p}</span>
                  </div>
                  <div className="text-[10px] bg-white/10 px-2 py-1 rounded-md text-gray-300 font-bold uppercase tracking-wider">
                    {h.gamesPlayed[p] || 0} jogos
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-sub italic">Ninguém na fila</div>
              )}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
