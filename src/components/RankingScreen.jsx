import React, { useState } from 'react';
import { S } from '../styles/theme';
import { Medal } from './Common';

export function RankingScreen({ h }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const sortedPlayers = [...h.rankingRows].sort((a,b) => b.wins - a.wins);
  const maxWins       = sortedPlayers[0]?.wins ?? 1;

  const sortedDuos = Object.entries(h.duoStats)
    .map(([key, v]) => ({ key, names: key.split("|"), ...v, winRate: v.games > 0 ? Math.round((v.wins/v.games)*100) : 0 }))
    .sort((a,b) => b.wins - a.wins || b.winRate - a.winRate);

  return (
    <div style={S.screen}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2 style={S.title}>🏆 Ranking</h2>
        {!confirmReset ? (
          <button style={S.resetBtn} onClick={() => setConfirmReset(true)}>🗑 Reset</button>
        ) : (
          <div style={{ display:"flex", gap:6 }}>
            <button style={{ ...S.resetBtn, background:"#7f1d1d", color:"#fff" }} onClick={() => { h.resetRanking(); setConfirmReset(false); }}>Confirmar</button>
            <button style={S.resetBtn} onClick={() => setConfirmReset(false)}>X</button>
          </div>
        )}
      </div>

      <div style={S.rankCard}>
        <div style={S.rankCardTitle}>👤 Jogadores</div>
        {sortedPlayers.map((row, i) => {
          const pct = (row.wins / maxWins) * 100;
          return (
            <div key={row.player_name} style={S.rankRow}>
              <Medal rank={i}/>
              <span style={{ flex:1, fontSize:14 }}>{row.player_name}</span>
              <div style={S.barWrap}><div style={{ ...S.barFill, width:`${pct}%`, background:"#1d4ed8" }}/></div>
              <span style={{ fontWeight:900, minWidth:24, textAlign:"right" }}>{row.wins}</span>
            </div>
          );
        })}
      </div>

      <div style={S.rankCard}>
        <div style={S.rankCardTitle}>📋 Histórico de partidas</div>
        {h.matchHistory.map((m, i) => (
          <div key={m.id ?? i} style={{ marginBottom:8, fontSize:12, borderBottom:"1px solid #0a1628", paddingBottom:4 }}>
            <div style={{ color:"#22c55e", fontWeight:800 }}>🏆 {m.winner_1} / {m.winner_2}</div>
            <div style={{ color:"#475569" }}>vs {m.loser_1} / {m.loser_2} ({m.sets_winner}x{m.sets_loser})</div>
          </div>
        ))}
      </div>
    </div>
  );
}
