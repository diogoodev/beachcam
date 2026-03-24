import { useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { liveMatchService } from "../services/supabase";
import { useMatchScoring } from "./useMatchScoring";
import { useRotation } from "./useRotation";
import { useSupabaseSync } from "./useSupabaseSync";

/**
 * useBeachCam — thin orchestrator that composes the 3 sub-hooks
 * and returns the same public API as the original monolithic hook.
 */
export function useBeachCam() {
  // Ref-based sync callback — lets sub-hooks call sync without circular deps
  const onSyncRef = useRef(null);
  const onUnsaveRef = useRef(null);
  const savingRef = useRef(false);

  // ── Sub-hooks ──
  const sync = useSupabaseSync();
  const scoring = useMatchScoring(onSyncRef, onUnsaveRef);
  const rotation = useRotation(
    onSyncRef,
    () => scoring.resetMatch(false), // resetScoringFn (no sync — orchestrator handles it)
    sync.players,
    scoring.bestOf
  );

  // ── Wire the sync callback ──
  // This builds the full state and calls syncState on the sync hook
  useEffect(() => {
    onSyncRef.current = (overrides = {}) => {
      const st = {
        screen: (rotation.teamA && rotation.teamA.length > 0) ? "game" : "session",
        teamA: rotation.teamA, teamB: rotation.teamB, bench: rotation.bench,
        pointIdxA: scoring.pointIdxA, pointIdxB: scoring.pointIdxB,
        setsA: scoring.setsA, setsB: scoring.setsB,
        matchWinner: scoring.matchWinner, bestOf: scoring.bestOf,
        gamesPlayed: rotation.gamesPlayed, benchSince: rotation.benchSince,
        ...overrides
      };
      sync.syncState(st);
    };
  }, [rotation.teamA, rotation.teamB, rotation.bench, scoring.pointIdxA, scoring.pointIdxB, scoring.setsA, scoring.setsB, scoring.matchWinner, scoring.bestOf, rotation.gamesPlayed, rotation.benchSince, sync.syncState]);

  // Keep the unsave ref pointing to the latest unsaveMatch function
  useEffect(() => {
    onUnsaveRef.current = sync.unsaveMatch;
  }, [sync.unsaveMatch]);

  // ── Handle remote updates ──
  // A-3: Use flushSync to apply all remote state atomically — prevents flicker when
  // a full remote state arrives with 10+ fields (would otherwise cause N re-renders).
  const applyRemoteState = useCallback((st) => {
    flushSync(() => {
      if (st.screen) rotation._setters.setScreen(st.screen);
      if (st.teamA !== undefined) rotation._setters.setTeamA(st.teamA);
      if (st.teamB !== undefined) rotation._setters.setTeamB(st.teamB);
      if (st.bench !== undefined) rotation._setters.setBench(st.bench);
      if (st.pointIdxA !== undefined) scoring._setters.setPointIdxA(st.pointIdxA);
      if (st.pointIdxB !== undefined) scoring._setters.setPointIdxB(st.pointIdxB);
      if (st.setsA !== undefined) scoring._setters.setSetsA(st.setsA);
      if (st.setsB !== undefined) scoring._setters.setSetsB(st.setsB);
      if (st.bestOf !== undefined) scoring._setters.setBestOf(st.bestOf);
      if (st.matchWinner !== undefined) scoring._setters.setMatchWinner(st.matchWinner);
      if (st.gamesPlayed) rotation._setters.setGamesPlayed(st.gamesPlayed);
      if (st.benchSince) rotation._setters.setBenchSince(st.benchSince);
    });
  }, [rotation._setters, scoring._setters]);

  const handleRemoteUpdate = useCallback((st) => {
    if (!st) return;
    sync.setActiveLiveMatch(st);

    if (st.updated_at && sync.localTimestamp > 0) {
      const remoteTime = new Date(st.updated_at).getTime();
      if (sync.localTimestamp > remoteTime) {
        onSyncRef.current?.();
        return;
      }
    }

    // CM-4: apply remote state regardless of active screen so scoreboard stays in sync
    // when the user is browsing Ranking or Session tabs.
    applyRemoteState(st);
  }, [applyRemoteState, sync.localTimestamp, rotation.screen, sync.setActiveLiveMatch]);

  // Keep the ref always pointing to the latest handleRemoteUpdate
  useEffect(() => {
    sync.handleRemoteUpdateRef.current = handleRemoteUpdate;
  }, [handleRemoteUpdate]); // CR-2: add dep array — avoid stale ref on every render

  const joinLiveMatch = useCallback(() => {
    if (sync.activeLiveMatch) {
      applyRemoteState(sync.activeLiveMatch);
      rotation._setters.setScreen("game");
    }
  }, [sync.activeLiveMatch, applyRemoteState, rotation._setters]);

  // ── Auto-save match when winner is determined ──
  // A-7: savingRef is set BEFORE setMatchSaved to close the race window where cancelMatch
  // could arrive between the useState read and the async save starting.
  useEffect(() => {
    if (scoring.matchWinner && !scoring.matchSaved && !savingRef.current) {
      savingRef.current = true;  // Guard FIRST — before any async
      scoring._setters.setMatchSaved(true);
      sync.saveMatch(scoring.matchWinner, rotation.teamA, rotation.teamB, scoring.setsA, scoring.setsB)
        .finally(() => { savingRef.current = false; });
    }
  }, [scoring.matchWinner, scoring.matchSaved, scoring.setsA, scoring.setsB, sync.saveMatch, scoring._setters, rotation.teamA, rotation.teamB]);

  // ── Add player mid-game (bridges sync + rotation) ──
  const addPlayerMidGame = useCallback(async (name) => {
    const trimmed = name.trim().toUpperCase();
    // CR-1: normalize case when checking for duplicates — sync.players may be mixed case
    if (!trimmed || sync.players.some(p => p.toUpperCase() === trimmed)) return;

    const success = await sync.addPlayerToList(trimmed);
    if (!success) return;

    const newBench = [...rotation.bench, trimmed];
    const newGP = { ...rotation.gamesPlayed, [trimmed]: 0 };
    const newBS = { ...rotation.benchSince, [trimmed]: 1 };

    flushSync(() => {
      rotation._setters.setGamesPlayed(newGP);
      rotation._setters.setBenchSince(newBS);
      rotation._setters.setBench(newBench);
    });

    onSyncRef.current?.({
      bench: newBench,
      gamesPlayed: newGP,
      benchSince: newBS
    });
  }, [sync.players, sync.addPlayerToList, rotation.bench, rotation.gamesPlayed, rotation.benchSince, rotation._setters, onSyncRef]);

  // ── startGame wrapper (needs to sync directly) ──
  const startGame = useCallback((tA, tB, b) => {
    const st = rotation.startGame(tA, tB, b);
    sync.setActiveLiveMatch(st);
    liveMatchService.sync(st).catch(err => console.error("Failed to sync live match on start", err));
  }, [rotation.startGame, sync.setActiveLiveMatch]);

  // ── doRotation wrapper ──
  const doRotation = useCallback((winner) => {
    const st = rotation.doRotation(winner);
    sync.setActiveLiveMatch(st);
    liveMatchService.sync(st).catch(err => console.error("Failed to sync live match on rotation", err));
  }, [rotation.doRotation, sync.setActiveLiveMatch]);

  const cancelMatch = useCallback(() => {
    // Dissolve local match state
    scoring.resetMatch(true);
    
    const onCourt = [...rotation.teamA, ...rotation.teamB];
    // UX-11: On-court players go to END of queue (they just played, bench waited)
    const newBench = [...rotation.bench, ...onCourt];

    // Revert gamesPlayed for on-court players (undo the increment from startGame)
    const newGP = { ...rotation.gamesPlayed };
    const newBS = { ...rotation.benchSince };
    for (const p of onCourt) {
      if (newGP[p] > 0) newGP[p] -= 1;
      // Put them behind existing bench waiters
      newBS[p] = 0;
    }

    flushSync(() => {
      rotation._setters.setTeamA([]);
      rotation._setters.setTeamB([]);
      rotation._setters.setBench(newBench);
      rotation._setters.setGamesPlayed(newGP);
      rotation._setters.setBenchSince(newBS);
      rotation._setters.setScreen("session");
    });
    
    const overrides = {
      teamA: [], teamB: [], bench: newBench, screen: "session",
      gamesPlayed: newGP, benchSince: newBS,
    };
    onSyncRef.current?.(overrides);
  }, [rotation.teamA, rotation.teamB, rotation.bench, rotation.gamesPlayed, rotation.benchSince, scoring, rotation._setters, onSyncRef]);

  // ── Return the same public API as the original hook ──
  return {
    screen: rotation.screen, setScreen: rotation._setters.setScreen,
    players: sync.players, addPlayer: sync.addPlayerToList, removePlayer: sync.removePlayer, addPlayerMidGame,
    teamA: rotation.teamA, setTeamA: rotation._setters.setTeamA,
    teamB: rotation.teamB, setTeamB: rotation._setters.setTeamB,
    bench: rotation.bench, setBench: rotation._setters.setBench,
    pointIdxA: scoring.pointIdxA, pointIdxB: scoring.pointIdxB,
    setsA: scoring.setsA, setsB: scoring.setsB,
    addPoint: scoring.addPoint, removePoint: scoring.removePoint, undoLastPoint: scoring.undoLastPoint,
    bestOf: scoring.bestOf, setBestOf: scoring._setters.setBestOf, setsToWin: scoring.setsToWin,
    matchWinner: scoring.matchWinner, setMatchWinner: scoring._setters.setMatchWinner,
    rankingRows: sync.rankingRows, matchHistory: sync.matchHistory, resetRanking: sync.resetRanking,
    gamesPlayed: rotation.gamesPlayed, benchSince: rotation.benchSince,
    flash: scoring.flash, gameLog: scoring.gameLog, matchSetHistory: scoring.matchSetHistory,
    syncStatus: sync.syncStatus,
    activeLiveMatch: sync.activeLiveMatch, joinLiveMatch,
    startGame, doRotation, resetMatch: scoring.resetMatch, triggerFlash: scoring.triggerFlash,
    endSession: rotation.endSession,
    promotePlayersToNext: rotation.promotePlayersToNext,
    removePlayerFromBench: rotation.removePlayerFromBench,
    reorderBench: rotation.reorderBench,
    revertSet: scoring.revertSet, substitutePlayer: rotation.substitutePlayer,
    cancelMatch,
    calculateDuoRanking: sync.calculateDuoRanking,
    todayMatches: sync.todayMatches, todayRanking: sync.todayRanking,
    todayDuoRanking: sync.todayDuoRanking, sortedBench: rotation.sortedBench,
  };
}
