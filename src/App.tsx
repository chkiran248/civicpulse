import React from 'react';
import { AnimatePresence } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useCivicPulse } from './lib/useCivicPulse';
import { Header } from './components/Header';
import { UploadScreen } from './components/UploadScreen';
import { AnalyzingScreen } from './components/AnalyzingScreen';
import { TicketScreen } from './components/TicketScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { NewsBriefing } from './components/NewsBriefing';

function App() {
  const {
    screen, setScreen,
    ticket, setTicket,
    error,
    user,
    history,
    newsBrief,
    isNewsLoading,
    fileInputRef,
    analyzingFact,
    blrFacts,
    handleLogin,
    handleLogout,
    handleFileChange,
    processText,
    refreshNews,
    reset
  } = useCivicPulse();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
        {/* Atmospheric Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-1000" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-400/5 blur-[100px] rounded-full animate-pulse delay-700" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
        </div>

        <Header 
          user={user} 
          reset={reset} 
          setScreen={setScreen} 
          handleLogout={handleLogout} 
          handleLogin={handleLogin} 
        />

        <main id="main-content" className="relative z-10 pt-32 pb-20 px-8 max-w-7xl mx-auto" role="main">
          {error && (
            <div 
              className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium flex items-center justify-center gap-2 animate-shake"
              role="alert"
              aria-live="assertive"
            >
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-hidden="true" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {screen === 'upload' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                  <UploadScreen 
                    user={user} 
                    handleLogin={handleLogin} 
                    fileInputRef={fileInputRef} 
                    handleFileChange={handleFileChange} 
                    processText={processText}
                  />
                </div>
                <div className="lg:col-span-1">
                  <NewsBriefing 
                    newsBrief={newsBrief} 
                    isLoading={isNewsLoading} 
                    onRefresh={refreshNews} 
                  />
                </div>
              </div>
            )}

            {screen === 'analyzing' && (
              <AnalyzingScreen 
                analyzingFact={analyzingFact} 
                blrFacts={blrFacts} 
              />
            )}

            {screen === 'ticket' && (
              <TicketScreen 
                ticket={ticket} 
                reset={reset} 
              />
            )}

            {screen === 'history' && (
              <HistoryScreen 
                history={history} 
                setScreen={setScreen} 
                setTicket={setTicket} 
              />
            )}
          </AnimatePresence>
        </main>

        <footer className="relative z-10 py-12 px-8 border-t border-white/5 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3 opacity-40">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white">
                <span className="font-display font-bold text-xs">CP</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest">CivicPulse Bengaluru v2.4</p>
            </div>
            <div className="flex items-center gap-8 text-[10px] font-mono uppercase tracking-widest text-slate-500">
              <a href="#" className="hover:text-blue-400 transition-colors" aria-label="Read our Privacy Policy">Privacy Policy</a>
              <a href="#" className="hover:text-blue-400 transition-colors" aria-label="Read our Terms of Service">Terms of Service</a>
              <a href="#" className="hover:text-blue-400 transition-colors" aria-label="Visit BBMP Official Portal">BBMP Portal</a>
            </div>
            <p className="text-[10px] font-mono text-slate-600">© 2026 CivicPulse Intelligence. Bengaluru, KA.</p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
