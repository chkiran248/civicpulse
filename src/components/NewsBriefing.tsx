import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Newspaper, ExternalLink, Clock } from 'lucide-react';
import { NewsBrief } from '../lib/news';

interface NewsBriefingProps {
  newsBrief: NewsBrief | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function NewsBriefing({ newsBrief, isLoading, onRefresh }: NewsBriefingProps) {
  return (
    <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <Newspaper className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-white">Daily Bengaluru Pulse</h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Civic News Summary</p>
          </div>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
          aria-label="Refresh News Briefing"
          title="Refresh News"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading && !newsBrief ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-white/5 rounded w-3/4" />
          <div className="h-4 bg-white/5 rounded w-1/2" />
          <div className="h-20 bg-white/5 rounded w-full" />
        </div>
      ) : newsBrief ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
            <p className="text-sm text-slate-300 leading-relaxed italic">
              "{newsBrief.summary}"
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-1">Latest Headlines</p>
            <div className="grid gap-2">
              {newsBrief.headlines.map((headline, idx) => (
                  <a 
                    key={idx}
                    href={headline.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read full article: ${headline.title} from ${headline.source}`}
                    className="group flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
                  >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                      {headline.title}
                    </span>
                    <span className="text-[10px] text-slate-500">{headline.source}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600 px-1">
            <Clock className="w-3 h-3" />
            <span>Last Updated: {new Date(newsBrief.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </motion.div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-4">No news updates available.</p>
      )}
    </div>
  );
}
