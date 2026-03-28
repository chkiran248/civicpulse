import { useState, useEffect, useRef } from 'react';
import { User, onAuthStateChanged, auth, db, signInWithPopup, googleProvider, signOut, collection, doc, setDoc, query, where, orderBy, onSnapshot, OperationType, handleFirestoreError } from './firebase';
import { analyzeUrbanIssue, CivicTicket } from './gemini';

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

  return {
    screen, setScreen,
    image, setImage,
    ticket, setTicket,
    error, setError,
    location, setLocation,
    user, setUser,
    isAuthReady, setIsAuthReady,
    history, setHistory,
    fileInputRef,
    analyzingFact,
    blrFacts,
    handleLogin,
    handleLogout,
    handleFileChange,
    processImage,
    reset
  };
}
