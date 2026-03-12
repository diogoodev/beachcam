import React from 'react';
import { S } from '../styles/theme';
import { SetDots } from './Common';
import { POINT_SEQUENCE, POINT_LABELS } from '../utils/constants';

export function GameScreen({ h }) {
  const totalSetsPlayed = Math.max(h.setsA + h.setsB, h.setsToWin);
  const currentLabelA   = POINT_LABELS[POINT_SEQUENCE[h.pointIdxA]] ?? "0";
  const currentLabelB   = POINT_LABELS[POINT_SEQUENCE[h.pointIdxB]] ?? "0";

  const sortedBenchDisplay = [...h.bench].sort((a,b) => {
    const d = (h.benchSince[b]??0) - (h.benchSince[a]??0);
    return d !== 0 ? d : (h.gamesPlayed[a]??0) - (h.gamesPlayed[b]??0);
  });

  return (
    <div style={S.screen}>
      {h.matchWinner && (
        <div style={S.winnerBanner}>
          <div style={{ fontSize:34 }}>🏆</div>
          <div style={{ fontWeight:800, fontSize:15, textAlign:"center" }}>
            {(h.matchWinner==="A"?h.teamA:h.teamB).join(" / ")} venceu!
          </div>
          <div style={{ fontWeight:900, fontSize:26, color:"#fbbf24" }}>{h.setsA} × {h.setsB}</div>
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <button style={S.winnerBtn} onClick={() => h.resetMatch()}>Nova Partida</button>
            <button style={S.winnerBtn} onClick={() => h.doRotation(h.matchWinner)}>🔄 Rotacionar</button>
          </div>
        </div>
      )}

      <div style={S.cameraBox}>
        <div style={S.cameraLabel}>📷 CÂMERA AO VIVO</div>
        <div style={S.cameraFake}><div style={S.recDot}/><span style={S.recText}>● REC</span></div>
      </div>

      <div style={S.setsRow}>
        <div style={S.setsTeamBlock}>
          <span style={S.setsTeamName}>{h.teamA.join(" / ")}</span>
          <SetDots won={h.setsA} total={totalSetsPlayed}/>
          <span style={S.setsCount}>{h.setsA} set{h.setsA!==1?"s":""}</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"0 6px", gap:2 }}>
          <span style={{ fontSize:9, color:"#334155", fontWeight:700 }}>Melhor de {h.bestOf}</span>
          <span style={{ color:"#1e3a5f", fontWeight:900, fontSize:10, letterSpacing:1 }}>SETS</span>
        </div>
        <div style={S.setsTeamBlock}>
          <span style={S.setsTeamName}>{h.teamB.join(" / ")}</span>
          <SetDots won={h.setsB} total={totalSetsPlayed}/>
          <span style={S.setsCount}>{h.setsB} set{h.setsB!==1?"s":""}</span>
        </div>
      </div>

      <div style={S.scoreSection}>
        <div style={{ ...S.scoreTeam, background: h.flash==="A"?"rgba(245,158,11,0.15)":"transparent" }}>
          <div style={S.teamNameScore}>{h.teamA.map(p => <span key={p} style={S.playerPillA}>{p}</span>)}</div>
          <div style={{ ...S.scoreNum, color:"#f59e0b" }}>{currentLabelA}</div>
          <div style={S.scoreControls}>
            <button style={{ ...S.ptBtn, background:"#f59e0b22", color:"#f59e0b" }} onClick={() => h.addPoint("A")}>+1</button>
            <button style={{ ...S.ptBtn, background:"#1e293b", color:"#475569" }} onClick={() => h.removePoint("A")}>−</button>
          </div>
        </div>
        <div style={{ color:"#1e3a5f", fontWeight:900, fontSize:24, padding:"0 2px" }}>×</div>
        <div style={{ ...S.scoreTeam, background: h.flash==="B"?"rgba(16,185,129,0.15)":"transparent" }}>
          <div style={S.teamNameScore}>{h.teamB.map(p => <span key={p} style={S.playerPillB}>{p}</span>)}</div>
          <div style={{ ...S.scoreNum, color:"#10b981" }}>{currentLabelB}</div>
          <div style={S.scoreControls}>
            <button style={{ ...S.ptBtn, background:"#10b98122", color:"#10b981" }} onClick={() => h.addPoint("B")}>+1</button>
            <button style={{ ...S.ptBtn, background:"#1e293b", color:"#475569" }} onClick={() => h.removePoint("B")}>−</button>
          </div>
        </div>
      </div>

      {sortedBenchDisplay.length > 0 && (
        <div style={S.benchBar}>
          <span style={S.benchBarLabel}>⏳ Fila:</span>
          {sortedBenchDisplay.map((p,idx) => (
            <span key={p} style={S.benchPill}>
              {p}
            </span>
          ))}
        </div>
      )}

      {h.setHistory.length > 0 && (
        <div style={S.setHistoryBox}>
          <div style={S.setHistoryTitle}>Histórico de Sets</div>
          {h.setHistory.map(s => (
            <div key={s.setNum} style={S.setHistoryRow}>
              <span style={{ color:"#e2e8f0", fontWeight:900 }}>{s.labelA} × {s.labelB}</span>
              <span style={{ fontSize:10, color:"#475569" }}>Set {s.setNum}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
