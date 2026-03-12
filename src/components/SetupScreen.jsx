import React, { useState } from 'react';
import { shuffle } from '../utils/gameLogic';

export function SetupScreen({ h }) {
  const [step, setStep] = useState(0);
  const [selectingFor, setSelectingFor] = useState(null);
  const [newPlayer, setNewPlayer] = useState("");

  const handleAdd = () => {
    if (newPlayer.trim()) {
      h.addPlayer(newPlayer.trim());
      setNewPlayer("");
    }
  };

  const randomize = () => {
    const sh = shuffle(h.players);
    h.setTeamA(sh.slice(0, 2));
    h.setTeamB(sh.slice(2, 4));
    h.setBench(sh.slice(4));
  };

  const pick = (name) => {
    if (!selectingFor) return;
    if (selectingFor === "A" && h.teamA.length < 2) {
      const next = [...h.teamA, name];
      h.setTeamA(next);
      h.setBench(b => b.filter(p => p !== name));
      if (next.length === 2 && h.teamB.length < 2) setSelectingFor("B");
      else if (next.length === 2) setSelectingFor(null);
    } else if (selectingFor === "B" && h.teamB.length < 2) {
      const next = [...h.teamB, name];
      h.setTeamB(next);
      h.setBench(b => b.filter(p => p !== name));
      if (next.length === 2 && h.teamA.length < 2) setSelectingFor("A");
      else if (next.length === 2) setSelectingFor(null);
    }
  };

  const remove = (team, name) => {
    if (team === "A") {
      h.setTeamA(t => t.filter(p => p !== name));
      h.setBench(b => [...b, name]);
    } else {
      h.setTeamB(t => t.filter(p => p !== name));
      h.setBench(b => [...b, name]);
    }
  };

  const renderPlayerCard = (player, colorVar, rotateClass, onRemove) => {
    if (!player) {
      return (
        <div className={`player-card rounded-2xl p-4 flex flex-col items-center gap-2 ${rotateClass} transform animate-[pulse_2s_infinite] border-2 border-[${colorVar}]`}>
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-dashed border-white/40">
              <span className={`material-symbols-outlined text-4xl text-[${colorVar}]`}>person_add</span>
            </div>
          </div>
          <span className="font-black text-sm md:text-lg uppercase tracking-tight opacity-50 italic">Empty</span>
        </div>
      );
    }

    return (
      <div className={`player-card rounded-2xl p-4 flex flex-col items-center gap-2 ${rotateClass} transform hover:scale-105 transition-transform`}>
        <div className="relative">
          <div className={`w-20 h-20 rounded-2xl bg-black/40 flex items-center justify-center border-4 shadow-xl border-[${colorVar}] overflow-hidden`}>
            <span className="text-4xl">{player[0] && player[0].toUpperCase()}</span>
          </div>
          <button 
            onClick={() => onRemove(player)}
            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
        <span className={`font-black text-sm md:text-lg uppercase tracking-tight truncate w-full text-center text-[${colorVar}]`}>{player}</span>
      </div>
    );
  };

  // STEP 0: PLAYERS & FORMAT
  if (step === 0) {
    return (
      <div className="px-4 animate-fade-in relative z-10">
        <div className="mb-8">
          <h2 className="heading-font text-5xl font-black mb-2 leading-none text-white drop-shadow-2xl">
            ARENA<br/>PLAYERS
          </h2>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {[3, 5, 7].map(n => (
              <button 
                key={n}
                onClick={() => h.setBestOf(n)}
                className={`flex-none px-4 py-2 rounded-lg font-extrabold text-xs uppercase transition-all ${
                  h.bestOf === n 
                    ? "bg-[var(--neon-blue)] text-black shadow-lg neon-glow" 
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
              >
                Melhor de {n}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-input rounded-xl flex items-center p-1 mb-8">
          <input 
            className="bg-transparent border-none focus:outline-none focus:ring-0 w-full px-4 py-3 heading-font text-sm font-bold placeholder:text-white/40 text-white" 
            placeholder="ADICIONAR JOGADOR..." 
            value={newPlayer} 
            onChange={e => setNewPlayer(e.target.value)} 
            onKeyDown={e => e.key === "Enter" && handleAdd()} 
            maxLength={10}
          />
          <button 
            onClick={handleAdd}
            className="bg-[var(--neon-blue)] text-black p-3 rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined font-black">add</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-20">
          {h.players.map((p, i) => (
            <div 
              key={p} 
              className={`player-card rounded-xl p-3 flex flex-col items-center gap-2 transform hover:scale-105 transition-transform ${i%2 === 0 ? '-rotate-2' : 'rotate-2'}`}
            >
              <div className="relative w-full flex justify-center">
                <div className="w-16 h-16 rounded-xl bg-black/40 flex items-center justify-center border-2 border-white/30 truncate">
                  <span className="text-2xl font-bold">{p[0] && p[0].toUpperCase()}</span>
                </div>
                <button 
                  onClick={() => h.removePlayer(p)}
                  className="absolute -top-2 -right-1 bg-red-500 rounded-full p-1 shadow-lg hover:scale-110 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[10px]">close</span>
                </button>
              </div>
              <span className="font-bold text-sm uppercase tracking-tight truncate w-full text-center">{p}</span>
            </div>
          ))}
        </div>

        <div className="fixed bottom-20 left-0 right-0 p-6 portal-gradient backdrop-blur-sm z-40 pb-6 rounded-t-3xl">
          <div className="max-w-md mx-auto">
            <button 
              onClick={() => {
                setStep(1); 
                h.setBench([...h.players]); 
                setSelectingFor("A");
              }}
              disabled={h.players.length < 4}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-4 group transition-all overflow-hidden relative ${
                h.players.length >= 4 
                  ? "bg-[var(--neon-green)] shadow-[0_10px_40px_-10px_rgba(198,255,0,0.5)] active:scale-95 cursor-pointer" 
                  : "bg-white/20 text-white/50 cursor-not-allowed"
              }`}
            >
              {h.players.length >= 4 && <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>}
              <span className={`heading-font text-xl font-black italic ${h.players.length >= 4 ? 'text-black' : 'text-white/50'}`}>MONTAR DUPLAS</span>
              {h.players.length >= 4 && <span className="material-symbols-outlined text-black font-black text-3xl">bolt</span>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 1: TEAMS MAKER
  return (
    <div className="px-4 animate-fade-in relative z-10 pb-40">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-0 w-full h-[2px] court-line"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[2px] h-3/4 court-line"></div>
      </div>

      <div className="mb-4 flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-md">
        <h2 className="heading-font text-2xl font-black text-white">DUPLAS</h2>
        <button 
          onClick={randomize}
          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 border border-white/20 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">shuffle</span>
          Sortear
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-12 relative mb-12">
        {/* Team A */}
        <div 
          onClick={() => setSelectingFor("A")}
          className={`col-span-1 rounded-2xl p-2 transition-colors cursor-pointer ${selectingFor === "A" ? "bg-white/10 ring-2 ring-[var(--neon-green)]" : ""}`}
        >
          <div className="text-center font-black uppercase text-[var(--neon-green)] mb-4 tracking-widest text-xs">Dupla A</div>
          <div className="flex flex-col gap-8">
            {renderPlayerCard(h.teamA[0], "var(--neon-green)", "-rotate-3", (p) => remove("A", p))}
            {renderPlayerCard(h.teamA[1], "var(--neon-green)", "rotate-3 translate-y-2", (p) => remove("A", p))}
          </div>
        </div>

        {/* Team B */}
        <div 
          onClick={() => setSelectingFor("B")}
          className={`col-span-1 rounded-2xl p-2 transition-colors cursor-pointer ${selectingFor === "B" ? "bg-white/10 ring-2 ring-[var(--neon-blue)]" : ""}`}
        >
          <div className="text-center font-black uppercase text-[var(--neon-blue)] mb-4 tracking-widest text-xs">Dupla B</div>
          <div className="flex flex-col gap-8">
            {renderPlayerCard(h.teamB[0], "var(--neon-blue)", "-rotate-6", (p) => remove("B", p))}
            {renderPlayerCard(h.teamB[1], "var(--neon-blue)", "rotate-6 translate-y-2", (p) => remove("B", p))}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Banco (Toque para adicionar)</div>
        <div className="flex flex-wrap gap-2">
          {h.bench.map(p => (
            <button 
              key={p} 
              onClick={() => pick(p)}
              className="px-4 py-2 bg-white/10 rounded-full font-bold text-sm border border-white/20 hover:bg-white/20 transition-colors"
            >
              {p}
            </button>
          ))}
          {h.bench.length === 0 && <span className="text-white/30 text-sm italic">Nenhum jogador no banco...</span>}
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 p-6 portal-gradient backdrop-blur-sm z-40 rounded-t-3xl flex gap-3">
        <button 
          onClick={() => setStep(0)}
          className="px-6 py-5 bg-black/60 rounded-2xl font-bold uppercase tracking-widest border border-white/20 hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button 
          disabled={h.teamA.length < 2 || h.teamB.length < 2}
          onClick={() => h.startGame(h.teamA, h.teamB, h.bench)}
          className={`flex-1 py-5 rounded-2xl flex items-center justify-center gap-2 group transition-all overflow-hidden relative ${
            h.teamA.length === 2 && h.teamB.length === 2
              ? "bg-[var(--neon-blue)] shadow-[0_10px_40px_-10px_rgba(0,245,255,0.5)] active:scale-95 cursor-pointer text-black" 
              : "bg-white/20 text-white/50 cursor-not-allowed"
          }`}
        >
          {h.teamA.length === 2 && h.teamB.length === 2 && <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>}
          <span className="heading-font text-xl font-black italic">INICIAR PARTIDA</span>
          {h.teamA.length === 2 && h.teamB.length === 2 && <span className="material-symbols-outlined font-black text-2xl">sports_tennis</span>}
        </button>
      </div>

    </div>
  );
}
