import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  // Se não estiver pronto pra offline nem precisar de refresh, não renderiza nada
  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] sm:bottom-24 right-4 z-[9999] bg-[#0a0a0a] border border-white/20 p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-w-sm w-[calc(100vw-2rem)] animate-slideUp">
      <div className="flex gap-4 items-center mb-3">
        <span className="material-symbols-outlined text-[var(--neon-green)] text-3xl">
          {needRefresh ? "update" : "cloud_done"}
        </span>
        <div className="flex-1">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-1">
            {needRefresh ? "Atualização Disponível" : "App Pronto"}
          </h3>
          <p className="text-white/50 text-xs text-balance leading-tight">
            {needRefresh 
              ? "Uma nova versão do BeachCam está disponível para uso." 
              : "O aplicativo foi instalado e pode funcionar offline."}
          </p>
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <button 
          className="px-4 py-2 border border-white/10 rounded-lg text-white/50 text-xs font-bold uppercase transition-colors hover:bg-white/5 hover:text-white active:scale-95" 
          onClick={close}
        >
          Fechar
        </button>
        {needRefresh && (
          <button 
            className="btn-shimmer bg-[var(--neon-blue)] text-black px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all shadow-[0_0_15px_rgba(0,245,255,0.3)] hover:scale-105 active:scale-95" 
            onClick={() => updateServiceWorker(true)}
          >
            Recarregar App
          </button>
        )}
      </div>
    </div>
  )
}
