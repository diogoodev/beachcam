import React, { useEffect, useRef, useState } from 'react';
import { getInitials } from '../../utils/helpers';

export function AddPlayerSheet({ players, bench, addPlayerMidGame, onClose, sortedBenchDisplay }) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleAddPlayer = async () => {
    const trimmed = newPlayerName.trim().toUpperCase();
    if (!trimmed || adding) return;
    // Normalise to upper-case before comparing — the input already forces uppercase
    if (players.some(p => p.toUpperCase() === trimmed)) {
      setNewPlayerName("");
      return;
    }
    setAdding(true);
    const success = await addPlayerMidGame(trimmed);
    setAdding(false);
    // D-4: Only close if successful — keeps sheet open if network fails so user sees the error
    if (success !== false) onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl p-6 pb-28 shadow-2xl animate-[slide-up_0.3s_ease-out]">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <div className="text-xs font-bold text-[var(--neon-green)] tracking-widest uppercase mb-1">
          Adicionar à fila
        </div>
        <p className="text-white/50 text-xs mb-5">
          O jogador entra no final da fila de espera sem reiniciar a sessão.
        </p>

        <div className="flex gap-3 mb-5 flex-col md:flex-row">
          <input
            ref={inputRef}
            className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white font-bold placeholder:text-white/30 focus:outline-none focus:border-[var(--neon-green)] transition-colors"
            placeholder="Nome do jogador..."
            value={newPlayerName}
            maxLength={20}
            onChange={e => setNewPlayerName(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleAddPlayer()}
          />
          <button
            onClick={handleAddPlayer}
            disabled={!newPlayerName.trim() || adding || players.includes(newPlayerName.trim().toUpperCase())}
            className="btn-shimmer bg-[var(--neon-green)] text-black px-5 py-3 rounded-xl font-black uppercase text-sm active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-[0_0_16px_rgba(198,255,0,0.25)] flex items-center justify-center"
          >
            {adding ? "..." : "Entrar"}
          </button>
        </div>

        {newPlayerName.trim() && players.includes(newPlayerName.trim().toUpperCase()) && (
          <p className="text-red-400 text-xs font-bold mb-4">
            "{newPlayerName.trim().toUpperCase()}" já está na sessão.
          </p>
        )}

        {bench.length > 0 && (
          <div>
            <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2">Na fila agora</div>
            <div className="flex flex-wrap gap-2">
              {sortedBenchDisplay.map(p => (
                <div key={p} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold">
                    {getInitials(p)}
                  </div>
                  <span className="text-xs text-white/60 font-medium">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
