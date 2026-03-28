import { describe, it, expect } from 'vitest';
import { cn, generateTicketId, sanitizeUserText } from '../lib/utils';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'skipped', 'active')).toBe('base active');
  });
});

describe('generateTicketId()', () => {
  it('starts with CP-', () => {
    expect(generateTicketId()).toMatch(/^CP-\d{5}$/);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, generateTicketId));
    expect(ids.size).toBeGreaterThan(90);
  });
});

describe('sanitizeUserText()', () => {
  it('strips HTML tags', () => {
    expect(sanitizeUserText('<script>alert(1)</script>Pothole')).toBe('Pothole');
  });

  it('removes javascript: protocol', () => {
    expect(sanitizeUserText('javascript:alert(1)')).toBe('alert(1)');
  });

  it('trims whitespace', () => {
    expect(sanitizeUserText('  Pothole  ')).toBe('Pothole');
  });

  it('truncates to 2000 characters', () => {
    const long = 'a'.repeat(3000);
    expect(sanitizeUserText(long).length).toBe(2000);
  });

  it('returns empty string for all-HTML input', () => {
    expect(sanitizeUserText('<b><i></i></b>')).toBe('');
  });
});
