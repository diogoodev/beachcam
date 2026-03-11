import { useState } from "react";

const INITIAL_PLAYERS = ["Diogo", "Jenifer", "Sabrina", "Vida", "Neto", "Renata", "João"];
const POINT_SEQUENCE = [0, 15, 30, 40, "SET"];
const POINT_LABELS = { 0: "0", 15: "15", 30: "30", 40: "40" };

const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
};

// ─── Smart rotation logic ───────────────────────────────────────────────────
//
// Each player has:
//   gamesPlayed  — total games participated
//   benchSince   — how many games they've been waiting (incremented each rotation)
//
// Priority to enter next game:
//   1. Sort bench by benchSince DESC (who waited longest)
//   2. Tie-break: sort by gamesPlayed ASC (who played least overall)
//
// Winners stay on court only if their individual benchSince would exceed
// benchSize (number of people currently on bench). If bench has 3 people,
// winners can stay at most 1 more game before someone from bench has priority.
//
// After each game:
//   - Losers go to bench (benchSince = 0, gamesPlayed++)
//   - Winners: benchSince++ (they "age" while on court)
//   - Bench players who DON'T enter: benchSince++
//   - Players who enter: benchSince = 0, gamesPlayed++

function pickNextFour(onCourt, bench, gamesPlayed, benchSince) {
  // onCourt = [winner1, winner2, loser1, loser2]
  const [w1, w2, l1, l2] = onCourt;
  const winners = [w1, w2];
  const losers = [l1, l2];

  // Sort bench by priority: most bench time first, then least games played
  const sortedBench = [...bench].sort((a, b) => {
    const bsDiff = (benchSince[b] ?? 0) - (benchSince[a] ?? 0);
    if (bsDiff !== 0) return bsDiff;
    return (gamesPlayed[a] ?? 0) - (gamesPlayed[b] ?? 0);
  });

  const benchSize = bench.length;

  // Can winners stay? They can stay if their benchSince < benchSize
  // (meaning not everyone on bench has been waiting longer than them)
  const winnersCanStay = benchSize < 2 || (benchSince[w1] ?? 0) < benchSize && (benchSince[w2] ?? 0) < benchSize;

  let nextTeamA, nextTeamB, nextBench;

  if (winnersCanStay && benchSize >= 2) {
    // Winners stay as Team A, top 2 from bench form Team B
    nextTeamA = winners;
    nextTeamB = sortedBench.slice(0, 2);
    nextBench = [...sortedBench.slice(2), ...losers];
  } else if (winnersCanStay && benchSize === 1) {
    // Only 1 bench player: bench + 1 loser form Team B
    nextTeamA = winners;
    nextTeamB = [sortedBench[0], losers[0]];
    nextBench = [losers[1]];
  } else if (winnersCanStay && benchSize === 0) {
    // No bench: rematch (losers come back)
    nextTeamA = winners;
    nextTeamB = losers;
    nextBench = [];
  } else {
    // Winners must sit — top 2 from bench + 1 winner form teams
    // Pick the winner who waited "more" (higher benchSince) to re-enter first
    const winnersSorted = [...winners].sort((a, b) => (benchSince[b] ?? 0) - (benchSince[a] ?? 0));
    const entering = [sortedBench[0], winnersSorted[0]]; // 1 from bench + 1 winner
    const entering2 = [sortedBench[1] ?? winnersSorted[1], losers[0]];
    nextTeamA = entering;
    nextTeamB = [sortedBench[1] ?? losers[0], losers[1] ?? winnersSorted[1]];
    nextBench = [
      ...sortedBench.slice(2),
      ...losers.filter(p => !nextTeamA.includes(p) && !nextTeamB.includes(p)),
      ...winners.filter(p => !nextTeamA.includes(p) && !nextTeamB.includes(p)),
    ];
    // Simpler fallback: if bench >= 2, put both winners on bench
    if (benchSize >= 2) {
      nextTeamA = sortedBench.slice(0, 2);
      nextTeamB = [...losers];
      nextBench = [...sortedBench.slice(2), ...winners];
    }
  }

  // Deduplicate bench (safety)
  const playing = new Set([...nextTeamA, ...nextTeamB]);
  nextBench = nextBench.filter(p => !playing.has(p));
  // remove duplicates
  nextBench = [...new Set(nextBench)];

  return { nextTeamA, nextTeamB, nextBench };
}

