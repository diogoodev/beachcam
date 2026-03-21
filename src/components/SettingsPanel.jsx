import React, { useState, useEffect } from 'react';

export function SettingsPanel({ players, removePlayer, resetRanking, teamA = [], teamB = [], bench = [], onClose }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] z-[101] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transform transition-transform animate-slideUp">
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="heading-font text-2xl font-black italic text-white uppercase tracking-widest">Configurações</h2>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-full text-white/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* DB Management */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-sub tracking-widest uppercase mb-3 text-[var(--neon-blue)]">Gestão de Jogadores</h3>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden max-h-[30vh] overflow-y-auto">
              {players.length === 0 ? (
                <div className="p-4 text-center text-white/50 text-xs">Nenhum jogador no banco de dados.</div>
              ) : players.map(p => {
                const isInSession = [...teamA, ...teamB, ...bench].includes(p);
                return (
                  <div key={p} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{p}</span>
                      {isInSession && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full border border-yellow-400/20">
                          em sessão
                        </span>
                      )}
                    </div>
                    {playerToDelete === p ? (
                      <div className="flex flex-col gap-1 items-end">
                        {isInSession && (
                          <span className="text-yellow-400 text-[9px] font-bold">Jogador ainda em quadra/fila!</span>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => { removePlayer(p); setPlayerToDelete(null); }} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-lg font-bold">Confirmar</button>
                          <button onClick={() => setPlayerToDelete(null)} className="text-xs bg-white/10 text-white px-3 py-1 rounded-lg">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setPlayerToDelete(p)} className="text-white/30 hover:text-red-400 transition-colors p-1">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-white/40 text-center uppercase tracking-widest mt-1">Excluir removerá o jogador do banco de dados.</p>
          </section>

          <div className="h-px bg-white/5 w-full"></div>

          {/* Session Actions */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-sub tracking-widest uppercase mb-1">Sistema</h3>
            
            {/* Reset Ranking */}
            {!confirmReset ? (
              <button 
                onClick={() => setConfirmReset(true)}
                className="btn-shimmer w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors text-white/50"
              >
                <span className="material-symbols-outlined">delete_forever</span>
                Zerar Todo o Ranking
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => { resetRanking(); setConfirmReset(false); onClose(); }}
                  className="btn-shimmer flex-[2] bg-red-900/80 hover:bg-red-700 border border-red-500/30 py-4 rounded-xl font-black uppercase tracking-wider text-white transition-colors"
                >
                  Confirmar Reset Geral
                </button>
                <button 
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 bg-white/10 py-4 rounded-xl font-bold uppercase transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </section>

          {/* App Info */}
          <section className="text-center mt-4">
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">BeachCam OS v4.1</p>
          </section>
        </div>
      </div>
    </>
  );
}
