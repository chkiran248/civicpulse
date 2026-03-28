import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface NewsBrief {
  summary: string;
  headlines: { title: string; url: string; source: string }[];
  lastUpdated: string;
}

export async function getBengaluruNewsBriefing(): Promise<NewsBrief> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Provide a concise summary of the most important civic and urban news in Bengaluru from the last 24 hours. 
  Focus on BBMP, BESCOM, BWSSB, traffic, and infrastructure updates.
  
  Format the response as a JSON object:
  {
    "summary": "A 3-4 sentence overview of the day's key civic updates.",
    "headlines": [
      { "title": "Headline of the news", "url": "URL to the news source", "source": "Name of the news source" }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    
    return {
      summary: data.summary || "No news summary available at the moment.",
      headlines: data.headlines || [],
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to fetch news briefing:", error);
    throw new Error("Could not fetch the latest Bengaluru news briefing.");
  }
}
