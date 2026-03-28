export interface NewsBrief {
  summary: string;
  headlines: { title: string; url: string; source: string }[];
  lastUpdated: string;
}

export async function getBengaluruNewsBriefing(): Promise<NewsBrief> {
  const response = await fetch('/api/news', { method: 'POST' });

  if (!response.ok) {
    throw new Error('Could not fetch the latest Bengaluru news briefing.');
  }

  return response.json();
}
