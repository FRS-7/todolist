-- ============================================================
--  SKRIP SETUP DATABASE SUPABASE LENGKAP
--  Catatan Aktivitas Harian + Fitur Membaca Buku + Keep-Alive
-- ============================================================

-- 1. TABEL KATEGORI
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#7C3AED',
  icon TEXT NOT NULL DEFAULT '📌',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL AKTIVITAS
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  logged_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL BUKU (FITUR MEMBACA)
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  total_pages INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 0,
  status TEXT DEFAULT 'reading', -- 'reading', 'wishlist', 'finished'
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL PING LOG (KEEP-ALIVE SUPABASE)
CREATE TABLE IF NOT EXISTS db_pings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT DEFAULT 'bot',
  pinged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DATA KATEGORI BAWAAN
INSERT INTO categories (name, color, icon, is_default) VALUES
  ('Olahraga',  '#22C55E', '🏃', true),
  ('Makan',     '#F59E0B', '🍽️', true),
  ('Baca Buku', '#3B82F6', '📚', true)
ON CONFLICT DO NOTHING;

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE db_pings ENABLE ROW LEVEL SECURITY;

-- 7. POLICIES (IZINKAN SEMUA OPERASI UNTUK SINGLE USER)
CREATE POLICY "allow_all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_activities" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_books"      ON books FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_db_pings"   ON db_pings FOR ALL USING (true) WITH CHECK (true);

