import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL = 'gemini-2.0-flash';

// ── Input sanitisation ────────────────────────────────────────────────────────
function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')         // strip HTML tags
    .replace(/javascript:/gi, '')    // strip JS protocol
    .trim()
    .slice(0, 2000);                 // enforce max length
}

function validateAnalyzeInput(body: unknown): {
  input: { base64Image?: string; mimeType?: string; textDescription?: string };
  location?: { lat: number; lng: number };
} {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body');
  const b = body as Record<string, unknown>;
  const input = b.input as Record<string, unknown> | undefined;
  if (!input) throw new Error('Missing input field');
  if (!input.base64Image && !input.textDescription) {
    throw new Error('Either base64Image or textDescription is required');
  }
  if (input.textDescription) {
    input.textDescription = sanitizeText(String(input.textDescription));
    if (!input.textDescription) throw new Error('Description is empty after sanitisation');
  }
  if (input.base64Image && typeof input.base64Image !== 'string') {
    throw new Error('base64Image must be a string');
  }
  let location: { lat: number; lng: number } | undefined;
  if (b.location && typeof b.location === 'object') {
    const loc = b.location as Record<string, unknown>;
    if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      location = { lat: loc.lat, lng: loc.lng };
    }
  }
  return { input: input as never, location };
}

// ── POST /api/analyze ─────────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  try {
    const { input, location } = validateAnalyzeInput(req.body);

    const prompt = input.base64Image
      ? `Analyze this photo of an urban problem in Bengaluru, Karnataka, India.
  Identify the type of issue, its severity, and the responsible city department.`
      : `Analyze this description of an urban problem in Bengaluru, Karnataka, India: "${input.textDescription}".
  Identify the type of issue, its severity, and the responsible city department.`;

    const systemInstruction = `
  You are an expert urban issue analyzer for Bengaluru, Karnataka.
  Responsible departments in Bengaluru include:
  - BBMP (Bruhat Bengaluru Mahanagara Palike): For potholes, garbage, streetlights, drainage, and public spaces.
  - BESCOM (Bangalore Electricity Supply Company): For power lines, transformers, and electrical hazards.
  - BWSSB (Bangalore Water Supply and Sewerage Board): For water leaks, sewage overflows, and water supply issues.
  - Bengaluru Traffic Police: For traffic signals, road blockages, and parking issues.

  Provide a formal description, the required action, and any immediate safety risks.
  Use Google Maps data to verify if this is a known issue or to provide more context about the location if possible.

  IMPORTANT: You MUST return ONLY a valid JSON object. Do not include any markdown formatting or extra text.

  JSON Structure:
  {
    "issueType": "Short name of the issue",
    "description": "A formal description",
    "severity": "Low" | "Medium" | "High" | "Critical",
    "department": "The city department responsible",
    "actionRequired": "Specific action needed",
    "safetyRisk": boolean,
    "estimatedResponseTime": "Typical response time"
  }`;

    const parts: Record<string, unknown>[] = [{ text: prompt + '\n\n' + systemInstruction }];
    if (input.base64Image && input.mimeType) {
      parts.push({
        inlineData: {
          data: input.base64Image.split(',')[1],
          mimeType: input.mimeType,
        },
      });
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ parts }],
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: location
            ? { retrievalConfig: { latLng: { latitude: location.lat, longitude: location.lng } } }
            : undefined,
        },
      });
    } catch {
      response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ parts }],
      });
    }

    let text = response.text || '{}';
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    if (jsonMatch) text = jsonMatch[1];
    else text = text.trim();

    const ticket = JSON.parse(text);
    if (!ticket.issueType || !ticket.description) {
      throw new Error('Incomplete analysis result from AI');
    }

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      ticket.groundingUrls = chunks
        .filter((c: Record<string, unknown>) => (c.maps as Record<string, unknown>)?.uri)
        .map((c: Record<string, unknown>) => (c.maps as Record<string, unknown>).uri);
    }

    res.json(ticket);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Analysis failed' });
  }
});

// ── POST /api/news ────────────────────────────────────────────────────────────
app.post('/api/news', async (_req, res) => {
  try {
    const prompt = `Provide a concise summary of the most important civic and urban news in Bengaluru from the last 24 hours.
  Focus on BBMP, BESCOM, BWSSB, traffic, and infrastructure updates.

  Format the response as a JSON object:
  {
    "summary": "A 3-4 sentence overview of the day's key civic updates.",
    "headlines": [
      { "title": "Headline of the news", "url": "URL to the news source", "source": "Name of the news source" }
    ]
  }`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const data = JSON.parse(text);

    res.json({
      summary: data.summary || 'No news summary available at the moment.',
      headlines: Array.isArray(data.headlines) ? data.headlines : [],
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('News error:', err);
    res.status(500).json({ error: 'Could not fetch the latest Bengaluru news briefing.' });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => console.log(`CivicPulse API server running on :${PORT}`));
