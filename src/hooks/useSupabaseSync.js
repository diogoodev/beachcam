import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocalState } from "./useLocalState";
import { supabase, playersService, rankingService, matchesService, liveMatchService } from "../services/supabase";
import { useToast } from "../components/ui/ToastContext";

/**
 * useSupabaseSync — manages all Supabase interactions: data fetching, subscriptions,
 * live match sync, and ranking computations.
 */
export function useSupabaseSync() {
  const { showToast } = useToast();
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

  const removePlayer = useCallback(async (name) => {
    const backup = [...players];
    try {
      setPlayers(pl => pl.filter(x => x !== name));
      await playersService.remove(name);
    } catch (e) {
      console.error("Failed to remove player", e);
      setPlayers(backup);
      showToast('Erro ao remover jogador', 'error');
    }
  }, [players, showToast]);

  const addPlayerToList = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!trimmed || players.includes(trimmed)) return false;
    try {
      setPlayers(p => [...p, trimmed]);
      await playersService.add(trimmed);
      return true;
    } catch (e) {
      console.error("Failed to add player", e);
      setPlayers(pl => pl.filter(x => x !== trimmed));
      showToast('Erro ao adicionar jogador', 'error');
      return false;
    }
  }, [players, showToast]);

  // ── Match Persistence ──
  const saveMatch = useCallback(async (winner, tA, tB, sa, sb) => {
    setSyncStatus("syncing");
    try {
      const winTeam = winner === "A" ? tA : tB;
      const loseTeam = winner === "A" ? tB : tA;
      const sW = winner === "A" ? sa : sb;
      const sL = winner === "A" ? sb : sa;
      await matchesService.save(winner, winTeam, loseTeam, sW, sL);

      // We no longer rely on the component closure's `rankingRows`.
      // We explicitly fetch fresh from Supabase. Next renders will 
      // see it via the Postgres subscription anyway.
      const freshRanking = await rankingService.fetchAll();

      await Promise.all([
        ...winTeam.map(p => {
          const existing = freshRanking.find(r => r.player_name === p);
          return rankingService.upsert(p, (existing?.wins ?? 0) + 1, (existing?.games ?? 0) + 1);
        }),
        ...loseTeam.map(p => {
          const existing = freshRanking.find(r => r.player_name === p);
          return rankingService.upsert(p, existing?.wins ?? 0, (existing?.games ?? 0) + 1);
        })
      ]);
      setSyncStatus("synced");
      showToast('Partida salva!', 'success', 2000);
    } catch (err) {
      console.error("Failed to save match", err);
      setSyncStatus("error");
      showToast('Erro ao salvar partida', 'error');
    }
  }, [showToast]);

  // Undo the last saveMatch: delete from DB, revert ranking, update local state
  const unsaveMatch = useCallback(async () => {
    try {
      setSyncStatus("syncing");
      const deleted = await matchesService.deleteLast();
      if (!deleted) {
        setSyncStatus("synced");
        return;
      }

      // Revert ranking: decrement wins/games for winners, decrement games for losers
      const winners = [deleted.winner_1, deleted.winner_2];
      const losers = [deleted.loser_1, deleted.loser_2];

      const freshRanking = await rankingService.fetchAll();

      await Promise.all([
        ...winners.map(p => {
          const existing = freshRanking.find(r => r.player_name === p);
          if (!existing) return Promise.resolve();
          return rankingService.upsert(p, Math.max(0, existing.wins - 1), Math.max(0, existing.games - 1));
        }),
        ...losers.map(p => {
          const existing = freshRanking.find(r => r.player_name === p);
          if (!existing) return Promise.resolve();
          return rankingService.upsert(p, existing.wins, Math.max(0, existing.games - 1));
        })
      ]);

      // Update local matchHistory (remove the first/newest entry)
      setMatchHistory(prev => prev.slice(1));
      setSyncStatus("synced");
      showToast('Partida revertida do histórico', 'success', 2000);
    } catch (err) {
      console.error("Failed to unsave match", err);
      setSyncStatus("error");
      showToast('Erro ao reverter partida', 'error');
    }
  }, [showToast]);

  const resetRanking = useCallback(async () => {
    try {
      await rankingService.reset();
      setRankingRows([]); setMatchHistory([]);
      setSyncStatus("synced");
    } catch (err) {
      console.error("Failed to reset ranking", err);
      setSyncStatus("error");
      showToast('Erro ao resetar ranking', 'error');
    }
  }, [showToast]);

  // ── Live Match Sync ──
  const syncState = useCallback((fullState) => {
    const now = Date.now();
    setLocalTimestamp(now);
    const st = { ...fullState, localTimestamp: now };
    setActiveLiveMatch(st);
    liveMatchService.sync(st).catch(err => console.error("Failed to sync live match state", err));
  }, [setLocalTimestamp]);

  // ── Ranking Computations ──
  const todayMatches = useMemo(() => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('sv-SE'); // YYYY-MM-DD in local timezone
    return matchHistory.filter(m => {
      if (!m.played_at) return false;
      const matchDate = new Date(m.played_at).toLocaleDateString('sv-SE');
      return matchDate === todayStr;
    });
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
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        // Tiebreak by win rate (higher is better)
        const wrA = a.games > 0 ? a.wins / a.games : 0;
        const wrB = b.games > 0 ? b.wins / b.games : 0;
        return wrB - wrA;
      });
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
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        const wrA = a.games > 0 ? a.wins / a.games : 0;
        const wrB = b.games > 0 ? b.wins / b.games : 0;
        return wrB - wrA;
      });
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
    const matchCh = supabase.channel("match-changes").on("postgres_changes", { event: "*", schema: "public", table: "matches" }, loadMatches).subscribe();
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
    removePlayer, addPlayerToList,
    // Match persistence
    saveMatch, unsaveMatch, resetRanking,
    // Live sync
    syncState, handleRemoteUpdateRef,
    // Ranking computations
    todayMatches, todayRanking, todayDuoRanking, calculateDuoRanking,
    // Internal state setters (for orchestrator)
    setActiveLiveMatch,
  };
}
