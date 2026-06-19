export interface Subscriber {
  id: string;
  email: string;
  delivery_time: string; // "HH:MM" format
  timezone: string; // IANA timezone e.g. "Asia/Kolkata"
  is_active: boolean;
  created_at: string;
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  published_at: string;
  description: string;
  hash: string;
}

export interface RankedStory {
  title: string;
  url: string;
  source: string;
  published_at: string;
  description: string;
  summary: string;
  why_it_matters: string;
  score: number;
}

export interface BriefingData {
  date: string;
  stories: RankedStory[];
  executive_brief: string;
}

export interface SubscribePayload {
  email: string;
  delivery_time: string;
  timezone: string;
}
