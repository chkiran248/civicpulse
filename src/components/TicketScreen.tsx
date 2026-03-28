import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, MapPin, ExternalLink, ArrowRight, Zap, Download } from 'lucide-react';
import { CivicTicket } from '../lib/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TicketScreenProps {
  ticket: CivicTicket | null;
  reset: () => void;
}

export function TicketScreen({ ticket, reset }: TicketScreenProps) {
  if (!ticket) return null;

  return (
    <motion.div
      key="ticket"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="max-w-4xl mx-auto space-y-12"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-[0.2em]"
          >
            <CheckCircle2 size={12} />
            <span>Ticket Generated Successfully</span>
          </motion.div>
          <h2 className="text-5xl font-display font-extrabold text-white tracking-tighter leading-none">
            Incident <br />
            <span className="text-blue-500">Reported.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-md">Your report has been analyzed and routed to the relevant department for action.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.print()}
            className="px-6 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
            aria-label="Export Receipt"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export Receipt</span>
          </button>
          <button 
            onClick={reset}
            className="px-8 py-4 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-2xl flex items-center gap-3 group"
            aria-label="Report Another Issue"
          >
            <span>Report Another</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl">
            <img 
              src={ticket.image} 
              alt="Uploaded urban issue" 
              className="w-full h-[400px] object-cover group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
                <MapPin size={12} className="text-blue-400" />
                <span>Grounding Active</span>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                ticket.severity === 'High' ? "bg-red-500 text-white" : 
                ticket.severity === 'Medium' ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
              )}>
                {ticket.severity} Severity
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-blue-400">Location Verification</h3>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400">
                <MapPin size={10} />
                <span>GPS Active</span>
              </div>
            </div>
            <div className="relative h-48 rounded-2xl overflow-hidden border border-white/10">
              <img 
                src={`https://picsum.photos/seed/${ticket.id}/600/400?blur=2`} 
                alt="Map Placeholder" 
                className="w-full h-full object-cover opacity-50"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-blue-400">
                  <MapPin size={32} className="animate-bounce" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Bengaluru, Karnataka</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-blue-400">Analysis Grounding</h3>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">
                <Zap size={10} />
                <span>Maps Verified</span>
              </div>
            </div>
            <div className="space-y-4">
              {ticket.groundingUrls?.map((url, i) => (
                <a 
                  key={i} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                  aria-label={`Open Maps Verification Link ${i + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <ExternalLink size={14} />
                    </div>
                    <span className="text-xs font-medium text-slate-300">Verification Source {i + 1}</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white text-black p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap size={120} />
            </div>
            
            <div className="relative z-10 space-y-10">
              <div className="flex items-center justify-between border-b border-black/10 pb-6">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">Official Receipt</p>
                  <h3 className="text-2xl font-display font-bold">CivicPulse Bengaluru</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">Ticket ID</p>
                  <p className="text-lg font-mono font-bold">#{ticket.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">Issue Category</p>
                  <p className="text-xl font-bold">{ticket.issueType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">Assigned Dept</p>
                  <p className="text-xl font-bold">{ticket.department}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">Response Time</p>
                  <p className="text-xl font-bold">{ticket.estimatedResponseTime}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">Safety Risk</p>
                  <p className={cn("text-xl font-bold", ticket.safetyRisk ? "text-red-600" : "text-green-600")}>
                    {ticket.safetyRisk ? "High Risk" : "Minimal"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-6 border-t border-black/10">
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">AI Analysis Summary</p>
                <p className="text-lg leading-relaxed text-slate-800 font-medium">{ticket.description}</p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">Action Required</p>
                <div className="p-4 bg-slate-100 rounded-2xl border border-black/5">
                  <p className="text-sm font-bold text-slate-700">{ticket.actionRequired}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Tracking Active</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">Generated: {new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
