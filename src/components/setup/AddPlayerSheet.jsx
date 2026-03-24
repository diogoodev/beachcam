import React, { useEffect, useRef, useState } from 'react';
import { getColorForName, getInitials } from '../../utils/helpers';

/**
 * Bottom-sheet for adding players to the current arena session.
 * Features:
 *  - "Quick Add" carousel: players from rankingRows who aren't already in session.
 *  - Text input for brand-new players.
 */
export function AddPlayerSheet({ players, addPlayer, rankingRows = [], onClose }) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  // Frequent players not yet in the session, sorted by total games desc.
  const suggestions = rankingRows
    .filter(r => r.player_name && !players.includes(r.player_name.toUpperCase()))
    .sort((a, b) => (b.games ?? 0) - (a.games ?? 0))
    .slice(0, 12);

  const handleAdd = async (name) => {
    const trimmed = name.trim().toUpperCase();
    if (!trimmed || adding) return;
    if (players.includes(trimmed)) { setNewName(''); return; }
    setAdding(true);
    const ok = await addPlayer(trimmed);
    setAdding(false);
    if (ok !== false) setNewName('');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-2xl animate-[slide-up_0.3s_ease-out]">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <div className="text-xs font-bold text-[var(--neon-green)] tracking-widest uppercase mb-1">
          Adicionar à Arena
        </div>

        {/* ── Quick Add Carousel ── */}
        {suggestions.length > 0 && (
          <div className="mb-5">
            <p className="text-white/40 text-[10px] mb-3 uppercase tracking-wide font-bold">Jogadores frequentes</p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {suggestions.map(r => {
                const color = getColorForName(r.player_name);
                const inSession = players.includes(r.player_name.toUpperCase());
                return (
                  <button
                    key={r.player_name}
                    disabled={inSession}
                    onClick={() => handleAdd(r.player_name)}
                    className="flex flex-col items-center gap-1.5 min-w-[56px] active:scale-90 transition-transform disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-black text-sm shadow-lg"
                      style={{ backgroundColor: color }}
                    >
                      {getInitials(r.player_name)}
                    </div>
                    <span className="text-[9px] text-white/60 font-bold uppercase truncate max-w-[56px]">
                      {r.player_name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Text Input for new player ── */}
        <p className="text-white/40 text-[10px] uppercase tracking-wide font-bold mb-2">Novo jogador</p>
        <div className="flex gap-3">
          <input
            ref={inputRef}
            className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white font-bold placeholder:text-white/30 focus:outline-none focus:border-[var(--neon-green)] transition-colors"
            placeholder="Nome do jogador..."
            value={newName}
            maxLength={20}
            onChange={e => setNewName(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleAdd(newName)}
          />
          <button
            onClick={() => handleAdd(newName)}
            disabled={!newName.trim() || adding}
            className="btn-shimmer bg-[var(--neon-green)] text-black px-5 py-3 rounded-xl font-black uppercase text-sm active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-[0_0_16px_rgba(198,255,0,0.25)] flex items-center justify-center"
          >
            {adding ? '...' : 'OK'}
          </button>
        </div>

        {newName.trim() && players.includes(newName.trim().toUpperCase()) && (
          <p className="text-red-400 text-xs font-bold mt-2">
            "{newName.trim()}" já está na arena.
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-bold uppercase tracking-widest"
        >
          Fechar
        </button>
      </div>
    </>
  );
}
