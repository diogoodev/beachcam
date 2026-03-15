import React, { useState } from 'react';
import { POINT_SEQUENCE, POINT_LABELS } from '../utils/constants';
import { SubstitutionSheet } from './SubstitutionSheet';
import { ShareSheet } from './ShareSheet';
import { useBluetoothRemote } from '../hooks/useBluetoothRemote';

export function GameScreen({ h }) {
  const [showSubstitution, setShowSubstitution] = useState(false);
  const [shareMatchData, setShareMatchData] = useState(null);

  const { remoteInputProps, lastEvent, debugMode, setDebugMode } = useBluetoothRemote(
    (clicks) => {
      if (clicks === 1) h.addPoint("A");
      else if (clicks === 2) h.addPoint("B");
      else if (clicks >= 3) h.undoLastPoint();
    }, 
    !h.matchWinner // Only active when the game is not finished
  );
  
  const currentLabelA   = POINT_LABELS[POINT_SEQUENCE[h.pointIdxA]] ?? "0";
  const currentLabelB   = POINT_LABELS[POINT_SEQUENCE[h.pointIdxB]] ?? "0";

  // Function to split score into two digits (e.g., "15" -> ["1", "5"], "0" -> ["", "0"], "SET" -> ["S", "E"])
  const getDigits = (score) => {
    if (score === "SET") return ["S", "T"];
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
      {/* Hidden input to capture Bluetooth Remote KeyEvents on iOS */}
      <input {...remoteInputProps} />
      
      {/* Background FX */}
      <div className="central-glow"></div>
      <div className="center-separator"></div>

      {/* Bluetooth Remote Debug Overlay */}
      {debugMode && (
        <div className="fixed top-20 left-4 right-4 z-[200] bg-black/95 border border-[var(--neon-blue)] rounded-2xl p-4 text-xs font-mono backdrop-blur-xl shadow-[0_0_30px_rgba(0,245,255,0.3)]">
          <div className="text-[var(--neon-blue)] font-bold uppercase tracking-widest text-[10px] mb-2">🔧 Debug Controle Remoto</div>
          <div className="text-white/70 mb-3 text-[10px]">Aperte o botão do controle Bluetooth agora e veja o que aparece abaixo:</div>
          {lastEvent ? (
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
              <div><span className="text-white/40">key:</span> <span className="text-[var(--neon-green)] font-bold">{lastEvent.key}</span></div>
              <div><span className="text-white/40">code:</span> <span className="text-[var(--neon-green)] font-bold">{lastEvent.code}</span></div>
              <div><span className="text-white/40">keyCode:</span> <span className="text-[var(--neon-green)] font-bold">{lastEvent.keyCode}</span></div>
              <div><span className="text-white/40">type:</span> <span className="text-[var(--neon-green)] font-bold">{lastEvent.type}</span></div>
            </div>
          ) : (
            <div className="text-white/30 italic text-center py-3 bg-white/5 rounded-xl border border-white/10">
              Nenhum evento capturado ainda...
            </div>
          )}
          <button onClick={() => setDebugMode(false)} className="mt-3 w-full bg-white/10 border border-white/20 rounded-xl py-2 text-white/70 text-[10px] font-bold uppercase tracking-widest">
            Fechar Debug
          </button>
        </div>
      )}

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
          <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
            <div className="flex gap-4">
              <button 
                className="btn-shimmer flex-[1.5] bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl py-4 font-bold uppercase transition-colors text-sm md:text-base flex items-center justify-center gap-2"
                onClick={() => {
                  const matchData = {
                    winner_1: h.matchWinner === "A" ? h.teamA[0] : h.teamB[0],
                    winner_2: h.matchWinner === "A" ? h.teamA[1] : h.teamB[1],
                    loser_1: h.matchWinner === "A" ? h.teamB[0] : h.teamA[0],
                    loser_2: h.matchWinner === "A" ? h.teamB[1] : h.teamA[1],
                    sets_winner: h.matchWinner === "A" ? h.setsA : h.setsB,
                    sets_loser: h.matchWinner === "A" ? h.setsB : h.setsA
                  };
                  setShareMatchData(matchData);
                }}
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                Share
              </button>
              <button 
                className="btn-shimmer flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl py-4 font-bold uppercase transition-colors text-sm md:text-base"
                onClick={() => h.resetMatch()}
              >
                Revanche
              </button>
            </div>
            <button 
              className="btn-shimmer w-full bg-[var(--neon-blue)] text-black rounded-xl py-4 font-black uppercase shadow-[0_0_20px_rgba(0,245,255,0.4)] active:scale-95 transition-all text-sm md:text-base"
              onClick={() => h.doRotation(h.matchWinner)}
            >
              🔄 Próxima Dupla
            </button>
            <button 
              className="btn-shimmer w-full bg-red-600/80 hover:bg-red-600 text-white rounded-xl py-3 font-bold uppercase border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95 transition-all text-xs md:text-sm tracking-widest mt-1"
              onClick={() => {
                if(window.confirm("Certeza que deseja encerrar a sessão de jogos?")) {
                  h.endSession();
                }
              }}
            >
              Encerrar Sessão
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-sm px-4 flex flex-col justify-center gap-10 relative z-10 h-full">
        
        {/* Bluetooth Remote Indicator (tap to open debug) */}
        <button 
          onClick={() => setDebugMode(true)}
          className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 z-20" 
          title="Controle Bluetooth — Toque para diagnóstico"
        >
          <span className="material-symbols-outlined text-[14px] text-[var(--neon-blue)] animate-pulse">bluetooth</span>
          <span className="text-[9px] uppercase font-bold tracking-widest text-white/50">
            {lastEvent ? '🟢' : 'ON'}
          </span>
        </button>

        {/* Team 1 (Blue) */}
        <section className="flex flex-col items-center gap-6 relative group">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl md:text-3xl font-black tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-90 text-center px-4 line-clamp-2">
              {h.teamA.join(" & ")}
            </h1>
            <div className="flex gap-3 relative">
              {renderSetDots(h.setsA).map((isActive, idx) => (
                <div key={idx} className={`set-dot ${isActive ? 'dot-blue-active' : 'dot-blue'}`}></div>
              ))}
              
              {/* Revert Set Button */}
              {h.setsA + h.setsB > 0 && !h.matchWinner && (
                <button
                  onClick={h.revertSet}
                  className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-[var(--neon-blue)] transition-colors active:scale-90"
                  title="Reverter último set"
                  aria-label="Reverter último set"
                >
                  <span className="material-symbols-outlined text-[18px]">history</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-4 relative">
            <div 
              className="digit-block team-blue-block"
              role="button"
              tabIndex={0}
              aria-label={`Adicionar ponto para ${h.teamA.join(' e ')}. Placar atual: ${currentLabelA}`}
              onClick={() => h.addPoint("A")}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && h.addPoint("A")}
            >
              <div className="hinge-line"></div>
              <span className="digit-text team-blue-text">{digitsA[0]}</span>
            </div>
            <div 
              className="digit-block team-blue-block"
              role="button"
              tabIndex={0}
              aria-label={`Adicionar ponto para ${h.teamA.join(' e ')}`}
              onClick={() => h.addPoint("A")}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && h.addPoint("A")}
            >
              <div className="hinge-line"></div>
              <span className="digit-text team-blue-text">{digitsA[1]}</span>
            </div>
            
            {/* Undo button (appears inside block on active interaction, or floats beside) */}
            <button 
               onClick={(e) => { e.stopPropagation(); h.removePoint("A"); }}
               className="absolute -right-4 -bottom-4 bg-black/80 border border-white/20 text-white p-3 rounded-full flex items-center justify-center opacity-30 hover:opacity-100 active:scale-95 transition-all z-20 backdrop-blur-md"
               aria-label={`Desfazer ponto da dupla ${h.teamA.join(' e ')}`}
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
              role="button"
              tabIndex={0}
              aria-label={`Adicionar ponto para ${h.teamB.join(' e ')}. Placar atual: ${currentLabelB}`}
              onClick={() => h.addPoint("B")}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && h.addPoint("B")}
            >
              <div className="hinge-line"></div>
              <span className="digit-text team-green-text">{digitsB[0]}</span>
            </div>
            <div 
              className="digit-block team-green-block"
              role="button"
              tabIndex={0}
              aria-label={`Adicionar ponto para ${h.teamB.join(' e ')}`}
              onClick={() => h.addPoint("B")}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && h.addPoint("B")}
            >
              <div className="hinge-line"></div>
              <span className="digit-text team-green-text">{digitsB[1]}</span>
            </div>

            {/* Undo button */}
            <button 
               onClick={(e) => { e.stopPropagation(); h.removePoint("B"); }}
               className="absolute -left-4 -bottom-4 bg-black/80 border border-white/20 text-white p-3 rounded-full flex items-center justify-center opacity-30 hover:opacity-100 active:scale-95 transition-all z-20 backdrop-blur-md"
               aria-label={`Desfazer ponto da dupla ${h.teamB.join(' e ')}`}
               title="Desfazer Ponto"
            >
              <span className="material-symbols-outlined font-black text-xl">undo</span>
            </button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-3 relative">
              {/* Revert Set Button */}
              {h.setsA + h.setsB > 0 && !h.matchWinner && (
                <button
                  onClick={h.revertSet}
                  className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-[var(--neon-green)] transition-colors active:scale-90 flex items-center justify-center transform -scale-x-100"
                  title="Reverter último set"
                  aria-label="Reverter último set"
                >
                  <span className="material-symbols-outlined text-[18px]">history</span>
                </button>
              )}
              
              {renderSetDots(h.setsB).map((isActive, idx) => (
                <div key={idx} className={`set-dot ${isActive ? 'dot-green-active' : 'dot-green'}`}></div>
              ))}
            </div>
            <h2 className="text-xl md:text-3xl font-black tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-90 text-center px-4 line-clamp-2">
              {h.teamB.join(" & ")}
            </h2>
          </div>
        </section>

        {/* Bottom Bar: Action buttons */}
        <div className="flex gap-3 mt-2">
          {/* Button to open Substitution Sheet */}
          <button
            onClick={() => setShowSubstitution(true)}
            disabled={h.bench.length === 0}
            className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-2xl p-3 flex items-center justify-center gap-2 hover:bg-white/5 transition-all shadow-xl active:scale-95 disabled:opacity-30 disabled:pointer-events-none group"
          >
            <div className="bg-white/5 p-1.5 rounded-lg group-hover:bg-white/10 transition-colors shrink-0">
              <span className="material-symbols-outlined font-black text-[18px]">swap_horiz</span>
            </div>
            <span className="text-white font-bold uppercase tracking-wider text-xs font-['Outfit']">Substituir</span>
          </button>
          
          {/* Next Duo / Bento Card */}
          <button
            onClick={() => h.setScreen("rotation")}
            className="flex-[2] bg-[#0a0a0a] border border-white/10 rounded-2xl p-3 flex items-center justify-between group hover:bg-white/5 transition-all shadow-xl active:scale-95 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-orange)]/0 via-[var(--neon-orange)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="flex items-center gap-3 relative z-10 w-full">
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/5 group-hover:bg-[var(--neon-orange)] group-hover:text-black transition-colors duration-300 shrink-0">
                <span className="material-symbols-outlined font-black text-[18px]">queue</span>
              </div>
              <div className="text-left overflow-hidden flex-1">
                <div className="text-[var(--neon-orange)] font-black uppercase tracking-wider text-[10px] font-['Outfit'] mb-0.5">Próxima Dupla</div>
                <div className="text-white text-xs font-medium truncate">
                  {h.bench.length >= 2 ? (() => {
                    const next = h.sortedBench.slice(0, 2);
                    return `${next[0].split(" ")[0]} & ${next[1].split(" ")[0]}`;
                  })() : h.bench.length === 1 ? (
                    <span className="text-white/50 italic">Fila isolada ({h.bench[0].split(" ")[0]})</span>
                  ) : (
                    <span className="text-white/50 italic">Ninguém na fila</span>
                  )}
                </div>
              </div>
              <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-colors text-[18px]">chevron_right</span>
            </div>
          </button>
        </div>

      </main>
      
      {showSubstitution && (
        <SubstitutionSheet h={h} onClose={() => setShowSubstitution(false)} />
      )}
      
      {shareMatchData && (
        <ShareSheet 
          type="match" 
          data={shareMatchData} 
          isDuo={false} 
          onClose={() => setShareMatchData(null)} 
        />
      )}
    </div>
  );
}
