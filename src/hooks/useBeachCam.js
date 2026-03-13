import { useState, useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { supabase, playersService, rankingService, matchesService, liveMatchService } from "../services/supabase";
import { POINT_SEQUENCE, POINT_LABELS } from "../utils/constants";
import { formatTime, pickNextFour, updateStats } from "../utils/gameLogic";

function useLocalState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading localStorage", error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Error setting localStorage", error);
    }
  }, [key, state]);

  return [state, setState];
}

export function useBeachCam() {
  const [screen, setScreen] = useLocalState("bc_screen", "setup");
  const [teamA, setTeamA] = useLocalState("bc_teamA", []);
  const [teamB, setTeamB] = useLocalState("bc_teamB", []);
  const [bench, setBench] = useLocalState("bc_bench", []);
  const [gamesPlayed, setGamesPlayed] = useLocalState("bc_gamesPlayed", {});
  const [benchSince, setBenchSince] = useLocalState("bc_benchSince", {});
  const [pointIdxA, setPointIdxA] = useLocalState("bc_pointIdxA", 0);
  const [pointIdxB, setPointIdxB] = useLocalState("bc_pointIdxB", 0);
  const [setsA, setSetsA] = useLocalState("bc_setsA", 0);
  const [setsB, setSetsB] = useLocalState("bc_setsB", 0);
  const [bestOf, setBestOf] = useLocalState("bc_bestOf", 3);
  const [matchWinner, setMatchWinner] = useLocalState("bc_matchWinner", null);
  const [matchSaved, setMatchSaved] = useLocalState("bc_matchSaved", false);
  const [localTimestamp, setLocalTimestamp] = useLocalState("bc_localTimestamp", 0);
  const [gameLog, setGameLog] = useLocalState("bc_gameLog", []);
  const [matchSetHistory, setMatchSetHistory] = useLocalState("bc_setHistory", []);

  const [players, setPlayers] = useState([]);
  const [rankingRows, setRankingRows] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [duoStats, setDuoStats] = useState({});
  const [flash, setFlash] = useState(null);
  const [syncStatus, setSyncStatus] = useState("offline");
  
  const [activeLiveMatch, setActiveLiveMatch] = useState(null);

  // Single ref for the remote update handler (used in Supabase subscription)
  const handleRemoteUpdateRef = useRef(null);

  const setsToWin = Math.ceil(bestOf / 2);

  const triggerFlash = (val) => { 
    setFlash(val); 
    setTimeout(() => setFlash(null), 700); 
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
  };

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
  }, [setScreen, setTeamA, setTeamB, setBench, setPointIdxA, setPointIdxB, setSetsA, setSetsB, setBestOf, setMatchWinner, setGamesPlayed, setBenchSince]);

  // Sync state — reads from state directly (no refs needed).
  // Changed values are always passed via overrides by callers.
  const syncState = useCallback((overrides = {}) => {
    const now = Date.now();
    setLocalTimestamp(now);
    const st = {
      screen: (teamA && teamA.length > 0) ? "game" : "setup",
      teamA, teamB, bench,
      pointIdxA, pointIdxB, setsA, setsB,
      matchWinner, bestOf,
      gamesPlayed, benchSince,
      localTimestamp: now,
      ...overrides
    };
    setActiveLiveMatch(st);
    liveMatchService.sync(st);
  }, [teamA, teamB, bench, pointIdxA, pointIdxB, setsA, setsB, matchWinner, bestOf, gamesPlayed, benchSince, setLocalTimestamp]);

  // Save match — uses rankingRows directly (no ref needed), parallelized with Promise.all
  const saveMatch = useCallback(async (winner, tA, tB, sa, sb) => {
    setSyncStatus("syncing");
    try {
      const winTeam  = winner === "A" ? tA : tB;
      const loseTeam = winner === "A" ? tB : tA;
      const sW = winner === "A" ? sa : sb;
      const sL = winner === "A" ? sb : sa;
      await matchesService.save(winner, winTeam, loseTeam, sW, sL);
      
      await Promise.all([
        ...winTeam.map(p => {
          const existing = rankingRows.find(r => r.player_name === p);
          return rankingService.upsert(p, (existing?.wins ?? 0) + 1, (existing?.games ?? 0) + 1);
        }),
        ...loseTeam.map(p => {
          const existing = rankingRows.find(r => r.player_name === p);
          return rankingService.upsert(p, existing?.wins ?? 0, (existing?.games ?? 0) + 1);
        })
      ]);
      setSyncStatus("synced");
    } catch (err) {
      console.error("Failed to save match", err);
      setSyncStatus("error");
    }
  }, [rankingRows]);

  const handleRemoteUpdate = useCallback((st) => {
    if (!st) return;
    setActiveLiveMatch(st);

    if (st.updated_at && localTimestamp > 0) {
      const remoteTime = new Date(st.updated_at).getTime();
      if (localTimestamp > remoteTime) {
        syncState();
        return;
      }
    }

    if (screen === "game") {
      applyRemoteState(st);
    }
  }, [applyRemoteState, syncState, localTimestamp, screen]);

  // Keep the ref always pointing to the latest handleRemoteUpdate
  useEffect(() => {
    handleRemoteUpdateRef.current = handleRemoteUpdate;
  });

  const joinLiveMatch = useCallback(() => {
    if (activeLiveMatch) {
      applyRemoteState(activeLiveMatch);
      setScreen("game");
    }
  }, [activeLiveMatch, applyRemoteState, setScreen]);

  useEffect(() => {
    if (matchWinner && !matchSaved) {
      setMatchSaved(true);
      saveMatch(matchWinner, teamA, teamB, setsA, setsB);
    }
  }, [matchWinner, matchSaved, setsA, setsB, saveMatch, setMatchSaved, teamA, teamB]);

  const loadPlayers = useCallback(async () => {
    try {
      const names = await playersService.fetchAll();
      setPlayers(names);
      setSyncStatus("synced");
    } catch (err) {
      console.error("Failed to load players", err);
      setSyncStatus("error");
    }
  }, []);

  const loadRanking = useCallback(async () => {
    try {
      const data = await rankingService.fetchAll();
      setRankingRows(data);
    } catch (err) {
      console.error("Failed to load ranking", err);
    }
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
    } catch (err) {
      console.error("Failed to load matches", err);
    }
  }, []);

  const addPlayer = async (name) => {
    if (name && !players.includes(name)) {
      try {
        setPlayers(p => [...p, name]);
        await playersService.add(name);
      } catch (e) {
        console.error("Failed to add player", e);
        setPlayers(pl => pl.filter(x => x !== name));
      }
    }
  };

  const removePlayer = async (name) => {
    const backup = [...players];
    try {
      setPlayers(pl => pl.filter(x => x !== name));
      await playersService.remove(name);
    } catch (e) {
      console.error("Failed to remove player", e);
      setPlayers(backup);
    }
  };

  const addPlayerMidGame = async (name) => {
    const trimmed = name.trim();
    if (!trimmed || players.includes(trimmed)) return;

    try {
      setPlayers(p => [...p, trimmed]);
      await playersService.add(trimmed);

      const newBench = [...bench, trimmed];
      const newGP = { ...gamesPlayed, [trimmed]: 0 };
      const newBS = { ...benchSince, [trimmed]: 1 };

      // flushSync garante que o estado é commitado antes de sincronizar
      flushSync(() => {
        setGamesPlayed(newGP);
        setBenchSince(newBS);
        setBench(newBench);
      });

      syncState({
        bench: newBench,
        gamesPlayed: newGP,
        benchSince: newBS
      });
    } catch (e) {
      console.error("Failed to add player mid-game", e);
      setPlayers(pl => pl.filter(x => x !== trimmed));
    }
  };

  const resetRanking = async () => {
    try {
      await rankingService.reset();
      setRankingRows([]); setMatchHistory([]); setDuoStats({});
      setSyncStatus("synced");
    } catch (err) {
      console.error("Failed to reset ranking", err);
      setSyncStatus("error");
    }
  };

  const endSession = useCallback(() => {
    const resetState = {
      screen: "setup",
      teamA: [], teamB: [], bench: [],
      gamesPlayed: {}, benchSince: {},
      pointIdxA: 0, pointIdxB: 0, setsA: 0, setsB: 0,
      matchWinner: null
    };

    // flushSync garante que o estado local é commitado antes de notificar outros clientes
    flushSync(() => {
      setScreen("setup");
      setTeamA([]);
      setTeamB([]);
      setBench([]);
      setGamesPlayed({});
      setBenchSince({});
      setPointIdxA(0);
      setPointIdxB(0);
      setSetsA(0);
      setSetsB(0);
      setMatchWinner(null);
      setMatchSetHistory([]);
      setGameLog([]);
      setMatchSaved(false);
    });

    syncState(resetState);
  }, [syncState, setScreen, setTeamA, setTeamB, setBench, setGamesPlayed, setBenchSince, setPointIdxA, setPointIdxB, setSetsA, setSetsB, setMatchWinner, setMatchSetHistory, setGameLog, setMatchSaved]);

  const promotePlayersToNext = (playerNames) => {
    if (!playerNames || playerNames.length === 0) return;
    
    let currentMaxSince = 0;
    Object.values(benchSince).forEach(val => {
      if (val > currentMaxSince) currentMaxSince = val;
    });

    const overrides = {};
    playerNames.forEach((p, idx) => {
      overrides[p] = currentMaxSince + 10 + (playerNames.length - idx); 
    });

    const newBS = { ...benchSince, ...overrides };
    setBenchSince(newBS);
    syncState({ benchSince: newBS });
  };

  const resetMatch = useCallback((sync = true) => {
    setPointIdxA(0); setPointIdxB(0); setSetsA(0); setSetsB(0);
    setMatchWinner(null); setMatchSetHistory([]); setGameLog([]); setMatchSaved(false);
    if (sync) {
      syncState({ pointIdxA:0, pointIdxB:0, setsA:0, setsB:0, matchWinner:null });
    }
  }, [syncState, setPointIdxA, setPointIdxB, setSetsA, setSetsB, setMatchWinner, setMatchSetHistory, setGameLog, setMatchSaved]);

  const addPoint = useCallback((team) => {
    if (matchWinner) return;
    triggerFlash(team);
    const nextIdxA = team === "A" ? pointIdxA + 1 : pointIdxA;
    const nextIdxB = team === "B" ? pointIdxB + 1 : pointIdxB;
    const pA = POINT_SEQUENCE[nextIdxA], pB = POINT_SEQUENCE[nextIdxB];

    if (pA === "SET" || pB === "SET") {
      const sw = pA === "SET" ? "A" : "B";
      const newSA = sw === "A" ? setsA + 1 : setsA;
      const newSB = sw === "B" ? setsB + 1 : setsB;
      setMatchSetHistory(prev => [...prev, {
        setNum: prev.length+1, winner: sw,
        labelA: pA === "SET" ? "SET" : POINT_LABELS[POINT_SEQUENCE[pointIdxA]],
        labelB: pB === "SET" ? "SET" : POINT_LABELS[POINT_SEQUENCE[pointIdxB]],
      }]);
      setSetsA(newSA); setSetsB(newSB); setPointIdxA(0); setPointIdxB(0);
      setGameLog(prev => [{ time: formatTime(), team: sw, type:"set" }, ...prev].slice(0,50));
      
      const currentSetsToWin = Math.ceil(bestOf / 2);
      let mw = null;
      if (newSA >= currentSetsToWin || newSB >= currentSetsToWin) {
        mw = newSA >= currentSetsToWin ? "A" : "B";
        setMatchWinner(mw);
      }
      syncState({ pointIdxA: 0, pointIdxB: 0, setsA: newSA, setsB: newSB, matchWinner: mw });
    } else {
      setPointIdxA(nextIdxA); setPointIdxB(nextIdxB);
      setGameLog(prev => [{ time: formatTime(), team, type:"point" }, ...prev].slice(0,50));
      syncState({ pointIdxA: nextIdxA, pointIdxB: nextIdxB });
    }
  }, [matchWinner, pointIdxA, pointIdxB, setsA, setsB, bestOf, syncState, setPointIdxA, setPointIdxB, setSetsA, setSetsB, setMatchWinner, setMatchSetHistory, setGameLog]);

  const removePoint = useCallback((team) => {
    if (matchWinner) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
    let nA = pointIdxA, nB = pointIdxB;
    if (team === "A" && pointIdxA > 0) { nA = pointIdxA - 1; setPointIdxA(nA); }
    if (team === "B" && pointIdxB > 0) { nB = pointIdxB - 1; setPointIdxB(nB); }
    syncState({ pointIdxA: nA, pointIdxB: nB });
  }, [matchWinner, pointIdxA, pointIdxB, syncState, setPointIdxA, setPointIdxB]);

  const startGame = (tA, tB, b) => {
    const initGP = {}, initBS = {};
    players.forEach(p => { initGP[p] = 0; initBS[p] = 0; });
    [...tA, ...tB].forEach(p => { initGP[p] = 1; });
    setTeamA(tA); setTeamB(tB); setBench(b);
    setGamesPlayed(initGP); setBenchSince(initBS);
    setPointIdxA(0); setPointIdxB(0); setSetsA(0); setSetsB(0); setMatchWinner(null); setMatchSaved(false);
    setScreen("game");
    const st = {
      screen: "game", teamA: tA, teamB: tB, bench: b,
      pointIdxA:0, pointIdxB:0, setsA:0, setsB:0, matchWinner:null,
      bestOf, gamesPlayed: initGP, benchSince: initBS,
      localTimestamp: Date.now()
    };
    setActiveLiveMatch(st);
    liveMatchService.sync(st);
  };

  const doRotation = (winner) => {
    const losers  = winner === "A" ? [...teamB] : [...teamA];
    const winners = winner === "A" ? [...teamA] : [...teamB];
    const { nextTeamA, nextTeamB, nextBench } = pickNextFour(winners, losers, bench, gamesPlayed, benchSince);
    const { newGP, newBS } = updateStats(gamesPlayed, benchSince, nextTeamA, nextTeamB, nextBench);
    setTeamA(nextTeamA); setTeamB(nextTeamB); setBench(nextBench);
    setGamesPlayed(newGP); setBenchSince(newBS);
    setPointIdxA(0); setPointIdxB(0); setSetsA(0); setSetsB(0); setMatchWinner(null); setMatchSaved(false);
    setScreen("game");
    const st = {
      screen: "game", teamA: nextTeamA, teamB: nextTeamB, bench: nextBench,
      pointIdxA:0, pointIdxB:0, setsA:0, setsB:0, matchWinner:null,
      bestOf, gamesPlayed: newGP, benchSince: newBS,
      localTimestamp: Date.now()
    };
    setActiveLiveMatch(st);
    liveMatchService.sync(st);
  };

  // Subscriptions — uses handleRemoteUpdateRef to always call the latest handler
  // without needing to resubscribe on every state change
  useEffect(() => {
    setSyncStatus("syncing");
    loadPlayers(); loadRanking(); loadMatches();
    liveMatchService.fetch().then(st => {
      if (st && handleRemoteUpdateRef.current) {
        handleRemoteUpdateRef.current(st);
      }
    }).catch(err => console.error("Failed to fetch live match", err));

    const rankCh = supabase.channel("ranking-changes").on("postgres_changes", { event:"*", schema:"public", table:"ranking" }, loadRanking).subscribe();
    const matchCh = supabase.channel("match-changes").on("postgres_changes", { event:"INSERT", schema:"public", table:"matches" }, loadMatches).subscribe();
    const playerCh = supabase.channel("player-changes").on("postgres_changes", { event:"*", schema:"public", table:"players" }, loadPlayers).subscribe();
    const liveCh = supabase.channel("live-match-changes").on("postgres_changes", { event:"UPDATE", schema:"public", table:"live_match", filter:"id=eq.1" }, (p) => {
      if (handleRemoteUpdateRef.current) {
        handleRemoteUpdateRef.current(p.new.state);
      }
    }).subscribe();

    return () => {
      supabase.removeChannel(rankCh); supabase.removeChannel(matchCh);
      supabase.removeChannel(playerCh); supabase.removeChannel(liveCh);
    };
  }, [loadPlayers, loadRanking, loadMatches]);

  return {
    screen, setScreen,
    players, addPlayer, removePlayer, addPlayerMidGame,
    teamA, setTeamA, teamB, setTeamB, bench, setBench,
    pointIdxA, pointIdxB, setsA, setsB,
    addPoint, removePoint,
    bestOf, setBestOf, setsToWin,
    matchWinner, setMatchWinner,
    rankingRows, matchHistory, duoStats, resetRanking,
    gamesPlayed, benchSince,
    flash, gameLog, matchSetHistory,
    syncStatus,
    activeLiveMatch, joinLiveMatch,
    startGame, doRotation, resetMatch, triggerFlash,
    endSession, promotePlayersToNext
  };
}
