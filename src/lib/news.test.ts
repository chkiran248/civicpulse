import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBengaluruNewsBriefing } from './news';

// Mock the GoogleGenAI SDK
const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn()
}));

vi.mock('@google/genai', () => {
  class GoogleGenAI {
    models = {
      generateContent: mockGenerateContent
    };
  }

  return {
    GoogleGenAI,
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      ARRAY: 'ARRAY'
    }
  };
});

describe('News Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and parse news briefing correctly', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        summary: "Test summary for Bengaluru news.",
        headlines: [
          { title: "Test Headline", url: "https://test.com", source: "Test Source" }
        ]
      })
    });

    const brief = await getBengaluruNewsBriefing();
    
    expect(brief.summary).toBe("Test summary for Bengaluru news.");
    expect(brief.headlines).toHaveLength(1);
    expect(brief.headlines[0].title).toBe("Test Headline");
    expect(brief.lastUpdated).toBeDefined();
  });

  it('should handle missing fields in AI response', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        // Missing summary and headlines
      })
    });

    const brief = await getBengaluruNewsBriefing();
    expect(brief.summary).toBe("No news summary available at the moment.");
    expect(brief.headlines).toEqual([]);
  });

  it('should throw error if API call fails', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error("Network error"));

    await expect(getBengaluruNewsBriefing()).rejects.toThrow("Could not fetch the latest Bengaluru news briefing.");
  });

  it('should handle invalid JSON from AI', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: "Not JSON"
    });

    await expect(getBengaluruNewsBriefing()).rejects.toThrow();
  });
});
