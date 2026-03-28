import React from 'react';
import { motion } from 'motion/react';
import { Zap, History, LogOut, LogIn } from 'lucide-react';
import { User } from '../lib/firebase';
import { Screen } from '../lib/useCivicPulse';

interface HeaderProps {
  user: User | null;
  reset: () => void;
  setScreen: (screen: Screen) => void;
  handleLogout: () => void;
  handleLogin: () => void;
}

export function Header({ user, reset, setScreen, handleLogout, handleLogin }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 p-8 flex items-center justify-between z-50">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:font-bold focus:text-xs focus:uppercase focus:tracking-widest"
      >
        Skip to Content
      </a>
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 cursor-pointer"
        onClick={reset}
        role="button"
        aria-label="CivicPulse Home"
      >
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 neo-glow">
          <Zap size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-white">CivicPulse <span className="text-blue-500">BLR</span></h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-blue-400">Bengaluru Urban Intelligence</p>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        {user ? (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setScreen('history')}
              className="hidden md:flex items-center gap-2 glass-pill hover:bg-white/10 transition-colors"
              aria-label="View My Reports"
            >
              <History size={14} className="text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">My Reports</span>
            </button>
            <div className="flex items-center gap-3 glass-pill">
              <img src={user.photoURL || ''} alt={user.displayName || 'User Profile'} className="w-6 h-6 rounded-full border border-white/20" />
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-slate-300">{user.displayName}</span>
              <button 
                onClick={handleLogout} 
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl"
            aria-label="Sign In with Google"
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        )}
      </motion.div>
    </header>
  );
}
