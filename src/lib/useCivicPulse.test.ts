import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCivicPulse } from './useCivicPulse';

// Mock firebase
vi.mock('./firebase', () => ({
  auth: {},
  db: {},
  onAuthStateChanged: vi.fn((auth, cb) => {
    setTimeout(() => cb(null), 0);
    return () => {};
  }),
  signInWithPopup: vi.fn(),
  googleProvider: {},
  signOut: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  OperationType: { WRITE: 'write', LIST: 'list' },
  handleFirestoreError: vi.fn()
}));

// Mock news
vi.mock('./news', () => ({
  getBengaluruNewsBriefing: vi.fn(async () => ({
    summary: "Mock summary",
    headlines: [],
    lastUpdated: new Date().toISOString()
  }))
}));

// Mock gemini
vi.mock('./gemini', () => ({
  analyzeUrbanIssue: vi.fn(async () => ({
    issueType: "Pothole",
    description: "Test pothole",
    severity: "High",
    department: "BBMP",
    actionRequired: "Fill it",
    safetyRisk: true,
    estimatedResponseTime: "2 days"
  }))
}));

describe('useCivicPulse Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default values', async () => {
    const { result } = renderHook(() => useCivicPulse());
    await act(async () => {
      vi.advanceTimersByTime(100);
      await Promise.resolve();
    });
    expect(result.current.screen).toBe('upload');
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthReady).toBe(true);
  });

  it('resets state correctly', async () => {
    const { result } = renderHook(() => useCivicPulse());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      result.current.setScreen('history');
      result.current.reset();
    });
    expect(result.current.screen).toBe('upload');
  });

  it('processes image and creates ticket correctly', async () => {
    const { result } = renderHook(() => useCivicPulse());
    await act(async () => {
      await Promise.resolve();
    });
    
    // Simulate login
    act(() => {
      // @ts-ignore
      result.current.setUser({ uid: 'test-uid', email: 'test@example.com' });
      result.current.setIsAuthReady(true);
    });

    await act(async () => {
      await result.current.processImage('data:image/png;base64,test', 'image/png');
    });

    expect(result.current.screen).toBe('ticket');
    expect(result.current.ticket?.issueType).toBe('Pothole');
    expect(result.current.ticket?.uid).toBe('test-uid');
  });

  it('processes text and creates ticket correctly', async () => {
    const { result } = renderHook(() => useCivicPulse());
    await act(async () => {
      await Promise.resolve();
    });
    
    // Simulate login
    act(() => {
      // @ts-ignore
      result.current.setUser({ uid: 'test-uid', email: 'test@example.com' });
      result.current.setIsAuthReady(true);
    });

    await act(async () => {
      await result.current.processText('Pothole on MG Road');
    });

    expect(result.current.screen).toBe('ticket');
    expect(result.current.ticket?.issueType).toBe('Pothole');
  });

  it('handles analysis errors correctly', async () => {
    const { analyzeUrbanIssue } = await import('./gemini');
    vi.mocked(analyzeUrbanIssue).mockRejectedValueOnce(new Error("Analysis failed"));

    const { result } = renderHook(() => useCivicPulse());
    await act(async () => {
      await Promise.resolve();
    });
    
    act(() => {
      // @ts-ignore
      result.current.setUser({ uid: 'test-uid', email: 'test@example.com' });
      result.current.setIsAuthReady(true);
    });

    await act(async () => {
      await result.current.processText('Pothole on MG Road');
    });

    expect(result.current.screen).toBe('upload');
    expect(result.current.error).toBe("Analysis failed. Please try again with a more detailed description.");
  });
});
