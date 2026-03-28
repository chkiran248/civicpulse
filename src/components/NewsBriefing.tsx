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
    <section
      aria-labelledby="news-heading"
      className="mt-12 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl" aria-hidden="true">
            <Newspaper className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 id="news-heading" className="text-lg font-display font-semibold text-white">
              Daily Bengaluru Pulse
            </h3>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Civic News Summary</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          aria-busy={isLoading}
          aria-label={isLoading ? 'Refreshing news…' : 'Refresh News Briefing'}
          title="Refresh News"
          className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Screen-reader live region for loading state */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading ? 'Loading Bengaluru news…' : newsBrief ? 'News updated.' : ''}
      </div>

      {isLoading && !newsBrief ? (
        <div className="space-y-4 animate-pulse" aria-hidden="true">
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
            <p className="text-sm text-slate-200 leading-relaxed italic">"{newsBrief.summary}"</p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-1">Latest Headlines</p>
            <ul className="grid gap-2" aria-label="Bengaluru civic headlines">
              {newsBrief.headlines.map((headline, idx) => (
                <li key={idx}>
                  <a
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
                      <span className="text-[10px] text-slate-400">{headline.source}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 px-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span>
              Last Updated:{' '}
              <time dateTime={newsBrief.lastUpdated}>
                {new Date(newsBrief.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </span>
          </div>
        </motion.div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-4">No news updates available.</p>
      )}
    </section>
  );
}
