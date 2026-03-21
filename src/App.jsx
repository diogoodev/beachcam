import React, { useState, useEffect } from "react";
import { useBeachCam } from "./hooks/useBeachCam";
import { SessionDashboard } from "./components/SessionDashboard";
import { GameScreen } from "./components/GameScreen";
import { RankingScreen } from "./components/RankingScreen";
import { SettingsPanel } from "./components/SettingsPanel";
import { SplashScreen } from "./components/SplashScreen";
import { ReloadPrompt } from "./components/ReloadPrompt";

export default function App() {
  const h = useBeachCam();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // OBS-2: Handle PWA shortcut URLs (/?action=new, /?action=ranking)
  // E também Share Target e Protocol Handlers
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // 1. Shortcuts & Actions
    const action = params.get('action');
    if (action === 'new') h.setScreen('session');
    else if (action === 'ranking') h.setScreen('ranking');
    
    // 2. Share Target parameters
    const sharedTitle = params.get('title');
    const sharedText = params.get('text');
    const sharedUrl = params.get('url');
    if (sharedTitle || sharedText || sharedUrl) {
      console.log("Recebido via Share Target:", { sharedTitle, sharedText, sharedUrl });
      // Remove parâmetros da URL para não processar novamente em reload
      window.history.replaceState({}, document.title, window.location.pathname);
      // Aqui poderíamos ter um alert customizado, toast, ou preencher um form.
    }

    // 3. Protocol Handler parameters (web+beachcam://...?route=...)
    const route = params.get('route');
    if (route) {
      console.log("Recebido via Protocol Handler:", route);
      // Ex: route = web+beachcam://ranking -> route estaria apenas como "ranking" devido ao mask na config
      // Mas o navegador costuma passar a URL completa, então podemos precisar fazer um parsing:
      try {
        const urlObj = new URL(route);
        if (urlObj.pathname === '/ranking') h.setScreen('ranking');
        else if (urlObj.pathname === '/new') h.setScreen('session');
      } catch (e) {
        // Fallback caso a route venha apenas como string simples
        if (route.includes('ranking')) h.setScreen('ranking');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }

  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        {h.screen === "session"  && <SessionDashboard 
          players={h.players} addPlayer={h.addPlayer} removePlayer={h.removePlayer}
          teamA={h.teamA} setTeamA={h.setTeamA} teamB={h.teamB} setTeamB={h.setTeamB}
          bench={h.bench} setBench={h.setBench} startGame={h.startGame}
          setsA={h.setsA} setsB={h.setsB} sortedBench={h.sortedBench}
          gamesPlayed={h.gamesPlayed} rankingRows={h.rankingRows}
          screen={h.screen}
          setScreen={h.setScreen} reorderBench={h.reorderBench} endSession={h.endSession}
          removePlayerFromBench={h.removePlayerFromBench} promotePlayersToNext={h.promotePlayersToNext}
          addPlayerMidGame={h.addPlayerMidGame}
        />}
        {h.screen === "game"     && <GameScreen 
          addPoint={h.addPoint} removePoint={h.removePoint} undoLastPoint={h.undoLastPoint}
          pointIdxA={h.pointIdxA} pointIdxB={h.pointIdxB}
          setsA={h.setsA} setsB={h.setsB} setsToWin={h.setsToWin}
          bestOf={h.bestOf} setBestOf={h.setBestOf} cancelMatch={h.cancelMatch}
          teamA={h.teamA} teamB={h.teamB} matchWinner={h.matchWinner}
          bench={h.bench} sortedBench={h.sortedBench}
          doRotation={h.doRotation} resetMatch={h.resetMatch} endSession={h.endSession}
          setScreen={h.setScreen} revertSet={h.revertSet} substitutePlayer={h.substitutePlayer}
        />}
        {h.screen === "ranking"  && <RankingScreen 
          rankingRows={h.rankingRows} matchHistory={h.matchHistory}
          todayMatches={h.todayMatches} todayRanking={h.todayRanking}
          todayDuoRanking={h.todayDuoRanking} calculateDuoRanking={h.calculateDuoRanking}
        />}
      </main>

      <ReloadPrompt />

      {/* BOTTOM NAVIGATION (Always visible) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 flex justify-around items-center z-50">
        <button 
          onClick={() => h.setScreen("session")}
          className={`flex flex-col items-center gap-1 transition-colors ${h.screen === "session" ? "text-[var(--neon-blue)]" : "text-white/50 hover:text-white"}`}
        >
          <span className="material-symbols-outlined text-2xl">groups</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Sessão</span>
        </button>

        {/* Live Match button — only show when a game is actually in progress or there's a live remote match */}
        {(h.screen === "game" || (Array.isArray(h.teamA) && h.teamA.length > 0 && h.screen !== "session") || (h.activeLiveMatch && h.activeLiveMatch.screen === "game")) && (
          <button 
            onClick={() => {
              if (h.screen === "game") return;
              if (Array.isArray(h.teamA) && h.teamA.length > 0) h.setScreen("game");
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
          onClick={() => setIsSettingsOpen(true)}
          className="flex flex-col items-center gap-1 transition-colors text-white/50 hover:text-white"
        >
          <span className="material-symbols-outlined text-2xl">settings</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Config</span>
        </button>
      </nav>
      {/* SETTINGS BOTTOM SHEET */}
      {isSettingsOpen && (
        <SettingsPanel 
          players={h.players} removePlayer={h.removePlayer}
          resetRanking={h.resetRanking}
          teamA={h.teamA} teamB={h.teamB} bench={h.bench}
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
}
