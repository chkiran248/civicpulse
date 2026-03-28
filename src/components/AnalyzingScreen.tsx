import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Zap } from 'lucide-react';

interface AnalyzingScreenProps {
  analyzingFact: number;
  blrFacts: string[];
}

export function AnalyzingScreen({ analyzingFact, blrFacts }: AnalyzingScreenProps) {
  return (
    <motion.div
      key="analyzing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="relative w-32 h-32 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 neo-glow animate-bounce">
          <Zap size={64} />
        </div>
        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl animate-spin-slow">
          <Loader2 size={24} />
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <h2 className="text-4xl font-display font-extrabold text-white tracking-tight">AI Analysis in Progress</h2>
        <p className="text-slate-400 text-lg">Gemini 3.1 Pro is identifying the issue, severity, and routing to the right department.</p>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
          />
        </div>
        
        <div className="glass-card p-6 rounded-3xl border-white/10 text-center min-h-[100px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={analyzingFact}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-blue-400">Namma Bengaluru Fact</p>
              <p className="text-sm font-medium text-slate-200 leading-relaxed italic">{blrFacts[analyzingFact]}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
