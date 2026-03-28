import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User, onAuthStateChanged, auth, db, signInWithPopup, googleProvider, signOut, collection, doc, setDoc, query, where, orderBy, onSnapshot, OperationType, handleFirestoreError } from './firebase';
import { getDoc } from 'firebase/firestore';
import { analyzeUrbanIssue, CivicTicket } from './gemini';
import { getBengaluruNewsBriefing, NewsBrief } from './news';
import { BLR_FACTS } from './constants';

export type Screen = 'upload' | 'analyzing' | 'ticket' | 'history';

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

  const blrFacts = useMemo(() => BLR_FACTS, []);

  const refreshNews = useCallback(async () => {
    if (isNewsLoading) return;
    setIsNewsLoading(true);
    try {
      const brief = await getBengaluruNewsBriefing();
      setNewsBrief(brief);
    } catch (err) {
      console.error("News refresh failed:", err);
    } finally {
      setIsNewsLoading(false);
    }
  }, [isNewsLoading]);

  useEffect(() => {
    let isMounted = true;
    if (screen === 'analyzing') {
      const interval = setInterval(() => {
        if (isMounted) {
          setAnalyzingFact(prev => (prev + 1) % blrFacts.length);
        }
      }, 3000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [screen, blrFacts.length]);

  useEffect(() => {
    // Initial news fetch
    refreshNews();
    
    // Check for 6 AM refresh
    let lastRefreshDate = '';
    const interval = setInterval(() => {
      const now = new Date();
      const today = now.toLocaleDateString();
      // Only refresh if it's 6 AM and we haven't refreshed today
      if (now.getHours() === 6 && now.getMinutes() === 0 && lastRefreshDate !== today) {
        lastRefreshDate = today;
        refreshNews();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

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
              createdAt: new Date().toISOString(),
              role: 'user'
            });
          } else {
            // Update profile but ensure required fields are present for schema validation
            const existingData = userSnap.data();
            const updateData: any = {
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              email: currentUser.email,
            };
            
            // Bootstrap missing required fields if they don't exist
            if (!existingData?.uid) updateData.uid = currentUser.uid;
            if (!existingData?.createdAt) updateData.createdAt = new Date().toISOString();
            if (!existingData?.role) updateData.role = 'user';
            
            await setDoc(userRef, updateData, { merge: true });
          }
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

  const handleLogin = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setScreen('upload');
    } catch (err) {
      setError("Logout failed.");
    }
  }, []);

  const processImage = useCallback(async (base64: string, mimeType: string) => {
    if (!user) {
      setError("Please sign in to report an issue.");
      return;
    }
    setScreen('analyzing');
    setError(null);
    try {
      const result = await analyzeUrbanIssue({ base64Image: base64, mimeType }, location || undefined);
      
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
      console.error("Image processing error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("safety")) {
        setError("Analysis blocked by safety filters. Please ensure the photo is appropriate.");
      } else {
        setError("Analysis failed. Please try again with a clearer photo or more details.");
      }
      setScreen('upload');
    }
  }, [user, location]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      processImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  }, [processImage]);

  const processText = useCallback(async (text: string) => {
    if (!user) {
      setError("Please sign in to report an issue.");
      return;
    }
    if (!text.trim()) {
      setError("Please provide a description of the issue.");
      return;
    }
    setScreen('analyzing');
    setError(null);
    try {
      const result = await analyzeUrbanIssue({ textDescription: text }, location || undefined);
      
      const ticketId = `CP-${Math.floor(Math.random() * 90000) + 10000}`;
      const ticketData = {
        ...result,
        id: ticketId,
        uid: user.uid,
        image: `https://picsum.photos/seed/${ticketId}/800/600?blur=2`, // Placeholder for text-only reports
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
      console.error("Text processing error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("safety")) {
        setError("Analysis blocked by safety filters. Please ensure the description is appropriate.");
      } else {
        setError("Analysis failed. Please try again with a more detailed description.");
      }
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
    reset
  };
}
