import { useState, useCallback, useRef } from "react";
import { useLocalState } from "./useLocalState";
import { POINT_SEQUENCE, POINT_LABELS } from "../utils/constants";
import { formatTime } from "../utils/gameLogic";

/**
 * useMatchScoring — manages point tracking, set tracking, match winner detection.
 * @param {Function} onSyncRef - ref containing callback(overrides) to notify the sync engine
 * @returns match scoring state and actions
 */
export function useMatchScoring(onSyncRef) {
  const [pointIdxA, setPointIdxA] = useLocalState("bc_pointIdxA", 0);
  const [pointIdxB, setPointIdxB] = useLocalState("bc_pointIdxB", 0);
  const [setsA, setSetsA] = useLocalState("bc_setsA", 0);
  const [setsB, setSetsB] = useLocalState("bc_setsB", 0);
  const [bestOf, setBestOf] = useLocalState("bc_bestOf", 3);
  const [matchWinner, setMatchWinner] = useLocalState("bc_matchWinner", null);
  const [matchSaved, setMatchSaved] = useLocalState("bc_matchSaved", false);
  const [gameLog, setGameLog] = useLocalState("bc_gameLog", []);
  const [matchSetHistory, setMatchSetHistory] = useLocalState("bc_setHistory", []);
  const [flash, setFlash] = useState(null);

  const setsToWin = Math.ceil(bestOf / 2);

  const flashTimerRef = useRef(null);
  const triggerFlash = (val) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlash(val);
    flashTimerRef.current = setTimeout(() => {
      setFlash(null);
      flashTimerRef.current = null;
    }, 700);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
  };

  const lastPointTime = useRef(0);

  const addPoint = useCallback((team) => {
    if (matchWinner) return;
    const now = Date.now();
    if (now - lastPointTime.current < 400) return;
    lastPointTime.current = now;

    triggerFlash(team);
    const nextIdxA = team === "A" ? pointIdxA + 1 : pointIdxA;
    const nextIdxB = team === "B" ? pointIdxB + 1 : pointIdxB;
    const pA = POINT_SEQUENCE[nextIdxA], pB = POINT_SEQUENCE[nextIdxB];

    if (pA === "SET" || pB === "SET") {
      const sw = pA === "SET" ? "A" : "B";
      const newSA = sw === "A" ? setsA + 1 : setsA;
      const newSB = sw === "B" ? setsB + 1 : setsB;
      setMatchSetHistory(prev => [...prev, {
        setNum: prev.length + 1, winner: sw,
        labelA: pA === "SET" ? "SET" : POINT_LABELS[POINT_SEQUENCE[pointIdxA]],
        labelB: pB === "SET" ? "SET" : POINT_LABELS[POINT_SEQUENCE[pointIdxB]],
        pointIdxA: pointIdxA,
        pointIdxB: pointIdxB
      }]);
      setSetsA(newSA); setSetsB(newSB); setPointIdxA(0); setPointIdxB(0);
      setGameLog(prev => [{ time: formatTime(), team: sw, type: "set" }, ...prev].slice(0, 50));

      const currentSetsToWin = Math.ceil(bestOf / 2);
      let mw = null;
      if (newSA >= currentSetsToWin || newSB >= currentSetsToWin) {
        mw = newSA >= currentSetsToWin ? "A" : "B";
        setMatchWinner(mw);
      }
      onSyncRef.current?.({ pointIdxA: 0, pointIdxB: 0, setsA: newSA, setsB: newSB, matchWinner: mw });
    } else {
      setPointIdxA(nextIdxA); setPointIdxB(nextIdxB);
      setGameLog(prev => [{ time: formatTime(), team, type: "point" }, ...prev].slice(0, 50));
      onSyncRef.current?.({ pointIdxA: nextIdxA, pointIdxB: nextIdxB });
    }
  }, [matchWinner, pointIdxA, pointIdxB, setsA, setsB, bestOf, onSyncRef, setPointIdxA, setPointIdxB, setSetsA, setSetsB, setMatchWinner, setMatchSetHistory, setGameLog]);

  const removePoint = useCallback((team) => {
    if (matchWinner) return;
    let nA = pointIdxA, nB = pointIdxB;
    if (team === "A" && pointIdxA > 0) { nA = pointIdxA - 1; setPointIdxA(nA); }
    if (team === "B" && pointIdxB > 0) { nB = pointIdxB - 1; setPointIdxB(nB); }
    if (nA === pointIdxA && nB === pointIdxB) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
    onSyncRef.current?.({ pointIdxA: nA, pointIdxB: nB });
  }, [matchWinner, pointIdxA, pointIdxB, onSyncRef, setPointIdxA, setPointIdxB]);

  const revertSet = useCallback(() => {
    if (setsA + setsB === 0 || matchWinner !== null) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);

    const lastSet = matchSetHistory[matchSetHistory.length - 1];
    if (!lastSet) return;

    const newSA = lastSet.winner === "A" ? setsA - 1 : setsA;
    const newSB = lastSet.winner === "B" ? setsB - 1 : setsB;
    const newHistory = matchSetHistory.slice(0, -1);
    const restoredIdxA = lastSet.pointIdxA ?? 0;
    const restoredIdxB = lastSet.pointIdxB ?? 0;

    setSetsA(newSA); setSetsB(newSB);
    setPointIdxA(restoredIdxA); setPointIdxB(restoredIdxB);
    setMatchSetHistory(newHistory);
    setGameLog(prev => [{ time: formatTime(), team: "system", type: "revert_set" }, ...prev].slice(0, 50));

    onSyncRef.current?.({ setsA: newSA, setsB: newSB, pointIdxA: restoredIdxA, pointIdxB: restoredIdxB });
  }, [setsA, setsB, matchWinner, matchSetHistory, onSyncRef, setSetsA, setSetsB, setPointIdxA, setPointIdxB, setMatchSetHistory, setGameLog]);

  const resetMatch = useCallback((sync = true) => {
    setPointIdxA(0); setPointIdxB(0); setSetsA(0); setSetsB(0);
    setMatchWinner(null); setMatchSetHistory([]); setGameLog([]); setMatchSaved(false);
    if (sync) {
      onSyncRef.current?.({ pointIdxA: 0, pointIdxB: 0, setsA: 0, setsB: 0, matchWinner: null });
    }
  }, [onSyncRef, setPointIdxA, setPointIdxB, setSetsA, setSetsB, setMatchWinner, setMatchSetHistory, setGameLog, setMatchSaved]);

  const undoLastPoint = useCallback(() => {
    if (!gameLog || gameLog.length === 0) return;
    // gameLog is newest-first. Find first "point" entry.
    const idx = gameLog.findIndex(event => event.type === 'point');
    if (idx === -1) return;
    
    const lastEvent = gameLog[idx];
    
    // Remove the log entry FIRST to prevent duplicate undo
    setGameLog(prev => prev.filter((_, i) => i !== idx));
    
    if (lastEvent.team === "A") {
      removePoint("A");
    } else if (lastEvent.team === "B") {
      removePoint("B");
    }
  }, [gameLog, removePoint, setGameLog]);

  // Setters exposed for applyRemoteState and orchestrator
  const setters = {
    setPointIdxA, setPointIdxB, setSetsA, setSetsB,
    setBestOf, setMatchWinner, setMatchSaved,
    setMatchSetHistory, setGameLog,
  };

  return {
    // State
    pointIdxA, pointIdxB, setsA, setsB,
    bestOf, setBestOf, setsToWin,
    matchWinner, setMatchWinner,
    matchSaved, setMatchSaved,
    flash, gameLog, matchSetHistory,
    // Actions
    addPoint, removePoint, revertSet, resetMatch, triggerFlash, undoLastPoint,
    // Internal setters (for orchestrator)
    _setters: setters,
  };
}
