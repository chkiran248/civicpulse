import { useState, useEffect, useRef, useCallback } from 'react';
import {
  User, onAuthStateChanged, auth, db,
  signInWithPopup, googleProvider, signOut,
  collection, doc, setDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp,
  OperationType, handleFirestoreError,
  analytics, logEvent,
} from './firebase';
import { getDoc } from 'firebase/firestore';
import { analyzeUrbanIssue, CivicTicket } from './gemini';
import { getBengaluruNewsBriefing, NewsBrief } from './news';
import { compressImage } from './imageUtils';
import { BLR_FACTS } from './constants';
import { generateTicketId, sanitizeUserText } from './utils';

export type Screen = 'upload' | 'analyzing' | 'ticket' | 'history';

const TICKET_QUERY_LIMIT = 50;
const NEWS_CACHE_DURATION = 3_600_000; // 1 hour

export function useCivicPulse() {
  const [screen, setScreen] = useState<Screen>('upload');
  const [image, setImage] = useState<string | null>(null);
  const [ticket, setTicket] = useState<CivicTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [history, setHistory] = useState<CivicTicket[]>([]);
  const [newsBrief, setNewsBrief] = useState<NewsBrief | null>(null);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzingFact, setAnalyzingFact] = useState(0);
  const isNewsLoadingRef = useRef(false);
  const newsCache = useRef<{ data: NewsBrief; timestamp: number } | null>(null);

  // BLR_FACTS is a module-level constant — no memo needed
  const blrFacts = BLR_FACTS;

  const refreshNews = useCallback(async () => {
    if (isNewsLoadingRef.current) return;

    // Serve from 1-hour cache if available
    if (newsCache.current && Date.now() - newsCache.current.timestamp < NEWS_CACHE_DURATION) {
      setNewsBrief(newsCache.current.data);
      return;
    }

    isNewsLoadingRef.current = true;
    setIsNewsLoading(true);
    try {
      const brief = await getBengaluruNewsBriefing();
      setNewsBrief(brief);
      newsCache.current = { data: brief, timestamp: Date.now() };
    } catch (err) {
      console.error('News refresh failed:', err);
    } finally {
      isNewsLoadingRef.current = false;
      setIsNewsLoading(false);
    }
  }, []);

  // Cycle BLR facts while analyzing
  useEffect(() => {
    if (screen !== 'analyzing') return;
    const interval = setInterval(() => {
      setAnalyzingFact(prev => (prev + 1) % blrFacts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [screen, blrFacts.length]);

  // Initial news fetch + daily 6 AM refresh
  useEffect(() => {
    refreshNews();
    let lastRefreshDate = '';
    const interval = setInterval(() => {
      const now = new Date();
      const today = now.toLocaleDateString();
      if (now.getHours() === 6 && now.getMinutes() === 0 && lastRefreshDate !== today) {
        lastRefreshDate = today;
        refreshNews();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auth state — create / sync user document
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              createdAt: serverTimestamp(),
              role: 'user',
            });
            logEvent(analytics, 'sign_up', { method: 'google' });
          } else {
            const existingData = userSnap.data();
            const updateData: Record<string, unknown> = {
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              email: currentUser.email,
            };
            if (!existingData?.uid) updateData.uid = currentUser.uid;
            if (!existingData?.createdAt) updateData.createdAt = serverTimestamp();
            if (!existingData?.role) updateData.role = 'user';
            await setDoc(userRef, updateData, { merge: true });
            logEvent(analytics, 'login', { method: 'google' });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.info('Location access denied — reports will not include GPS coordinates.')
    );
  }, []);

  // Real-time ticket history (limited to 50)
  useEffect(() => {
    if (!user || !isAuthReady) return;
    const q = query(
      collection(db, 'tickets'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(TICKET_QUERY_LIMIT)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tickets = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as CivicTicket[];
        setHistory(tickets);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'tickets')
    );
    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleLogin = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setError('Login failed. Please try again.');
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setScreen('upload');
    } catch {
      setError('Logout failed.');
    }
  }, []);

  const processImage = useCallback(async (base64: string, mimeType: string) => {
    if (!user) { setError('Please sign in to report an issue.'); return; }
    setScreen('analyzing');
    setError(null);
    try {
      const result = await analyzeUrbanIssue({ base64Image: base64, mimeType }, location || undefined);
      const ticketId = generateTicketId();
      const ticketData: CivicTicket = {
        ...result,
        id: ticketId,
        uid: user.uid,
        image: base64,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        createdAt: serverTimestamp() as unknown as string,
        status: 'Open',
      };
      try {
        await setDoc(doc(db, 'tickets', ticketId), ticketData);
        logEvent(analytics, 'ticket_created', { method: 'image', severity: result.severity });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `tickets/${ticketId}`);
      }
      // Release base64 from state — Firestore has the source of truth
      setImage(null);
      setTicket(ticketData);
      setScreen('ticket');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes('safety')
        ? 'Analysis blocked by safety filters. Please ensure the photo is appropriate.'
        : 'Analysis failed. Please try again with a clearer photo or more details.');
      setScreen('upload');
    }
  }, [user, location]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const originalBase64 = event.target?.result as string;
      setImage(originalBase64);
      try {
        const compressedBase64 = await compressImage(originalBase64);
        processImage(compressedBase64, 'image/jpeg');
      } catch {
        processImage(originalBase64, file.type);
      }
    };
    reader.readAsDataURL(file);
  }, [processImage]);

  const processText = useCallback(async (text: string) => {
    if (!user) { setError('Please sign in to report an issue.'); return; }
    const sanitized = sanitizeUserText(text);
    if (!sanitized) { setError('Please provide a description of the issue.'); return; }
    setScreen('analyzing');
    setError(null);
    try {
      const result = await analyzeUrbanIssue({ textDescription: sanitized }, location || undefined);
      const ticketId = generateTicketId();
      const ticketData: CivicTicket = {
        ...result,
        id: ticketId,
        uid: user.uid,
        image: `https://picsum.photos/seed/${ticketId}/800/600?blur=2`,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        createdAt: serverTimestamp() as unknown as string,
        status: 'Open',
      };
      try {
        await setDoc(doc(db, 'tickets', ticketId), ticketData);
        logEvent(analytics, 'ticket_created', { method: 'text', severity: result.severity });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `tickets/${ticketId}`);
      }
      setTicket(ticketData);
      setScreen('ticket');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes('safety')
        ? 'Analysis blocked by safety filters. Please ensure the description is appropriate.'
        : 'Analysis failed. Please try again with a more detailed description.');
      setScreen('upload');
    }
  }, [user, location]);

  const reset = useCallback(() => {
    setScreen('upload');
    setImage(null);
    setTicket(null);
    setError(null);
  }, []);

  return {
    screen, setScreen,
    image, setImage,
    ticket, setTicket,
    error, setError,
    location, setLocation,
    user, setUser,
    isAuthReady, setIsAuthReady,
    history, setHistory,
    newsBrief, setNewsBrief,
    isNewsLoading,
    fileInputRef,
    analyzingFact,
    blrFacts,
    handleLogin,
    handleLogout,
    handleFileChange,
    processImage,
    processText,
    refreshNews,
    reset,
  };
}
