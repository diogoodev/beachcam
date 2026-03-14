import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getInitials } from '../utils/helpers';

export function RotationScreen({ h }) {
  const [showFullBench, setShowFullBench] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showOverrideSheet, setShowOverrideSheet] = useState(false);
  const [overrideSelection, setOverrideSelection] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);

  // ── Drag-and-drop state ──
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const listRef = useRef(null);
  const longPressTimer = useRef(null);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const getItemIndexFromY = useCallback((clientY) => {
    if (!listRef.current) return null;
    const items = listRef.current.querySelectorAll('[data-queue-idx]');
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        return parseInt(item.getAttribute('data-queue-idx'), 10);
      }
    }
    // If beyond last item, return last index
    if (items.length > 0) {
      const lastRect = items[items.length - 1].getBoundingClientRect();
      if (clientY > lastRect.bottom) return items.length - 1;
      const firstRect = items[0].getBoundingClientRect();
      if (clientY < firstRect.top) return 0;
    }
    return null;
  }, []);

  const handleDragEnd = useCallback((sortedList) => {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const newOrder = [...sortedList];
      const [moved] = newOrder.splice(dragIdx, 1);
      newOrder.splice(overIdx, 0, moved);
      h.reorderBench(newOrder);
    }
    setDragIdx(null);
    setOverIdx(null);
    isDragging.current = false;
    clearTimeout(longPressTimer.current);
  }, [dragIdx, overIdx, h]);

  const handleTouchStart = useCallback((e, idx) => {
    touchStartY.current = e.touches[0].clientY;
    longPressTimer.current = setTimeout(() => {
      isDragging.current = true;
      setDragIdx(idx);
      setOverIdx(idx);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
    }, 200);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current) {
      // If finger moved too much before long press, cancel
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (dy > 10) clearTimeout(longPressTimer.current);
      return;
    }
    e.preventDefault();
    const idx = getItemIndexFromY(e.touches[0].clientY);
    if (idx !== null) setOverIdx(idx);
  }, [getItemIndexFromY]);

  const handleTouchEnd = useCallback((sortedList) => {
    clearTimeout(longPressTimer.current);
    if (isDragging.current) {
      handleDragEnd(sortedList);
    }
  }, [handleDragEnd]);

  // Foca o input quando o sheet abre
  useEffect(() => {
    if (showAddPlayer) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setNewPlayerName("");
    }
  }, [showAddPlayer]);

  const handleAddPlayer = async () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed || adding) return;
    if (h.players.includes(trimmed)) {
      setNewPlayerName("");
      return;
    }
    setAdding(true);
    await h.addPlayerMidGame(trimmed);
    setAdding(false);
    setShowAddPlayer(false);
  };

  const handleToggleOverridePlayer = (player) => {
    setOverrideSelection(prev => {
      if (prev.includes(player)) return prev.filter(p => p !== player);
      if (prev.length < 2) return [...prev, player];
      return [prev[1], player]; // shifts the oldest selection out
    });
  };

  const confirmOverride = () => {
    if (overrideSelection.length > 0) {
      h.promotePlayersToNext(overrideSelection);
      setOverrideSelection([]);
    }
    setShowOverrideSheet(false);
  };

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

        {/* Botão + Jogador */}
        <button
          onClick={() => setShowAddPlayer(true)}
          className="btn-shimmer ml-auto flex items-center gap-1.5 bg-[var(--neon-green)] text-black px-3 py-2 rounded-full font-black text-xs uppercase tracking-wider shadow-[0_0_16px_rgba(198,255,0,0.3)] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          Jogador
        </button>
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
          <section className="bg-card rounded-3xl p-5 flex flex-col justify-between aspect-square md:aspect-[4/5] shadow-xl border border-white/5">
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
              <button 
                onClick={() => {
                  setOverrideSelection([]); // limpa estado antigo
                  setShowOverrideSheet(true);
                }} 
                className="text-[10px] flex items-center gap-1 text-white hover:text-black hover:bg-neon-orange transition-colors bg-white/10 py-1.5 px-3 rounded-full font-bold uppercase tracking-wider backdrop-blur-sm"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span> Alterar
              </button>
            </div>
          </section>

          {/* Player Highlight Card */}
          <section className="bg-card rounded-3xl p-5 flex flex-col items-center justify-between aspect-square md:aspect-[4/5] shadow-xl border border-white/5">
            <div className="text-xs font-bold text-neon-green tracking-wide self-start w-full text-center">JOGADOR DESTAQUE</div>
            
            <div className="w-24 h-24 progress-ring flex items-center justify-center my-auto shadow-[0_0_25px_rgba(198,255,0,0.15)] mt-4">
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-3xl font-bold leading-none text-white">{topWR >= 0 ? topWR : 0}%</span>
                <span className="text-[9px] text-gray-sub font-bold uppercase tracking-widest mt-0.5">Taxa Vitória</span>
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
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-white tracking-wide">FILA DE ESPERA</div>
              {showFullBench && (
                <span className="text-[9px] text-white/30 font-medium tracking-wider uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">drag_indicator</span>
                  arraste para reordenar
                </span>
              )}
            </div>
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
            <div 
              ref={listRef}
              className="flex flex-col gap-1 mt-1 max-h-72 overflow-y-auto pr-2 custom-scrollbar"
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd(sortedBenchDisplay)}
            >
              {sortedBenchDisplay.length > 0 ? sortedBenchDisplay.map((p, i) => {
                const isBeingDragged = dragIdx === i;
                const isDropTarget = overIdx === i && dragIdx !== null && dragIdx !== i;

                return (
                  <div key={p} className="relative">
                    {/* Drop indicator line */}
                    {isDropTarget && dragIdx > i && (
                      <div className="absolute -top-[3px] left-0 right-0 h-[3px] bg-[var(--neon-green)] rounded-full shadow-[0_0_8px_rgba(198,255,0,0.6)] z-20" />
                    )}
                    <div
                      data-queue-idx={i}
                      onTouchStart={(e) => handleTouchStart(e, i)}
                      className={`flex justify-between items-center rounded-xl px-3 py-2.5 transition-all select-none ${
                        isBeingDragged
                          ? 'bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/40 scale-[1.02] shadow-[0_0_20px_rgba(198,255,0,0.15)]'
                          : 'border border-transparent hover:bg-white/5'
                      }`}
                      style={{ touchAction: isDragging.current ? 'none' : 'auto' }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Drag handle */}
                        <span className={`material-symbols-outlined text-[18px] cursor-grab active:cursor-grabbing transition-colors ${
                          isBeingDragged ? 'text-[var(--neon-green)]' : 'text-white/25'
                        }`}>drag_indicator</span>
                        <span className={`text-xs font-bold w-4 transition-colors ${
                          isBeingDragged ? 'text-[var(--neon-green)]' : 'text-[var(--neon-green)]'
                        }`}>#{i+1}</span>
                        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5 text-[10px] font-bold">
                          {getInitials(p)}
                        </div>
                        <span className="font-semibold text-sm">{p}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="text-[10px] bg-white/10 px-2 py-1 rounded-md text-gray-300 font-bold uppercase tracking-wider">
                          {h.gamesPlayed[p] || 0} jogos
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(window.confirm(`Remover ${p} da fila de espera?`)) h.removePlayerFromBench(p); }}
                          className="text-red-400 opacity-60 hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 transition-all flex items-center justify-center -mr-1"
                          title="Remover da Fila"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                    {/* Drop indicator line (below) */}
                    {isDropTarget && dragIdx < i && (
                      <div className="absolute -bottom-[3px] left-0 right-0 h-[3px] bg-[var(--neon-green)] rounded-full shadow-[0_0_8px_rgba(198,255,0,0.6)] z-20" />
                    )}
                  </div>
                );
              }) : (
                <div className="text-sm text-gray-sub italic">Ninguém na fila</div>
              )}
              {dragIdx !== null && (
                <div className="text-[10px] text-white/30 text-center pt-2 font-medium tracking-wider uppercase">
                  Solte para reordenar
                </div>
              )}
            </div>
          )}
        </section>

      </main>

      {/* ── BOTTOM SHEET: Adicionar Jogador Mid-Game ── */}
      {showAddPlayer && (
        <>
          {/* Overlay escuro */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowAddPlayer(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl p-6 pb-28 shadow-2xl">
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            <div className="text-xs font-bold text-[var(--neon-green)] tracking-widest uppercase mb-1">
              Adicionar à fila
            </div>
            <p className="text-white/50 text-xs mb-5">
              O jogador entra no final da fila de espera sem reiniciar a sessão.
            </p>

            {/* Input */}
            <div className="flex gap-3 mb-5 flex-col md:flex-row">
              <input
                ref={inputRef}
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white font-bold placeholder:text-white/30 focus:outline-none focus:border-[var(--neon-green)] transition-colors"
                placeholder="Nome do jogador..."
                value={newPlayerName}
                maxLength={10}
                onChange={e => setNewPlayerName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddPlayer()}
              />
              <button
                onClick={handleAddPlayer}
                disabled={!newPlayerName.trim() || adding || h.players.includes(newPlayerName.trim())}
                className="btn-shimmer bg-[var(--neon-green)] text-black px-5 py-3 rounded-xl font-black uppercase text-sm active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-[0_0_16px_rgba(198,255,0,0.25)] flex items-center justify-center"
              >
                {adding ? "..." : "Entrar"}
              </button>
            </div>

            {/* Aviso se jogador já existe */}
            {newPlayerName.trim() && h.players.includes(newPlayerName.trim()) && (
              <p className="text-red-400 text-xs font-bold mb-4">
                "{newPlayerName.trim()}" já está na sessão.
              </p>
            )}

            {/* Jogadores já na sessão (para referência visual) */}
            {h.bench.length > 0 && (
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
      )}

      {/* ── BOTTOM SHEET: Alterar Próxima Dupla (Override) ── */}
      {showOverrideSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowOverrideSheet(false)}
          />

          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-[var(--neon-orange)]/30 rounded-t-3xl p-6 pb-28 shadow-[0_-10px_40px_rgba(255,107,0,0.15)] flex flex-col max-h-[85vh]">
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
                      
                      {/* Checkbox Indicador */}
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
                onClick={() => setShowOverrideSheet(false)}
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
      )}

    </div>
  );
}
