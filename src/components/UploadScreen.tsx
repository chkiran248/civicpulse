import React from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, CheckCircle2, Clock, Camera, LogIn, Upload } from 'lucide-react';
import { User } from '../lib/firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UploadScreenProps {
  user: User | null;
  handleLogin: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadScreen({ user, handleLogin, fileInputRef, handleFileChange }: UploadScreenProps) {
  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="grid lg:grid-cols-2 gap-12 items-center"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em]"
          >
            Next-Gen Reporting
          </motion.span>
          <h2 className="text-6xl font-display font-extrabold text-white leading-[0.9] tracking-tighter">
            Bengaluru <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              In Your Hands
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">
            Snap a photo of any urban problem in Namma Bengaluru. Gemini 3.1 Pro identifies, routes, and generates a formal ticket for BBMP, BESCOM, or BWSSB.
          </p>
        </div>

        {!user && (
          <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
              <UserIcon size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Sign in required</p>
              <p className="text-xs text-slate-400">Please sign in with Google to report and track issues.</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl glass-card">
            <CheckCircle2 size={20} className="text-green-400" />
            <span className="text-sm font-semibold text-slate-200">BBMP Integrated</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl glass-card">
            <Clock size={20} className="text-amber-400" />
            <span className="text-sm font-semibold text-slate-200">Instant Routing</span>
          </div>
        </div>
      </div>

      <div 
        onClick={() => user ? fileInputRef.current?.click() : handleLogin()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            user ? fileInputRef.current?.click() : handleLogin();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={user ? "Capture Incident or Upload Image" : "Sign In to Start Reporting"}
        className={cn(
          "group relative h-[500px] glass-card rounded-[3rem] border-white/10 transition-all cursor-pointer flex flex-col items-center justify-center p-12 overflow-hidden animate-float",
          user ? "hover:border-blue-500/50" : "opacity-50 grayscale"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/10 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500 neo-glow">
            {user ? <Camera size={44} /> : <LogIn size={44} />}
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-display font-bold text-white">{user ? "Capture Incident" : "Sign In to Start"}</p>
            <p className="text-slate-400">{user ? "Tap to snap or upload from gallery" : "Connect your account to report issues"}</p>
          </div>
          {user && (
            <div className="flex items-center gap-2 text-white font-bold bg-white/10 px-6 py-3 rounded-full border border-white/10 group-hover:bg-white group-hover:text-black transition-colors">
              <Upload size={20} />
              <span>Select File</span>
            </div>
          )}
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          capture="environment"
          onChange={handleFileChange} 
          aria-hidden="true"
        />
      </div>
    </motion.div>
  );
}
