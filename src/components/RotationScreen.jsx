import React from 'react';
import { S } from '../styles/theme';

export function RotationScreen({ h }) {
  const sortedBenchDisplay = [...h.bench].sort((a,b) => {
    const d = (h.benchSince[b]??0) - (h.benchSince[a]??0);
    return d !== 0 ? d : (h.gamesPlayed[a]??0) - (h.gamesPlayed[b]??0);
  });

  return (
    <div style={S.screen}>
      <h2 style={S.title}>🔄 Fila & Rotações</h2>
      <div style={S.rotCard}>
        <div style={S.rotCardTitle}>Na Quadra</div>
        <div style={{ display:"flex", gap:10, fontSize:13 }}>
          <div style={{ flex:1 }}>
            <div style={{ color:"#f59e0b", fontWeight:800 }}>A: {h.teamA.join(" / ")}</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ color:"#10b981", fontWeight:800 }}>B: {h.teamB.join(" / ")}</div>
          </div>
        </div>
      </div>

      <div style={S.rotCard}>
        <div style={S.rotCardTitle}>Fila de Espera</div>
        {sortedBenchDisplay.map((p, idx) => (
          <div key={p} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"4px 0", borderBottom:"1px solid #122236" }}>
            <span>#{idx+1} {p}</span>
            <span style={{ fontSize:10, color:"#475569" }}>{h.gamesPlayed[p]??0}j</span>
          </div>
        ))}
      </div>

      <div style={S.rotCard}>
        <div style={S.rotCardTitle}>Estatísticas de hoje</div>
        {h.players.map(p => (
          <div key={p} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"2px 0" }}>
            <span>{p}</span>
            <span>{h.gamesPlayed[p]??0} jogos</span>
          </div>
        ))}
      </div>
    </div>
  );
}
