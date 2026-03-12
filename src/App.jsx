import React from "react";
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
        <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
          {h.syncStatus === "synced" && <div className="w-2 h-2 rounded-full bg-[var(--neon-green)] animate-pulse"></div>}
          {h.syncStatus === "syncing" && <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>}
          {h.syncStatus === "error" && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
          {h.syncStatus === "offline" && <div className="w-2 h-2 rounded-full bg-gray-500"></div>}
          <span className="text-[10px] uppercase font-bold tracking-widest">{h.syncStatus}</span>
        </div>
      </header>

      {/* ROTEAMENTO DE TELAS */}
      <main className="relative pt-24 pb-32">
        {h.screen === "setup"    && <SetupScreen h={h} />}
        {h.screen === "game"     && <GameScreen h={h} />}
        {h.screen === "ranking"  && <RankingScreen h={h} />}
        {h.screen === "rotation" && <RotationScreen h={h} />}
      </main>


      {/* BOTTOM NAVIGATION (For non-game screens) */}
      {h.screen !== "game" && (
        <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex justify-around items-center z-50">
          <button 
            onClick={() => h.setScreen("setup")}
            className={`flex flex-col items-center gap-1 transition-colors ${h.screen === "setup" ? "text-[var(--neon-blue)]" : "text-white/50 hover:text-white"}`}
          >
            <span className="material-symbols-outlined text-2xl">home</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Início</span>
          </button>

          {h.activeLiveMatch && h.activeLiveMatch.screen === "game" && (
            <button 
              onClick={h.joinLiveMatch}
              className="flex flex-col items-center gap-1 text-[var(--neon-green)] animate-pulse"
            >
              <span className="material-symbols-outlined text-2xl">sports_tennis</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Ao Vivo</span>
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
            <span className="material-symbols-outlined text-2xl">history</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Histórico</span>
          </button>
          
          <button 
            onClick={() => h.setScreen("setup")}
            className="flex flex-col items-center gap-1 transition-colors text-white/50 hover:text-white"
          >
            <span className="material-symbols-outlined text-2xl">settings</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Configs</span>
          </button>
        </nav>
      )}

      {/* FLOATING ACTION IF IN GAME TO GO BACK */}
      {h.screen === "game" && (
         <button 
           onClick={() => h.setScreen("setup")}
           className="fixed top-24 left-4 bg-black/50 p-2 rounded-full backdrop-blur-md z-50 text-white/70 hover:text-white"
         >
           <span className="material-symbols-outlined">arrow_back</span>
         </button>
      )}
    </div>
  );
}
