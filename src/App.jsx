// ─── BeachCam — Supabase realtime version ────────────────────────────────────
// Requires in your project:
//   npm install @supabase/supabase-js
//
// Create src/supabase.js:
//   import { createClient } from '@supabase/supabase-js'
//   export const supabase = createClient(
//     import.meta.env.VITE_SUPABASE_URL,
//     import.meta.env.VITE_SUPABASE_KEY
//   )
//
// .env.local:
//   VITE_SUPABASE_URL=https://vofbqvfjmnssggnlejhj.supabase.co
//   VITE_SUPABASE_KEY=sb_publishable_VVpoPIJbMQwQdnpiU1edvA_9YZrbazp
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client (inline for single-file usage) ───────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

// ── Constants ─────────────────────────────────────────────────────────────────
const POINT_SEQUENCE = [0, 15, 30, 40, "SET"];
const POINT_LABELS   = { 0: "0", 15: "15", 30: "30", 40: "40" };

const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Rotation logic ────────────────────────────────────────────────────────────
function pickNextFour(winners, losers, bench, gamesPlayed, benchSince) {
  const sortedBench = [...bench].sort((a, b) => {
    const d = (benchSince[b] ?? 0) - (benchSince[a] ?? 0);
    return d !== 0 ? d : (gamesPlayed[a] ?? 0) - (gamesPlayed[b] ?? 0);
  });
  const [w1, w2] = winners;
  const benchSize = bench.length;
  const winnersCanStay = benchSize < 2 ||
    ((benchSince[w1] ?? 0) < benchSize && (benchSince[w2] ?? 0) < benchSize);

  let nextTeamA, nextTeamB, nextBench;
  if (winnersCanStay && benchSize >= 2) {
    nextTeamA = winners; nextTeamB = sortedBench.slice(0, 2);
    nextBench = [...sortedBench.slice(2), ...losers];
  } else if (winnersCanStay && benchSize === 1) {
    nextTeamA = winners; nextTeamB = [sortedBench[0], losers[0]];
    nextBench = [losers[1]];
  } else if (winnersCanStay && benchSize === 0) {
    nextTeamA = winners; nextTeamB = losers; nextBench = [];
  } else {
    if (benchSize >= 2) {
      nextTeamA = sortedBench.slice(0, 2); nextTeamB = [...losers];
      nextBench = [...sortedBench.slice(2), ...winners];
    } else {
      const ws = [...winners].sort((a, b) => (benchSince[b] ?? 0) - (benchSince[a] ?? 0));
      nextTeamA = [sortedBench[0] ?? ws[0], losers[0]];
      nextTeamB = [sortedBench[1] ?? ws[1], losers[1]];
      nextBench = [];
    }
  }
  const playing = new Set([...nextTeamA, ...nextTeamB]);
  nextBench = [...new Set(nextBench.filter(p => !playing.has(p)))];
  return { nextTeamA, nextTeamB, nextBench };
}

