import React, { useState } from "react";
import { useBeachCam } from "./hooks/useBeachCam";
import { SetupScreen } from "./components/SetupScreen";
import { GameScreen } from "./components/GameScreen";
import { RankingScreen } from "./components/RankingScreen";
import { RotationScreen } from "./components/RotationScreen";
import { SettingsPanel } from "./components/SettingsPanel";
import { SplashScreen } from "./components/SplashScreen";

export default function App() {
  const h = useBeachCam();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="min-h-screen text-white select-none relative font-['Outfit']">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div className="fixed inset-0 court-bg -z-10"></div>
      
      {/* HEADER GLOBAL */}
      <header className="fixed top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-50">
        <div className="flex items-center gap-2">
          <img src="/logoBeachCam.ico" alt="BeachCam Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_var(--neon-green)]" />
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
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 flex justify-around items-center z-50">
        <button 
          onClick={() => h.setScreen("setup")}
          className={`flex flex-col items-center gap-1 transition-colors ${h.screen === "setup" ? "text-[var(--neon-blue)]" : "text-white/50 hover:text-white"}`}
        >
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Início</span>
        </button>

        {/* Live Match / Current Match button */}
        {(h.screen === "game" || (h.teamA && h.teamA.length > 0) || (h.activeLiveMatch && h.activeLiveMatch.screen === "game")) && (
          <button 
            onClick={() => {
              if (h.screen === "game") return;
              if (h.teamA && h.teamA.length > 0) h.setScreen("game");
              else h.joinLiveMatch();
            }}
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

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex flex-col items-center gap-1 transition-colors text-white/50 hover:text-white"
          >
            <span className="material-symbols-outlined text-2xl">settings</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Config</span>
          </button>
        </nav>
      {/* SETTINGS BOTTOM SHEET */}
      {isSettingsOpen && (
        <SettingsPanel h={h} onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}
