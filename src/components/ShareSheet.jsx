import React, { useState, useEffect } from 'react';
import { renderRankingCard, renderMatchResultCard } from '../utils/shareCardRenderer';

export function ShareSheet({ type, data, isDuo = false, duoData = [], onClose }) {
  const [format, setFormat] = useState('story'); // 'story' or 'square'
  const [rankingType, setRankingType] = useState('jogadores'); // 'jogadores' | 'duplas' | 'ambos'
  const [previewUrl, setPreviewUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const prevUrlRef = React.useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    let active = true;
    
    // Revoke previous URL to prevent memory leak
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
    
    setIsGenerating(true);

    const generate = async () => {
      let newBlob = null;
      if (type === 'ranking') {
        newBlob = await renderRankingCard(data, isDuo, format, rankingType, duoData);
      } else if (type === 'match') {
        newBlob = await renderMatchResultCard(data, format);
      }
      
      if (active && newBlob) {
        const url = URL.createObjectURL(newBlob);
        prevUrlRef.current = url;
        setBlob(newBlob);
        setPreviewUrl(url);
        setIsGenerating(false);
      }
    };

    generate();
    return () => {
      active = false;
    };
  }, [type, data, isDuo, format, rankingType, duoData]);

  const handleShare = async (platform) => {
    if (!blob) return;
    
    const file = new File([blob], `beachcam-${type}-${Date.now()}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'BeachCam',
          text: type === 'ranking' ? 'Confira o ranking do BeachCam!' : 'Resultado da partida no BeachCam!'
        });
        return;
      } catch (err) {
        console.log('Share failed or was cancelled', err);
      }
    }

    // Fallback: Download
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80]" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[90] bg-[#0a0a0a] border-t border-[var(--neon-blue)]/30 rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,245,255,0.15)] flex flex-col items-center max-h-[90vh] overflow-y-auto">
        
        <div className="w-12 h-1.5 bg-white/20 rounded-full mb-5 shrink-0" />
        
        <h2 className="text-xl font-black italic uppercase tracking-widest text-white mb-4 shrink-0">Compartilhar</h2>

        {/* Ranking Type Selector — only for ranking type shares */}
        {type === 'ranking' && (
          <div className="flex bg-white/5 p-1 rounded-full border border-white/10 mb-4 w-full max-w-xs shrink-0">
            <button 
              onClick={() => setRankingType('jogadores')}
              className={`flex-1 py-2 label-text rounded-full transition-all ${rankingType === 'jogadores' ? 'bg-[var(--neon-blue)]/20 text-[var(--neon-blue)] shadow-md' : 'text-white/40 hover:text-white/80'}`}
            >
              Jogadores
            </button>
            <button 
              onClick={() => setRankingType('duplas')}
              className={`flex-1 py-2 label-text rounded-full transition-all ${rankingType === 'duplas' ? 'bg-[var(--neon-orange)]/20 text-[var(--neon-orange)] shadow-md' : 'text-white/40 hover:text-white/80'}`}
            >
              Duplas
            </button>
            <button 
              onClick={() => setRankingType('ambos')}
              className={`flex-1 py-2 label-text rounded-full transition-all ${rankingType === 'ambos' ? 'bg-[var(--neon-green)]/20 text-[var(--neon-green)] shadow-md' : 'text-white/40 hover:text-white/80'}`}
            >
              Ambos
            </button>
          </div>
        )}

        {/* Format Toggle */}
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 mb-5 w-full max-w-[240px] shrink-0">
          <button 
            onClick={() => setFormat('story')}
            className={`flex-1 py-2 label-text rounded-full transition-all flex items-center justify-center gap-1 ${format === 'story' ? 'bg-white/20 text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}
          >
            <span className="material-symbols-outlined text-[14px]">smartphone</span>
            Story
          </button>
          <button 
            onClick={() => setFormat('square')}
            className={`flex-1 py-2 label-text rounded-full transition-all flex items-center justify-center gap-1 ${format === 'square' ? 'bg-white/20 text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}
          >
            <span className="material-symbols-outlined text-[14px]">crop_square</span>
            Feed
          </button>
        </div>

        {/* Preview Area */}
        <div className={`relative rounded-xl overflow-hidden shadow-2xl transition-all duration-300 shrink-0 ${format === 'story' ? 'w-[180px] h-[320px]' : 'w-[250px] h-[250px]'}`}>
          {isGenerating ? (
            <div className="absolute inset-0 bg-white/5 flex items-center justify-center border border-white/10">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--neon-blue)] border-t-transparent animate-spin" />
            </div>
          ) : (
            <img src={previewUrl} alt="Share Preview" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex gap-3 mt-6 max-w-sm shrink-0">
          <button
            onClick={() => handleShare('native')}
            disabled={isGenerating}
            className="flex-1 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded-2xl py-3 flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all text-white disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-2xl">share</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Social</span>
          </button>
          
          <button
            onClick={() => handleShare('download')}
            disabled={isGenerating}
            className="flex-1 bg-[#25D366] rounded-2xl py-3 flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all text-white disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-2xl">download</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Salvar</span>
          </button>
        </div>
        
        <button className="mt-4 text-white/50 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors p-2 shrink-0" onClick={onClose}>
          Fechar
        </button>

      </div>
    </>
  );
}
