import React from 'react';
import { POINT_SEQUENCE, POINT_LABELS } from '../utils/constants';

export function GameScreen({ h }) {
  const currentLabelA   = POINT_LABELS[POINT_SEQUENCE[h.pointIdxA]] ?? "0";
  const currentLabelB   = POINT_LABELS[POINT_SEQUENCE[h.pointIdxB]] ?? "0";

  // Function to split score into two digits (e.g., "15" -> ["1", "5"], "0" -> ["", "0"], "SET" -> ["S", "E"])
  const getDigits = (score) => {
    if (score === "SET") return ["S", "T"];
    if (score === "AD") return ["A", "D"];
    const str = String(score);
    if (str.length === 1) return ["", str];
    if (str.length === 2) return [str[0], str[1]];
    return [str[0] || "", str[1] || ""]; // Fallback
  };

  const digitsA = getDigits(currentLabelA);
  const digitsB = getDigits(currentLabelB);

  // Helper for set dots
  const renderSetDots = (won) => {
    const dotsCount = h.setsToWin;
    const dotsText = [];
    for (let i = 0; i < dotsCount; i++) {
        dotsText.push(i < won);
    }
    return dotsText;
  };

  return (
    <div className="text-white flex flex-col items-center justify-center relative min-h-screen pb-32 pt-16">
      
      {/* Background FX */}
      <div className="central-glow"></div>
      <div className="center-separator"></div>

      {h.matchWinner && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <div className="font-black text-2xl uppercase tracking-widest text-[var(--sand)]">
            {(h.matchWinner === "A" ? h.teamA : h.teamB).join(" & ")}<br/>
            <span className="text-white text-xl">VENCEU!</span>
          </div>
          <div className="font-black text-4xl text-[var(--neon-green)] my-6">
            {h.setsA} × {h.setsB}
          </div>
          <div className="flex gap-4 w-full max-w-sm">
            <button 
              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl py-4 font-bold uppercase transition-colors"
              onClick={() => h.resetMatch()}
            >
              Nova Partida
            </button>
            <button 
              className="flex-1 bg-[var(--neon-blue)] text-black rounded-xl py-4 font-black uppercase shadow-[0_0_20px_rgba(0,245,255,0.4)] active:scale-95 transition-all"
              onClick={() => h.doRotation(h.matchWinner)}
            >
              🔄 Trocar Fila
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-sm px-4 flex flex-col justify-center gap-10 relative z-10 h-full">
        
        {/* Team 1 (Blue) */}
        <section className="flex flex-col items-center gap-6 relative group">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl md:text-3xl font-black tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-90 text-center px-4 line-clamp-2">
              {h.teamA.join(" & ")}
            </h1>
            <div className="flex gap-3">
              {renderSetDots(h.setsA).map((isActive, idx) => (
                <div key={idx} className={`set-dot ${isActive ? 'dot-blue-active' : 'dot-blue'}`}></div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 relative">
            <div 
              className="digit-block team-blue-block"
              onClick={() => h.addPoint("A")}
            >
              <div className="hinge-line"></div>
              <span className="digit-text team-blue-text">{digitsA[0]}</span>
            </div>
            <div 
              className="digit-block team-blue-block"
              onClick={() => h.addPoint("A")}
            >
              <div className="hinge-line"></div>
              <span className="digit-text team-blue-text">{digitsA[1]}</span>
            </div>
            
            {/* Undo button (appears inside block on active interaction, or floats beside) */}
            <button 
               onClick={(e) => { e.stopPropagation(); h.removePoint("A"); }}
               className="absolute -right-4 -bottom-4 bg-black/80 border border-white/20 text-white p-3 rounded-full flex items-center justify-center opacity-30 hover:opacity-100 active:scale-95 transition-all z-20 backdrop-blur-md"
               title="Desfazer Ponto"
            >
              <span className="material-symbols-outlined font-black text-xl">undo</span>
            </button>
          </div>
        </section>

        {/* Team 2 (Green) */}
        <section className="flex flex-col items-center gap-6 relative group">
          <div className="flex gap-4 relative">
            <div 
              className="digit-block team-green-block"
              onClick={() => h.addPoint("B")}
            >
              <div className="hinge-line"></div>
              <span className="digit-text team-green-text">{digitsB[0]}</span>
            </div>
            <div 
              className="digit-block team-green-block"
              onClick={() => h.addPoint("B")}
            >
              <div className="hinge-line"></div>
              <span className="digit-text team-green-text">{digitsB[1]}</span>
            </div>

            {/* Undo button */}
            <button 
               onClick={(e) => { e.stopPropagation(); h.removePoint("B"); }}
               className="absolute -left-4 -bottom-4 bg-black/80 border border-white/20 text-white p-3 rounded-full flex items-center justify-center opacity-30 hover:opacity-100 active:scale-95 transition-all z-20 backdrop-blur-md"
               title="Desfazer Ponto"
            >
              <span className="material-symbols-outlined font-black text-xl">undo</span>
            </button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-3">
              {renderSetDots(h.setsB).map((isActive, idx) => (
                <div key={idx} className={`set-dot ${isActive ? 'dot-green-active' : 'dot-green'}`}></div>
              ))}
            </div>
            <h2 className="text-xl md:text-3xl font-black tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-90 text-center px-4 line-clamp-2">
              {h.teamB.join(" & ")}
            </h2>
          </div>
        </section>

        {/* Match Status / Rotation Bento Button */}
        <button
          onClick={() => h.setScreen("rotation")}
          className="w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-3xl p-4 flex items-center justify-between group hover:bg-white/5 transition-all shadow-2xl active:scale-95 relative overflow-hidden"
        >
          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-blue)]/0 via-[var(--neon-blue)]/5 to-[var(--neon-green)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 group-hover:bg-[var(--neon-blue)] group-hover:text-black transition-colors duration-300">
              <span className="material-symbols-outlined font-black">groups</span>
            </div>
            <div className="text-left">
              <div className="text-white font-black uppercase tracking-wider text-sm font-['Outfit']">Status da Partida</div>
              <div className="text-white/50 text-xs font-medium mt-0.5">Fila de espera & quadra</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-colors relative z-10">chevron_right</span>
        </button>

      </main>
    </div>
  );
}
