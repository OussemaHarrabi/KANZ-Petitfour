-- Run this in Supabase SQL Editor to add the News table
-- This is safe to run if other tables already exist

CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    date DATE,
    source TEXT NOT NULL,
    stock_code TEXT,
    language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'ar')),
    sentiment_score FLOAT,
    sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
    sentiment_confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_stock ON news(stock_code);
CREATE INDEX IF NOT EXISTS idx_news_date ON news(date DESC);
CREATE INDEX IF NOT EXISTS idx_news_source ON news(source);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'news' AND policyname = 'Public read access for news'
    ) THEN
        CREATE POLICY "Public read access for news" ON news FOR SELECT USING (true);
    END IF;
END
$$;

GRANT SELECT ON news TO anon, authenticated;
