import React, { useState } from "react";
import { useBeachCam } from "./hooks/useBeachCam";
import { SetupScreen } from "./components/SetupScreen";
import { GameScreen } from "./components/GameScreen";
import { RankingScreen } from "./components/RankingScreen";
import { RotationScreen } from "./components/RotationScreen";

export default function App() {
  const h = useBeachCam();

  return (
    <div className="min-h-screen text-white select-none relative font-['Outfit']">
      <div className="fixed inset-0 court-bg -z-10"></div>
      
      {/* HEADER GLOBAL */}
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--neon-green)] text-3xl">sports_tennis</span>
          <h1 className="heading-font text-2xl font-black tracking-tighter italic">BeachCam</h1>
        </div>
        <div className={`px-3 py-1 backdrop-blur-md rounded-full border flex items-center gap-2 transition-colors ${h.syncStatus === "error" ? "bg-red-500/20 border-red-500/50" : "bg-black/40 border-white/20"}`}>
          {h.syncStatus === "synced" && <div className="w-2 h-2 rounded-full bg-[var(--neon-green)] animate-pulse shadow-[0_0_10px_var(--neon-green)]"></div>}
          {h.syncStatus === "syncing" && <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>}
          {h.syncStatus === "error" && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]"></div>}
          {h.syncStatus === "offline" && <div className="w-2 h-2 rounded-full bg-gray-500"></div>}
          <span className={`text-[10px] uppercase font-black tracking-widest ${h.syncStatus === "error" ? "text-red-400" : ""}`}>
            {h.syncStatus === "error" ? "OFFLINE" : h.syncStatus}
          </span>
        </div>
      </header>

      {/* ROTEAMENTO DE TELAS */}
      <main className="relative pt-24 pb-32">
        {h.screen === "setup"    && <SetupScreen h={h} />}
        {h.screen === "game"     && <GameScreen h={h} />}
        {h.screen === "ranking"  && <RankingScreen h={h} />}
        {h.screen === "rotation" && <RotationScreen h={h} />}
      </main>

      {/* BOTTOM NAVIGATION (Always visible) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex justify-around items-center z-50">
        <button 
          onClick={() => h.setScreen("setup")}
          className={`flex flex-col items-center gap-1 transition-colors ${h.screen === "setup" ? "text-[var(--neon-blue)]" : "text-white/50 hover:text-white"}`}
        >
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Início</span>
        </button>

        {/* Live Match / Current Match button */}
        {(h.screen === "game" || (h.activeLiveMatch && h.activeLiveMatch.screen === "game")) && (
          <button 
            onClick={() => h.screen === "game" ? null : h.joinLiveMatch()}
            className={`flex flex-col items-center gap-1 ${h.screen === "game" ? "text-[var(--neon-green)]" : "text-[var(--neon-green)] animate-pulse"}`}
          >
            <span className="material-symbols-outlined text-2xl">sports_tennis</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Ao Vivo</span>
            {h.screen === "game" && <div className="w-1 h-1 rounded-full bg-[var(--neon-green)] mt-[-2px]"></div>}
          </button>
        )}
          
          <button 
            onClick={() => h.setScreen("ranking")}
            className={`flex flex-col items-center gap-1 transition-colors ${h.screen === "ranking" ? "text-[var(--neon-blue)]" : "text-white/50 hover:text-white"}`}
          >
            <span className="material-symbols-outlined text-2xl">leaderboard</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Ranking</span>
          </button>

          <button 
            onClick={() => h.setScreen("rotation")}
            className={`flex flex-col items-center gap-1 transition-colors ${h.screen === "rotation" ? "text-[var(--neon-blue)]" : "text-white/50 hover:text-white"}`}
          >
            <span className="material-symbols-outlined text-2xl">dashboard</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Status</span>
          </button>
        </nav>

      {/* FLOATING ACTION IF IN GAME TO GO BACK */}
      {h.screen === "game" && (
        <EndSessionButton onEndSession={h.endSession} onGoSetup={() => h.setScreen("setup")} />
      )}
    </div>
  );
}

function EndSessionButton({ onEndSession, onGoSetup }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-24 left-4 z-50">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-black/50 p-2 rounded-full backdrop-blur-md text-white/70 hover:text-white"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute top-12 left-0 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-44 z-50">
            <button
              onClick={() => { onGoSetup(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              Configurar
            </button>
            <div className="h-px bg-white/10" />
            <button
              onClick={() => { onEndSession(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Encerrar sessão
            </button>
          </div>
        </>
      )}
    </div>
  );
}
