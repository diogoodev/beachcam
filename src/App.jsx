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

  // activeTab controls the visible section — fully independent of h.screen (game state).
  // This means clicking "Sessão" never touches the match state, eliminating the "Ao Vivo" bug.
  const [activeTab, setActiveTab] = useState("session");

  // OBS-2: Handle PWA shortcut URLs (/?action=new, /?action=ranking)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const action = params.get("action");
    if (action === "new") setActiveTab("session");
    else if (action === "ranking") setActiveTab("ranking");

    const route = params.get("route");
    if (route) {
      try {
        const urlObj = new URL(route);
        if (urlObj.pathname === "/ranking") setActiveTab("ranking");
        else if (urlObj.pathname === "/new") setActiveTab("session");
      } catch (e) {
        if (route.includes("ranking")) setActiveTab("ranking");
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A match is "live" if there are players on court (regardless of screen state).
  const isMatchLive = Array.isArray(h.teamA) && h.teamA.length > 0;

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
          {h.syncStatus === "synced"  && <div className="w-2 h-2 rounded-full bg-[var(--neon-green)] animate-pulse shadow-[0_0_10px_var(--neon-green)]"></div>}
          {h.syncStatus === "syncing" && <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>}
          {h.syncStatus === "error"   && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]"></div>}
          {h.syncStatus === "offline" && <div className="w-2 h-2 rounded-full bg-gray-500"></div>}
          <span className={`text-[10px] uppercase font-black tracking-widest ${h.syncStatus === "error" ? "text-red-400" : ""}`}>
            {h.syncStatus === "error" ? "OFFLINE" : h.syncStatus}
          </span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative pt-24 pb-32">

        {/* Live match banner — Bento card visible on any non-session tab when a match is active */}
        {activeTab !== "session" && isMatchLive && (
          <div className="px-4 pt-2 pb-1">
            <button
              onClick={() => setActiveTab("session")}
              className="cursor-pointer group w-full flex items-center gap-4 bg-white/5 backdrop-blur-md border border-[var(--neon-green)]/25 rounded-2xl px-5 py-4 hover:bg-[var(--neon-green)]/10 hover:border-[var(--neon-green)]/50 active:scale-[0.98] transition-all duration-200 shadow-[0_0_24px_rgba(198,255,0,0.08)] overflow-hidden relative"
            >
              {/* Glow sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-green)]/0 via-[var(--neon-green)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="shrink-0 relative z-10 bg-[var(--neon-green)]/15 group-hover:bg-[var(--neon-green)]/25 border border-[var(--neon-green)]/30 rounded-xl p-2.5 transition-colors">
                <span className="material-symbols-outlined text-[var(--neon-green)] text-[22px]">sports_tennis</span>
              </div>

              <div className="flex-1 text-left relative z-10">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon-green)] animate-pulse shadow-[0_0_6px_var(--neon-green)]" />
                  <span className="text-[10px] text-[var(--neon-green)] font-black uppercase tracking-widest">Partida em andamento</span>
                </div>
                <p className="text-white font-black text-base leading-tight">Toque para voltar ao jogo</p>
              </div>

              <span className="material-symbols-outlined text-white/30 group-hover:text-[var(--neon-green)] transition-colors relative z-10 text-[20px]">chevron_right</span>
            </button>
          </div>
        )}

        {/* SESSION TAB: routes internally between Setup → Rotation → Game */}
        {activeTab === "session" && h.screen === "game" && (
          <GameScreen
            addPoint={h.addPoint} removePoint={h.removePoint} undoLastPoint={h.undoLastPoint}
            pointIdxA={h.pointIdxA} pointIdxB={h.pointIdxB}
            setsA={h.setsA} setsB={h.setsB} setsToWin={h.setsToWin}
            bestOf={h.bestOf} setBestOf={h.setBestOf} cancelMatch={h.cancelMatch}
            teamA={h.teamA} teamB={h.teamB} matchWinner={h.matchWinner}
            bench={h.bench} sortedBench={h.sortedBench}
            doRotation={h.doRotation} resetMatch={h.resetMatch} endSession={h.endSession}
            setScreen={h.setScreen} revertSet={h.revertSet} substitutePlayer={h.substitutePlayer}
            matchSetHistory={h.matchSetHistory}
          />
        )}
        {activeTab === "session" && h.screen !== "game" && (
          <SessionDashboard
            players={h.players} addPlayer={h.addPlayer} removePlayer={h.removePlayer}
            teamA={h.teamA} setTeamA={h.setTeamA} teamB={h.teamB} setTeamB={h.setTeamB}
            bench={h.bench} setBench={h.setBench} startGame={h.startGame}
            setsA={h.setsA} setsB={h.setsB} sortedBench={h.sortedBench}
            gamesPlayed={h.gamesPlayed} rankingRows={h.rankingRows}
            screen={h.screen}
            setScreen={h.setScreen} reorderBench={h.reorderBench} endSession={h.endSession}
            removePlayerFromBench={h.removePlayerFromBench} promotePlayersToNext={h.promotePlayersToNext}
            addPlayerMidGame={h.addPlayerMidGame}
          />
        )}

        {/* RANKING TAB */}
        {activeTab === "ranking" && (
          <RankingScreen
            rankingRows={h.rankingRows} matchHistory={h.matchHistory}
            todayMatches={h.todayMatches} todayRanking={h.todayRanking}
            todayDuoRanking={h.todayDuoRanking} calculateDuoRanking={h.calculateDuoRanking}
          />
        )}
      </main>

      <ReloadPrompt />

      {/* BOTTOM NAVIGATION — 3 fixed tabs, never conditional */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 flex justify-around items-center z-50">

        {/* Sessão */}
        <button
          onClick={() => setActiveTab("session")}
          className={`flex flex-col items-center gap-1 transition-colors relative ${activeTab === "session" ? "text-[var(--neon-blue)]" : "text-white/50 hover:text-white"}`}
        >
          <span className="material-symbols-outlined text-2xl">groups</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Sessão</span>
          {/* Live dot indicator — always tells user there's an active match */}
          {isMatchLive && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--neon-green)] shadow-[0_0_6px_var(--neon-green)] animate-pulse" />
          )}
        </button>

        {/* Ranking */}
        <button
          onClick={() => setActiveTab("ranking")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "ranking" ? "text-[var(--neon-blue)]" : "text-white/50 hover:text-white"}`}
        >
          <span className="material-symbols-outlined text-2xl">leaderboard</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Ranking</span>
        </button>

        {/* Config */}
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
