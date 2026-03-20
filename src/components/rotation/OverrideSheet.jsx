import React, { useState } from 'react';
import { getInitials } from '../../utils/helpers';

export function OverrideSheet({ promotePlayersToNext, onClose, sortedBenchDisplay }) {
  const [overrideSelection, setOverrideSelection] = useState([]);

  const handleToggleOverridePlayer = (player) => {
    setOverrideSelection(prev => {
      if (prev.includes(player)) return prev.filter(p => p !== player);
      if (prev.length < 2) return [...prev, player];
      return [prev[1], player];
    });
  };

  const confirmOverride = () => {
    if (overrideSelection.length > 0) {
      promotePlayersToNext(overrideSelection);
    }
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-[var(--neon-orange)]/30 rounded-t-3xl p-6 pb-28 shadow-[0_-10px_40px_rgba(255,107,0,0.15)] flex flex-col max-h-[85vh] animate-[slide-up_0.3s_ease-out]">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 shrink-0" />

        <div className="text-xs font-bold text-[var(--neon-orange)] tracking-widest uppercase mb-1">
          Escalar Próxima Dupla
        </div>
        <p className="text-white/50 text-xs mb-5">
          Selecione 1 ou 2 jogadores da fila que devem entrar na próxima rotação furando a ordem atual.
        </p>

        <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 pr-2">
          <div className="flex flex-col gap-2">
            {sortedBenchDisplay.length > 0 ? sortedBenchDisplay.map(p => {
              const isSelected = overrideSelection.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => handleToggleOverridePlayer(p)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected ? 'bg-[var(--neon-orange)]/10 border-[var(--neon-orange)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${isSelected ? 'border-[var(--neon-orange)] text-[var(--neon-orange)] shadow-[0_0_10px_rgba(255,107,0,0.3)] bg-black/40' : 'border-white/20 text-white bg-white/5'}`}>
                      {getInitials(p)}
                    </div>
                    <span className={`font-semibold text-sm transition-colors ${isSelected ? 'text-[var(--neon-orange)]' : 'text-white'}`}>
                      {p}
                    </span>
                  </div>
                  
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-[var(--neon-green)] shadow-[0_0_8px_rgba(198,255,0,0.3)] bg-black/40' : 'border-white/30'}`}>
                    {isSelected && <span className="material-symbols-outlined text-[var(--neon-green)] text-[14px] font-bold">check</span>}
                  </div>
                </button>
              );
            }) : (
              <div className="text-sm text-gray-sub text-center py-4 italic">Nenhum jogador na fila de espera.</div>
            )}
          </div>
        </div>

        <div className="shrink-0 pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl py-4 font-bold uppercase tracking-wider text-sm hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmOverride}
            disabled={overrideSelection.length === 0}
            className={`btn-shimmer flex-1 rounded-xl py-4 font-black uppercase tracking-wider text-sm active:scale-95 transition-all shadow-[0_0_20px_rgba(255,107,0,0.3)] disabled:opacity-30 disabled:pointer-events-none ${
              overrideSelection.length === 2 
                ? "bg-[#111] border-2 border-[var(--neon-orange)] text-[var(--neon-orange)]" 
                : "bg-[var(--neon-orange)] text-black border-2 border-transparent"
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </>
  );
}
