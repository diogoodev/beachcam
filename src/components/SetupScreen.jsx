import React, { useState } from 'react';
import { S } from '../styles/theme';
import { shuffle } from '../utils/gameLogic';

export function SetupScreen({ h }) {
  const [step, setStep] = useState(0);
  const [selectingFor, setSelectingFor] = useState(null);
  const [newPlayer, setNewPlayer] = useState("");
  const [shuffleFlash, setShuffleFlash] = useState(false);

  const handleAdd = () => {
    if (newPlayer.trim()) {
      h.addPlayer(newPlayer.trim());
      setNewPlayer("");
    }
  };

  const randomize = () => {
    const sh = shuffle(h.players);
    h.setTeamA(sh.slice(0, 2));
    h.setTeamB(sh.slice(2, 4));
    h.setBench(sh.slice(4));
    setShuffleFlash(true);
    setTimeout(() => setShuffleFlash(false), 800);
  };

  const pick = (name) => {
    if (!selectingFor) return;
    if (selectingFor === "A" && h.teamA.length < 2) {
      const next = [...h.teamA, name];
      h.setTeamA(next);
      h.setBench(b => b.filter(p => p !== name));
      if (next.length === 2) setSelectingFor("B");
    } else if (selectingFor === "B" && h.teamB.length < 2) {
      const next = [...h.teamB, name];
      h.setTeamB(next);
      h.setBench(b => b.filter(p => p !== name));
      if (next.length === 2) setSelectingFor(null);
    }
  };

  const remove = (team, name) => {
    if (team === "A") {
      h.setTeamA(t => t.filter(p => p !== name));
      h.setBench(b => [...b, name]);
    } else {
      h.setTeamB(t => t.filter(p => p !== name));
      h.setBench(b => [...b, name]);
    }
  };

  const hasLiveGame = h.activeLiveMatch && h.activeLiveMatch.screen === "game" && h.screen !== "game";

  if (step === 0) {
    return (
      <div style={S.screen}>
        {hasLiveGame && (
          <div 
            style={{
              background: "#16a34a", color: "#fff", padding: "12px", borderRadius: "8px", 
              marginBottom: "16px", cursor: "pointer", textAlign: "center", fontWeight: "bold",
              animation: "pulse 2s infinite"
            }}
            onClick={h.joinLiveMatch}
          >
            🎾 Jogo em andamento! Toque aqui para entrar na quadra.
          </div>
        )}
        <h2 style={S.title}>Jogadores da Partida</h2>
        <div style={S.settingBox}>
          <span style={S.settingLabel}>🏆 Formato</span>
          <div style={S.settingControls}>
            {[3, 5, 7].map(n => (
              <button key={n}
                style={{ ...S.settingBtn, background: h.bestOf === n ? "#1d4ed8" : "#122236", color: h.bestOf === n ? "#fff" : "#64748b" }}
                onClick={() => h.setBestOf(n)}>Melhor de {n}
              </button>
            ))}
          </div>
        </div>
        <div style={S.playerList}>
          {h.players.map(p => (
            <div key={p} style={S.playerChip}>
              <span style={S.avatar}>{p[0]}</span>
              <span style={S.playerName}>{p}</span>
              <button style={S.removeBtn} onClick={() => h.removePlayer(p)}>✕</button>
            </div>
          ))}
        </div>
        <div style={S.addRow}>
          <input style={S.input} placeholder="Nome..." value={newPlayer} onChange={e => setNewPlayer(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} />
          <button style={S.addBtn} onClick={handleAdd}>+</button>
        </div>
        <button style={{ ...S.bigBtn, opacity: h.players.length >= 4 ? 1 : 0.4 }} disabled={h.players.length < 4} onClick={() => { setStep(1); h.setBench([...h.players]); setSelectingFor("A"); }}>
          Montar Duplas →
        </button>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      <h2 style={S.title}>Montar Duplas</h2>
      <button style={{ ...S.shuffleBtn, background: shuffleFlash ? "#16a34a" : "#0f2d1a" }} onClick={randomize}>
        🎲 Sortear Duplas
      </button>
      <div style={S.teamsRow}>
        <div style={{ ...S.teamBox, borderColor: selectingFor === "A" ? "#f59e0b" : "#1e3a5f" }} onClick={() => setSelectingFor("A")}>
          <div style={S.teamLabel}>Dupla A</div>
          {h.teamA.map(p => (
            <div key={p} style={S.teamPlayer}>
              {p} <button style={S.removeBtn} onClick={(e) => { e.stopPropagation(); remove("A", p); }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ ...S.teamBox, borderColor: selectingFor === "B" ? "#10b981" : "#1e3a5f" }} onClick={() => setSelectingFor("B")}>
          <div style={S.teamLabel}>Dupla B</div>
          {h.teamB.map(p => (
            <div key={p} style={S.teamPlayer}>
              {p} <button style={S.removeBtn} onClick={(e) => { e.stopPropagation(); remove("B", p); }}>✕</button>
            </div>
          ))}
        </div>
      </div>
      <div style={S.benchSection}>
        <div style={S.benchLabel}>Disponíveis</div>
        <div style={S.benchRow}>
          {h.bench.map(p => <button key={p} style={S.benchChip} onClick={() => pick(p)}>{p}</button>)}
        </div>
      </div>
      <div style={S.rowBtns}>
        <button style={S.ghostBtn} onClick={() => setStep(0)}>← Voltar</button>
        <button style={{ ...S.bigBtn, flex: 1, opacity: h.teamA.length === 2 && h.teamB.length === 2 ? 1 : 0.4 }} disabled={h.teamA.length < 2 || h.teamB.length < 2} onClick={() => h.startGame(h.teamA, h.teamB, h.bench)}>
          🏁 Iniciar Jogo
        </button>
      </div>
    </div>
  );
}
