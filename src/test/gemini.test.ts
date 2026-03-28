import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeUrbanIssue } from '../lib/gemini';

const mockTicket = {
  issueType: 'Pothole',
  description: 'Large pothole on MG Road.',
  severity: 'High',
  department: 'BBMP',
  actionRequired: 'Fill and resurface within 72 hours.',
  safetyRisk: true,
  estimatedResponseTime: '72 hours',
};

describe('analyzeUrbanIssue()', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a CivicTicket for image input', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTicket,
    });

    const result = await analyzeUrbanIssue({ base64Image: 'data:image/jpeg;base64,abc', mimeType: 'image/jpeg' });
    expect(result.issueType).toBe('Pothole');
    expect(result.severity).toBe('High');

    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/analyze');
    expect(JSON.parse((opts as RequestInit).body as string).input.base64Image).toBeTruthy();
  });

  it('returns a CivicTicket for text input', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTicket,
    });

    const result = await analyzeUrbanIssue({ textDescription: 'Broken streetlight near Koramangala' });
    expect(result.department).toBe('BBMP');
  });

  it('passes location when provided', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTicket,
    });

    await analyzeUrbanIssue({ textDescription: 'Garbage pile' }, { lat: 12.97, lng: 77.59 });
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.location).toEqual({ lat: 12.97, lng: 77.59 });
  });

  it('throws on non-ok response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Analysis failed' }),
    });

    await expect(analyzeUrbanIssue({ textDescription: 'test' })).rejects.toThrow('Analysis failed');
  });

  it('throws on network failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
    await expect(analyzeUrbanIssue({ textDescription: 'test' })).rejects.toThrow('Network error');
  });
});
