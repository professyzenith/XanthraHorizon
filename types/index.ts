export type Topic =
  | "ai_tech"
  | "geopolitics"
  | "politics"
  | "business"
  | "science"
  | "sports"
  | "health";

export interface Subscriber {
  id: string;
  email: string;
  delivery_time: string; // "HH:MM" format
  timezone: string; // IANA timezone e.g. "Asia/Kolkata"
  topics: Topic[];
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
  topic: Topic; // which category this article belongs to
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
  topic: Topic;
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
  topics: Topic[];
}

export interface SupportTicket {
  id: string;
  email: string;
  category: "bug" | "delivery" | "feature" | "account" | "other";
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
}

export interface SupportPayload {
  email: string;
  category: SupportTicket["category"];
  subject: string;
  message: string;
}
