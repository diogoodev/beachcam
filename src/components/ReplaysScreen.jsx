import React from 'react';
import { S } from '../styles/theme';

export function ReplaysScreen({ h }) {
  return (
    <div style={S.screen}>
      <h2 style={S.title}>🎬 Replays</h2>
      {h.replays.length === 0 ? (
        <div style={{ textAlign:"center", color:"#475569", marginTop:40, fontSize:14 }}>
          Nenhum replay salvo ainda.
        </div>
      ) : h.replays.map(r => (
        <div key={r.id} style={S.replayCard}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontWeight:800, fontSize:14, color:"#a78bfa" }}>Replay #{r.id}</span>
            <span style={{ fontSize:12, color:"#475569" }}>{r.time}</span>
          </div>
          <div style={{ fontSize:13, fontWeight:700 }}>
            {r.teamA.join(" / ")} vs {r.teamB.join(" / ")}
          </div>
          <div style={{ fontSize:12, color:"#94a3b8" }}>
            Placar final: {r.setsA}x{r.setsB} (Ponto: {r.pointA}x{r.pointB})
          </div>
        </div>
      ))}
    </div>
  );
}
