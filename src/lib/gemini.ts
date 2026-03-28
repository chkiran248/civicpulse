import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CivicTicket {
  id?: string;
  issueType: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
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
  base64Image: string, 
  mimeType: string, 
  location?: { lat: number; lng: number }
): Promise<CivicTicket> {
  // Upgraded to gemini-3.1-pro-preview for complex image understanding
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `Analyze this photo of an urban problem in Bengaluru, Karnataka, India. 
  Identify the type of issue, its severity, and the responsible city department.
  
  Responsible departments in Bengaluru include:
  - BBMP (Bruhat Bengaluru Mahanagara Palike): For potholes, garbage, streetlights, drainage, and public spaces.
  - BESCOM (Bangalore Electricity Supply Company): For power lines, transformers, and electrical hazards.
  - BWSSB (Bangalore Water Supply and Sewerage Board): For water leaks, sewage overflows, and water supply issues.
  - Bengaluru Traffic Police: For traffic signals, road blockages, and parking issues.
  
  Provide a formal description, the required action, and any immediate safety risks.
  Use Google Maps data to verify if this is a known issue or to provide more context about the location if possible.
  
  Return the response in JSON format with the following structure:
  {
    "issueType": "Short name of the issue",
    "description": "A formal description",
    "severity": "Low" | "Medium" | "High" | "Critical",
    "department": "The city department responsible",
    "actionRequired": "Specific action needed",
    "safetyRisk": boolean,
    "estimatedResponseTime": "Typical response time"
  }`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image.split(",")[1],
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    config: {
      // responseMimeType and responseSchema are NOT allowed when using googleMaps
      tools: [{ googleMaps: {} }],
      toolConfig: location ? {
        retrievalConfig: {
          latLng: {
            latitude: location.lat,
            longitude: location.lng
          }
        }
      } : undefined
    },
  });

  try {
    let text = response.text || "{}";
    
    // Extract JSON if it's wrapped in markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    if (jsonMatch) {
      text = jsonMatch[1];
    }
    
    const ticket = JSON.parse(text) as CivicTicket;
    
    // Extract grounding URLs if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      ticket.groundingUrls = chunks
        .filter(chunk => chunk.maps?.uri)
        .map(chunk => chunk.maps!.uri);
    }
    
    return ticket;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to analyze image");
  }
}
