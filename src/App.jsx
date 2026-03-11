import { useState } from "react";

const INITIAL_PLAYERS = ["João", "Pedro", "Lucas", "Mateus", "Rafael"];

const getReplays = () => [];

const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
};

export default function BeachCam() {
  const [screen, setScreen] = useState("setup"); // setup | game | rotation | replays
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [newPlayer, setNewPlayer] = useState("");
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [bench, setBench] = useState([]);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [replays, setReplays] = useState([]);
  const [flash, setFlash] = useState(null); // "A" | "B"
  const [setupStep, setSetupStep] = useState(0); // 0=players, 1=teams
  const [selectingFor, setSelectingFor] = useState(null); // "A" | "B"
  const [gameLog, setGameLog] = useState([]);

  const triggerFlash = (team) => {
    setFlash(team);
    setTimeout(() => setFlash(null), 600);
  };

  const addPoint = (team) => {
    triggerFlash(team);
    if (team === "A") setScoreA((s) => s + 1);
    else setScoreB((s) => s + 1);
    setGameLog((prev) => [{ time: formatTime(), team, type: "point" }, ...prev].slice(0, 50));
  };

  const saveReplay = () => {
    const replay = {
      id: replays.length + 1,
      time: formatTime(),
      teamA: [...teamA],
      teamB: [...teamB],
      scoreA,
      scoreB,
    };
    setReplays((prev) => [replay, ...prev]);
    triggerFlash("replay");
    setGameLog((prev) => [{ time: formatTime(), team: "replay", type: "replay" }, ...prev].slice(0, 50));
  };

  const startSetup = () => {
    setSetupStep(1);
    setTeamA([]);
    setTeamB([]);
    setBench([...players]);
  };

  const pickPlayer = (name) => {
    if (!selectingFor) return;
    if (selectingFor === "A" && teamA.length < 2) {
      setTeamA((t) => [...t, name]);
      setBench((b) => b.filter((p) => p !== name));
      if (teamA.length === 1) setSelectingFor("B");
    } else if (selectingFor === "B" && teamB.length < 2) {
      setTeamB((t) => [...t, name]);
      setBench((b) => b.filter((p) => p !== name));
      if (teamB.length === 1) setSelectingFor(null);
    }
  };

  const startGame = () => {
    if (teamA.length === 2 && teamB.length === 2) {
      setScoreA(0);
      setScoreB(0);
      setGameLog([]);
      setScreen("game");
    }
  };

  const endGame = (winner) => {
    // loser goes to bench, winner stays, bench player pairs with one of loser
    const losers = winner === "A" ? [...teamB] : [...teamA];
    const winners = winner === "A" ? [...teamA] : [...teamB];
    const newBench = [...bench];
    const incoming = newBench.splice(0, Math.min(2, newBench.length));

    const newTeamA = winners;
    const newTeamB = [
      incoming[0] || losers[0],
      incoming[1] || losers[1] || newBench[0] || losers[0],
    ].filter(Boolean).slice(0, 2);

    const remaining = [...losers, ...newBench].filter(
      (p) => !newTeamA.includes(p) && !newTeamB.includes(p)
    );

    setTeamA(newTeamA);
    setTeamB(newTeamB);
    setBench(remaining);
    setScoreA(0);
    setScoreB(0);
    setScreen("game");
  };

  const addPlayer = () => {
    if (newPlayer.trim() && !players.includes(newPlayer.trim())) {
      const name = newPlayer.trim();
      setPlayers((p) => [...p, name]);
      if (setupStep === 1) setBench((b) => [...b, name]);
      setNewPlayer("");
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.app}>
        {/* HEADER */}
        <div style={styles.header}>
          <span style={styles.logo}>🏖 BeachCam</span>
          <div style={styles.navBtns}>
            {screen === "game" && (
              <>
                <button style={styles.navBtn} onClick={() => setScreen("replays")}>
                  🎬 {replays.length}
                </button>
                <button style={styles.navBtn} onClick={() => setScreen("setup")}>
                  ⚙️
                </button>
              </>
            )}
            {screen !== "game" && screen !== "setup" && (
              <button style={styles.navBtn} onClick={() => setScreen("game")}>
                ← Quadra
              </button>
            )}
          </div>
        </div>

        {/* ====== SETUP SCREEN ====== */}
        {screen === "setup" && setupStep === 0 && (
          <div style={styles.screen}>
            <h2 style={styles.title}>Jogadores da Partida</h2>
            <div style={styles.playerList}>
              {players.map((p) => (
                <div key={p} style={styles.playerChip}>
                  <span style={styles.avatar}>{p[0]}</span>
                  <span style={styles.playerName}>{p}</span>
                  <button
                    style={styles.removeBtn}
                    onClick={() => setPlayers((pl) => pl.filter((x) => x !== p))}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div style={styles.addRow}>
              <input
                style={styles.input}
                placeholder="Nome do jogador..."
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              />
              <button style={styles.addBtn} onClick={addPlayer}>+</button>
            </div>
            <button
              style={{ ...styles.bigBtn, opacity: players.length >= 4 ? 1 : 0.4 }}
              disabled={players.length < 4}
              onClick={startSetup}
            >
              Montar Duplas →
            </button>
          </div>
        )}

        {screen === "setup" && setupStep === 1 && (
          <div style={styles.screen}>
            <h2 style={styles.title}>Montar Duplas</h2>
            <div style={styles.teamsRow}>
              <div
                style={{ ...styles.teamBox, borderColor: selectingFor === "A" ? "#f59e0b" : "#1e3a5f" }}
                onClick={() => setSelectingFor("A")}
              >
                <div style={styles.teamLabel}>Dupla A</div>
                {teamA.map((p) => <div key={p} style={styles.teamPlayer}><span style={styles.avatarSm}>{p[0]}</span>{p}</div>)}
                {teamA.length < 2 && (
                  <div style={styles.emptySlot}>{selectingFor === "A" ? "← selecione" : "vazio"}</div>
                )}
              </div>
              <div style={styles.vsSmall}>vs</div>
              <div
                style={{ ...styles.teamBox, borderColor: selectingFor === "B" ? "#10b981" : "#1e3a5f" }}
                onClick={() => setSelectingFor("B")}
              >
                <div style={styles.teamLabel}>Dupla B</div>
                {teamB.map((p) => <div key={p} style={styles.teamPlayer}><span style={styles.avatarSm}>{p[0]}</span>{p}</div>)}
                {teamB.length < 2 && (
                  <div style={styles.emptySlot}>{selectingFor === "B" ? "← selecione" : "vazio"}</div>
                )}
              </div>
            </div>
            {bench.length > 0 && (
              <div style={styles.benchSection}>
                <div style={styles.benchLabel}>Disponíveis</div>
                <div style={styles.benchRow}>
                  {bench.map((p) => (
                    <button
                      key={p}
                      style={{ ...styles.benchChip, opacity: selectingFor ? 1 : 0.5 }}
                      onClick={() => pickPlayer(p)}
                    >
                      <span style={styles.avatarSm}>{p[0]}</span>{p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {bench.length === 0 && players.length > 4 && (
              <div style={styles.benchSection}>
                <div style={styles.benchLabel}>Banco de Espera</div>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>— vazio —</div>
              </div>
            )}
            <div style={styles.addRow}>
              <input
                style={styles.input}
                placeholder="Adicionar jogador..."
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              />
              <button style={styles.addBtn} onClick={addPlayer}>+</button>
            </div>
            <div style={styles.rowBtns}>
              <button style={styles.ghostBtn} onClick={() => { setSetupStep(0); setTeamA([]); setTeamB([]); setBench([]); }}>← Voltar</button>
              <button
                style={{ ...styles.bigBtn, flex: 1, opacity: teamA.length === 2 && teamB.length === 2 ? 1 : 0.4 }}
                disabled={teamA.length < 2 || teamB.length < 2}
                onClick={startGame}
              >
                🏁 Iniciar Jogo
              </button>
            </div>
          </div>
        )}

        {/* ====== GAME SCREEN ====== */}
        {screen === "game" && (
          <div style={styles.screen}>
            {/* Camera preview area */}
            <div style={styles.cameraBox}>
              <div style={styles.cameraLabel}>📷 CÂMERA AO VIVO</div>
              <div style={styles.cameraFake}>
                <div style={styles.recDot} />
                <span style={styles.recText}>● REC</span>
              </div>
            </div>

            {/* Score */}
            <div style={styles.scoreSection}>
              <div style={{ ...styles.scoreTeam, background: flash === "A" ? "rgba(245,158,11,0.18)" : "transparent" }}>
                <div style={styles.teamNameScore}>
                  {teamA.map((p) => <span key={p} style={styles.playerPill}>{p}</span>)}
                </div>
                <div style={{ ...styles.scoreNum, color: "#f59e0b" }}>{scoreA}</div>
                <div style={styles.scoreControls}>
                  <button style={{ ...styles.ptBtn, background: "#f59e0b22", color: "#f59e0b" }} onClick={() => addPoint("A")}>+1</button>
                  <button style={{ ...styles.ptBtn, background: "#1e293b", color: "#64748b" }} onClick={() => setScoreA((s) => Math.max(0, s - 1))}>−</button>
                </div>
              </div>

              <div style={styles.scoreVs}>×</div>

              <div style={{ ...styles.scoreTeam, background: flash === "B" ? "rgba(16,185,129,0.18)" : "transparent" }}>
                <div style={styles.teamNameScore}>
                  {teamB.map((p) => <span key={p} style={styles.playerPill2}>{p}</span>)}
                </div>
                <div style={{ ...styles.scoreNum, color: "#10b981" }}>{scoreB}</div>
                <div style={styles.scoreControls}>
                  <button style={{ ...styles.ptBtn, background: "#10b98122", color: "#10b981" }} onClick={() => addPoint("B")}>+1</button>
                  <button style={{ ...styles.ptBtn, background: "#1e293b", color: "#64748b" }} onClick={() => setScoreB((s) => Math.max(0, s - 1))}>−</button>
                </div>
              </div>
            </div>

            {/* Bench */}
            {bench.length > 0 && (
              <div style={styles.benchBar}>
                <span style={styles.benchBarLabel}>⏳ Aguardando:</span>
                {bench.map((p) => (
                  <span key={p} style={styles.benchPill}><span style={styles.avatarXs}>{p[0]}</span>{p}</span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div style={styles.actionRow}>
              <button
                style={{ ...styles.replayBtn, background: flash === "replay" ? "#7c3aed" : "#312e81" }}
                onClick={saveReplay}
              >
                🎬 Salvar Replay
              </button>
            </div>

            <div style={styles.endGameRow}>
              <button style={styles.endBtn} onClick={() => endGame("A")}>
                🏆 Dupla A venceu
              </button>
              <button style={styles.endBtn} onClick={() => endGame("B")}>
                🏆 Dupla B venceu
              </button>
            </div>

            {/* Mini log */}
            {gameLog.length > 0 && (
              <div style={styles.log}>
                {gameLog.slice(0, 4).map((e, i) => (
                  <div key={i} style={styles.logRow}>
                    <span style={styles.logTime}>{e.time}</span>
                    <span style={{ color: e.team === "A" ? "#f59e0b" : e.team === "B" ? "#10b981" : "#a78bfa" }}>
                      {e.type === "replay" ? "🎬 replay salvo" : `ponto Dupla ${e.team}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== REPLAYS SCREEN ====== */}
        {screen === "replays" && (
          <div style={styles.screen}>
            <h2 style={styles.title}>🎬 Replays Salvos</h2>
            {replays.length === 0 ? (
              <div style={styles.emptyReplays}>Nenhum replay ainda.<br />Clique em "Salvar Replay" durante o jogo.</div>
            ) : (
              replays.map((r) => (
                <div key={r.id} style={styles.replayCard}>
                  <div style={styles.replayTop}>
                    <span style={styles.replayId}>Replay #{r.id}</span>
                    <span style={styles.replayTime}>{r.time}</span>
                  </div>
                  <div style={styles.replayTeams}>
                    <span style={{ color: "#f59e0b" }}>{r.teamA.join(" / ")}</span>
                    <span style={styles.replayScore}>{r.scoreA} × {r.scoreB}</span>
                    <span style={{ color: "#10b981" }}>{r.teamB.join(" / ")}</span>
                  </div>
                  <button style={styles.playBtn}>▶ Reproduzir</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#020c1b",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding: "0 0 40px",
  },
  app: {
    width: "100%",
    maxWidth: 420,
    background: "#0d1f35",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    color: "#e2e8f0",
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "#061120",
    borderBottom: "1px solid #1e3a5f",
  },
  logo: {
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: "-0.5px",
    color: "#f0c040",
  },
  navBtns: { display: "flex", gap: 8 },
  navBtn: {
    background: "#1e3a5f",
    border: "none",
    color: "#94a3b8",
    borderRadius: 8,
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  screen: { padding: "20px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 16 },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" },

  // Setup
  playerList: { display: "flex", flexDirection: "column", gap: 8 },
  playerChip: {
    display: "flex", alignItems: "center", gap: 10,
    background: "#122236", borderRadius: 12, padding: "10px 14px",
    border: "1px solid #1e3a5f",
  },
  avatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 14, color: "#fff",
  },
  avatarSm: {
    width: 24, height: 24, borderRadius: "50%",
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 11, color: "#fff", marginRight: 6, flexShrink: 0,
  },
  avatarXs: {
    width: 18, height: 18, borderRadius: "50%",
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 9, color: "#fff", marginRight: 4, flexShrink: 0,
  },
  playerName: { flex: 1, fontWeight: 600, fontSize: 15 },
  removeBtn: {
    background: "none", border: "none", color: "#475569",
    cursor: "pointer", fontSize: 14, padding: "2px 4px",
  },
  addRow: { display: "flex", gap: 8 },
  input: {
    flex: 1, background: "#122236", border: "1px solid #1e3a5f",
    borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 14,
    outline: "none",
  },
  addBtn: {
    background: "#1d4ed8", border: "none", color: "#fff",
    borderRadius: 10, width: 42, fontSize: 20, cursor: "pointer", fontWeight: 700,
  },
  bigBtn: {
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    border: "none", color: "#fff", borderRadius: 12,
    padding: "14px", fontWeight: 800, fontSize: 16, cursor: "pointer",
    letterSpacing: "-0.3px",
  },
  ghostBtn: {
    background: "#122236", border: "1px solid #1e3a5f", color: "#94a3b8",
    borderRadius: 12, padding: "14px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  rowBtns: { display: "flex", gap: 10, alignItems: "stretch" },

  teamsRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  teamBox: {
    flex: 1, background: "#0a192e", borderRadius: 14, padding: 14,
    border: "2px solid #1e3a5f", cursor: "pointer", transition: "border-color 0.2s",
    minHeight: 90,
  },
  teamLabel: { fontWeight: 800, fontSize: 12, color: "#64748b", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" },
  teamPlayer: { display: "flex", alignItems: "center", fontWeight: 600, fontSize: 14, marginBottom: 4 },
  emptySlot: { color: "#334155", fontSize: 13, fontStyle: "italic", marginTop: 4 },
  vsSmall: { paddingTop: 36, color: "#334155", fontWeight: 900, fontSize: 16 },
  benchSection: { background: "#0a192e", borderRadius: 12, padding: 14, border: "1px solid #1e3a5f" },
  benchLabel: { fontWeight: 800, fontSize: 11, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  benchRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  benchChip: {
    display: "flex", alignItems: "center",
    background: "#122236", border: "1px solid #1e3a5f", borderRadius: 20,
    padding: "6px 12px", color: "#cbd5e1", fontWeight: 600, fontSize: 13,
    cursor: "pointer",
  },

  // Game
  cameraBox: {
    background: "#000", borderRadius: 16, overflow: "hidden",
    aspectRatio: "16/9", position: "relative",
    border: "2px solid #1e3a5f",
  },
  cameraLabel: {
    position: "absolute", top: 12, left: 14,
    fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 1, zIndex: 2,
  },
  cameraFake: {
    width: "100%", height: "100%",
    background: "radial-gradient(ellipse at center, #0d1f35 0%, #000 100%)",
    display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
    padding: 12,
  },
  recDot: {
    width: 8, height: 8, borderRadius: "50%", background: "#ef4444",
    animation: "pulse 1s infinite", marginRight: 4,
  },
  recText: { fontSize: 11, color: "#ef4444", fontWeight: 700 },

  scoreSection: {
    display: "flex", alignItems: "center", gap: 0,
    background: "#061120", borderRadius: 16, overflow: "hidden",
    border: "1px solid #1e3a5f",
  },
  scoreTeam: {
    flex: 1, padding: "14px 10px", transition: "background 0.3s",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
  },
  teamNameScore: { display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" },
  playerPill: {
    background: "#f59e0b22", color: "#f59e0b", borderRadius: 20,
    padding: "2px 8px", fontSize: 11, fontWeight: 700,
  },
  playerPill2: {
    background: "#10b98122", color: "#10b981", borderRadius: 20,
    padding: "2px 8px", fontSize: 11, fontWeight: 700,
  },
  scoreNum: {
    fontSize: 52, fontWeight: 900, lineHeight: 1,
    letterSpacing: "-2px",
  },
  scoreControls: { display: "flex", gap: 6 },
  ptBtn: {
    border: "none", borderRadius: 8, padding: "8px 14px",
    fontWeight: 800, fontSize: 16, cursor: "pointer",
  },
  scoreVs: {
    color: "#1e3a5f", fontWeight: 900, fontSize: 28, padding: "0 4px",
  },

  benchBar: {
    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
    background: "#0a192e", borderRadius: 10, padding: "8px 12px",
    border: "1px solid #1e3a5f",
  },
  benchBarLabel: { fontSize: 12, color: "#475569", fontWeight: 700 },
  benchPill: {
    display: "inline-flex", alignItems: "center",
    background: "#122236", borderRadius: 20, padding: "4px 10px",
    fontSize: 12, fontWeight: 600, color: "#94a3b8",
  },

  actionRow: { display: "flex", gap: 10 },
  replayBtn: {
    flex: 1, border: "none", borderRadius: 12,
    padding: "14px", color: "#fff", fontWeight: 800, fontSize: 15,
    cursor: "pointer", transition: "background 0.3s",
  },

  endGameRow: { display: "flex", gap: 8 },
  endBtn: {
    flex: 1, background: "#0a192e", border: "1px solid #1e3a5f",
    color: "#94a3b8", borderRadius: 10, padding: "10px 6px",
    fontSize: 12, fontWeight: 700, cursor: "pointer",
  },

  log: {
    background: "#061120", borderRadius: 10, padding: 10,
    border: "1px solid #1e3a5f",
  },
  logRow: { display: "flex", gap: 8, fontSize: 12, marginBottom: 3 },
  logTime: { color: "#334155", fontFamily: "monospace", minWidth: 60 },

  // Replays screen
  emptyReplays: {
    textAlign: "center", color: "#475569", marginTop: 40,
    lineHeight: 1.8, fontSize: 14,
  },
  replayCard: {
    background: "#0a192e", borderRadius: 14, padding: 16,
    border: "1px solid #1e3a5f", display: "flex", flexDirection: "column", gap: 8,
  },
  replayTop: { display: "flex", justifyContent: "space-between" },
  replayId: { fontWeight: 800, fontSize: 14, color: "#a78bfa" },
  replayTime: { fontSize: 12, color: "#475569", fontFamily: "monospace" },
  replayTeams: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: 13, fontWeight: 700,
  },
  replayScore: { color: "#e2e8f0", fontWeight: 900, fontSize: 18 },
  playBtn: {
    background: "#1e3a5f", border: "none", color: "#94a3b8",
    borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 13, cursor: "pointer",
  },
};
