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
  input: { base64Image?: string; mimeType?: string; textDescription?: string },
  location?: { lat: number; lng: number }
): Promise<CivicTicket> {
  // Using gemini-3-flash-preview for faster and more reliable classification
  const model = "gemini-3-flash-preview";
  
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

  const parts: any[] = [{ text: prompt + "\n\n" + systemInstruction }];
  
  if (input.base64Image && input.mimeType) {
    parts.push({
      inlineData: {
        data: input.base64Image.split(",")[1],
        mimeType: input.mimeType,
      },
    });
  }

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model,
        contents: [{ parts }],
        config: {
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
    } catch (toolError) {
      console.warn("Analysis with Google Maps tool failed, retrying without tools...", toolError);
      // Fallback: Try without tools if the tool call fails
      response = await ai.models.generateContent({
        model,
        contents: [{ parts }],
      });
    }

    let text = response.text || "{}";
    
    // Extract JSON if it's wrapped in markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    if (jsonMatch) {
      text = jsonMatch[1];
    } else {
      // Sometimes it might just be the JSON string with some leading/trailing whitespace
      text = text.trim();
    }
    
    const ticket = JSON.parse(text) as CivicTicket;
    
    // Basic validation of the parsed object
    if (!ticket.issueType || !ticket.description) {
      throw new Error("Incomplete analysis result from AI");
    }
    
    // Extract grounding URLs if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      ticket.groundingUrls = chunks
        .filter(chunk => chunk.maps?.uri)
        .map(chunk => chunk.maps!.uri);
    }
    
    return ticket;
  } catch (e) {
    console.error("Gemini analysis error:", e);
    throw e; // Re-throw the original error for better debugging
  }
}
