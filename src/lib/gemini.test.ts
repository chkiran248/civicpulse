import { describe, it, expect, vi } from 'vitest';
import { analyzeUrbanIssue } from './gemini';

// Mock the GoogleGenAI SDK
vi.mock('@google/genai', () => {
  class GoogleGenAI {
    models = {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          issueType: "Pothole",
          description: "Large pothole on MG Road",
          severity: "High",
          department: "BBMP",
          actionRequired: "Fill with asphalt",
          safetyRisk: true,
          estimatedResponseTime: "24 hours"
        }),
        candidates: [{ groundingMetadata: { groundingChunks: [] } }]
      })
    };
  }

  return {
    GoogleGenAI,
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      BOOLEAN: 'BOOLEAN'
    }
  };
});

describe('analyzeUrbanIssue', () => {
  it('should return a CivicTicket when analysis is successful', async () => {
    const result = await analyzeUrbanIssue('base64data', 'image/png');
    expect(result.issueType).toBe('Pothole');
    expect(result.severity).toBe('High');
    expect(result.department).toBe('BBMP');
  });
});
