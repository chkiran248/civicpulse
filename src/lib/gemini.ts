export interface CivicTicket {
  id?: string;
  issueType: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  department: string;
  actionRequired: string;
  safetyRisk: boolean;
  estimatedResponseTime: string;
  groundingUrls?: string[];
  lat?: number | null;
  lng?: number | null;
  image?: string;
  status?: string;
  uid?: string;
  createdAt?: string;
}

export async function analyzeUrbanIssue(
  input: { base64Image?: string; mimeType?: string; textDescription?: string },
  location?: { lat: number; lng: number }
): Promise<CivicTicket> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, location }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Analysis failed' }));
    throw new Error(err.error || 'Analysis failed');
  }

  return response.json();
}
