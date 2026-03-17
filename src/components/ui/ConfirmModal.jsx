import React, { useEffect } from 'react';

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", isDestructive = false }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div className="bg-[#1e293b] border border-white/10 p-6 rounded-2xl w-[90%] max-w-sm shadow-2xl animate-[scale-in_0.2s_ease-out]">
        <h3 className="text-xl font-black text-white mb-2">{title}</h3>
        <p className="text-white/70 mb-6 text-sm leading-relaxed">{message}</p>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-[#0f172a] transition-all transform active:scale-95
              ${isDestructive 
                ? 'bg-red-500 hover:bg-red-400 text-white' 
                : 'bg-[var(--neon-green)] hover:brightness-110 shadow-[0_0_15px_rgba(204,255,0,0.3)]'
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
