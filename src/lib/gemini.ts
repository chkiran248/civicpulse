import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CivicTicket {
  issueType: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  department: string;
  actionRequired: string;
  safetyRisk: boolean;
  estimatedResponseTime: string;
}

export async function analyzeUrbanIssue(base64Image: string, mimeType: string): Promise<CivicTicket> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze this photo of an urban problem and provide a structured report for city officials. 
  Identify the type of issue, its severity, the responsible city department, a formal description, the required action, and any immediate safety risks.
  
  Return the response in JSON format.`;

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
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          issueType: { type: Type.STRING, description: "Short name of the issue (e.g., Pothole, Broken Streetlight)" },
          description: { type: Type.STRING, description: "A formal description of the problem" },
          severity: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
          department: { type: Type.STRING, description: "The city department responsible (e.g., Public Works, Utilities, Sanitation)" },
          actionRequired: { type: Type.STRING, description: "Specific action needed to fix the issue" },
          safetyRisk: { type: Type.BOOLEAN, description: "Whether there is an immediate danger to the public" },
          estimatedResponseTime: { type: Type.STRING, description: "Typical response time for this type of issue (e.g., 24-48 hours)" },
        },
        required: ["issueType", "description", "severity", "department", "actionRequired", "safetyRisk", "estimatedResponseTime"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as CivicTicket;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to analyze image");
  }
}
