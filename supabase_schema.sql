-- ========================================================
-- SUPABASE SCHEMA FOR 5 PPIC ISSUE HUB
-- Run this in your Supabase SQL Editor: https://app.supabase.com -> SQL Editor
-- ========================================================

-- 1. Create table for issues
CREATE TABLE IF NOT EXISTS public.issues (
  id TEXT PRIMARY KEY,
  ppic TEXT NOT NULL,           -- 'PPIC 1', 'PPIC 2', 'PPIC 3', 'PPIC 4', 'PPIC 5'
  title TEXT NOT NULL,
  date TEXT NOT NULL,           -- 'YYYY-MM-DD'
  status TEXT NOT NULL DEFAULT 'BELUM_SELESAI', -- 'BELUM_SELESAI' or 'SELESAI'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 2. Create table for customizable PPIC names
CREATE TABLE IF NOT EXISTS public.ppic_names (
  id TEXT PRIMARY KEY,          -- 'PPIC 1', 'PPIC 2', etc.
  custom_name TEXT NOT NULL
);

-- Insert initial PPIC names
INSERT INTO public.ppic_names (id, custom_name) VALUES
  ('PPIC 1', 'PPIC 1 (Royan)'),
  ('PPIC 2', 'PPIC 2 (Cynara)'),
  ('PPIC 3', 'PPIC 3 (Ami)'),
  ('PPIC 4', 'PPIC 4 (Ryan)'),
  ('PPIC 5', 'PPIC 5 (Hanamy)')
ON CONFLICT (id) DO NOTHING;

-- 3. Row Level Security policies
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to issues" 
ON public.issues FOR ALL 
USING (true) WITH CHECK (true);

ALTER TABLE public.ppic_names ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to ppic_names" 
ON public.ppic_names FOR ALL 
USING (true) WITH CHECK (true);

-- 4. Enable Realtime broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ppic_names;
