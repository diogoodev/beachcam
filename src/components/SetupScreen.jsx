import React, { useState } from 'react';
import { shuffle } from '../utils/gameLogic';
import { getColorForName } from '../utils/helpers';
import { AddPlayerSheet } from './setup/AddPlayerSheet';

export function SetupScreen({ players, addPlayer, removePlayer, teamA, setTeamA, teamB, setTeamB, bench, setBench, startGame, rankingRows = [] }) {
  const [step, setStep] = useState(0);
  const [selectingFor, setSelectingFor] = useState(null);
  const [showAddSheet, setShowAddSheet] = useState(false);

  // UX-1: Shuffle and immediately start the game — no Step 1 needed
  const shuffleAndGo = () => {
    if (players.length < 4) return;
    const sh = shuffle(players);
    startGame(sh.slice(0, 2), sh.slice(2, 4), sh.slice(4));
  };

  const randomize = () => {
    if (players.length < 4) return;
    const sh = shuffle(players);
    setTeamA(sh.slice(0, 2));
    setTeamB(sh.slice(2, 4));
    setBench(sh.slice(4));
  };

  // UX-6: local-only removal during setup — does NOT delete from DB
  const removeFromSetup = (name) => {
    setBench(b => b.filter(p => p !== name));
    setTeamA(t => t.filter(p => p !== name));
    setTeamB(t => t.filter(p => p !== name));
  };

  const pick = (name) => {
    if (!selectingFor) return;
    if (selectingFor === 'A' && teamA.length < 2 && !teamA.includes(name)) {
      const next = [...teamA, name];
      setTeamA(next);
      setBench(b => b.filter(p => p !== name));
      if (next.length === 2 && teamB.length < 2) setSelectingFor('B');
      else if (next.length === 2) setSelectingFor(null);
    } else if (selectingFor === 'B' && teamB.length < 2 && !teamB.includes(name)) {
      const next = [...teamB, name];
      setTeamB(next);
      setBench(b => b.filter(p => p !== name));
      if (next.length === 2 && teamA.length < 2) setSelectingFor('A');
      else if (next.length === 2) setSelectingFor(null);
    }
  };

  const remove = (team, name) => {
    if (team === 'A') { setTeamA(t => t.filter(p => p !== name)); setBench(b => [...b, name]); }
    else             { setTeamB(t => t.filter(p => p !== name)); setBench(b => [...b, name]); }
  };

  const renderPlayerCard = (player, rotateClass, onRemove) => {
    const color = player ? getColorForName(player) : 'var(--neon-blue)';
    if (!player) {
      return (
        <div className={`player-card rounded-2xl p-4 flex flex-col items-center gap-2 ${rotateClass} animate-pulse border-2 border-dashed`} style={{ borderColor: color }}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 flex items-center justify-center border-4 border-dashed border-white/30">
            <span className="material-symbols-outlined text-3xl text-white/30">person_add</span>
          </div>
          <span className="font-black text-sm uppercase tracking-tight opacity-40 italic">Vazio</span>
        </div>
      );
    }
    return (
      <div className={`player-card rounded-2xl p-4 flex flex-col items-center gap-2 ${rotateClass} hover:scale-105 transition-transform`}>
        <div className="relative">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-3xl shadow-xl border-4 text-black"
            style={{ backgroundColor: color, borderColor: color, boxShadow: `0 0 20px ${color}55` }}
          >
            {player[0]?.toUpperCase()}
          </div>
          <button
            onClick={() => onRemove(player)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-black/80 border border-white/20 rounded-full flex items-center justify-center hover:bg-red-500 hover:border-red-500 active:scale-90 transition-all shadow-lg"
          >
            <span className="material-symbols-outlined text-[12px]">close</span>
          </button>
        </div>
        <span className="font-black text-sm md:text-base uppercase tracking-tight truncate w-full text-center" style={{ color }}>
          {player}
        </span>
      </div>
    );
  };

  // ── STEP 0 ────────────────────────────────────────────────────────────────
  if (step === 0) {
    const canStart = players.length >= 4;
    return (
      <>
        <div className="px-4 relative z-10 pb-36">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="heading-font text-4xl sm:text-5xl font-black leading-none text-white drop-shadow-2xl">
                ARENA
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/30">Quadra 1</span>
            </div>

            {/* Player count badge */}
            <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2 gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Quadra</span>
              <span className="text-2xl font-black text-white leading-none">{players.length}</span>
              <span className="text-[9px] text-white/30 font-bold">jogadores</span>
            </div>
          </div>

          {/* ── Player Grid ── */}
          {players.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center animate-fadeIn">
              <div className="text-7xl opacity-40">🏖️</div>
              <p className="text-white/40 text-base font-bold leading-snug">
                A areia está vazia!<br />
                <span className="text-white/25 text-sm font-normal">Adicione jogadores para o aquecimento.</span>
              </p>
              <button
                onClick={() => setShowAddSheet(true)}
                className="btn-shimmer mt-2 bg-[var(--neon-green)] text-black px-6 py-3 rounded-2xl font-black uppercase text-sm tracking-widest shadow-[0_0_20px_rgba(198,255,0,0.3)] active:scale-95 transition-all"
              >
                + Adicionar Jogadores
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {players.map((p, i) => {
                const color = getColorForName(p);
                return (
                  <div
                    key={p}
                    className={`player-card rounded-xl p-3 flex flex-col items-center gap-2 transform hover:scale-105 transition-transform ${i % 2 === 0 ? '-rotate-2' : 'rotate-2'}`}
                  >
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center font-black text-xl sm:text-2xl text-black shadow-lg"
                        style={{ backgroundColor: color, boxShadow: `0 4px 15px ${color}60` }}
                      >
                        {p[0]?.toUpperCase()}
                      </div>
                      <button
                        onClick={() => removeFromSetup(p)}
                        className="absolute -top-1.5 -right-1 w-5 h-5 bg-black/80 border border-white/20 rounded-full flex items-center justify-center hover:bg-red-500 hover:border-red-400 active:scale-90 transition-all shadow-md"
                        title="Remover da sessão atual"
                      >
                        <span className="material-symbols-outlined text-[10px]">close</span>
                      </button>
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-tight truncate w-full text-center" style={{ color }}>
                      {p}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Compact Bottom Action Bar ── */}
        <div className="fixed bottom-[calc(56px+env(safe-area-inset-bottom))] left-0 right-0 px-4 pb-3 z-40">
          <div className="max-w-md mx-auto flex flex-col gap-2">
            {/* Secondary actions row */}
            {players.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTeamA([]); setTeamB([]); setBench([...players]);
                    setStep(1); setSelectingFor('A');
                  }}
                  disabled={!canStart}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 border text-xs font-bold uppercase tracking-wide transition-all ${
                    canStart
                      ? 'border-white/20 text-white/70 hover:bg-white/10 active:scale-95'
                      : 'border-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">group_work</span>
                  Manual
                </button>
                <button
                  onClick={() => setShowAddSheet(true)}
                  className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-white/20 text-white/70 hover:bg-white/10 active:scale-95 text-xs font-bold uppercase tracking-wide transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  Adicionar
                </button>
              </div>
            )}

            {/* Primary CTA */}
            <button
              onClick={shuffleAndGo}
              disabled={!canStart}
              className={`btn-shimmer w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all relative font-black ${
                canStart
                  ? 'bg-[var(--neon-green)] shadow-[0_8px_30px_-8px_rgba(198,255,0,0.55)] active:scale-95 text-black'
                  : 'bg-white/10 text-white/30 cursor-not-allowed pointer-events-none'
              }`}
            >
              <span className="material-symbols-outlined text-xl">shuffle</span>
              <span className="heading-font text-base italic">SORTEAR DUPLAS</span>
              {!canStart && (
                <span className="text-[10px] font-normal normal-case opacity-70 ml-1">
                  ({players.length}/4)
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Add Player Sheet ── */}
        {showAddSheet && (
          <AddPlayerSheet
            players={players}
            addPlayer={addPlayer}
            rankingRows={rankingRows}
            onClose={() => setShowAddSheet(false)}
          />
        )}
      </>
    );
  }

  // ── STEP 1: TEAMS MAKER ─────────────────────────────────────────────────
  return (
    <div className="px-4 relative z-10 pb-40">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-0 w-full h-[2px] court-line"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[2px] h-3/4 court-line"></div>
      </div>

      <div className="mb-4 flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-md">
        <h2 className="heading-font text-2xl font-black text-white">DUPLAS</h2>
        <button
          onClick={randomize}
          className="btn-shimmer bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 border border-white/20 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">shuffle</span>
          Sortear
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-12 relative mb-12">
        {/* Team A */}
        <div
          onClick={() => setSelectingFor('A')}
          className={`col-span-1 rounded-2xl p-2 transition-colors cursor-pointer ${selectingFor === 'A' ? 'bg-white/10 ring-2 ring-[var(--neon-green)]' : ''}`}
        >
          <div className="text-center font-black uppercase text-[var(--neon-green)] mb-4 tracking-widest text-xs">Dupla A</div>
          <div className="flex flex-col gap-8">
            {renderPlayerCard(teamA[0], '-rotate-3', p => remove('A', p))}
            {renderPlayerCard(teamA[1], 'rotate-3 translate-y-2', p => remove('A', p))}
          </div>
        </div>

        {/* Team B */}
        <div
          onClick={() => setSelectingFor('B')}
          className={`col-span-1 rounded-2xl p-2 transition-colors cursor-pointer ${selectingFor === 'B' ? 'bg-white/10 ring-2 ring-[var(--neon-blue)]' : ''}`}
        >
          <div className="text-center font-black uppercase text-[var(--neon-blue)] mb-4 tracking-widest text-xs">Dupla B</div>
          <div className="flex flex-col gap-8">
            {renderPlayerCard(teamB[0], '-rotate-6', p => remove('B', p))}
            {renderPlayerCard(teamB[1], 'rotate-6 translate-y-2', p => remove('B', p))}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Aguardando → Tap para adicionar</div>
        <div className="flex flex-wrap gap-2">
          {bench.map(p => {
            const color = getColorForName(p);
            return (
              <button
                key={p}
                onClick={() => pick(p)}
                className="px-4 py-2 bg-white/10 rounded-full font-bold text-sm border border-white/20 hover:bg-white/20 transition-colors flex items-center gap-2"
                style={{ borderColor: `${color}50` }}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                {p}
              </button>
            );
          })}
          {bench.length === 0 && <span className="text-white/30 text-sm italic">Nenhum jogador no banco...</span>}
        </div>
      </div>

      <div className="fixed bottom-[calc(56px+env(safe-area-inset-bottom))] left-0 right-0 p-4 portal-gradient backdrop-blur-sm z-40 rounded-t-3xl flex gap-3">
        <button
          onClick={() => setStep(0)}
          className="px-5 py-4 bg-black/60 rounded-2xl font-bold uppercase tracking-widest border border-white/20 hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button
          disabled={teamA.length < 2 || teamB.length < 2}
          onClick={() => startGame(teamA, teamB, bench)}
          className={`btn-shimmer flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all relative ${
            teamA.length === 2 && teamB.length === 2
              ? 'bg-[var(--neon-blue)] shadow-[0_10px_40px_-10px_rgba(0,245,255,0.5)] active:scale-95 text-black'
              : 'bg-white/20 text-white/50 cursor-not-allowed pointer-events-none'
          }`}
        >
          <span className="heading-font text-xl font-black italic">INICIAR PARTIDA</span>
          {teamA.length === 2 && teamB.length === 2 && (
            <span className="material-symbols-outlined font-black text-2xl">sports_tennis</span>
          )}
        </button>
      </div>
    </div>
  );
}
