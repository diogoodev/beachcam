import { useState, useEffect, useCallback } from "react";
import { supabase, playersService, rankingService, matchesService, liveMatchService } from "../services/supabase";
import { POINT_SEQUENCE, POINT_LABELS } from "../utils/constants";
import { formatTime, shuffle, pickNextFour, updateStats } from "../utils/gameLogic";

export function useBeachCam() {
  const [screen, setScreen] = useState("setup");
  const [players, setPlayers] = useState([]);
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [bench, setBench] = useState([]);
  const [gamesPlayed, setGamesPlayed] = useState({});
  const [benchSince, setBenchSince] = useState({});
  const [rankingRows, setRankingRows] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [duoStats, setDuoStats] = useState({});
  const [pointIdxA, setPointIdxA] = useState(0);
  const [pointIdxB, setPointIdxB] = useState(0);
  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);
  const [bestOf, setBestOf] = useState(3);
  const [matchWinner, setMatchWinner] = useState(null);
  const [replays, setReplays] = useState([]);
  const [flash, setFlash] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [setHistory, setSetHistory] = useState([]);
  const [rotationLog, setRotationLog] = useState([]);
  const [syncStatus, setSyncStatus] = useState("offline");

  const setsToWin = Math.ceil(bestOf / 2);

  // Helper for flash
  const triggerFlash = (val) => { setFlash(val); setTimeout(() => setFlash(null), 700); };

  // ── Remote Sync ─────────────────────────────────────────────────────────────
  const syncLiveState = useCallback(async (updates = {}) => {
    // Note: To avoid closure stale state, we'd ideally use functional updates or refs, 
    // but for the sake of the refactor, we'll assume latest state is available.
    try {
      // In a real hook, you might want to get these from a ref or use a "dispatch" pattern
      // to avoid dependencies. For now, we'll pass the critical ones.
    } catch (e) { console.error(e); }
  }, []);

  const applyRemoteState = useCallback((st) => {
    if (st.screen) setScreen(st.screen);
    if (st.teamA) setTeamA(st.teamA);
    if (st.teamB) setTeamB(st.teamB);
    if (st.bench) setBench(st.bench);
    if (st.pointIdxA !== undefined) setPointIdxA(st.pointIdxA);
    if (st.pointIdxB !== undefined) setPointIdxB(st.pointIdxB);
    if (st.setsA !== undefined) setSetsA(st.setsA);
    if (st.setsB !== undefined) setSetsB(st.setsB);
    if (st.bestOf !== undefined) setBestOf(st.bestOf);
    if (st.matchWinner !== undefined) setMatchWinner(st.matchWinner);
    if (st.gamesPlayed) setGamesPlayed(st.gamesPlayed);
    if (st.benchSince) setBenchSince(st.benchSince);
  }, []);

  // ── API Actions ─────────────────────────────────────────────────────────────
  const loadPlayers = useCallback(async () => {
    try {
      const names = await playersService.fetchAll();
      if (names.length > 0) setPlayers(names);
      setSyncStatus("synced");
    } catch { setSyncStatus("error"); }
  }, []);

  const loadRanking = useCallback(async () => {
    try {
      const data = await rankingService.fetchAll();
      setRankingRows(data);
    } catch {}
  }, []);

  const loadMatches = useCallback(async () => {
    try {
      const data = await matchesService.fetchRecent();
      setMatchHistory(data);
      const ds = {};
      data.forEach(m => {
        const wk = [m.winner_1, m.winner_2].sort().join("|");
        const lk = [m.loser_1,  m.loser_2 ].sort().join("|");
        ds[wk] = ds[wk] ?? { wins:0, games:0 };
        ds[lk] = ds[lk] ?? { wins:0, games:0 };
        ds[wk].wins++; ds[wk].games++; ds[lk].games++;
      });
      setDuoStats(ds);
    } catch {}
  }, []);

  const saveMatch = async (winner, tA, tB, sa, sb) => {
    setSyncStatus("syncing");
    try {
      const winTeam  = winner === "A" ? tA : tB;
      const loseTeam = winner === "A" ? tB : tA;
      const sW = winner === "A" ? sa : sb;
      const sL = winner === "A" ? sb : sa;
      await matchesService.save(winner, winTeam, loseTeam, sW, sL);
      
      for (const p of winTeam) {
        const existing = rankingRows.find(r => r.player_name === p);
        await rankingService.upsert(p, (existing?.wins ?? 0) + 1, (existing?.games ?? 0) + 1);
      }
      for (const p of loseTeam) {
        const existing = rankingRows.find(r => r.player_name === p);
        await rankingService.upsert(p, existing?.wins ?? 0, (existing?.games ?? 0) + 1);
      }
      setSyncStatus("synced");
    } catch { setSyncStatus("error"); }
  };

  const addPlayer = async (name) => {
    if (name && !players.includes(name)) {
      setPlayers(p => [...p, name]);
      await playersService.add(name);
    }
  };

  const removePlayer = async (name) => {
    setPlayers(pl => pl.filter(x => x !== name));
    await playersService.remove(name);
  };

  const resetRanking = async () => {
    try {
      await rankingService.reset();
      setRankingRows([]); setMatchHistory([]); setDuoStats({});
      setSyncStatus("synced");
    } catch { setSyncStatus("error"); }
  };

  // ── Game Logic ──────────────────────────────────────────────────────────────
  const resetMatch = useCallback((sync = true) => {
    setPointIdxA(0); setPointIdxB(0); setSetsA(0); setSetsB(0);
    setMatchWinner(null); setSetHistory([]); setGameLog([]);
    if (sync) liveMatchService.sync({ 
      screen, teamA, teamB, bench, pointIdxA:0, pointIdxB:0, setsA:0, setsB:0, 
      matchWinner:null, bestOf, gamesPlayed, benchSince 
    });
  }, [screen, teamA, teamB, bench, bestOf, gamesPlayed, benchSince]);

  const addPoint = (team) => {
    if (matchWinner) return;
    triggerFlash(team);
    const nextIdxA = team === "A" ? pointIdxA + 1 : pointIdxA;
    const nextIdxB = team === "B" ? pointIdxB + 1 : pointIdxB;
    const pA = POINT_SEQUENCE[nextIdxA], pB = POINT_SEQUENCE[nextIdxB];

    if (pA === "SET" || pB === "SET") {
      const sw = pA === "SET" ? "A" : "B";
      const newSA = sw === "A" ? setsA + 1 : setsA;
      const newSB = sw === "B" ? setsB + 1 : setsB;
      setSetHistory(prev => [...prev, {
        setNum: prev.length+1, winner: sw,
        labelA: pA === "SET" ? "SET" : POINT_LABELS[POINT_SEQUENCE[pointIdxA]],
        labelB: pB === "SET" ? "SET" : POINT_LABELS[POINT_SEQUENCE[pointIdxB]],
      }]);
      setSetsA(newSA); setSetsB(newSB); setPointIdxA(0); setPointIdxB(0);
      setGameLog(prev => [{ time: formatTime(), team: sw, type:"set" }, ...prev].slice(0,50));
      
      let mw = null;
      if (newSA >= setsToWin || newSB >= setsToWin) {
        mw = newSA >= setsToWin ? "A" : "B";
        setMatchWinner(mw);
        saveMatch(mw, teamA, teamB, newSA, newSB);
      }
      liveMatchService.sync({
        screen, teamA, teamB, bench, bestOf, gamesPlayed, benchSince,
        pointIdxA: 0, pointIdxB: 0, setsA: newSA, setsB: newSB, matchWinner: mw
      });
    } else {
      setPointIdxA(nextIdxA); setPointIdxB(nextIdxB);
      setGameLog(prev => [{ time: formatTime(), team, type:"point" }, ...prev].slice(0,50));
      liveMatchService.sync({
        screen, teamA, teamB, bench, bestOf, gamesPlayed, benchSince, setsA, setsB, matchWinner,
        pointIdxA: nextIdxA, pointIdxB: nextIdxB
      });
    }
  };

  const removePoint = (team) => {
    if (matchWinner) return;
    let nA = pointIdxA, nB = pointIdxB;
    if (team === "A" && pointIdxA > 0) { nA = pointIdxA - 1; setPointIdxA(nA); }
    if (team === "B" && pointIdxB > 0) { nB = pointIdxB - 1; setPointIdxB(nB); }
    liveMatchService.sync({
      screen, teamA, teamB, bench, bestOf, gamesPlayed, benchSince, setsA, setsB, matchWinner,
      pointIdxA: nA, pointIdxB: nB
    });
  };

  const startGame = (tA, tB, b) => {
    const initGP = {}, initBS = {};
    players.forEach(p => { initGP[p] = 0; initBS[p] = 0; });
    [...tA, ...tB].forEach(p => { initGP[p] = 1; });
    setTeamA(tA); setTeamB(tB); setBench(b);
    setGamesPlayed(initGP); setBenchSince(initBS);
    setPointIdxA(0); setPointIdxB(0); setSetsA(0); setSetsB(0); setMatchWinner(null);
    setScreen("game");
    liveMatchService.sync({
      screen: "game", teamA: tA, teamB: tB, bench: b,
      pointIdxA:0, pointIdxB:0, setsA:0, setsB:0, matchWinner:null,
      bestOf, gamesPlayed: initGP, benchSince: initBS
    });
  };

  const doRotation = (winner) => {
    const losers  = winner === "A" ? [...teamB] : [...teamA];
    const winners = winner === "A" ? [...teamA] : [...teamB];
    const { nextTeamA, nextTeamB, nextBench } = pickNextFour(winners, losers, bench, gamesPlayed, benchSince);
    const { newGP, newBS } = updateStats(gamesPlayed, benchSince, nextTeamA, nextTeamB, nextBench);
    setTeamA(nextTeamA); setTeamB(nextTeamB); setBench(nextBench);
    setGamesPlayed(newGP); setBenchSince(newBS);
    setPointIdxA(0); setPointIdxB(0); setSetsA(0); setSetsB(0); setMatchWinner(null);
    setScreen("game");
    liveMatchService.sync({
      screen: "game", teamA: nextTeamA, teamB: nextTeamB, bench: nextBench,
      pointIdxA:0, pointIdxB:0, setsA:0, setsB:0, matchWinner:null,
      bestOf, gamesPlayed: newGP, benchSince: newBS
    });
  };

  // ── Initial Load & Realtime ────────────────────────────────────────────────
  useEffect(() => {
    setSyncStatus("syncing");
    loadPlayers(); loadRanking(); loadMatches();
    liveMatchService.fetch().then(st => st && applyRemoteState(st));

    const rankCh = supabase.channel("ranking-changes").on("postgres_changes", { event:"*", schema:"public", table:"ranking" }, loadRanking).subscribe();
    const matchCh = supabase.channel("match-changes").on("postgres_changes", { event:"INSERT", schema:"public", table:"matches" }, loadMatches).subscribe();
    const playerCh = supabase.channel("player-changes").on("postgres_changes", { event:"*", schema:"public", table:"players" }, loadPlayers).subscribe();
    const liveCh = supabase.channel("live-match-changes").on("postgres_changes", { event:"UPDATE", schema:"public", table:"live_match", filter:"id=eq.1" }, (p) => applyRemoteState(p.new.state)).subscribe();

    return () => {
      supabase.removeChannel(rankCh); supabase.removeChannel(matchCh);
      supabase.removeChannel(playerCh); supabase.removeChannel(liveCh);
    };
  }, [loadPlayers, loadRanking, loadMatches, applyRemoteState]);

  return {
    screen, setScreen,
    players, addPlayer, removePlayer,
    teamA, setTeamA, teamB, setTeamB, bench, setBench,
    pointIdxA, pointIdxB, setsA, setsB,
    addPoint, removePoint,
    bestOf, setBestOf, setsToWin,
    matchWinner, setMatchWinner,
    rankingRows, matchHistory, duoStats, resetRanking,
    gamesPlayed, benchSince,
    replays, setReplays,
    flash, gameLog, setHistory, rotationLog,
    syncStatus,
    startGame, doRotation, resetMatch, triggerFlash
  };
}
