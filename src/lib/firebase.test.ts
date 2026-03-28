import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleFirestoreError, OperationType } from './firebase';

describe('Firebase Service', () => {
  it('should handle firestore errors correctly', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = new Error("Permission denied");
    
    expect(() => handleFirestoreError(mockError, OperationType.GET, 'test/path')).toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    
    const lastCall = consoleSpy.mock.calls[0][1];
    const parsed = JSON.parse(lastCall);
    expect(parsed.error).toBe("Permission denied");
    expect(parsed.operationType).toBe("get");
    expect(parsed.path).toBe("test/path");
    
    consoleSpy.mockRestore();
  });

  it('should handle non-error objects', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => handleFirestoreError("String error", OperationType.WRITE, 'test/path')).toThrow();
    
    const lastCall = consoleSpy.mock.calls[0][1];
    const parsed = JSON.parse(lastCall);
    expect(parsed.error).toBe("String error");
    
    consoleSpy.mockRestore();
  });
});
