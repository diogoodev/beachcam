import React, { useEffect, useState } from 'react';

export function MatchSettingsModal({ bestOf, setBestOf, setsA, setsB, teamA, teamB, cancelMatch, onClose }) {
  const [confirmCancel, setConfirmCancel] = useState(false);

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
          <h2 className="heading-font text-2xl font-black italic text-white uppercase tracking-widest">Ajustes da Partida</h2>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-full text-white/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* Match Format */}
          <section>
            <h3 className="text-xs font-bold text-gray-sub tracking-widest uppercase mb-3">Formato da Partida</h3>
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
              {[3, 5, 7].map(n => {
                const newSetsToWin = Math.ceil(n / 2);
                // Prevent reducing bestOf when both teams already have enough sets to win
                const wouldEndImmediately = (setsA >= newSetsToWin || setsB >= newSetsToWin) && n < bestOf;
                return (
                  <button 
                    key={n}
                    onClick={() => !wouldEndImmediately && setBestOf(n)}
                    disabled={wouldEndImmediately}
                    className={`flex-1 py-4 rounded-lg font-bold text-xs uppercase transition-all ${
                      bestOf === n 
                        ? "bg-[var(--neon-blue)] text-black shadow-lg" 
                        : wouldEndImmediately
                          ? "text-white/20 cursor-not-allowed"
                          : "text-white/50 hover:text-white"
                    }`}
                  >
                    Melhor de {n}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-white/40 mt-2 text-center">
              Altere o número máximo de sets desta partida.
            </p>
          </section>

          <div className="h-px bg-white/5 w-full"></div>

          {/* Danger Zone: Cancel Match */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-sub tracking-widest uppercase mb-1">Ações Críticas</h3>
            
            {!confirmCancel ? (
              <button 
                onClick={() => setConfirmCancel(true)}
                className="btn-shimmer w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors text-red-400"
              >
                <span className="material-symbols-outlined">cancel</span>
                Cancelar Partida Atual
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-red-400 text-xs text-center px-4">
                  Certeza? Os pontos desta partida serão descartados e todos voltarão para a Fila.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { cancelMatch(); setConfirmCancel(false); onClose(); }}
                    className="btn-shimmer flex-[2] bg-red-900/80 hover:bg-red-700 border border-red-500/30 py-4 rounded-xl font-black uppercase tracking-wider text-white transition-colors"
                  >
                    Sim, Cancelar
                  </button>
                  <button 
                    onClick={() => setConfirmCancel(false)}
                    className="flex-1 bg-white/10 py-4 rounded-xl font-bold uppercase transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
