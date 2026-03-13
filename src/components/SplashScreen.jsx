import React, { useEffect, useState } from 'react';

export function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState("idle");
  // phases: idle (0-1200ms), shoot (1200ms-2400ms), fadeout (2400ms-2800ms)

  useEffect(() => {
    // Atraso inicial para a bola "estourar"
    const t1 = setTimeout(() => setPhase("shoot"), 1200);
    // Tempo para começar a desvanecer a tela inteira
    const t2 = setTimeout(() => setPhase("fadeout"), 2400);
    // Termina e desmonta a SplashScreen
    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-500 overflow-hidden ${phase === "fadeout" ? "opacity-0" : "opacity-100"}`}>
      
      {/* Container gráfico */}
      <div className="relative flex flex-col items-center justify-center -mt-10">
        
        {/* SVG Animado da Raquete e Bola */}
        <svg width="250" height="300" viewBox="0 0 200 250" className="overflow-visible">
          <defs>
            {/* Gradiente da Raquete (Yellow to Cyan) */}
            <linearGradient id="racket-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C6FF00" />
              <stop offset="100%" stopColor="#00F5FF" />
            </linearGradient>

            {/* Brilho da Bola (Pink) */}
            <filter id="pink-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Brilho geral da Raquete */}
            <filter id="racket-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Gradiente do Rastro (Trail) */}
            <linearGradient id="trail-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF00A0" stopOpacity="0" />
              <stop offset="30%" stopColor="#FF00A0" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF00A0" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* ONDA DE CHOQUE (Shockwave) */}
          <ellipse 
            cx="100" cy="120" rx="45" ry="12" 
            fill="none" stroke="#FF00A0" strokeWidth="4" 
            className={`origin-center ${phase === "shoot" ? "animate-shockwave" : "opacity-0"}`}
            style={{ transformOrigin: '100px 120px' }}
            filter="url(#pink-glow)"
          />

          {/* RASTRO DA BOLA (Ball Trail) */}
          <rect 
            x="85" y="0" width="30" height="120" 
            fill="url(#trail-grad)" 
            className={`transition-all duration-700 ease-out origin-bottom ${phase === "shoot" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}
            style={{ transformOrigin: "100px 120px" }}
          />

          {/* RAQUETE (Com obturador/shutter) */}
          <g filter="url(#racket-glow)">
            <g transform="rotate(45 100 120)">
              {/* Pescoço do cabo */}
              <path d="M 90 160 L 80 180 L 120 180 L 110 160 Z" fill="url(#racket-grad)" />
              {/* Cabo (Grip) */}
              <rect x="85" y="180" width="30" height="35" rx="3" fill="url(#racket-grad)" />
              {/* Base do cabo (Pommel) */}
              <rect x="80" y="215" width="40" height="10" rx="4" fill="url(#racket-grad)" />

              {/* Cabeça da Raquete (Aro exterior) */}
              <circle cx="100" cy="120" r="42" fill="none" stroke="url(#racket-grad)" strokeWidth="10" />

              {/* Aro interior do obturador */}
              <circle cx="100" cy="120" r="24" fill="none" stroke="url(#racket-grad)" strokeWidth="2.5" opacity="0.9" />

              {/* Lâminas do Obturador (Shutter Blades) */}
              <g stroke="url(#racket-grad)" strokeWidth="2.5" opacity="0.9">
                <line x1="86"  y1="100" x2="63"  y2="105" />
                <line x1="114" y1="100" x2="137" y2="105" />
                <line x1="100" y1="96"  x2="114" y2="78" />
                <line x1="86"  y1="140" x2="63"  y2="135" />
                <line x1="114" y1="140" x2="137" y2="135" />
                <line x1="100" y1="144" x2="86"  y2="162" />
              </g>
            </g>
          </g>

          {/* PARTÍCULAS EXALANDO */}
          <g className={`transition-all duration-700 ease-out origin-center ${phase === "shoot" ? "opacity-100" : "opacity-0 scale-50"}`} style={{ transformOrigin: "100px 120px" }}>
            <circle cx="65" cy="95" r="3" fill="#FF00A0" filter="url(#pink-glow)" className={phase === "shoot" ? "animate-particle-1" : ""} />
            <circle cx="135" cy="105" r="2" fill="#FF00A0" filter="url(#pink-glow)" className={phase === "shoot" ? "animate-particle-2" : ""} />
            <circle cx="75" cy="145" r="3.5" fill="#FF00A0" filter="url(#pink-glow)" className={phase === "shoot" ? "animate-particle-3" : ""} />
            <circle cx="125" cy="140" r="2.5" fill="#FF00A0" filter="url(#pink-glow)" className={phase === "shoot" ? "animate-particle-4" : ""} />
            <circle cx="95" cy="65" r="3" fill="#FF00A0" filter="url(#pink-glow)" className={phase === "shoot" ? "animate-particle-5" : ""} />
            <circle cx="145" cy="120" r="2" fill="#FF00A0" filter="url(#pink-glow)" className={phase === "shoot" ? "animate-particle-6" : ""} />
          </g>

          {/* BOLA DE BEACH TENNIS (Com linha em 'S') */}
          <g 
            className={`transition-all duration-[650ms] ease-in-out ${phase === "shoot" ? "-translate-y-44 scale-125 opacity-0" : "translate-y-0 scale-100 opacity-100"}`}
          >
            <circle cx="100" cy="120" r="16" fill="#FF00A0" filter="url(#pink-glow)" />
            {/* Linha da bola de beach tennis */}
            <path d="M 91 113 Q 100 105, 109 113 T 109 127" fill="none" stroke="#FFF" strokeWidth="2.5" opacity="0.9" />
          </g>
        </svg>

        {/* TEXTO: BEACHCAM */}
        <div className="mt-4 relative flex items-center justify-center">
          <h1 className={`heading-font text-5xl sm:text-6xl font-black tracking-widest transition-all duration-700 ${phase === "shoot" ? "splash-text-glow" : "splash-text-solid"}`}>
            BEACHCAM
          </h1>
        </div>

      </div>

      {/* LINHA DE GRADIENTE BASE */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--neon-green)] to-[var(--neon-blue)] shadow-[0_-5px_15px_rgba(0,245,255,0.4)]"></div>
    </div>
  );
}
