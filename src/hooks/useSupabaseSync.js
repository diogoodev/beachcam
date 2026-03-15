import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocalState } from "./useLocalState";
import { supabase, playersService, rankingService, matchesService, liveMatchService } from "../services/supabase";

/**
 * useSupabaseSync — manages all Supabase interactions: data fetching, subscriptions,
 * live match sync, and ranking computations.
 */
export function useSupabaseSync() {
  const [players, setPlayers] = useState([]);
  const [rankingRows, setRankingRows] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [syncStatus, setSyncStatus] = useState("offline");
  const [activeLiveMatch, setActiveLiveMatch] = useState(null);
  const [localTimestamp, setLocalTimestamp] = useLocalState("bc_localTimestamp", 0);

  // Ref for the remote update handler — lets us subscribe once and always call latest
  const handleRemoteUpdateRef = useRef(null);

  // ── Data Loading ──
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
    } catch (err) {
      console.error("Failed to load matches", err);
    }
  }, []);

  // ── Player Management ──
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

  const addPlayerToList = async (name) => {
    const trimmed = name.trim();
    if (!trimmed || players.includes(trimmed)) return false;
    try {
      setPlayers(p => [...p, trimmed]);
      await playersService.add(trimmed);
      return true;
    } catch (e) {
      console.error("Failed to add player", e);
      setPlayers(pl => pl.filter(x => x !== trimmed));
      return false;
    }
  };

  // ── Match Persistence ──
  const saveMatch = useCallback(async (winner, tA, tB, sa, sb) => {
    setSyncStatus("syncing");
    try {
      const winTeam = winner === "A" ? tA : tB;
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

  const resetRanking = async () => {
    try {
      await rankingService.reset();
      setRankingRows([]); setMatchHistory([]);
      setSyncStatus("synced");
    } catch (err) {
      console.error("Failed to reset ranking", err);
      setSyncStatus("error");
    }
  };

  // ── Live Match Sync ──
  const syncState = useCallback((fullState) => {
    const now = Date.now();
    setLocalTimestamp(now);
    const st = { ...fullState, localTimestamp: now };
    setActiveLiveMatch(st);
    liveMatchService.sync(st);
  }, [setLocalTimestamp]);

  const syncDirectState = useCallback((st) => {
    setActiveLiveMatch(st);
    liveMatchService.sync(st);
  }, []);

  // ── Ranking Computations ──
  const todayMatches = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return matchHistory.filter(m => m.played_at && m.played_at.startsWith(todayStr));
  }, [matchHistory]);

  const todayRanking = useMemo(() => {
    const stats = {};
    todayMatches.forEach(m => {
      [m.winner_1, m.winner_2].forEach(p => {
        if (!p) return;
        stats[p] = stats[p] || { player_name: p, wins: 0, games: 0 };
        stats[p].wins += 1;
        stats[p].games += 1;
      });
      [m.loser_1, m.loser_2].forEach(p => {
        if (!p) return;
        stats[p] = stats[p] || { player_name: p, wins: 0, games: 0 };
        stats[p].games += 1;
      });
    });
    return Object.values(stats)
      .filter(p => p.wins > 0)
      .sort((a, b) => b.wins - a.wins);
  }, [todayMatches]);

  const calculateDuoRanking = useCallback((matches) => {
    const stats = {};
    matches.forEach(m => {
      const duo = [m.winner_1, m.winner_2].sort().join(" / ");
      const loserDuo = [m.loser_1, m.loser_2].sort().join(" / ");
      stats[duo] = stats[duo] ?? { name: duo, players: [m.winner_1, m.winner_2].sort(), wins: 0, games: 0 };
      stats[loserDuo] = stats[loserDuo] ?? { name: loserDuo, players: [m.loser_1, m.loser_2].sort(), wins: 0, games: 0 };
      stats[duo].wins += 1;
      stats[duo].games += 1;
      stats[loserDuo].games += 1;
    });
    return Object.values(stats)
      .filter(d => d.wins > 0)
      .sort((a, b) => b.wins - a.wins);
  }, []);

  const todayDuoRanking = useMemo(() => calculateDuoRanking(todayMatches), [todayMatches, calculateDuoRanking]);

  // ── Subscriptions ──
  useEffect(() => {
    setSyncStatus("syncing");
    loadPlayers(); loadRanking(); loadMatches();
    liveMatchService.fetch().then(st => {
      if (st && handleRemoteUpdateRef.current) {
        handleRemoteUpdateRef.current(st);
      }
    }).catch(err => console.error("Failed to fetch live match", err));

    const rankCh = supabase.channel("ranking-changes").on("postgres_changes", { event: "*", schema: "public", table: "ranking" }, loadRanking).subscribe();
    const matchCh = supabase.channel("match-changes").on("postgres_changes", { event: "INSERT", schema: "public", table: "matches" }, loadMatches).subscribe();
    const playerCh = supabase.channel("player-changes").on("postgres_changes", { event: "*", schema: "public", table: "players" }, loadPlayers).subscribe();
    const liveCh = supabase.channel("live-match-changes").on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_match", filter: "id=eq.1" }, (p) => {
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
    // State
    players, rankingRows, matchHistory, syncStatus, activeLiveMatch, localTimestamp,
    // Player management
    addPlayer, removePlayer, addPlayerToList,
    // Match persistence
    saveMatch, resetRanking,
    // Live sync
    syncState, syncDirectState, handleRemoteUpdateRef,
    // Ranking computations
    todayMatches, todayRanking, todayDuoRanking, calculateDuoRanking,
    // Internal state setters (for orchestrator)
    setActiveLiveMatch,
  };
}
