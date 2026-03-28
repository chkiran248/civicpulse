import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      let isFirestoreError = false;

      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.operationType) {
          isFirestoreError = true;
          errorMessage = `Database Error: ${parsed.error}`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
          <div className="max-w-md w-full glass-card p-8 rounded-[2.5rem] border-red-500/20 text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto border border-red-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold text-white">System Error</h2>
              <p className="text-slate-400">{errorMessage}</p>
              {isFirestoreError && (
                <p className="text-xs text-slate-500 mt-4">
                  Please check your connection or permissions and try again.
                </p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
