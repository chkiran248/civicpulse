import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBengaluruNewsBriefing } from '../lib/news';

const mockBrief = {
  summary: 'BBMP resurfaced 10 km of roads.',
  headlines: [{ title: 'Road work update', url: 'https://example.com', source: 'Deccan Herald' }],
  lastUpdated: new Date().toISOString(),
};

describe('getBengaluruNewsBriefing()', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a NewsBrief on success', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBrief,
    });

    const result = await getBengaluruNewsBriefing();
    expect(result.summary).toBe('BBMP resurfaced 10 km of roads.');
    expect(result.headlines).toHaveLength(1);
    expect(result.lastUpdated).toBeTruthy();
  });

  it('calls POST /api/news', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBrief,
    });

    await getBengaluruNewsBriefing();
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe('/api/news');
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].method).toBe('POST');
  });

  it('throws on non-ok response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });
    await expect(getBengaluruNewsBriefing()).rejects.toThrow('Could not fetch');
  });

  it('throws on network failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
    await expect(getBengaluruNewsBriefing()).rejects.toThrow('Network error');
  });
});
