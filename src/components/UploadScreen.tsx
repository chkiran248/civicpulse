import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, CheckCircle2, Clock, Camera, LogIn, Upload, Mic, MicOff, Send, Type } from 'lucide-react';
import { User } from '../lib/firebase';
import { cn } from '../lib/utils';

interface UploadScreenProps {
  user: User | null;
  handleLogin: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  processText: (text: string) => Promise<void>;
}

export function UploadScreen({ user, handleLogin, fileInputRef, handleFileChange, processText }: UploadScreenProps) {
  const [inputMode, setInputMode] = useState<'image' | 'text'>('image');
  const [textDescription, setTextDescription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as Window & { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN';

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) setTextDescription(prev => prev + finalTranscript);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setSpeechError('Microphone access denied. Please allow microphone permissions and try again.');
      } else {
        setSpeechError('Voice input error. Please try again or type your description.');
      }
      setIsListening(false);
    };

    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;
  }, []);

  const toggleListening = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      setSpeechError('Speech recognition is not supported in your browser.');
      return;
    }
    setSpeechError(null);
    if (isListening) {
      rec.stop();
    } else {
      rec.start();
      setIsListening(true);
    }
  };

  const handleSubmitText = () => {
    if (textDescription.trim()) processText(textDescription);
  };

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
          <p className="text-slate-300 text-lg max-w-md leading-relaxed">
            Snap a photo, type a description, or use your voice to report urban problems in Namma Bengaluru.
            Gemini handles the rest.
          </p>
        </div>

        <div
          className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 w-fit"
          role="tablist"
          aria-label="Reporting mode"
        >
          <button
            onClick={() => setInputMode('image')}
            aria-label="Switch to Visual reporting mode"
            aria-selected={inputMode === 'image'}
            role="tab"
            className={cn(
              'px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2',
              inputMode === 'image' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'
            )}
          >
            <Camera size={14} aria-hidden="true" />
            <span>Visual</span>
          </button>
          <button
            onClick={() => setInputMode('text')}
            aria-label="Switch to Text and Voice reporting mode"
            aria-selected={inputMode === 'text'}
            role="tab"
            className={cn(
              'px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2',
              inputMode === 'text' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'
            )}
          >
            <Type size={14} aria-hidden="true" />
            <span>Text/Voice</span>
          </button>
        </div>

        {!user && (
          <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400" aria-hidden="true">
              <UserIcon size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Sign in required</p>
              <p className="text-xs text-slate-300">Please sign in with Google to report and track issues.</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl glass-card">
            <CheckCircle2 size={20} className="text-green-400" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-200">BBMP Integrated</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl glass-card">
            <Clock size={20} className="text-amber-400" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-200">Instant Routing</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {inputMode === 'image' ? (
          <motion.div
            key="image-input"
            role="tabpanel"
            aria-label="Visual reporting"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => user ? fileInputRef.current?.click() : handleLogin()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                user ? fileInputRef.current?.click() : handleLogin();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={user ? 'Capture Incident or Upload Image' : 'Sign In to Start Reporting'}
            className={cn(
              'group relative h-[500px] glass-card rounded-[3rem] border-white/10 transition-all cursor-pointer flex flex-col items-center justify-center p-12 overflow-hidden animate-float',
              user ? 'hover:border-blue-500/50' : 'opacity-50 grayscale'
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" aria-hidden="true" />

            <div className="relative z-10 flex flex-col items-center gap-8 text-center">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/10 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500 neo-glow" aria-hidden="true">
                {user ? <Camera size={44} /> : <LogIn size={44} />}
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-display font-bold text-white">{user ? 'Capture Incident' : 'Sign In to Start'}</p>
                <p className="text-slate-300">{user ? 'Tap to snap or upload from gallery' : 'Connect your account to report issues'}</p>
              </div>
              {user && (
                <div className="flex items-center gap-2 text-white font-bold bg-white/10 px-6 py-3 rounded-full border border-white/10 group-hover:bg-white group-hover:text-black transition-colors">
                  <Upload size={20} aria-hidden="true" />
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
          </motion.div>
        ) : (
          <motion.div
            key="text-input"
            role="tabpanel"
            aria-label="Text and voice reporting"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
              'relative h-[500px] glass-card rounded-[3rem] border-white/10 p-10 flex flex-col gap-6',
              !user && 'opacity-50 grayscale'
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-white" id="describe-issue-title">Describe Issue</h3>
              <button
                onClick={toggleListening}
                disabled={!user}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                  isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                )}
                aria-label={isListening ? 'Stop Voice Input' : 'Start Voice Input'}
                aria-pressed={isListening}
              >
                {isListening ? <MicOff size={20} aria-hidden="true" /> : <Mic size={20} aria-hidden="true" />}
              </button>
            </div>

            {/* Surface speech recognition errors visibly */}
            {speechError && (
              <p role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {speechError}
              </p>
            )}

            <div className="relative flex-1">
              <textarea
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                placeholder={
                  user
                    ? "Describe the problem (e.g., 'Large pothole near Indiranagar metro station')"
                    : 'Please sign in to report…'
                }
                disabled={!user}
                aria-labelledby="describe-issue-title"
                maxLength={2000}
                className="w-full h-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 resize-none transition-colors"
              />
              {/* aria-live status for voice input */}
              <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isListening ? 'Listening to your voice input…' : textDescription ? 'Text description updated.' : ''}
              </div>
            </div>

            <button
              onClick={handleSubmitText}
              disabled={!user || !textDescription.trim()}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20"
            >
              <Send size={18} aria-hidden="true" />
              <span>Submit Report</span>
            </button>

            <div className="flex items-center gap-2 justify-center opacity-40" aria-hidden="true">
              <div className="w-1 h-1 rounded-full bg-blue-500" />
              <p className="text-[10px] font-mono uppercase tracking-widest">Voice-to-Text Enabled</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
