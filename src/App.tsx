import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle2, MapPin, Clock, ShieldAlert, ChevronRight, RefreshCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeUrbanIssue, CivicTicket } from './lib/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Screen = 'upload' | 'analyzing' | 'ticket';

export default function App() {
  const [screen, setScreen] = useState<Screen>('upload');
  const [image, setImage] = useState<string | null>(null);
  const [ticket, setTicket] = useState<CivicTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location access denied")
      );
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      processImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string, mimeType: string) => {
    setScreen('analyzing');
    setError(null);
    try {
      const result = await analyzeUrbanIssue(base64, mimeType);
      setTicket(result);
      setScreen('ticket');
    } catch (err) {
      setError("Analysis failed. Please try again with a clearer photo.");
      setScreen('upload');
    }
  };

  const reset = () => {
    setScreen('upload');
    setImage(null);
    setTicket(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8">
      <header className="fixed top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">CivicPulse</h1>
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
          City of Tomorrow • Beta
        </div>
      </header>

      <main className="w-full max-w-2xl mt-16">
        <AnimatePresence mode="wait">
          {screen === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Report an Issue</h2>
                <p className="text-slate-500 text-lg">Snap a photo of any urban problem to notify the city.</p>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-96 bg-white rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-400 transition-all cursor-pointer flex flex-col items-center justify-center p-12 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-50"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                    <Camera size={40} />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-slate-900">Tap to Capture or Upload</p>
                    <p className="text-slate-400 mt-1">Potholes, broken lights, graffiti, etc.</p>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 font-medium bg-blue-50 px-4 py-2 rounded-full">
                    <Upload size={18} />
                    <span>Select from Gallery</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleFileChange} 
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</p>
                    <p className="text-sm font-semibold text-slate-700">System Online</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Response</p>
                    <p className="text-sm font-semibold text-slate-700">~24h Average</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-8"
            >
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldAlert size={40} className="text-blue-600 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-slate-900">Analyzing Issue</h2>
                <div className="flex flex-col gap-2">
                  <p className="text-slate-500 animate-pulse">Gemini Vision is identifying the problem...</p>
                  <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Routing to department</p>
                </div>
              </div>
              {image && (
                <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-white shadow-2xl rotate-3">
                  <img src={image} alt="Analyzing" className="w-full h-full object-cover opacity-50" />
                </div>
              )}
            </motion.div>
          )}

          {screen === 'ticket' && ticket && (
            <motion.div
              key="ticket"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors"
                >
                  <RefreshCcw size={18} />
                  <span>Report Another</span>
                </button>
                <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-1.5 rounded-full border border-green-100">
                  <CheckCircle2 size={16} />
                  <span className="text-sm">Ticket Generated</span>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 ticket-grid">
                <div className={cn(
                  "p-8 text-white flex justify-between items-start",
                  ticket.severity === 'Critical' ? "bg-red-600" :
                  ticket.severity === 'High' ? "bg-orange-500" :
                  ticket.severity === 'Medium' ? "bg-blue-600" : "bg-slate-700"
                )}>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Incident Report</p>
                    <h3 className="text-3xl font-black tracking-tight">{ticket.issueType}</h3>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Severity</p>
                    <p className="text-lg font-black">{ticket.severity}</p>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned Department</p>
                      <p className="text-lg font-bold text-slate-900">{ticket.department}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ticket ID</p>
                      <p className="text-lg font-mono font-bold text-slate-900">#CP-{Math.floor(Math.random() * 90000) + 10000}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</p>
                    <p className="text-slate-600 leading-relaxed font-medium">{ticket.description}</p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                        <Loader2 size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Action Required</p>
                        <p className="text-sm font-bold text-slate-700">{ticket.actionRequired}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                        <Clock size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Est. Response Time</p>
                        <p className="text-sm font-bold text-slate-700">{ticket.estimatedResponseTime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Location Context</span>
                      </div>
                      {location && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </span>
                      )}
                    </div>
                    <div className="h-40 bg-slate-200 rounded-2xl overflow-hidden relative group">
                      <img 
                        src={`https://picsum.photos/seed/${ticket.issueType}/800/400`} 
                        alt="Map Placeholder" 
                        className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 transition-all duration-500"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl animate-bounce">
                          <MapPin size={24} />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-white shadow-lg">
                        <p className="text-xs font-bold text-slate-900">Geotagged Incident Location</p>
                        <p className="text-[10px] text-slate-500">Verified via device GPS</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                      <ShieldAlert size={16} />
                    </div>
                    <p className="text-xs font-bold text-white tracking-wide">Official CivicPulse Record</p>
                  </div>
                  <div className="h-8 w-24 bg-white/10 rounded flex items-center justify-center">
                    <div className="w-full h-1 bg-white/20 mx-2 rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-blue-500" />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => window.print()}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-xl"
              >
                <span>Download Official Receipt</span>
                <ChevronRight size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-auto py-8 text-slate-400 text-xs font-medium tracking-widest uppercase">
        Empowering Citizens • Built with Gemini 3.1
      </footer>
    </div>
  );
}
