import React, { useState, useEffect } from 'react';
import { getInitials } from '../utils/helpers';

export function SubstitutionSheet({ teamA, teamB, sortedBench, substitutePlayer, onClose }) {
  const [selectedOut, setSelectedOut] = useState(null);
  const [selectedIn, setSelectedIn] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubstitute = () => {
    if (selectedOut && selectedIn) {
      substitutePlayer(selectedOut, selectedIn);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0f0f0f] border-t border-[var(--neon-blue)]/30 rounded-t-3xl p-6 pb-28 shadow-[0_-10px_40px_rgba(0,245,255,0.15)] flex flex-col max-h-[90vh]">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 shrink-0" />
        
        <div className="text-xs font-bold text-[var(--neon-blue)] tracking-widest uppercase mb-1">
          Substituição
        </div>
        <p className="text-white/50 text-xs mb-5">
          O jogador que sai vai para o final da fila de espera.
        </p>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-6">
          
          {/* QUEM SAI */}
          <div>
            <div className="text-[10px] text-white/50 font-bold tracking-widest uppercase mb-3 text-center">Quem sai?</div>
            <div className="grid grid-cols-2 gap-3">
              {/* Dupla 1 */}
              <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-2xl border border-[var(--neon-blue)]/20">
                <div className="text-[9px] text-[var(--neon-blue)] font-bold text-center uppercase tracking-wider">Dupla 1</div>
                {teamA.map(p => (
                  <button
                    key={`out-${p}`}
                    onClick={() => setSelectedOut(p)}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-all border ${selectedOut === p ? 'bg-[var(--neon-blue)]/20 border-[var(--neon-blue)] shadow-[0_0_10px_rgba(0,245,255,0.3)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedOut === p ? 'bg-[var(--neon-blue)] text-black' : 'bg-white/10 text-white'}`}>
                      {getInitials(p)}
                    </div>
                    <span className="text-xs font-semibold text-white truncate max-w-[80px]">{p.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
              
              {/* Dupla 2 */}
              <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-2xl border border-[var(--neon-green)]/20">
                <div className="text-[9px] text-[var(--neon-green)] font-bold text-center uppercase tracking-wider">Dupla 2</div>
                {teamB.map(p => (
                  <button
                    key={`out-${p}`}
                    onClick={() => setSelectedOut(p)}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-all border ${selectedOut === p ? 'bg-[var(--neon-green)]/20 border-[var(--neon-green)] shadow-[0_0_10px_rgba(198,255,0,0.3)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedOut === p ? 'bg-[var(--neon-green)] text-black' : 'bg-white/10 text-white'}`}>
                      {getInitials(p)}
                    </div>
                    <span className="text-xs font-semibold text-white truncate max-w-[80px]">{p.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-3 z-10">
            <div className="bg-[#0f0f0f] p-1 rounded-full border border-white/10">
              <span className="material-symbols-outlined text-white/30 text-xl">swap_vert</span>
            </div>
          </div>

          {/* QUEM ENTRA */}
          <div>
            <div className="text-[10px] text-white/50 font-bold tracking-widest uppercase mb-3 text-center">Quem entra?</div>
            <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-2xl border border-white/5">
              {sortedBench.length > 0 ? sortedBench.map((p, i) => (
                <button
                  key={`in-${p}`}
                  onClick={() => setSelectedIn(p)}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all border ${selectedIn === p ? 'bg-white/20 border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold ${i < 2 ? 'text-[var(--neon-orange)]' : 'text-white/40'}`}>#{i+1}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedIn === p ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
                      {getInitials(p)}
                    </div>
                    <span className="text-sm font-semibold text-white">{p}</span>
                  </div>
                  {selectedIn === p && <span className="material-symbols-outlined text-white text-sm mr-2">check_circle</span>}
                </button>
              )) : (
                <div className="text-xs text-white/40 text-center py-4 italic">Nenhum jogador na fila.</div>
              )}
            </div>
          </div>

        </div>

        <div className="shrink-0 pt-4 mt-2 flex gap-3 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl py-4 font-bold uppercase tracking-wider text-sm hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubstitute}
            disabled={!selectedOut || !selectedIn}
            className="btn-shimmer flex-1 bg-white text-black rounded-xl py-4 font-black uppercase tracking-wider text-sm active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-30 disabled:pointer-events-none"
          >
            Confirmar
          </button>
        </div>
      </div>
    </>
  );
}
