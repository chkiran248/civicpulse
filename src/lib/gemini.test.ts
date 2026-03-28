import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeUrbanIssue } from './gemini';

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
      BOOLEAN: 'BOOLEAN'
    }
  };
});

describe('analyzeUrbanIssue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a CivicTicket when image analysis is successful', async () => {
    mockGenerateContent.mockResolvedValueOnce({
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
    });

    const result = await analyzeUrbanIssue({ base64Image: 'base64data', mimeType: 'image/png' });
    expect(result.issueType).toBe('Pothole');
    expect(result.severity).toBe('High');
    expect(result.department).toBe('BBMP');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('should return a CivicTicket when text analysis is successful', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        issueType: "Garbage",
        description: "Illegal dumping in Indiranagar",
        severity: "Medium",
        department: "BBMP",
        actionRequired: "Clear the waste",
        safetyRisk: false,
        estimatedResponseTime: "48 hours"
      }),
      candidates: [{ groundingMetadata: { groundingChunks: [] } }]
    });

    const result = await analyzeUrbanIssue({ textDescription: 'Garbage pile near my house' });
    expect(result.issueType).toBe('Garbage');
    expect(result.severity).toBe('Medium');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('should handle grounding metadata correctly', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        issueType: "Water Leak",
        description: "Pipe burst in Koramangala",
        severity: "High",
        department: "BWSSB",
        actionRequired: "Repair pipe",
        safetyRisk: false,
        estimatedResponseTime: "12 hours"
      }),
      candidates: [{ 
        groundingMetadata: { 
          groundingChunks: [
            { maps: { uri: "https://maps.google.com/123", title: "Water Leak Location" } }
          ] 
        } 
      }]
    });

    const result = await analyzeUrbanIssue({ textDescription: 'Water leak' });
    expect(result.groundingUrls).toContain("https://maps.google.com/123");
  });

  it('should retry without tools if the first attempt fails', async () => {
    // First call fails (simulating tool error)
    mockGenerateContent.mockRejectedValueOnce(new Error("Tool error"));
    // Second call succeeds
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        issueType: "Pothole",
        description: "Fallback analysis",
        severity: "Low",
        department: "BBMP",
        actionRequired: "Monitor",
        safetyRisk: false,
        estimatedResponseTime: "7 days"
      }),
      candidates: []
    });

    const result = await analyzeUrbanIssue({ textDescription: 'Small crack' });
    expect(result.description).toBe('Fallback analysis');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('should throw error if AI returns invalid JSON', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: "Invalid JSON",
      candidates: []
    });

    await expect(analyzeUrbanIssue({ textDescription: 'test' })).rejects.toThrow();
  });
});
