import React, { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle2, MapPin, Clock, ShieldAlert, ChevronRight, RefreshCcw, Loader2, Zap, Globe, Fingerprint, LogIn, LogOut, History, User as UserIcon, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeUrbanIssue, CivicTicket } from './lib/gemini';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, collection, doc, setDoc, getDoc, query, where, orderBy, onSnapshot, User, OperationType, handleFirestoreError } from './lib/firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
          <div className="glass-card p-12 rounded-[3rem] max-w-lg text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mx-auto">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-3xl font-display font-bold text-white">Something went wrong</h2>
            <p className="text-slate-400">We encountered an unexpected error. Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-white text-black rounded-2xl font-bold hover:bg-blue-500 hover:text-white transition-all"
            >
              Refresh App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type Screen = 'upload' | 'analyzing' | 'ticket' | 'history';

function CivicPulseApp() {
  const [screen, setScreen] = useState<Screen>('upload');
  const [image, setImage] = useState<string | null>(null);
  const [ticket, setTicket] = useState<CivicTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [history, setHistory] = useState<CivicTicket[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzingFact, setAnalyzingFact] = useState(0);
  const blrFacts = [
    "BBMP manages over 1,400 km of arterial roads in Bengaluru.",
    "BESCOM serves over 13 million consumers across 8 districts.",
    "BWSSB was the first to implement water recycling in India.",
    "Bengaluru Traffic Police uses AI-powered signals at 50+ junctions.",
    "Namma Bengaluru is home to 1,200+ parks and open spaces."
  ];

  useEffect(() => {
    if (screen === 'analyzing') {
      const interval = setInterval(() => {
        setAnalyzingFact(prev => (prev + 1) % blrFacts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [screen]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        // Sync user to Firestore
        try {
          await setDoc(doc(db, 'users', currentUser.uid), {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location access denied")
      );
    }
  }, []);

  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(
        collection(db, 'tickets'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as CivicTicket[];
        setHistory(tickets);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'tickets');
      });
      
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setScreen('upload');
    } catch (err) {
      setError("Logout failed.");
    }
  };

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
    if (!user) {
      setError("Please sign in to report an issue.");
      return;
    }
    setScreen('analyzing');
    setError(null);
    try {
      const result = await analyzeUrbanIssue(base64, mimeType, location || undefined);
      
      // Save to Firestore
      const ticketId = `CP-${Math.floor(Math.random() * 90000) + 10000}`;
      const ticketData = {
        ...result,
        id: ticketId,
        uid: user.uid,
        image: base64,
        lat: location?.lat || null,
        lng: location?.lng || null,
        createdAt: new Date().toISOString(),
        status: 'Open'
      };
      
      try {
        await setDoc(doc(db, 'tickets', ticketId), ticketData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `tickets/${ticketId}`);
      }

      setTicket(ticketData);
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

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="atmosphere" />
        <Loader2 className="text-blue-500 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      <div className="atmosphere" />
      
      <header className="fixed top-0 left-0 right-0 p-8 flex items-center justify-between z-50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={reset}
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
              >
                <History size={14} className="text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">My Reports</span>
              </button>
              <div className="flex items-center gap-3 glass-pill">
                <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-6 h-6 rounded-full border border-white/20" />
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-slate-300">{user.displayName}</span>
                <button onClick={handleLogout} className="text-slate-500 hover:text-white transition-colors">
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}
        </motion.div>
      </header>

      <main className="w-full max-w-5xl relative z-10 pt-24 pb-32">
        <AnimatePresence mode="wait">
          {screen === 'upload' && (
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
                />
              </div>
            </motion.div>
          )}

          {screen === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-12"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-48 h-48 rounded-full border-[12px] border-white/5 border-t-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap size={64} className="text-blue-500 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-6 max-w-md">
                <div className="space-y-2">
                  <h2 className="text-5xl font-display font-bold text-white tracking-tight">AI Analysis</h2>
                  <p className="text-blue-400 font-mono text-xs uppercase tracking-[0.3em]">Gemini 3.1 Pro + Maps Grounding</p>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={analyzingFact}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-6 glass-card rounded-2xl border-white/5"
                  >
                    <p className="text-slate-400 text-sm italic">"{blrFacts[analyzingFact]}"</p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      className="w-2 h-2 bg-blue-500 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'ticket' && ticket && (
            <motion.div
              key="ticket"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 text-slate-400 hover:text-white font-bold transition-colors uppercase tracking-widest text-[10px]"
                >
                  <RefreshCcw size={14} />
                  <span>New Report</span>
                </button>
                <div className="flex items-center gap-2 text-green-400 font-bold glass-pill">
                  <CheckCircle2 size={14} />
                  <span className="text-[10px] uppercase tracking-widest">Saved to Cloud</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-[1fr_350px] gap-8">
                <div className="glass-card rounded-[3rem] overflow-hidden border-white/10 ticket-texture relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-shimmer" />
                  <div className={cn(
                    "p-12 text-white relative",
                    ticket.severity === 'Critical' ? "bg-red-600/20" :
                    ticket.severity === 'High' ? "bg-orange-500/20" :
                    ticket.severity === 'Medium' ? "bg-blue-600/20" : "bg-slate-700/20"
                  )}>
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                      <ShieldAlert size={120} />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]",
                          ticket.severity === 'Critical' ? "bg-red-500 text-white" :
                          ticket.severity === 'High' ? "bg-orange-500 text-white" :
                          ticket.severity === 'Medium' ? "bg-blue-500 text-white" : "bg-slate-500 text-white"
                        )}>
                          {ticket.severity} Priority
                        </span>
                        {ticket.groundingUrls && ticket.groundingUrls.length > 0 && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                            <Globe size={10} />
                            Maps Verified
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                          ID: {ticket.id}
                        </span>
                      </div>
                      <h3 className="text-7xl font-display font-black tracking-tighter leading-none">
                        {ticket.issueType}
                      </h3>
                    </div>
                  </div>

                  <div className="p-12 space-y-12">
                    <div className="grid md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">Department</p>
                        <p className="text-2xl font-display font-bold text-white">{ticket.department}</p>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">Response Time</p>
                        <p className="text-2xl font-display font-bold text-white">{ticket.estimatedResponseTime}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">AI Summary</p>
                      <p className="text-xl text-slate-300 leading-relaxed font-light">
                        {ticket.description}
                      </p>
                    </div>

                    {ticket.groundingUrls && ticket.groundingUrls.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">Maps Grounding Sources</p>
                        <div className="flex flex-wrap gap-3">
                          {ticket.groundingUrls.map((url, i) => (
                            <a 
                              key={i} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition-colors"
                            >
                              <ExternalLink size={12} />
                              <span>Source {i + 1}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                          <Zap size={28} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">Action Required</p>
                          <p className="text-lg font-bold text-white">{ticket.actionRequired}</p>
                        </div>
                      </div>
                      <div className="hidden md:block text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">Official Receipt</p>
                        <p className="text-xs font-mono text-slate-500">Namma Bengaluru CivicPulse</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="glass-card rounded-[2.5rem] p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">Location</p>
                      <MapPin size={14} className="text-slate-500" />
                    </div>
                    <div className="h-64 rounded-3xl overflow-hidden relative border border-white/10">
                      <img 
                        src={`https://picsum.photos/seed/${ticket.issueType}/600/600`} 
                        alt="Map" 
                        className="w-full h-full object-cover grayscale opacity-40"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl neo-glow animate-bounce">
                          <MapPin size={20} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">Geotag Verified</p>
                      <p className="text-xs text-slate-500 font-mono">
                        {ticket.lat && ticket.lng ? `${ticket.lat.toFixed(6)}, ${ticket.lng.toFixed(6)}` : "Coordinates Pending"}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => window.print()}
                    className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-500 hover:text-white transition-all shadow-2xl shadow-white/5"
                  >
                    Export Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-display font-bold text-white tracking-tight">My Reports</h2>
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 text-slate-400 hover:text-white font-bold transition-colors uppercase tracking-widest text-[10px]"
                >
                  <RefreshCcw size={14} />
                  <span>Back to Camera</span>
                </button>
              </div>

              {history.length === 0 ? (
                <div className="glass-card p-20 rounded-[3rem] text-center space-y-6">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-slate-600 mx-auto">
                    <History size={40} />
                  </div>
                  <p className="text-slate-400 text-lg">You haven't reported any issues yet.</p>
                  <button onClick={reset} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all">
                    Report First Issue
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((item) => (
                    <motion.div 
                      key={item.id}
                      whileHover={{ y: -5 }}
                      onClick={() => {
                        setTicket(item);
                        setScreen('ticket');
                      }}
                      className="glass-card rounded-3xl overflow-hidden border-white/10 cursor-pointer group"
                    >
                      <div className="h-48 overflow-hidden relative">
                        <img src={item.image} alt={item.issueType} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-4 right-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                            item.severity === 'Critical' ? "bg-red-500 text-white" :
                            item.severity === 'High' ? "bg-orange-500 text-white" :
                            item.severity === 'Medium' ? "bg-blue-500 text-white" : "bg-slate-500 text-white"
                          )}>
                            {item.severity}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">ID: {item.id}</p>
                          <h4 className="text-xl font-display font-bold text-white">{item.issueType}</h4>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock size={12} />
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={12} />
                            <span>{item.department}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-8 flex justify-center pointer-events-none">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-600">
          Namma Bengaluru • CivicPulse System • v2.0
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CivicPulseApp />
    </ErrorBoundary>
  );
}
