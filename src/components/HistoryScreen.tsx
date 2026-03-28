import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, MapPin, CheckCircle2, Zap } from 'lucide-react';
import { CivicTicket } from '../lib/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HistoryScreenProps {
  history: CivicTicket[];
  setScreen: (screen: 'upload' | 'analyzing' | 'ticket' | 'history') => void;
  setTicket: (ticket: CivicTicket) => void;
}

export function HistoryScreen({ history, setScreen, setTicket }: HistoryScreenProps) {
  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-6xl mx-auto space-y-12"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <button 
            onClick={() => setScreen('upload')}
            className="flex items-center gap-2 text-blue-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4 group"
            aria-label="Back to Reporting"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Reporting</span>
          </button>
          <h2 className="text-5xl font-display font-extrabold text-white tracking-tighter">My <span className="text-blue-500">Reports.</span></h2>
          <p className="text-slate-400 text-lg">Track the status of your reported urban issues in Namma Bengaluru.</p>
        </div>
        
        <div className="hidden md:flex items-center gap-4 px-6 py-3 rounded-2xl glass-card border-white/10">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Total Reports</p>
            <p className="text-2xl font-display font-bold text-white">{history.length}</p>
          </div>
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
            <Zap size={24} />
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="glass-card p-20 rounded-[3rem] border-white/10 text-center space-y-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-slate-500 mx-auto border border-white/10">
            <Clock size={40} />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-display font-bold text-white">No reports yet</p>
            <p className="text-slate-400">Your reported issues will appear here once analyzed.</p>
          </div>
          <button 
            onClick={() => setScreen('upload')}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl"
            aria-label="Report Your First Issue"
          >
            Report Your First Issue
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => {
                setTicket(item);
                setScreen('ticket');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setTicket(item);
                  setScreen('ticket');
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View Report Details for ${item.issueType} #${item.id}`}
              className="group glass-card rounded-[2.5rem] border-white/10 overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.issueType} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white uppercase tracking-widest">
                    <MapPin size={10} className="text-blue-400" />
                    <span>Bengaluru</span>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest",
                    item.severity === 'High' ? "bg-red-500 text-white" : 
                    item.severity === 'Medium' ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                  )}>
                    {item.severity}
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-blue-400">#{item.id}</p>
                  <div className="flex items-center gap-1.5 text-green-400">
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{item.status}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-display font-bold text-white group-hover:text-blue-400 transition-colors">{item.issueType}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Zap size={12} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.department}</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