function updateStats(gamesPlayed, benchSince, nextTeamA, nextTeamB, nextBench) {
  const newGP = { ...gamesPlayed }, newBS = { ...benchSince };
  for (const p of [...nextTeamA, ...nextTeamB]) { newGP[p] = (newGP[p] ?? 0) + 1; newBS[p] = 0; }
  for (const p of nextBench) { newBS[p] = (newBS[p] ?? 0) + 1; }
  return { newGP, newBS };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SetDots({ won, total }) {
  return (
    <div style={{ display:"flex", gap:4, justifyContent:"center", flexWrap:"wrap" }}>
      {Array.from({ length: Math.max(total,1) }).map((_,i) => (
        <div key={i} style={{
          width:12, height:12, borderRadius:"50%",
          background: i < won ? "#22c55e" : "#ef4444",
          border: i < won ? "1.5px solid #16a34a" : "1.5px solid #b91c1c",
          boxShadow: i < won ? "0 0 6px #22c55e88" : "0 0 4px #ef444444",
          transition:"all 0.3s",
        }}/>
      ))}
    </div>
  );
}

function Medal({ rank }) {
  if (rank === 0) return <span style={{fontSize:18}}>🥇</span>;
  if (rank === 1) return <span style={{fontSize:18}}>🥈</span>;
  if (rank === 2) return <span style={{fontSize:18}}>🥉</span>;
  return <span style={{fontSize:13, color:"#334155", fontWeight:800, minWidth:24, textAlign:"center"}}>#{rank+1}</span>;
}

function SyncBadge({ status }) {
  const cfg = {
    synced:  { color:"#22c55e", bg:"#0f2d1a", label:"● sincronizado" },
    syncing: { color:"#f59e0b", bg:"#2d1f0a", label:"⟳ sincronizando" },
    error:   { color:"#ef4444", bg:"#2d0a0a", label:"✕ sem conexão" },
    offline: { color:"#475569", bg:"#122236", label:"◌ offline" },
  }[status] ?? { color:"#475569", bg:"#122236", label:"◌" };
  return (
    <div style={{ background:cfg.bg, border:`1px solid ${cfg.color}33`, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, color:cfg.color }}>
      {cfg.label}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function BeachCam() {
  const [screen, setScreen]           = useState("setup");
  const [players, setPlayers]         = useState([]);
  const [newPlayer, setNewPlayer]     = useState("");
  const [teamA, setTeamA]             = useState([]);
  const [teamB, setTeamB]             = useState([]);
  const [bench, setBench]             = useState([]);
  const [setupStep, setSetupStep]     = useState(0);
  const [selectingFor, setSelectingFor] = useState(null);
  const [shuffleFlash, setShuffleFlash] = useState(false);

  const [gamesPlayed, setGamesPlayed] = useState({});
  const [benchSince, setBenchSince]   = useState({});

  // Ranking — loaded from Supabase
  const [rankingRows, setRankingRows]       = useState([]); // [{player_name, wins, games}]
  const [matchHistory, setMatchHistory]     = useState([]); // from matches table
  const [duoStats, setDuoStats]             = useState({}); // local derived

  const [pointIdxA, setPointIdxA] = useState(0);
  const [pointIdxB, setPointIdxB] = useState(0);
  const [setsA, setSetsA]         = useState(0);
  const [setsB, setSetsB]         = useState(0);
  const [bestOf, setBestOf]       = useState(3);
  const [matchWinner, setMatchWinner] = useState(null);

  const [replays, setReplays]         = useState([]);
  const [flash, setFlash]             = useState(null);
  const [gameLog, setGameLog]         = useState([]);
  const [setHistory, setSetHistory]   = useState([]);
  const [rotationLog, setRotationLog] = useState([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [syncStatus, setSyncStatus]   = useState("offline");

  const setsToWin = Math.ceil(bestOf / 2);

  // ── Load initial data from Supabase ─────────────────────────────────────────
  const loadPlayers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("players").select("name").order("created_at");
      if (error) throw error;
      if (data.length > 0) setPlayers(data.map(p => p.name));
      setSyncStatus("synced");
    } catch { setSyncStatus("error"); }
  }, []);

  const loadRanking = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ranking").select("*").order("wins", { ascending: false });
      if (error) throw error;
      setRankingRows(data ?? []);
    } catch {}
  }, []);

  const loadMatches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("matches").select("*").order("played_at", { ascending: false }).limit(30);
      if (error) throw error;
      setMatchHistory(data ?? []);
      // derive duo stats locally
      const ds = {};
      (data ?? []).forEach(m => {
        const wk = [m.winner_1, m.winner_2].sort().join("|");
        const lk = [m.loser_1,  m.loser_2 ].sort().join("|");
        ds[wk] = ds[wk] ?? { wins:0, games:0 };
        ds[lk] = ds[lk] ?? { wins:0, games:0 };
        ds[wk].wins++; ds[wk].games++; ds[lk].games++;
      });
      setDuoStats(ds);
    } catch {}
  }, []);

  // ── Sync Live State to Supabase ─────────────────────────────────────────────
  const syncLiveState = async (newStateUpdate) => {
    try {
      const payload = {
        screen, teamA, teamB, bench,
        pointIdxA, pointIdxB, setsA, setsB,
        bestOf, matchWinner, gamesPlayed, benchSince,
        ...newStateUpdate
      };
      await supabase
        .from("live_match")
        .update({ state: payload, updated_at: new Date().toISOString() })
        .eq("id", 1);
    } catch (error) {
      console.error("Erro ao sincronizar estado:", error);
    }
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
  }, []);

  const loadLiveMatch = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("live_match").select("state").eq("id", 1).single();
      if (error) throw error;
      if (data && data.state) {
        applyRemoteState(data.state);
      }
    } catch {}
  }, [applyRemoteState]);

  useEffect(() => {
    setSyncStatus("syncing");
    loadPlayers();
    loadRanking();
    loadMatches();
    loadLiveMatch();

    // Realtime subscriptions
    const rankCh = supabase.channel("ranking-changes")
      .on("postgres_changes", { event:"*", schema:"public", table:"ranking" }, () => loadRanking())
      .subscribe();

    const matchCh = supabase.channel("match-changes")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"matches" }, () => loadMatches())
      .subscribe();

    const playerCh = supabase.channel("player-changes")
      .on("postgres_changes", { event:"*", schema:"public", table:"players" }, () => loadPlayers())
      .subscribe();

    const liveMatchCh = supabase.channel("live-match-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_match", filter: "id=eq.1" }, (payload) => {
        applyRemoteState(payload.new.state);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(rankCh);
      supabase.removeChannel(matchCh);
      supabase.removeChannel(playerCh);
      supabase.removeChannel(liveMatchCh);
    };
  }, [loadPlayers, loadRanking, loadMatches, loadLiveMatch, applyRemoteState]);

  // ── Save match to Supabase ───────────────────────────────────────────────────
  const saveMatchToSupabase = async (winner, tA, tB, sa, sb) => {
    setSyncStatus("syncing");
    try {
      const winTeam  = winner === "A" ? tA : tB;
      const loseTeam = winner === "A" ? tB : tA;
      const sW = winner === "A" ? sa : sb;
      const sL = winner === "A" ? sb : sa;

      // Insert match record
      await supabase.from("matches").insert({
        winner_1: winTeam[0], winner_2: winTeam[1],
        loser_1:  loseTeam[0], loser_2: loseTeam[1],
        sets_winner: sW, sets_loser: sL,
      });

      // Upsert ranking for winners (+1 win, +1 game)
      for (const p of winTeam) {
        const existing = rankingRows.find(r => r.player_name === p);
        await supabase.from("ranking").upsert({
          player_name: p,
          wins:  (existing?.wins  ?? 0) + 1,
          games: (existing?.games ?? 0) + 1,
          updated_at: new Date().toISOString(),
        }, { onConflict: "player_name" });
      }

      // Upsert ranking for losers (+0 wins, +1 game)
      for (const p of loseTeam) {
        const existing = rankingRows.find(r => r.player_name === p);
        await supabase.from("ranking").upsert({
          player_name: p,
          wins:  existing?.wins  ?? 0,
          games: (existing?.games ?? 0) + 1,
          updated_at: new Date().toISOString(),
        }, { onConflict: "player_name" });
      }

      setSyncStatus("synced");
    } catch { setSyncStatus("error"); }
  };

  // ── Add player to Supabase ───────────────────────────────────────────────────
  const addPlayerToSupabase = async (name) => {
    try {
      await supabase.from("players").insert({ name });
    } catch {}
  };

  const removePlayerFromSupabase = async (name) => {
    try {
      await supabase.from("players").delete().eq("name", name);
    } catch {}
  };

  // ── Reset ranking ────────────────────────────────────────────────────────────
  const resetRanking = async () => {
    try {
      await supabase.from("ranking").delete().neq("player_name", "");
      await supabase.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      setRankingRows([]); setMatchHistory([]); setDuoStats({});
      setConfirmReset(false);
      setSyncStatus("synced");
    } catch { setSyncStatus("error"); }
  };

  // ── Game logic ────────────────────────────────────────────────────────────────
  const triggerFlash = (team) => { setFlash(team); setTimeout(() => setFlash(null), 700); };
  const resetPoints  = () => { setPointIdxA(0); setPointIdxB(0); };

  const addPoint = (team) => {
    if (matchWinner) return;
    triggerFlash(team);
    const idxA = pointIdxA, idxB = pointIdxB;
    const nextIdxA = team === "A" ? idxA + 1 : idxA;
    const nextIdxB = team === "B" ? idxB + 1 : idxB;
    const pA = POINT_SEQUENCE[nextIdxA], pB = POINT_SEQUENCE[nextIdxB];

    if (pA === "SET" || pB === "SET") {
      const sw    = pA === "SET" ? "A" : "B";
      const newSA = sw === "A" ? setsA + 1 : setsA;
      const newSB = sw === "B" ? setsB + 1 : setsB;
      setSetHistory(prev => [...prev, {
        setNum: prev.length + 1, winner: sw,
        labelA: pA === "SET" ? "SET" : POINT_LABELS[POINT_SEQUENCE[idxA]],
        labelB: pB === "SET" ? "SET" : POINT_LABELS[POINT_SEQUENCE[idxB]],
      }]);
      setSetsA(newSA); setSetsB(newSB); resetPoints();
      setGameLog(prev => [{ time: formatTime(), team: sw, type:"set" }, ...prev].slice(0,50));
      
      let mw = null;
      if (newSA >= setsToWin || newSB >= setsToWin) {
        mw = newSA >= setsToWin ? "A" : "B";
        setMatchWinner(mw);
        saveMatchToSupabase(mw, teamA, teamB, newSA, newSB);
      }

      syncLiveState({
        pointIdxA: 0, pointIdxB: 0,
        setsA: newSA, setsB: newSB,
        matchWinner: mw
      });
    } else {
      setPointIdxA(nextIdxA); setPointIdxB(nextIdxB);
      setGameLog(prev => [{ time: formatTime(), team, type:"point" }, ...prev].slice(0,50));
      syncLiveState({ pointIdxA: nextIdxA, pointIdxB: nextIdxB });
    }
  };

  const removePoint = (team) => {
    if (matchWinner) return;
    let nextA = pointIdxA, nextB = pointIdxB;
    if (team === "A" && pointIdxA > 0) { nextA = pointIdxA - 1; setPointIdxA(nextA); }
    if (team === "B" && pointIdxB > 0) { nextB = pointIdxB - 1; setPointIdxB(nextB); }
    syncLiveState({ pointIdxA: nextA, pointIdxB: nextB });
  };

  const saveReplay = () => {
    setReplays(prev => [{ id: prev.length+1, time: formatTime(),
      teamA:[...teamA], teamB:[...teamB],
      pointA: POINT_LABELS[POINT_SEQUENCE[pointIdxA]]??"0",
      pointB: POINT_LABELS[POINT_SEQUENCE[pointIdxB]]??"0",
      setsA, setsB,
    }, ...prev]);
    triggerFlash("replay");
  };

  const resetMatch = (sync = true) => {
    resetPoints(); setSetsA(0); setSetsB(0);
    setMatchWinner(null); setSetHistory([]); setGameLog([]);
    if (sync) syncLiveState({ pointIdxA: 0, pointIdxB: 0, setsA: 0, setsB: 0, matchWinner: null });
  };

  // ── Setup ─────────────────────────────────────────────────────────────────────
  const startSetup = () => {
    setSetupStep(1); setTeamA([]); setTeamB([]); setBench([...players]); setSelectingFor("A");
  };

  const randomizeDuplas = () => {
    const sh = shuffle(players);
    setTeamA(sh.slice(0,2)); setTeamB(sh.slice(2,4)); setBench(sh.slice(4));
    setShuffleFlash(true); setTimeout(() => setShuffleFlash(false), 800);
  };

  const pickPlayer = (name) => {
    if (!selectingFor) return;
    if (selectingFor === "A" && teamA.length < 2) {
      const next = [...teamA, name]; setTeamA(next); setBench(b => b.filter(p => p !== name));
      if (next.length === 2) setSelectingFor("B");
    } else if (selectingFor === "B" && teamB.length < 2) {
      const next = [...teamB, name]; setTeamB(next); setBench(b => b.filter(p => p !== name));
      if (next.length === 2) setSelectingFor(null);
    }
  };

  const removeFromTeam = (team, name) => {
    if (team === "A") { setTeamA(t => t.filter(p => p !== name)); setBench(b => [...b, name]); }
    else              { setTeamB(t => t.filter(p => p !== name)); setBench(b => [...b, name]); }
  };

  const startGame = () => {
    if (teamA.length === 2 && teamB.length === 2) {
      const initGP = {}, initBS = {};
      players.forEach(p => { initGP[p] = 0; initBS[p] = 0; });
      [...teamA, ...teamB].forEach(p => { initGP[p] = 1; });
      setGamesPlayed(initGP); setBenchSince(initBS);
      resetMatch(false); setScreen("game");
      syncLiveState({
        screen: "game",
        teamA, teamB, bench,
        pointIdxA: 0, pointIdxB: 0,
        setsA: 0, setsB: 0,
        matchWinner: null,
        gamesPlayed: initGP,
        benchSince: initBS
      });
    }
  };

  const doRotation = (winner) => {
    const losers  = winner === "A" ? [...teamB] : [...teamA];
    const winners = winner === "A" ? [...teamA] : [...teamB];
    const { nextTeamA, nextTeamB, nextBench } = pickNextFour(winners, losers, bench, gamesPlayed, benchSince);
    const { newGP, newBS } = updateStats(gamesPlayed, benchSince, nextTeamA, nextTeamB, nextBench);
    setRotationLog(prev => [{ time:formatTime(), teamA:nextTeamA, teamB:nextTeamB, bench:nextBench }, ...prev].slice(0,20));
    setTeamA(nextTeamA); setTeamB(nextTeamB); setBench(nextBench);
    setGamesPlayed(newGP); setBenchSince(newBS);
    resetMatch(false); setScreen("game");
    syncLiveState({
      screen: "game",
      teamA: nextTeamA, teamB: nextTeamB, bench: nextBench,
      pointIdxA: 0, pointIdxB: 0,
      setsA: 0, setsB: 0,
      matchWinner: null,
      gamesPlayed: newGP,
      benchSince: newBS
    });
  };

  const addPlayer = async () => {
    const name = newPlayer.trim();
    if (name && !players.includes(name)) {
      setPlayers(p => [...p, name]);
      if (setupStep === 1) setBench(b => [...b, name]);
      setNewPlayer("");
      await addPlayerToSupabase(name);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────────
  const sortedBenchDisplay = [...bench].sort((a,b) => {
    const d = (benchSince[b]??0) - (benchSince[a]??0);
    return d !== 0 ? d : (gamesPlayed[a]??0) - (gamesPlayed[b]??0);
  });

  const totalSetsPlayed = Math.max(setsA + setsB, setsToWin);
  const currentLabelA   = POINT_LABELS[POINT_SEQUENCE[pointIdxA]] ?? "0";
  const currentLabelB   = POINT_LABELS[POINT_SEQUENCE[pointIdxB]] ?? "0";

  // Ranking derived
  const sortedPlayers = [...rankingRows].sort((a,b) => b.wins - a.wins);
  const maxWins       = sortedPlayers[0]?.wins ?? 1;

  const sortedDuos = Object.entries(duoStats)
    .map(([key, v]) => ({ key, names: key.split("|"), ...v, winRate: v.games > 0 ? Math.round((v.wins/v.games)*100) : 0 }))
    .sort((a,b) => b.wins - a.wins || b.winRate - a.winRate);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      <div style={S.app}>

        {/* HEADER */}
        <div style={S.header}>
          <span style={S.logo}>🏖 BeachCam</span>
          <div style={S.navBtns}>
            <SyncBadge status={syncStatus} />
            {screen === "game" && (<>
              <button style={S.navBtn} onClick={() => setScreen("ranking")}>🏆</button>
              <button style={S.navBtn} onClick={() => setScreen("replays")}>🎬 {replays.length}</button>
              <button style={S.navBtn} onClick={() => setScreen("rotation")}>🔄</button>
              <button style={S.navBtn} onClick={() => setScreen("setup")}>⚙️</button>
            </>)}
            {["replays","rotation","ranking"].includes(screen) && (
              <button style={S.navBtn} onClick={() => setScreen("game")}>← Quadra</button>
            )}
          </div>
        </div>

        {/* ══ SETUP 0 ══ */}
        {screen === "setup" && setupStep === 0 && (
          <div style={S.screen}>
            <h2 style={S.title}>Jogadores da Partida</h2>

            <div style={S.settingBox}>
              <span style={S.settingLabel}>🏆 Formato</span>
              <div style={S.settingControls}>
                {[3,5,7].map(n => (
                  <button key={n}
                    style={{ ...S.settingBtn, background: bestOf===n?"#1d4ed8":"#122236", color: bestOf===n?"#fff":"#64748b" }}
                    onClick={() => setBestOf(n)}>Melhor de {n}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:12, color:"#475569" }}>Personalizado:</span>
                <input style={{ ...S.input, width:64, padding:"6px 10px", textAlign:"center" }}
                  type="number" min={1} max={99} value={bestOf}
                  onChange={e => setBestOf(Math.max(1, parseInt(e.target.value)||1))} />
                <span style={{ fontSize:12, color:"#475569" }}>sets</span>
              </div>
              <div style={S.settingHint}>🎯 Ganha quem vencer {setsToWin} set{setsToWin>1?"s":""} primeiro</div>
            </div>

            {players.length === 0 ? (
              <div style={{ textAlign:"center", color:"#334155", padding:"20px 0", fontSize:13 }}>
                ⟳ Carregando jogadores do servidor...
              </div>
            ) : (
              <div style={S.playerList}>
                {players.map(p => (
                  <div key={p} style={S.playerChip}>
                    <span style={S.avatar}>{p[0]}</span>
                    <span style={S.playerName}>{p}</span>
                    <button style={S.removeBtn} onClick={() => {
                      setPlayers(pl => pl.filter(x => x !== p));
                      removePlayerFromSupabase(p);
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={S.addRow}>
              <input style={S.input} placeholder="Nome do jogador..." value={newPlayer}
                onChange={e => setNewPlayer(e.target.value)}
                onKeyDown={e => e.key==="Enter" && addPlayer()} />
              <button style={S.addBtn} onClick={addPlayer}>+</button>
            </div>
            <button style={{ ...S.bigBtn, opacity: players.length>=4?1:0.4 }}
              disabled={players.length<4} onClick={startSetup}>
              Montar Duplas →
            </button>
          </div>
        )}

        {/* ══ SETUP 1 ══ */}
        {screen === "setup" && setupStep === 1 && (
          <div style={S.screen}>
            <h2 style={S.title}>Montar Duplas</h2>

            <button
              style={{ ...S.shuffleBtn, background: shuffleFlash?"#16a34a":"#0f2d1a", borderColor: shuffleFlash?"#22c55e":"#14532d" }}
              onClick={randomizeDuplas}>
              <span style={{ fontSize:18 }}>🎲</span>
              <div>
                <div style={{ fontWeight:800, fontSize:14 }}>Sortear Duplas</div>
                <div style={{ fontSize:11, color:"#86efac", opacity:0.8 }}>clique para montar aleatoriamente</div>
              </div>
              {shuffleFlash && <span style={{ marginLeft:"auto", fontSize:13, color:"#86efac" }}>✓ sorteado!</span>}
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, height:1, background:"#1e3a5f" }}/>
              <span style={{ fontSize:11, color:"#334155", fontWeight:700 }}>ou monte manualmente</span>
              <div style={{ flex:1, height:1, background:"#1e3a5f" }}/>
            </div>

            <div style={S.teamsRow}>
              <div style={{ ...S.teamBox, borderColor: selectingFor==="A"?"#f59e0b":"#1e3a5f" }} onClick={() => setSelectingFor("A")}>
                <div style={S.teamLabel}>Dupla A</div>
                {teamA.map(p => (
                  <div key={p} style={S.teamPlayer}>
                    <span style={S.avatarSm}>{p[0]}</span>{p}
                    <button style={S.removeBtn} onClick={e => { e.stopPropagation(); removeFromTeam("A",p); }}>✕</button>
                  </div>
                ))}
                {teamA.length<2 && <div style={S.emptySlot}>{selectingFor==="A"?"← selecione":"vazio"}</div>}
              </div>
              <div style={S.vsSmall}>vs</div>
              <div style={{ ...S.teamBox, borderColor: selectingFor==="B"?"#10b981":"#1e3a5f" }} onClick={() => setSelectingFor("B")}>
                <div style={S.teamLabel}>Dupla B</div>
                {teamB.map(p => (
                  <div key={p} style={S.teamPlayer}>
                    <span style={S.avatarSm}>{p[0]}</span>{p}
                    <button style={S.removeBtn} onClick={e => { e.stopPropagation(); removeFromTeam("B",p); }}>✕</button>
                  </div>
                ))}
                {teamB.length<2 && <div style={S.emptySlot}>{selectingFor==="B"?"← selecione":"vazio"}</div>}
              </div>
            </div>

            {bench.length > 0 && (
              <div style={S.benchSection}>
                <div style={S.benchLabel}>Disponíveis — toque para escalar</div>
                <div style={S.benchRow}>
                  {bench.map(p => (
                    <button key={p} style={{ ...S.benchChip, opacity: selectingFor?1:0.6 }} onClick={() => pickPlayer(p)}>
                      <span style={S.avatarSm}>{p[0]}</span>{p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={S.addRow}>
              <input style={S.input} placeholder="Adicionar jogador..." value={newPlayer}
                onChange={e => setNewPlayer(e.target.value)}
                onKeyDown={e => e.key==="Enter" && addPlayer()} />
              <button style={S.addBtn} onClick={addPlayer}>+</button>
            </div>
            <div style={S.rowBtns}>
              <button style={S.ghostBtn} onClick={() => { setSetupStep(0); setTeamA([]); setTeamB([]); setBench([]); }}>← Voltar</button>
              <button style={{ ...S.bigBtn, flex:1, opacity: teamA.length===2&&teamB.length===2?1:0.4 }}
                disabled={teamA.length<2||teamB.length<2} onClick={startGame}>
                🏁 Iniciar Jogo
              </button>
            </div>
          </div>
        )}

        {/* ══ GAME ══ */}
        {screen === "game" && (
          <div style={S.screen}>
            {matchWinner && (
              <div style={S.winnerBanner}>
                <div style={{ fontSize:34 }}>🏆</div>
                <div style={{ fontWeight:800, fontSize:15, textAlign:"center" }}>
                  {(matchWinner==="A"?teamA:teamB).join(" / ")} venceu!
                </div>
                <div style={{ fontWeight:900, fontSize:26, color:"#fbbf24" }}>{setsA} × {setsB}</div>
                <div style={{ fontSize:11, color:"#86efac" }}>✓ Salvo no ranking</div>
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  <button style={S.winnerBtn} onClick={resetMatch}>Nova Partida</button>
                  <button style={S.winnerBtn} onClick={() => doRotation(matchWinner)}>🔄 Rotacionar</button>
                </div>
              </div>
            )}

            <div style={S.cameraBox}>
              <div style={S.cameraLabel}>📷 CÂMERA AO VIVO</div>
              <div style={S.cameraFake}><div style={S.recDot}/><span style={S.recText}>● REC</span></div>
            </div>

            <div style={S.setsRow}>
              <div style={S.setsTeamBlock}>
                <span style={S.setsTeamName}>{teamA.join(" / ")}</span>
                <SetDots won={setsA} total={totalSetsPlayed}/>
                <span style={S.setsCount}>{setsA} set{setsA!==1?"s":""}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"0 6px", gap:2 }}>
                <span style={{ fontSize:9, color:"#334155", fontWeight:700 }}>Melhor de {bestOf}</span>
                <span style={{ color:"#1e3a5f", fontWeight:900, fontSize:10, letterSpacing:1 }}>SETS</span>
                <span style={{ fontSize:9, color:"#334155" }}>ganhar {setsToWin}</span>
              </div>
              <div style={S.setsTeamBlock}>
                <span style={S.setsTeamName}>{teamB.join(" / ")}</span>
                <SetDots won={setsB} total={totalSetsPlayed}/>
                <span style={S.setsCount}>{setsB} set{setsB!==1?"s":""}</span>
              </div>
            </div>

            <div style={S.scoreSection}>
              <div style={{ ...S.scoreTeam, background: flash==="A"?"rgba(245,158,11,0.15)":"transparent" }}>
                <div style={S.teamNameScore}>{teamA.map(p => <span key={p} style={S.playerPillA}>{p}</span>)}</div>
                <div style={{ ...S.scoreNum, color:"#f59e0b" }}>{currentLabelA}</div>
                <div style={S.scoreControls}>
                  <button style={{ ...S.ptBtn, background:"#f59e0b22", color:"#f59e0b" }} onClick={() => addPoint("A")}>+1</button>
                  <button style={{ ...S.ptBtn, background:"#1e293b", color:"#475569" }} onClick={() => removePoint("A")}>−</button>
                </div>
              </div>
              <div style={{ color:"#1e3a5f", fontWeight:900, fontSize:24, padding:"0 2px" }}>×</div>
              <div style={{ ...S.scoreTeam, background: flash==="B"?"rgba(16,185,129,0.15)":"transparent" }}>
                <div style={S.teamNameScore}>{teamB.map(p => <span key={p} style={S.playerPillB}>{p}</span>)}</div>
                <div style={{ ...S.scoreNum, color:"#10b981" }}>{currentLabelB}</div>
                <div style={S.scoreControls}>
                  <button style={{ ...S.ptBtn, background:"#10b98122", color:"#10b981" }} onClick={() => addPoint("B")}>+1</button>
                  <button style={{ ...S.ptBtn, background:"#1e293b", color:"#475569" }} onClick={() => removePoint("B")}>−</button>
                </div>
              </div>
            </div>

            <div style={S.progressRow}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, flex:1 }}>
                  <div style={{ width:9, height:9, borderRadius:"50%", background:"#f59e0b", opacity: pointIdxA>i?1:0.18, transition:"opacity 0.3s" }}/>
                  <span style={{ fontSize:9, color:"#334155", fontWeight:700 }}>{POINT_LABELS[POINT_SEQUENCE[i]]}</span>
                  <div style={{ width:9, height:9, borderRadius:"50%", background:"#10b981", opacity: pointIdxB>i?1:0.18, transition:"opacity 0.3s" }}/>
                </div>
              ))}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, flex:1 }}>
                <div style={{ width:9, height:9, borderRadius:"50%", background:"#f59e0b", opacity:0.1 }}/>
                <span style={{ fontSize:9, color:"#7c3aed", fontWeight:800 }}>SET</span>
                <div style={{ width:9, height:9, borderRadius:"50%", background:"#10b981", opacity:0.1 }}/>
              </div>
            </div>

            {sortedBenchDisplay.length > 0 && (
              <div style={S.benchBar}>
                <span style={S.benchBarLabel}>⏳ Fila:</span>
                {sortedBenchDisplay.map((p,idx) => (
                  <span key={p} style={S.benchPill}>
                    <span style={{ ...S.avatarXs, background: idx===0?"linear-gradient(135deg,#d97706,#b45309)":"linear-gradient(135deg,#1d4ed8,#7c3aed)" }}>{p[0]}</span>
                    {p}{benchSince[p]>0&&<span style={{ fontSize:9, color:"#475569", marginLeft:3 }}>{benchSince[p]}g</span>}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button style={{ ...S.replayBtn, background: flash==="replay"?"#7c3aed":"#312e81" }} onClick={saveReplay}>
                🎬 Salvar Replay
              </button>
            </div>

            {setHistory.length > 0 && (
              <div style={S.setHistoryBox}>
                <div style={S.setHistoryTitle}>Histórico de Sets</div>
                {setHistory.map(s => (
                  <div key={s.setNum} style={S.setHistoryRow}>
                    <span style={{ color:"#334155", fontWeight:700, minWidth:44, fontSize:12 }}>Set {s.setNum}</span>
                    <span style={{ color: s.winner==="A"?"#f59e0b":"#334155", fontWeight:700, fontSize:13 }}>{s.winner==="A"?"✓":" "}</span>
                    <span style={{ color:"#e2e8f0", fontWeight:900, fontSize:14 }}>{s.labelA} × {s.labelB}</span>
                    <span style={{ color: s.winner==="B"?"#10b981":"#334155", fontWeight:700, fontSize:13 }}>{s.winner==="B"?"✓":" "}</span>
                  </div>
                ))}
              </div>
            )}

            {gameLog.length > 0 && (
              <div style={{ background:"#061120", borderRadius:10, padding:10, border:"1px solid #1e3a5f" }}>
                {gameLog.slice(0,4).map((e,i) => (
                  <div key={i} style={{ display:"flex", gap:8, fontSize:11, marginBottom:3 }}>
                    <span style={{ color:"#334155", fontFamily:"monospace", minWidth:56 }}>{e.time}</span>
                    <span style={{ color: e.team==="A"?"#f59e0b":e.team==="B"?"#10b981":"#a78bfa" }}>
                      {e.type==="set"?`🏅 Set — Dupla ${e.team}`:e.type==="replay"?"🎬 replay":`ponto Dupla ${e.team}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ RANKING ══ */}
        {screen === "ranking" && (
          <div style={S.screen}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h2 style={S.title}>🏆 Ranking do Dia</h2>
              {!confirmReset ? (
                <button style={S.resetBtn} onClick={() => setConfirmReset(true)}>🗑 Reset</button>
              ) : (
                <div style={{ display:"flex", gap:6 }}>
                  <button style={{ ...S.resetBtn, background:"#7f1d1d", borderColor:"#ef4444", color:"#fca5a5" }} onClick={resetRanking}>Confirmar</button>
                  <button style={S.resetBtn} onClick={() => setConfirmReset(false)}>Cancelar</button>
                </div>
              )}
            </div>

            <div style={S.rankCard}>
              <div style={S.rankCardTitle}>👤 Jogadores — Vitórias individuais</div>
              {sortedPlayers.length === 0 ? (
                <div style={S.rankEmpty}>Nenhuma vitória registrada ainda.</div>
              ) : sortedPlayers.map((row, i) => {
                const pct = maxWins > 0 ? (row.wins / maxWins) * 100 : 0;
                const barColor = i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#cd7c3a":"#1d4ed8";
                return (
                  <div key={row.player_name} style={S.rankRow}>
                    <Medal rank={i}/>
                    <span style={S.avatarSm}>{row.player_name[0]}</span>
                    <span style={{ flex:1, fontWeight:700, fontSize:14 }}>{row.player_name}</span>
                    <div style={S.barWrap}><div style={{ ...S.barFill, width:`${pct}%`, background:barColor }}/></div>
                    <span style={{ fontWeight:900, fontSize:16, minWidth:28, textAlign:"right", color: row.wins>0?"#e2e8f0":"#334155" }}>{row.wins}</span>
                    <span style={{ fontSize:10, color:"#475569", marginLeft:2 }}>v</span>
                    <span style={{ fontSize:10, color:"#334155", marginLeft:4 }}>{row.games}j</span>
                  </div>
                );
              })}
            </div>

            <div style={S.rankCard}>
              <div style={S.rankCardTitle}>👥 Duplas — Melhores parceiras</div>
              {sortedDuos.length === 0 ? (
                <div style={S.rankEmpty}>Nenhuma dupla registrada ainda.</div>
              ) : sortedDuos.map((duo, i) => {
                const pct = sortedDuos[0].wins > 0 ? (duo.wins/sortedDuos[0].wins)*100 : 0;
                const barColor = i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#cd7c3a":"#1d4ed8";
                return (
                  <div key={duo.key} style={S.rankRow}>
                    <Medal rank={i}/>
                    <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
                      <span style={{ fontWeight:700, fontSize:13 }}>{duo.names.join(" / ")}</span>
                      <span style={{ fontSize:10, color:"#475569" }}>{duo.games} jogo{duo.games!==1?"s":""} • {duo.winRate}% aproveit.</span>
                    </div>
                    <div style={S.barWrap}><div style={{ ...S.barFill, width:`${pct}%`, background:barColor }}/></div>
                    <span style={{ fontWeight:900, fontSize:16, minWidth:28, textAlign:"right", color: duo.wins>0?"#e2e8f0":"#334155" }}>{duo.wins}</span>
                    <span style={{ fontSize:10, color:"#475569", marginLeft:2 }}>v</span>
                  </div>
                );
              })}
            </div>

            {matchHistory.length > 0 && (
              <div style={S.rankCard}>
                <div style={S.rankCardTitle}>📋 Histórico de partidas</div>
                {matchHistory.map((m,i) => (
                  <div key={m.id ?? i} style={{ marginBottom:10, paddingBottom:8, borderBottom:"1px solid #0a1628" }}>
                    <div style={{ fontSize:10, color:"#334155", marginBottom:4 }}>
                      {new Date(m.played_at).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13 }}>
                      <span style={{ color:"#22c55e", fontWeight:800 }}>🏆</span>
                      <span style={{ color:"#f1f5f9", fontWeight:700 }}>{m.winner_1} / {m.winner_2}</span>
                      <span style={{ color:"#475569", fontSize:12 }}>{m.sets_winner} × {m.sets_loser}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>vs {m.loser_1} / {m.loser_2}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ ROTATION ══ */}
        {screen === "rotation" && (
          <div style={S.screen}>
            <h2 style={S.title}>🔄 Fila & Rotações</h2>
            <div style={S.rotCard}>
              <div style={S.rotCardTitle}>Partida atual</div>
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#f59e0b", fontWeight:800, fontSize:11, marginBottom:4 }}>DUPLA A</div>
                  {teamA.map(p => (
                    <div key={p} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, marginBottom:3 }}>
                      <span style={S.avatarSm}>{p[0]}</span><span>{p}</span>
                      <span style={{ fontSize:10, color:"#334155", marginLeft:"auto" }}>{gamesPlayed[p]??0}j</span>
                    </div>
                  ))}
                </div>
                <div style={{ color:"#334155", fontWeight:900, alignSelf:"center" }}>vs</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#10b981", fontWeight:800, fontSize:11, marginBottom:4 }}>DUPLA B</div>
                  {teamB.map(p => (
                    <div key={p} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, marginBottom:3 }}>
                      <span style={S.avatarSm}>{p[0]}</span><span>{p}</span>
                      <span style={{ fontSize:10, color:"#334155", marginLeft:"auto" }}>{gamesPlayed[p]??0}j</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {sortedBenchDisplay.length > 0 && (
              <div style={S.rotCard}>
                <div style={S.rotCardTitle}>Fila de espera</div>
                {sortedBenchDisplay.map((p,idx) => (
                  <div key={p} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:600, background: idx===0?"#0f2d1a":idx===1?"#0f1d2d":"transparent", borderRadius:8, padding:"6px 8px", marginBottom:4 }}>
                    <span style={{ color:"#475569", fontWeight:800, fontSize:12, minWidth:20 }}>#{idx+1}</span>
                    <span style={{ ...S.avatarSm, background: idx<2?"linear-gradient(135deg,#16a34a,#15803d)":"linear-gradient(135deg,#1d4ed8,#7c3aed)" }}>{p[0]}</span>
                    <span style={{ fontWeight:700 }}>{p}</span>
                    <span style={{ fontSize:10, color:"#334155", marginLeft:"auto" }}>{gamesPlayed[p]??0}j</span>
                    <span style={{ fontSize:10, color:"#475569" }}>{(benchSince[p]??0)>0?`esp. ${benchSince[p]}`:""}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={S.rotCard}>
              <div style={S.rotCardTitle}>Todos os jogadores</div>
              {[...players].sort((a,b) => (gamesPlayed[b]??0)-(gamesPlayed[a]??0)).map(p => {
                const onCourt = teamA.includes(p)||teamB.includes(p);
                const onBench = bench.includes(p);
                return (
                  <div key={p} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, marginBottom:5 }}>
                    <span style={S.avatarSm}>{p[0]}</span>
                    <span style={{ flex:1 }}>{p}</span>
                    <span style={{ fontSize:10, color: onCourt?"#22c55e":onBench?"#f59e0b":"#475569", fontWeight:700, marginRight:6 }}>
                      {onCourt?"● quadra":onBench?"○ banco":""}
                    </span>
                    <span style={{ fontSize:10, color:"#334155" }}>{gamesPlayed[p]??0} jogos</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ REPLAYS ══ */}
        {screen === "replays" && (
          <div style={S.screen}>
            <h2 style={S.title}>🎬 Replays Salvos</h2>
            {replays.length === 0 ? (
              <div style={{ textAlign:"center", color:"#475569", marginTop:40, lineHeight:1.8, fontSize:14 }}>
                Nenhum replay ainda.<br/>Clique em "Salvar Replay" durante o jogo.
              </div>
            ) : replays.map(r => (
              <div key={r.id} style={S.replayCard}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontWeight:800, fontSize:14, color:"#a78bfa" }}>Replay #{r.id}</span>
                  <span style={{ fontSize:12, color:"#475569", fontFamily:"monospace" }}>{r.time}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12, fontWeight:700 }}>
                  <span style={{ color:"#f59e0b" }}>{r.teamA.join(" / ")}</span>
                  <span style={{ color:"#e2e8f0", fontWeight:900, fontSize:16 }}>{r.setsA}S × {r.setsB}S</span>
                  <span style={{ color:"#10b981" }}>{r.teamB.join(" / ")}</span>
                </div>
                <div style={{ fontSize:12, color:"#475569" }}>
                  Ponto: <span style={{ color:"#f59e0b" }}>{r.pointA}</span> × <span style={{ color:"#10b981" }}>{r.pointB}</span>
                </div>
                <button style={{ background:"#1e3a5f", border:"none", color:"#94a3b8", borderRadius:8, padding:"8px", fontWeight:700, fontSize:12, cursor:"pointer" }}>
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

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root:       { minHeight:"100vh", background:"#020c1b", display:"flex", justifyContent:"center", alignItems:"flex-start", fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:"0 0 40px" },
  app:        { width:"100%", maxWidth:420, background:"#0d1f35", minHeight:"100vh", display:"flex", flexDirection:"column", color:"#e2e8f0" },
  header:     { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:"#061120", borderBottom:"1px solid #1e3a5f", gap:6, flexWrap:"wrap" },
  logo:       { fontWeight:800, fontSize:17, letterSpacing:"-0.5px", color:"#f0c040" },
  navBtns:    { display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" },
  navBtn:     { background:"#1e3a5f", border:"none", color:"#94a3b8", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:13, fontWeight:600 },
  screen:     { padding:"16px", flex:1, display:"flex", flexDirection:"column", gap:12 },
  title:      { margin:0, fontSize:20, fontWeight:800, color:"#f1f5f9", letterSpacing:"-0.5px" },
  settingBox: { background:"#061120", borderRadius:14, padding:"14px 16px", border:"1px solid #1e3a5f", display:"flex", flexDirection:"column", gap:8 },
  settingLabel:    { fontSize:11, fontWeight:800, color:"#64748b", letterSpacing:1, textTransform:"uppercase" },
  settingControls: { display:"flex", gap:6, flexWrap:"wrap" },
  settingBtn:      { border:"none", borderRadius:8, padding:"6px 12px", fontWeight:700, fontSize:13, cursor:"pointer" },
  settingHint:     { fontSize:12, color:"#334155" },
  playerList: { display:"flex", flexDirection:"column", gap:7 },
  playerChip: { display:"flex", alignItems:"center", gap:10, background:"#122236", borderRadius:12, padding:"10px 14px", border:"1px solid #1e3a5f" },
  avatar:     { width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, color:"#fff", flexShrink:0 },
  avatarSm:   { width:22, height:22, borderRadius:"50%", background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:10, color:"#fff", marginRight:6, flexShrink:0 },
  avatarXs:   { width:16, height:16, borderRadius:"50%", background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:8, color:"#fff", marginRight:4, flexShrink:0 },
  playerName: { flex:1, fontWeight:600, fontSize:15 },
  removeBtn:  { background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:13, padding:"2px 4px" },
  addRow:     { display:"flex", gap:8 },
  input:      { flex:1, background:"#122236", border:"1px solid #1e3a5f", borderRadius:10, padding:"10px 14px", color:"#e2e8f0", fontSize:14, outline:"none" },
  addBtn:     { background:"#1d4ed8", border:"none", color:"#fff", borderRadius:10, width:42, fontSize:20, cursor:"pointer", fontWeight:700 },
  bigBtn:     { background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", border:"none", color:"#fff", borderRadius:12, padding:"14px", fontWeight:800, fontSize:16, cursor:"pointer" },
  ghostBtn:   { background:"#122236", border:"1px solid #1e3a5f", color:"#94a3b8", borderRadius:12, padding:"14px 16px", fontWeight:700, fontSize:14, cursor:"pointer" },
  rowBtns:    { display:"flex", gap:10, alignItems:"stretch" },
  shuffleBtn: { display:"flex", alignItems:"center", gap:12, border:"2px solid", borderRadius:14, padding:"14px 16px", cursor:"pointer", color:"#86efac", transition:"all 0.3s", textAlign:"left" },
  teamsRow:   { display:"flex", gap:10, alignItems:"flex-start" },
  teamBox:    { flex:1, background:"#0a192e", borderRadius:14, padding:12, border:"2px solid #1e3a5f", cursor:"pointer", transition:"border-color 0.2s", minHeight:80 },
  teamLabel:  { fontWeight:800, fontSize:11, color:"#64748b", marginBottom:6, letterSpacing:1, textTransform:"uppercase" },
  teamPlayer: { display:"flex", alignItems:"center", fontWeight:600, fontSize:13, marginBottom:3 },
  emptySlot:  { color:"#334155", fontSize:12, fontStyle:"italic", marginTop:4 },
  vsSmall:    { paddingTop:32, color:"#334155", fontWeight:900, fontSize:14 },
  benchSection:{ background:"#0a192e", borderRadius:12, padding:12, border:"1px solid #1e3a5f" },
  benchLabel: { fontWeight:800, fontSize:11, color:"#64748b", letterSpacing:1, textTransform:"uppercase", marginBottom:8 },
  benchRow:   { display:"flex", flexWrap:"wrap", gap:7 },
  benchChip:  { display:"flex", alignItems:"center", background:"#122236", border:"1px solid #1e3a5f", borderRadius:20, padding:"5px 10px", color:"#cbd5e1", fontWeight:600, fontSize:12, cursor:"pointer" },
  winnerBanner:{ background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", borderRadius:16, padding:"18px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:7, border:"1px solid #7c3aed" },
  winnerBtn:  { background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", color:"#fff", borderRadius:10, padding:"8px 14px", fontWeight:700, fontSize:13, cursor:"pointer" },
  cameraBox:  { background:"#000", borderRadius:14, overflow:"hidden", aspectRatio:"16/9", position:"relative", border:"2px solid #1e3a5f" },
  cameraLabel:{ position:"absolute", top:10, left:12, fontSize:10, fontWeight:700, color:"#475569", letterSpacing:1, zIndex:2 },
  cameraFake: { width:"100%", height:"100%", background:"radial-gradient(ellipse at center,#0d1f35 0%,#000 100%)", display:"flex", alignItems:"flex-end", justifyContent:"flex-end", padding:10 },
  recDot:     { width:7, height:7, borderRadius:"50%", background:"#ef4444", marginRight:4 },
  recText:    { fontSize:11, color:"#ef4444", fontWeight:700 },
  setsRow:    { display:"flex", alignItems:"center", background:"#061120", borderRadius:14, overflow:"hidden", border:"1px solid #1e3a5f" },
  setsTeamBlock:{ flex:1, padding:"10px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:5 },
  setsTeamName: { fontSize:10, color:"#475569", fontWeight:700, textAlign:"center", lineHeight:1.2 },
  setsCount:  { fontSize:11, fontWeight:800, color:"#64748b" },
  scoreSection:{ display:"flex", alignItems:"center", background:"#061120", borderRadius:16, overflow:"hidden", border:"1px solid #1e3a5f" },
  scoreTeam:  { flex:1, padding:"12px 8px", transition:"background 0.3s", display:"flex", flexDirection:"column", alignItems:"center", gap:5 },
  teamNameScore:{ display:"flex", gap:3, flexWrap:"wrap", justifyContent:"center" },
  playerPillA:{ background:"#f59e0b18", color:"#f59e0b", borderRadius:20, padding:"2px 7px", fontSize:10, fontWeight:700 },
  playerPillB:{ background:"#10b98118", color:"#10b981", borderRadius:20, padding:"2px 7px", fontSize:10, fontWeight:700 },
  scoreNum:   { fontSize:56, fontWeight:900, lineHeight:1, letterSpacing:"-2px" },
  scoreControls:{ display:"flex", gap:5 },
  ptBtn:      { border:"none", borderRadius:8, padding:"7px 12px", fontWeight:800, fontSize:15, cursor:"pointer" },
  progressRow:{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", background:"#061120", borderRadius:10, border:"1px solid #1e3a5f" },
  benchBar:   { display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", background:"#0a192e", borderRadius:10, padding:"7px 10px", border:"1px solid #1e3a5f" },
  benchBarLabel:{ fontSize:11, color:"#475569", fontWeight:700 },
  benchPill:  { display:"inline-flex", alignItems:"center", background:"#122236", borderRadius:20, padding:"3px 9px", fontSize:11, fontWeight:600, color:"#94a3b8" },
  replayBtn:  { flex:1, border:"none", borderRadius:12, padding:"13px", color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer", transition:"background 0.3s" },
  setHistoryBox:{ background:"#061120", borderRadius:12, padding:"10px 14px", border:"1px solid #1e3a5f" },
  setHistoryTitle:{ fontSize:10, fontWeight:800, color:"#475569", letterSpacing:1, textTransform:"uppercase", marginBottom:6 },
  setHistoryRow:{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0", borderBottom:"1px solid #0a1628" },
  replayCard: { background:"#0a192e", borderRadius:14, padding:14, border:"1px solid #1e3a5f", display:"flex", flexDirection:"column", gap:7 },
  rotCard:    { background:"#061120", borderRadius:14, padding:"12px 14px", border:"1px solid #1e3a5f", display:"flex", flexDirection:"column", gap:6 },
  rotCardTitle:{ fontSize:11, fontWeight:800, color:"#475569", letterSpacing:1, textTransform:"uppercase", marginBottom:4 },
  rankCard:   { background:"#061120", borderRadius:14, padding:"14px", border:"1px solid #1e3a5f", display:"flex", flexDirection:"column", gap:8 },
  rankCardTitle:{ fontSize:11, fontWeight:800, color:"#64748b", letterSpacing:1, textTransform:"uppercase", marginBottom:4 },
  rankEmpty:  { color:"#334155", fontSize:13, textAlign:"center", padding:"12px 0" },
  rankRow:    { display:"flex", alignItems:"center", gap:8, padding:"4px 0" },
  barWrap:    { width:55, height:6, background:"#122236", borderRadius:3, overflow:"hidden", flexShrink:0 },
  barFill:    { height:"100%", borderRadius:3, transition:"width 0.5s ease" },
  resetBtn:   { background:"#122236", border:"1px solid #1e3a5f", color:"#64748b", borderRadius:8, padding:"6px 12px", fontWeight:700, fontSize:12, cursor:"pointer" },
};
