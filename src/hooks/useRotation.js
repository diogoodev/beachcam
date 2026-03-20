import { useMemo, useCallback } from "react";
import { flushSync } from "react-dom";
import { useLocalState } from "./useLocalState";
import { pickNextFour, updateStats, sortBenchPlayers } from "../utils/gameLogic";

/**
 * useRotation — manages teams, bench, rotation, and substitution logic.
 * @param {Object} onSyncRef - ref containing callback(overrides) to notify the sync engine
 * @param {Function} resetScoringFn - function to reset scoring state on new game/rotation
 * @param {Array} players - current player list (from sync hook)
 * @param {number} bestOf - current bestOf value (from scoring hook)
 * @returns rotation state and actions
 */
export function useRotation(onSyncRef, resetScoringFn, players, bestOf) {
  const [screen, setScreen] = useLocalState("bc_screen", "session");
  const [teamA, setTeamA] = useLocalState("bc_teamA", []);
  const [teamB, setTeamB] = useLocalState("bc_teamB", []);
  const [bench, setBench] = useLocalState("bc_bench", []);
  const [gamesPlayed, setGamesPlayed] = useLocalState("bc_gamesPlayed", {});
  const [benchSince, setBenchSince] = useLocalState("bc_benchSince", {});

  const sortedBench = useMemo(() => {
    return sortBenchPlayers(bench, benchSince, gamesPlayed);
  }, [bench, benchSince, gamesPlayed]);

  const substitutePlayer = useCallback((playerOut, playerIn) => {
    if (!playerOut || !playerIn) return;

    const isInTeamA = teamA.includes(playerOut);
    const isInTeamB = teamB.includes(playerOut);
    if (!isInTeamA && !isInTeamB) return;

    const newTeamA = isInTeamA ? teamA.map(p => p === playerOut ? playerIn : p) : teamA;
    const newTeamB = isInTeamB ? teamB.map(p => p === playerOut ? playerIn : p) : teamB;
    const filteredBench = bench.filter(p => p !== playerIn);
    const newBench = [...filteredBench, playerOut];
    const newBS = { ...benchSince, [playerOut]: 0 };

    flushSync(() => {
      setTeamA(newTeamA);
      setTeamB(newTeamB);
      setBench(newBench);
      setBenchSince(newBS);
    });

    onSyncRef.current?.({ teamA: newTeamA, teamB: newTeamB, bench: newBench, benchSince: newBS });
  }, [teamA, teamB, bench, benchSince, onSyncRef, setTeamA, setTeamB, setBench, setBenchSince]);

  const removePlayerFromBench = useCallback((name) => {
    const newBench = bench.filter(p => p !== name);
    const newGP = { ...gamesPlayed };
    const newBS = { ...benchSince };
    delete newGP[name];
    delete newBS[name];

    flushSync(() => {
      setBench(newBench);
      setGamesPlayed(newGP);
      setBenchSince(newBS);
    });

    onSyncRef.current?.({
      bench: newBench,
      gamesPlayed: newGP,
      benchSince: newBS
    });
  }, [bench, gamesPlayed, benchSince, onSyncRef, setBench, setGamesPlayed, setBenchSince]);

  const reorderBench = useCallback((newOrder) => {
    const newBS = { ...benchSince };
    newOrder.forEach((p, i) => {
      newBS[p] = newOrder.length - i;
    });

    flushSync(() => {
      setBenchSince(newBS);
    });

    onSyncRef.current?.({ benchSince: newBS });
  }, [benchSince, onSyncRef, setBenchSince]);

  const promotePlayersToNext = useCallback((playerNames) => {
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
    flushSync(() => {
      setBenchSince(newBS);
    });
    onSyncRef.current?.({ benchSince: newBS });
  }, [benchSince, onSyncRef, setBenchSince]);

  const startGame = useCallback((tA, tB, b) => {
    const initGP = {}, initBS = {};
    players.forEach(p => { initGP[p] = 0; initBS[p] = 0; });
    [...tA, ...tB].forEach(p => { initGP[p] = 1; });
    setTeamA(tA); setTeamB(tB); setBench(b);
    setGamesPlayed(initGP); setBenchSince(initBS);
    resetScoringFn();
    setScreen("game");

    // Direct sync (bypasses the ref pattern for initial game start)
    return {
      screen: "game", teamA: tA, teamB: tB, bench: b,
      pointIdxA: 0, pointIdxB: 0, setsA: 0, setsB: 0, matchWinner: null,
      bestOf, gamesPlayed: initGP, benchSince: initBS,
      localTimestamp: Date.now()
    };
  }, [players, bestOf, resetScoringFn, setTeamA, setTeamB, setBench, setGamesPlayed, setBenchSince, setScreen]);

  const doRotation = useCallback((winner) => {
    const losers = winner === "A" ? [...teamB] : [...teamA];
    const winners = winner === "A" ? [...teamA] : [...teamB];
    const { nextTeamA, nextTeamB, nextBench } = pickNextFour(winners, losers, bench, gamesPlayed, benchSince);
    const { newGP, newBS } = updateStats(gamesPlayed, benchSince, nextTeamA, nextTeamB, nextBench);
    setTeamA(nextTeamA); setTeamB(nextTeamB); setBench(nextBench);
    setGamesPlayed(newGP); setBenchSince(newBS);
    resetScoringFn();
    setScreen("game");

    return {
      screen: "game", teamA: nextTeamA, teamB: nextTeamB, bench: nextBench,
      pointIdxA: 0, pointIdxB: 0, setsA: 0, setsB: 0, matchWinner: null,
      bestOf, gamesPlayed: newGP, benchSince: newBS,
      localTimestamp: Date.now()
    };
  }, [teamA, teamB, bench, gamesPlayed, benchSince, bestOf, resetScoringFn, setTeamA, setTeamB, setBench, setGamesPlayed, setBenchSince, setScreen]);

  const endSession = useCallback(() => {
    flushSync(() => {
      setScreen("session");
      setTeamA([]); setTeamB([]); setBench([]);
      setGamesPlayed({}); setBenchSince({});
    });
    resetScoringFn();
    onSyncRef.current?.({
      screen: "session",
      teamA: [], teamB: [], bench: [],
      gamesPlayed: {}, benchSince: {},
      pointIdxA: 0, pointIdxB: 0, setsA: 0, setsB: 0,
      matchWinner: null
    });
  }, [onSyncRef, resetScoringFn, setScreen, setTeamA, setTeamB, setBench, setGamesPlayed, setBenchSince]);

  // Setters exposed for applyRemoteState
  const _setters = useMemo(() => ({
    setScreen, setTeamA, setTeamB, setBench,
    setGamesPlayed, setBenchSince,
  }), [setScreen, setTeamA, setTeamB, setBench, setGamesPlayed, setBenchSince]);

  return {
    screen, setScreen,
    teamA, setTeamA, teamB, setTeamB, bench, setBench,
    gamesPlayed, benchSince, sortedBench,
    startGame, doRotation, endSession,
    substitutePlayer, removePlayerFromBench, reorderBench, promotePlayersToNext,
    _setters,
  };
}