function updateStats(gamesPlayed, benchSince, teamA, teamB, bench, nextTeamA, nextTeamB, nextBench) {
  const newGP = { ...gamesPlayed };
  const newBS = { ...benchSince };

  const playing = new Set([...teamA, ...teamB]);
  const nextPlaying = new Set([...nextTeamA, ...nextTeamB]);

  // Everyone who plays next game: reset benchSince, increment gamesPlayed
  for (const p of nextPlaying) {
    newGP[p] = (newGP[p] ?? 0) + 1;
    newBS[p] = 0;
  }

  // Everyone going to bench: increment benchSince
  for (const p of nextBench) {
    newBS[p] = (newBS[p] ?? 0) + 1;
  }

  return { newGP, newBS };
}

function SetDots({ won, total }) {
  const dots = Math.max(total, 1);
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
      {Array.from({ length: dots }).map((_, i) => (
        <div key={i} style={{
          width: 12, height: 12, borderRadius: "50%",
          background: i < won ? "#22c55e" : "#ef4444",
          border: i < won ? "1.5px solid #16a34a" : "1.5px solid #b91c1c",
          boxShadow: i < won ? "0 0 6px #22c55e88" : "0 0 4px #ef444444",
          transition: "all 0.3s",
        }} />
      ))}
    </div>
  );
}

