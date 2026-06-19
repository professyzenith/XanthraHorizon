-- ============================================
-- Xanthra Horizon — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  delivery_time TEXT NOT NULL DEFAULT '10:00',   -- "HH:MM" in user's local time
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata', -- IANA timezone string
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for fast email lookup
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(is_active);

-- Row Level Security: only service role can read/write
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: service role has full access (used by backend)
CREATE POLICY "Service role full access" ON subscribers
  FOR ALL USING (auth.role() = 'service_role');

-- Optional: articles cache table for deduplication across days
CREATE TABLE IF NOT EXISTS articles_seen (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  title TEXT,
  url TEXT,
  source TEXT,
  seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_hash ON articles_seen(hash);
CREATE INDEX IF NOT EXISTS idx_articles_seen_at ON articles_seen(seen_at);

-- Auto-clean articles older than 7 days (keeps table small)
-- Run this periodically via Supabase scheduled functions or pg_cron
-- DELETE FROM articles_seen WHERE seen_at < NOW() - INTERVAL '7 days';
