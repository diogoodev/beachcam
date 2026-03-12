import React from 'react';

export function SetDots({ won, total }) {
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

export function Medal({ rank }) {
  if (rank === 0) return <span style={{fontSize:18}}>🥇</span>;
  if (rank === 1) return <span style={{fontSize:18}}>🥈</span>;
  if (rank === 2) return <span style={{fontSize:18}}>🥉</span>;
  return <span style={{fontSize:13, color:"#334155", fontWeight:800, minWidth:24, textAlign:"center"}}>#{rank+1}</span>;
}

export function SyncBadge({ status }) {
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
