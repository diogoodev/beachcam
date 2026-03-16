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

  // ── Sub-hooks ──
  const sync = useSupabaseSync();
  const scoring = useMatchScoring(onSyncRef);
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
        screen: (rotation.teamA && rotation.teamA.length > 0) ? "game" : "setup",
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

  // ── Handle remote updates ──
  const applyRemoteState = useCallback((st) => {
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

    if (rotation.screen === "game") {
      applyRemoteState(st);
    }
  }, [applyRemoteState, sync.localTimestamp, rotation.screen, sync.setActiveLiveMatch]);

  // Keep the ref always pointing to the latest handleRemoteUpdate
  useEffect(() => {
    sync.handleRemoteUpdateRef.current = handleRemoteUpdate;
  });

  const joinLiveMatch = useCallback(() => {
    if (sync.activeLiveMatch) {
      applyRemoteState(sync.activeLiveMatch);
      rotation._setters.setScreen("game");
    }
  }, [sync.activeLiveMatch, applyRemoteState, rotation._setters]);

  // ── Auto-save match when winner is determined ──
  useEffect(() => {
    if (scoring.matchWinner && !scoring.matchSaved) {
      scoring._setters.setMatchSaved(true);
      sync.saveMatch(scoring.matchWinner, rotation.teamA, rotation.teamB, scoring.setsA, scoring.setsB);
    }
  }, [scoring.matchWinner, scoring.matchSaved, scoring.setsA, scoring.setsB, sync.saveMatch, scoring._setters, rotation.teamA, rotation.teamB]);

  // ── Add player mid-game (bridges sync + rotation) ──
  const addPlayerMidGame = async (name) => {
    const trimmed = name.trim();
    if (!trimmed || sync.players.includes(trimmed)) return;

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
  };

  // ── startGame wrapper (needs to sync directly) ──
  const startGame = (tA, tB, b) => {
    const st = rotation.startGame(tA, tB, b);
    sync.setActiveLiveMatch(st);
    liveMatchService.sync(st);
  };

  // ── doRotation wrapper ──
  const doRotation = (winner) => {
    const st = rotation.doRotation(winner);
    sync.setActiveLiveMatch(st);
    liveMatchService.sync(st);
  };

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
    calculateDuoRanking: sync.calculateDuoRanking,
    todayMatches: sync.todayMatches, todayRanking: sync.todayRanking,
    todayDuoRanking: sync.todayDuoRanking, sortedBench: rotation.sortedBench,
  };
}
