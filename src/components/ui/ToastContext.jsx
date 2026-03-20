import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timersRef.current.delete(id);
    }, duration);
    timersRef.current.set(id, timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 max-w-[90vw] pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`
              px-4 py-3 rounded-xl shadow-lg text-white font-bold text-sm tracking-wide
              animate-[slide-up_0.3s_ease-out] backdrop-blur-md
              ${toast.type === 'error' ? 'bg-red-500/90 border border-red-500/50' : ''}
              ${toast.type === 'success' ? 'bg-[var(--neon-green)]/90 border border-[var(--neon-green)]/50 text-[#0f172a]' : ''}
              ${toast.type === 'info' ? 'bg-white/10 text-white border border-white/20' : ''}
            `}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
