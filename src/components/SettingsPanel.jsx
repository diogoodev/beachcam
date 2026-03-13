import React, { useState } from 'react';

export function SettingsPanel({ h, onClose }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

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
          {/* Match Format */}
          <section>
            <h3 className="text-xs font-bold text-gray-sub tracking-widest uppercase mb-3">Formato da Partida</h3>
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
              {[3, 5, 7].map(n => (
                <button 
                  key={n}
                  onClick={() => h.setBestOf(n)}
                  className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase transition-all ${
                    h.bestOf === n 
                      ? "bg-[var(--neon-blue)] text-black shadow-lg" 
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Melhor de {n}
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-white/5 w-full"></div>

          {/* Session Actions */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-sub tracking-widest uppercase mb-1">Ações</h3>
            
            {/* End Session */}
            {!confirmEnd ? (
              <button 
                onClick={() => setConfirmEnd(true)}
                className="btn-shimmer w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors text-red-400"
              >
                <span className="material-symbols-outlined">logout</span>
                Encerrar Sessão Atual
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => { h.endSession(); setConfirmEnd(false); onClose(); }}
                  className="btn-shimmer flex-[2] bg-red-900/80 hover:bg-red-700 border border-red-500/30 py-4 rounded-xl font-black uppercase tracking-wider text-white transition-colors"
                >
                  Confirmar Encerramento
                </button>
                <button 
                  onClick={() => setConfirmEnd(false)}
                  className="flex-1 bg-white/10 py-4 rounded-xl font-bold uppercase transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}

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
                  onClick={() => { h.resetRanking(); setConfirmReset(false); onClose(); }}
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
