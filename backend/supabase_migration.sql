-- Supabase SQL Migration for BVMT Trading Assistant
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    supabase_uid TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'investor' CHECK (role IN ('investor', 'cmf_inspector')),
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stocks table
CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    groupe INTEGER DEFAULT 11
);

-- Price data table
CREATE TABLE IF NOT EXISTS price_data (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stock(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    open FLOAT NOT NULL,
    high FLOAT NOT NULL,
    low FLOAT NOT NULL,
    close FLOAT NOT NULL,
    volume INTEGER DEFAULT 0,
    transactions INTEGER DEFAULT 0,
    capital FLOAT DEFAULT 0
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_price_data_stock_date ON price_data(stock_id, date DESC);

-- Portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    stock_code TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    avg_buy_price FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio(user_id);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    stock_code TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, stock_code)
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alert (
    id SERIAL PRIMARY KEY,
    stock_code TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_alert_timestamp ON alert(timestamp DESC);

-- Predictions cache table (optional, for storing ML predictions)
CREATE TABLE IF NOT EXISTS prediction_cache (
    id SERIAL PRIMARY KEY,
    stock_code TEXT NOT NULL,
    model_type TEXT NOT NULL,
    prediction_date DATE NOT NULL,
    day_1_price FLOAT,
    day_2_price FLOAT,
    day_3_price FLOAT,
    day_4_price FLOAT,
    day_5_price FLOAT,
    confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stock_code, model_type, prediction_date)
);

-- Row Level Security (RLS) policies
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own portfolio
CREATE POLICY "Users can manage their portfolio" ON portfolio
    FOR ALL USING (user_id = auth.uid()::text);

-- Allow users to manage their own watchlist  
CREATE POLICY "Users can manage their watchlist" ON watchlist
    FOR ALL USING (user_id = auth.uid()::text);

-- Public read access for stocks and price data
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for stocks" ON stock
    FOR SELECT USING (true);

CREATE POLICY "Public read access for price data" ON price_data
    FOR SELECT USING (true);

-- Insert some demo data
INSERT INTO stock (code, name, groupe) VALUES
    ('BIAT', 'Banque Internationale Arabe de Tunisie', 11),
    ('BNA', 'Banque Nationale Agricole', 11),
    ('SFBT', 'Société de Fabrication des Boissons de Tunisie', 11),
    ('ATB', 'Arab Tunisian Bank', 11),
    ('BH', 'Banque de l''Habitat', 11),
    ('UIB', 'Union Internationale de Banques', 11),
    ('STAR', 'Société Tunisienne d''Assurances', 11),
    ('POULINA', 'Poulina Group Holding', 11),
    ('ADWYA', 'Adwya', 11),
    ('SAH', 'SAH Lilas', 11)
ON CONFLICT (code) DO NOTHING;

-- News table for scraped articles with sentiment
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

CREATE POLICY "Public read access for news" ON news
    FOR SELECT USING (true);

-- Grant permissions for anon and authenticated users
GRANT SELECT ON stock TO anon, authenticated;
GRANT SELECT ON price_data TO anon, authenticated;
GRANT ALL ON portfolio TO authenticated;
GRANT ALL ON watchlist TO authenticated;
GRANT SELECT ON alert TO anon, authenticated;
GRANT SELECT ON news TO anon, authenticated;
