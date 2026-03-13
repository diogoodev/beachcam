import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center">
          <span className="text-6xl mb-4">⚠️</span>
          <h1 className="heading-font text-2xl font-black mb-2 uppercase tracking-widest">Algo deu errado</h1>
          <p className="text-white/50 text-sm mb-6 max-w-sm">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-shimmer bg-[var(--neon-blue)] text-black px-8 py-3 rounded-xl font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,245,255,0.4)] active:scale-95 transition-all"
          >
            Recarregar
          </button>
          {this.state.error && (
            <details className="mt-6 text-left w-full max-w-sm">
              <summary className="text-white/30 text-xs cursor-pointer hover:text-white/50 transition-colors">
                Detalhes do erro
              </summary>
              <pre className="mt-2 text-[10px] text-red-400/70 bg-white/5 p-3 rounded-lg overflow-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