export default function BeachCam() {
  const [screen, setScreen] = useState("setup");
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [newPlayer, setNewPlayer] = useState("");
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [bench, setBench] = useState([]);
  const [setupStep, setSetupStep] = useState(0);
  const [selectingFor, setSelectingFor] = useState(null);

  // Stats per player: how many games played and how long on bench
  const [gamesPlayed, setGamesPlayed] = useState({});
  const [benchSince, setBenchSince] = useState({});

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

  const setsToWin = Math.ceil(bestOf / 2);

  const triggerFlash = (team) => {
    setFlash(team);
    setTimeout(() => setFlash(null), 700);
  };

  const resetPoints = () => { setPointIdxA(0); setPointIdxB(0); };

  const addPoint = (team) => {
    if (matchWinner) return;
    triggerFlash(team);
    const idxA = pointIdxA, idxB = pointIdxB;
    const nextIdxA = team === "A" ? idxA + 1 : idxA;
    const nextIdxB = team === "B" ? idxB + 1 : idxB;
    const pointA = POINT_SEQUENCE[nextIdxA];
    const pointB = POINT_SEQUENCE[nextIdxB];

    if (pointA === "SET" || pointB === "SET") {
      const setWinner = pointA === "SET" ? "A" : "B";
      const newSetsA = setWinner === "A" ? setsA + 1 : setsA;
      const newSetsB = setWinner === "B" ? setsB + 1 : setsB;
      setSetHistory(prev => [...prev, {
        setNum: prev.length + 1, winner: setWinner,
        labelA: pointA === "SET" ? "SET" : POINT_LABELS[POINT_SEQUENCE[idxA]],
        labelB: pointB === "SET" ? "SET" : POINT_LABELS[POINT_SEQUENCE[idxB]],
      }]);
      setSetsA(newSetsA); setSetsB(newSetsB); resetPoints();
      setGameLog(prev => [{ time: formatTime(), team: setWinner, type: "set" }, ...prev].slice(0, 50));
      if (newSetsA >= setsToWin || newSetsB >= setsToWin) {
        setMatchWinner(newSetsA >= setsToWin ? "A" : "B");
      }
    } else {
      setPointIdxA(nextIdxA); setPointIdxB(nextIdxB);
      setGameLog(prev => [{ time: formatTime(), team, type: "point" }, ...prev].slice(0, 50));
    }
  };

  const removePoint = (team) => {
    if (matchWinner) return;
    if (team === "A" && pointIdxA > 0) setPointIdxA(i => i - 1);
    if (team === "B" && pointIdxB > 0) setPointIdxB(i => i - 1);
  };

  const saveReplay = () => {
    setReplays(prev => [{
      id: prev.length + 1, time: formatTime(),
      teamA: [...teamA], teamB: [...teamB],
      pointA: POINT_LABELS[POINT_SEQUENCE[pointIdxA]] ?? "0",
      pointB: POINT_LABELS[POINT_SEQUENCE[pointIdxB]] ?? "0",
      setsA, setsB,
    }, ...prev]);
    triggerFlash("replay");
  };

  const resetMatch = () => {
    resetPoints(); setSetsA(0); setSetsB(0);
    setMatchWinner(null); setSetHistory([]); setGameLog([]);
  };

  const startSetup = () => {
    setSetupStep(1); setTeamA([]); setTeamB([]); setBench([...players]);
  };

  const pickPlayer = (name) => {
    if (!selectingFor) return;
    if (selectingFor === "A" && teamA.length < 2) {
      const next = [...teamA, name];
      setTeamA(next); setBench(b => b.filter(p => p !== name));
      if (next.length === 2) setSelectingFor("B");
    } else if (selectingFor === "B" && teamB.length < 2) {
      const next = [...teamB, name];
      setTeamB(next); setBench(b => b.filter(p => p !== name));
      if (next.length === 2) setSelectingFor(null);
    }
  };

  const removeFromTeam = (team, name) => {
    if (team === "A") { setTeamA(t => t.filter(p => p !== name)); setBench(b => [...b, name]); }
    else { setTeamB(t => t.filter(p => p !== name)); setBench(b => [...b, name]); }
  };

  const startGame = () => {
    if (teamA.length === 2 && teamB.length === 2) {
      // Init stats for everyone
      const initGP = {}, initBS = {};
      players.forEach(p => { initGP[p] = 0; initBS[p] = 0; });
      [...teamA, ...teamB].forEach(p => { initGP[p] = 1; initBS[p] = 0; });
      setGamesPlayed(initGP); setBenchSince(initBS);
      resetMatch(); setScreen("game");
    }
  };

  const doRotation = (winner) => {
    const losers = winner === "A" ? [...teamB] : [...teamA];
    const winners = winner === "A" ? [...teamA] : [...teamB];

    const { nextTeamA, nextTeamB, nextBench } = pickNextFour(
      [...winners, ...losers], bench, gamesPlayed, benchSince
    );

    const { newGP, newBS } = updateStats(
      gamesPlayed, benchSince, teamA, teamB, bench, nextTeamA, nextTeamB, nextBench
    );

    // Log the rotation
    const entry = {
      time: formatTime(),
      teamA: nextTeamA,
      teamB: nextTeamB,
      bench: nextBench,
    };
    setRotationLog(prev => [entry, ...prev].slice(0, 20));

    setTeamA(nextTeamA); setTeamB(nextTeamB); setBench(nextBench);
    setGamesPlayed(newGP); setBenchSince(newBS);
    resetMatch(); setScreen("game");
  };

  const addPlayer = () => {
    const name = newPlayer.trim();
    if (name && !players.includes(name)) {
      setPlayers(p => [...p, name]);
      if (setupStep === 1) setBench(b => [...b, name]);
      setNewPlayer("");
    }
  };

  const currentLabelA = POINT_LABELS[POINT_SEQUENCE[pointIdxA]] ?? "0";
  const currentLabelB = POINT_LABELS[POINT_SEQUENCE[pointIdxB]] ?? "0";
  const totalSetsPlayed = Math.max(setsA + setsB, setsToWin);

  // Sort bench for display: most waiting first
  const sortedBenchDisplay = [...bench].sort((a, b) => {
    const bsDiff = (benchSince[b] ?? 0) - (benchSince[a] ?? 0);
    if (bsDiff !== 0) return bsDiff;
    return (gamesPlayed[a] ?? 0) - (gamesPlayed[b] ?? 0);
  });

  return (
    <div style={S.root}>
      <div style={S.app}>
        {/* HEADER */}
        <div style={S.header}>
          <span style={S.logo}>🏖 BeachCam</span>
          <div style={S.navBtns}>
            {screen === "game" && (
              <>
                <button style={S.navBtn} onClick={() => setScreen("replays")}>🎬 {replays.length}</button>
                <button style={S.navBtn} onClick={() => setScreen("rotation")}>🔄</button>
                <button style={S.navBtn} onClick={() => setScreen("setup")}>⚙️</button>
              </>
            )}
            {(screen === "replays" || screen === "rotation") && (
              <button style={S.navBtn} onClick={() => setScreen("game")}>← Quadra</button>
            )}
          </div>
        </div>

        {/* ===== SETUP 0 ===== */}
        {screen === "setup" && setupStep === 0 && (
          <div style={S.screen}>
            <h2 style={S.title}>Jogadores da Partida</h2>
            <div style={S.settingBox}>
              <span style={S.settingLabel}>🏆 Formato</span>
              <div style={S.settingControls}>
                {[3, 5, 7].map(n => (
                  <button key={n}
                    style={{ ...S.settingBtn, background: bestOf === n ? "#1d4ed8" : "#122236", color: bestOf === n ? "#fff" : "#64748b" }}
                    onClick={() => setBestOf(n)}>Melhor de {n}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 12, color: "#475569" }}>Personalizado:</span>
                <input style={{ ...S.input, width: 64, padding: "6px 10px", textAlign: "center" }}
                  type="number" min={1} max={99} value={bestOf}
                  onChange={e => setBestOf(Math.max(1, parseInt(e.target.value) || 1))} />
                <span style={{ fontSize: 12, color: "#475569" }}>sets</span>
              </div>
              <div style={S.settingHint}>🎯 Ganha quem vencer {setsToWin} set{setsToWin > 1 ? "s" : ""} primeiro</div>
            </div>
            <div style={S.playerList}>
              {players.map(p => (
                <div key={p} style={S.playerChip}>
                  <span style={S.avatar}>{p[0]}</span>
                  <span style={S.playerName}>{p}</span>
                  <button style={S.removeBtn} onClick={() => setPlayers(pl => pl.filter(x => x !== p))}>✕</button>
                </div>
              ))}
            </div>
            <div style={S.addRow}>
              <input style={S.input} placeholder="Nome do jogador..." value={newPlayer}
                onChange={e => setNewPlayer(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addPlayer()} />
              <button style={S.addBtn} onClick={addPlayer}>+</button>
            </div>
            <button style={{ ...S.bigBtn, opacity: players.length >= 4 ? 1 : 0.4 }}
              disabled={players.length < 4} onClick={startSetup}>
              Montar Duplas →
            </button>
          </div>
        )}

        {/* ===== SETUP 1 ===== */}
        {screen === "setup" && setupStep === 1 && (
          <div style={S.screen}>
            <h2 style={S.title}>Montar Duplas</h2>
            <div style={S.teamsRow}>
              <div style={{ ...S.teamBox, borderColor: selectingFor === "A" ? "#f59e0b" : "#1e3a5f" }}
                onClick={() => setSelectingFor("A")}>
                <div style={S.teamLabel}>Dupla A</div>
                {teamA.map(p => (
                  <div key={p} style={S.teamPlayer}>
                    <span style={S.avatarSm}>{p[0]}</span>{p}
                    <button style={S.removeBtn} onClick={e => { e.stopPropagation(); removeFromTeam("A", p); }}>✕</button>
                  </div>
                ))}
                {teamA.length < 2 && <div style={S.emptySlot}>{selectingFor === "A" ? "← selecione" : "vazio"}</div>}
              </div>
              <div style={S.vsSmall}>vs</div>
              <div style={{ ...S.teamBox, borderColor: selectingFor === "B" ? "#10b981" : "#1e3a5f" }}
                onClick={() => setSelectingFor("B")}>
                <div style={S.teamLabel}>Dupla B</div>
                {teamB.map(p => (
                  <div key={p} style={S.teamPlayer}>
                    <span style={S.avatarSm}>{p[0]}</span>{p}
                    <button style={S.removeBtn} onClick={e => { e.stopPropagation(); removeFromTeam("B", p); }}>✕</button>
                  </div>
                ))}
                {teamB.length < 2 && <div style={S.emptySlot}>{selectingFor === "B" ? "← selecione" : "vazio"}</div>}
              </div>
            </div>
            {bench.length > 0 && (
              <div style={S.benchSection}>
                <div style={S.benchLabel}>Disponíveis — toque para escalar</div>
                <div style={S.benchRow}>
                  {bench.map(p => (
                    <button key={p} style={{ ...S.benchChip, opacity: selectingFor ? 1 : 0.5 }} onClick={() => pickPlayer(p)}>
                      <span style={S.avatarSm}>{p[0]}</span>{p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={S.addRow}>
              <input style={S.input} placeholder="Adicionar jogador..." value={newPlayer}
                onChange={e => setNewPlayer(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addPlayer()} />
              <button style={S.addBtn} onClick={addPlayer}>+</button>
            </div>
            <div style={S.rowBtns}>
              <button style={S.ghostBtn} onClick={() => { setSetupStep(0); setTeamA([]); setTeamB([]); setBench([]); }}>← Voltar</button>
              <button style={{ ...S.bigBtn, flex: 1, opacity: teamA.length === 2 && teamB.length === 2 ? 1 : 0.4 }}
                disabled={teamA.length < 2 || teamB.length < 2} onClick={startGame}>
                🏁 Iniciar Jogo
              </button>
            </div>
          </div>
        )}

        {/* ===== GAME ===== */}
        {screen === "game" && (
          <div style={S.screen}>
            {matchWinner && (
              <div style={S.winnerBanner}>
                <div style={{ fontSize: 34 }}>🏆</div>
                <div style={{ fontWeight: 800, fontSize: 15, textAlign: "center" }}>
                  {(matchWinner === "A" ? teamA : teamB).join(" / ")} venceu!
                </div>
                <div style={{ fontWeight: 900, fontSize: 26, color: "#fbbf24" }}>{setsA} × {setsB}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button style={S.winnerBtn} onClick={resetMatch}>Nova Partida</button>
                  <button style={S.winnerBtn} onClick={() => doRotation(matchWinner)}>🔄 Rotacionar</button>
                </div>
              </div>
            )}

            <div style={S.cameraBox}>
              <div style={S.cameraLabel}>📷 CÂMERA AO VIVO</div>
              <div style={S.cameraFake}>
                <div style={S.recDot} /><span style={S.recText}>● REC</span>
              </div>
            </div>

            {/* Sets */}
            <div style={S.setsRow}>
              <div style={S.setsTeamBlock}>
                <span style={S.setsTeamName}>{teamA.join(" / ")}</span>
                <SetDots won={setsA} total={totalSetsPlayed} />
                <span style={S.setsCount}>{setsA} set{setsA !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 6px", gap: 2 }}>
                <span style={{ fontSize: 9, color: "#334155", fontWeight: 700 }}>Melhor de {bestOf}</span>
                <span style={{ color: "#1e3a5f", fontWeight: 900, fontSize: 10, letterSpacing: 1 }}>SETS</span>
                <span style={{ fontSize: 9, color: "#334155" }}>ganhar {setsToWin}</span>
              </div>
              <div style={S.setsTeamBlock}>
                <span style={S.setsTeamName}>{teamB.join(" / ")}</span>
                <SetDots won={setsB} total={totalSetsPlayed} />
                <span style={S.setsCount}>{setsB} set{setsB !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Score */}
            <div style={S.scoreSection}>
              <div style={{ ...S.scoreTeam, background: flash === "A" ? "rgba(245,158,11,0.15)" : "transparent" }}>
                <div style={S.teamNameScore}>
                  {teamA.map(p => <span key={p} style={S.playerPillA}>{p}</span>)}
                </div>
                <div style={{ ...S.scoreNum, color: "#f59e0b" }}>{currentLabelA}</div>
                <div style={S.scoreControls}>
                  <button style={{ ...S.ptBtn, background: "#f59e0b22", color: "#f59e0b" }} onClick={() => addPoint("A")}>+1</button>
                  <button style={{ ...S.ptBtn, background: "#1e293b", color: "#475569" }} onClick={() => removePoint("A")}>−</button>
                </div>
              </div>
              <div style={{ color: "#1e3a5f", fontWeight: 900, fontSize: 24, padding: "0 2px" }}>×</div>
              <div style={{ ...S.scoreTeam, background: flash === "B" ? "rgba(16,185,129,0.15)" : "transparent" }}>
                <div style={S.teamNameScore}>
                  {teamB.map(p => <span key={p} style={S.playerPillB}>{p}</span>)}
                </div>
                <div style={{ ...S.scoreNum, color: "#10b981" }}>{currentLabelB}</div>
                <div style={S.scoreControls}>
                  <button style={{ ...S.ptBtn, background: "#10b98122", color: "#10b981" }} onClick={() => addPoint("B")}>+1</button>
                  <button style={{ ...S.ptBtn, background: "#1e293b", color: "#475569" }} onClick={() => removePoint("B")}>−</button>
                </div>
              </div>
            </div>

            {/* Point progress */}
            <div style={S.progressRow}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f59e0b", opacity: pointIdxA > i ? 1 : 0.18, transition: "opacity 0.3s" }} />
                  <span style={{ fontSize: 9, color: "#334155", fontWeight: 700 }}>{POINT_LABELS[POINT_SEQUENCE[i]]}</span>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#10b981", opacity: pointIdxB > i ? 1 : 0.18, transition: "opacity 0.3s" }} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f59e0b", opacity: 0.1 }} />
                <span style={{ fontSize: 9, color: "#7c3aed", fontWeight: 800 }}>SET</span>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#10b981", opacity: 0.1 }} />
              </div>
            </div>

            {/* Bench with queue info */}
            {sortedBenchDisplay.length > 0 && (
              <div style={S.benchBar}>
                <span style={S.benchBarLabel}>⏳ Fila:</span>
                {sortedBenchDisplay.map((p, idx) => (
                  <span key={p} style={S.benchPill}>
                    <span style={{ ...S.avatarXs, background: idx === 0 ? "linear-gradient(135deg,#d97706,#b45309)" : "linear-gradient(135deg,#1d4ed8,#7c3aed)" }}>{p[0]}</span>
                    {p}
                    <span style={{ fontSize: 9, color: "#475569", marginLeft: 3 }}>
                      {benchSince[p] > 0 ? `${benchSince[p]}g` : ""}
                    </span>
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...S.replayBtn, background: flash === "replay" ? "#7c3aed" : "#312e81" }} onClick={saveReplay}>
                🎬 Salvar Replay
              </button>
            </div>

            {setHistory.length > 0 && (
              <div style={S.setHistoryBox}>
                <div style={S.setHistoryTitle}>Histórico de Sets</div>
                {setHistory.map(s => (
                  <div key={s.setNum} style={S.setHistoryRow}>
                    <span style={{ color: "#334155", fontWeight: 700, minWidth: 44, fontSize: 12 }}>Set {s.setNum}</span>
                    <span style={{ color: s.winner === "A" ? "#f59e0b" : "#334155", fontWeight: 700, fontSize: 13 }}>{s.winner === "A" ? "✓" : " "}</span>
                    <span style={{ color: "#e2e8f0", fontWeight: 900, fontSize: 14 }}>{s.labelA} × {s.labelB}</span>
                    <span style={{ color: s.winner === "B" ? "#10b981" : "#334155", fontWeight: 700, fontSize: 13 }}>{s.winner === "B" ? "✓" : " "}</span>
                  </div>
                ))}
              </div>
            )}

            {gameLog.length > 0 && (
              <div style={{ background: "#061120", borderRadius: 10, padding: 10, border: "1px solid #1e3a5f" }}>
                {gameLog.slice(0, 4).map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: "#334155", fontFamily: "monospace", minWidth: 56 }}>{e.time}</span>
                    <span style={{ color: e.team === "A" ? "#f59e0b" : e.team === "B" ? "#10b981" : "#a78bfa" }}>
                      {e.type === "set" ? `🏅 Set — Dupla ${e.team}` : e.type === "replay" ? "🎬 replay salvo" : `ponto Dupla ${e.team}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== ROTATION LOG ===== */}
        {screen === "rotation" && (
          <div style={S.screen}>
            <h2 style={S.title}>🔄 Fila & Rotações</h2>

            {/* Current state */}
            <div style={S.rotCard}>
              <div style={S.rotCardTitle}>Partida atual</div>
              <div style={S.rotTeamsRow}>
                <div style={S.rotTeam}>
                  <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 11, marginBottom: 4 }}>DUPLA A</div>
                  {teamA.map(p => (
                    <div key={p} style={S.rotPlayer}>
                      <span style={S.avatarSm}>{p[0]}</span>
                      <span>{p}</span>
                      <span style={S.rotStats}>{gamesPlayed[p] ?? 0}j</span>
                    </div>
                  ))}
                </div>
                <div style={{ color: "#334155", fontWeight: 900, alignSelf: "center" }}>vs</div>
                <div style={S.rotTeam}>
                  <div style={{ color: "#10b981", fontWeight: 800, fontSize: 11, marginBottom: 4 }}>DUPLA B</div>
                  {teamB.map(p => (
                    <div key={p} style={S.rotPlayer}>
                      <span style={S.avatarSm}>{p[0]}</span>
                      <span>{p}</span>
                      <span style={S.rotStats}>{gamesPlayed[p] ?? 0}j</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bench queue */}
            {sortedBenchDisplay.length > 0 && (
              <div style={S.rotCard}>
                <div style={S.rotCardTitle}>Fila de espera <span style={{ color: "#334155", fontWeight: 400 }}>(ordem de entrada)</span></div>
                {sortedBenchDisplay.map((p, idx) => (
                  <div key={p} style={{ ...S.rotPlayer, background: idx === 0 ? "#0f2d1a" : idx === 1 ? "#0f1d2d" : "transparent", borderRadius: 8, padding: "6px 8px", marginBottom: 4 }}>
                    <span style={{ color: "#475569", fontWeight: 800, fontSize: 12, minWidth: 20 }}>#{idx + 1}</span>
                    <span style={{ ...S.avatarSm, background: idx < 2 ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#1d4ed8,#7c3aed)" }}>{p[0]}</span>
                    <span style={{ fontWeight: 700 }}>{p}</span>
                    <span style={S.rotStats}>{gamesPlayed[p] ?? 0}j jogados</span>
                    <span style={{ fontSize: 10, color: "#475569" }}>
                      {(benchSince[p] ?? 0) > 0 ? `esperando ${benchSince[p]} partida${benchSince[p] > 1 ? "s" : ""}` : "entrou agora"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* All players stats */}
            <div style={S.rotCard}>
              <div style={S.rotCardTitle}>Estatísticas gerais</div>
              {[...players].sort((a, b) => (gamesPlayed[b] ?? 0) - (gamesPlayed[a] ?? 0)).map(p => {
                const onCourt = teamA.includes(p) || teamB.includes(p);
                const onBench = bench.includes(p);
                return (
                  <div key={p} style={{ ...S.rotPlayer, marginBottom: 5 }}>
                    <span style={S.avatarSm}>{p[0]}</span>
                    <span style={{ flex: 1, fontWeight: 600 }}>{p}</span>
                    <span style={{ fontSize: 10, color: onCourt ? "#22c55e" : onBench ? "#f59e0b" : "#475569", fontWeight: 700, marginRight: 6 }}>
                      {onCourt ? "● quadra" : onBench ? "○ banco" : ""}
                    </span>
                    <span style={S.rotStats}>{gamesPlayed[p] ?? 0} jogos</span>
                  </div>
                );
              })}
            </div>

            {rotationLog.length > 0 && (
              <div style={S.rotCard}>
                <div style={S.rotCardTitle}>Histórico de rotações</div>
                {rotationLog.map((r, i) => (
                  <div key={i} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #0a1628" }}>
                    <div style={{ fontSize: 10, color: "#334155", marginBottom: 4 }}>{r.time}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      <span style={{ color: "#f59e0b" }}>{r.teamA.join(" / ")}</span> vs <span style={{ color: "#10b981" }}>{r.teamB.join(" / ")}</span>
                    </div>
                    {r.bench.length > 0 && (
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>banco: {r.bench.join(", ")}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== REPLAYS ===== */}
        {screen === "replays" && (
          <div style={S.screen}>
            <h2 style={S.title}>🎬 Replays Salvos</h2>
            {replays.length === 0 ? (
              <div style={{ textAlign: "center", color: "#475569", marginTop: 40, lineHeight: 1.8, fontSize: 14 }}>
                Nenhum replay ainda.<br />Clique em "Salvar Replay" durante o jogo.
              </div>
            ) : replays.map(r => (
              <div key={r.id} style={S.replayCard}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: "#a78bfa" }}>Replay #{r.id}</span>
                  <span style={{ fontSize: 12, color: "#475569", fontFamily: "monospace" }}>{r.time}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 700 }}>
                  <span style={{ color: "#f59e0b" }}>{r.teamA.join(" / ")}</span>
                  <span style={{ color: "#e2e8f0", fontWeight: 900, fontSize: 16 }}>{r.setsA}S × {r.setsB}S</span>
                  <span style={{ color: "#10b981" }}>{r.teamB.join(" / ")}</span>
                </div>
                <div style={{ fontSize: 12, color: "#475569" }}>
                  Ponto: <span style={{ color: "#f59e0b" }}>{r.pointA}</span> × <span style={{ color: "#10b981" }}>{r.pointB}</span>
                </div>
                <button style={{ background: "#1e3a5f", border: "none", color: "#94a3b8", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  ▶ Reproduzir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  root: { minHeight: "100vh", background: "#020c1b", display: "flex", justifyContent: "center", alignItems: "flex-start", fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: "0 0 40px" },
  app: { width: "100%", maxWidth: 420, background: "#0d1f35", minHeight: "100vh", display: "flex", flexDirection: "column", color: "#e2e8f0" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#061120", borderBottom: "1px solid #1e3a5f" },
  logo: { fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px", color: "#f0c040" },
  navBtns: { display: "flex", gap: 8 },
  navBtn: { background: "#1e3a5f", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  screen: { padding: "16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 12 },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" },
  settingBox: { background: "#061120", borderRadius: 14, padding: "14px 16px", border: "1px solid #1e3a5f", display: "flex", flexDirection: "column", gap: 8 },
  settingLabel: { fontSize: 11, fontWeight: 800, color: "#64748b", letterSpacing: 1, textTransform: "uppercase" },
  settingControls: { display: "flex", gap: 6, flexWrap: "wrap" },
  settingBtn: { border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  settingHint: { fontSize: 12, color: "#334155" },
  playerList: { display: "flex", flexDirection: "column", gap: 7 },
  playerChip: { display: "flex", alignItems: "center", gap: 10, background: "#122236", borderRadius: 12, padding: "10px 14px", border: "1px solid #1e3a5f" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", flexShrink: 0 },
  avatarSm: { width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, color: "#fff", marginRight: 6, flexShrink: 0 },
  avatarXs: { width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 8, color: "#fff", marginRight: 4, flexShrink: 0 },
  playerName: { flex: 1, fontWeight: 600, fontSize: 15 },
  removeBtn: { background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 13, padding: "2px 4px" },
  addRow: { display: "flex", gap: 8 },
  input: { flex: 1, background: "#122236", border: "1px solid #1e3a5f", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none" },
  addBtn: { background: "#1d4ed8", border: "none", color: "#fff", borderRadius: 10, width: 42, fontSize: 20, cursor: "pointer", fontWeight: 700 },
  bigBtn: { background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", border: "none", color: "#fff", borderRadius: 12, padding: "14px", fontWeight: 800, fontSize: 16, cursor: "pointer" },
  ghostBtn: { background: "#122236", border: "1px solid #1e3a5f", color: "#94a3b8", borderRadius: 12, padding: "14px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  rowBtns: { display: "flex", gap: 10, alignItems: "stretch" },
  teamsRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  teamBox: { flex: 1, background: "#0a192e", borderRadius: 14, padding: 12, border: "2px solid #1e3a5f", cursor: "pointer", transition: "border-color 0.2s", minHeight: 80 },
  teamLabel: { fontWeight: 800, fontSize: 11, color: "#64748b", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" },
  teamPlayer: { display: "flex", alignItems: "center", fontWeight: 600, fontSize: 13, marginBottom: 3 },
  emptySlot: { color: "#334155", fontSize: 12, fontStyle: "italic", marginTop: 4 },
  vsSmall: { paddingTop: 32, color: "#334155", fontWeight: 900, fontSize: 14 },
  benchSection: { background: "#0a192e", borderRadius: 12, padding: 12, border: "1px solid #1e3a5f" },
  benchLabel: { fontWeight: 800, fontSize: 11, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  benchRow: { display: "flex", flexWrap: "wrap", gap: 7 },
  benchChip: { display: "flex", alignItems: "center", background: "#122236", border: "1px solid #1e3a5f", borderRadius: 20, padding: "5px 10px", color: "#cbd5e1", fontWeight: 600, fontSize: 12, cursor: "pointer" },
  winnerBanner: { background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", borderRadius: 16, padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, border: "1px solid #7c3aed" },
  winnerBtn: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  cameraBox: { background: "#000", borderRadius: 14, overflow: "hidden", aspectRatio: "16/9", position: "relative", border: "2px solid #1e3a5f" },
  cameraLabel: { position: "absolute", top: 10, left: 12, fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 1, zIndex: 2 },
  cameraFake: { width: "100%", height: "100%", background: "radial-gradient(ellipse at center,#0d1f35 0%,#000 100%)", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 10 },
  recDot: { width: 7, height: 7, borderRadius: "50%", background: "#ef4444", marginRight: 4 },
  recText: { fontSize: 11, color: "#ef4444", fontWeight: 700 },
  setsRow: { display: "flex", alignItems: "center", background: "#061120", borderRadius: 14, overflow: "hidden", border: "1px solid #1e3a5f" },
  setsTeamBlock: { flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 },
  setsTeamName: { fontSize: 10, color: "#475569", fontWeight: 700, textAlign: "center", lineHeight: 1.2 },
  setsCount: { fontSize: 11, fontWeight: 800, color: "#64748b" },
  scoreSection: { display: "flex", alignItems: "center", background: "#061120", borderRadius: 16, overflow: "hidden", border: "1px solid #1e3a5f" },
  scoreTeam: { flex: 1, padding: "12px 8px", transition: "background 0.3s", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 },
  teamNameScore: { display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" },
  playerPillA: { background: "#f59e0b18", color: "#f59e0b", borderRadius: 20, padding: "2px 7px", fontSize: 10, fontWeight: 700 },
  playerPillB: { background: "#10b98118", color: "#10b981", borderRadius: 20, padding: "2px 7px", fontSize: 10, fontWeight: 700 },
  scoreNum: { fontSize: 56, fontWeight: 900, lineHeight: 1, letterSpacing: "-2px" },
  scoreControls: { display: "flex", gap: 5 },
  ptBtn: { border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 800, fontSize: 15, cursor: "pointer" },
  progressRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#061120", borderRadius: 10, border: "1px solid #1e3a5f" },
  benchBar: { display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", background: "#0a192e", borderRadius: 10, padding: "7px 10px", border: "1px solid #1e3a5f" },
  benchBarLabel: { fontSize: 11, color: "#475569", fontWeight: 700 },
  benchPill: { display: "inline-flex", alignItems: "center", background: "#122236", borderRadius: 20, padding: "3px 9px", fontSize: 11, fontWeight: 600, color: "#94a3b8" },
  replayBtn: { flex: 1, border: "none", borderRadius: 12, padding: "13px", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", transition: "background 0.3s" },
  setHistoryBox: { background: "#061120", borderRadius: 12, padding: "10px 14px", border: "1px solid #1e3a5f" },
  setHistoryTitle: { fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  setHistoryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #0a1628" },
  replayCard: { background: "#0a192e", borderRadius: 14, padding: 14, border: "1px solid #1e3a5f", display: "flex", flexDirection: "column", gap: 7 },
  // Rotation screen
  rotCard: { background: "#061120", borderRadius: 14, padding: "12px 14px", border: "1px solid #1e3a5f", display: "flex", flexDirection: "column", gap: 6 },
  rotCardTitle: { fontSize: 11, fontWeight: 800, color: "#475569", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  rotTeamsRow: { display: "flex", gap: 10, justifyContent: "space-between", alignItems: "flex-start" },
  rotTeam: { flex: 1, display: "flex", flexDirection: "column" },
  rotPlayer: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 },
  rotStats: { fontSize: 10, color: "#334155", marginLeft: "auto", fontWeight: 700 },
};
