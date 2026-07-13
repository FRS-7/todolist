# 📋 Panduan Setup — Catatan Aktivitas Harian

Ikuti langkah-langkah berikut untuk menghubungkan aplikasi ke Supabase-mu.

---

## Langkah 1 — Buat Tabel di Supabase

1. Buka [supabase.com](https://supabase.com) dan login
2. Masuk ke project-mu
3. Klik menu **SQL Editor** di sidebar kiri
4. Klik tombol **New Query**
5. Copy & paste SQL berikut, lalu klik **Run**:

```sql
-- Tabel kategori
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#7C3AED',
  icon TEXT NOT NULL DEFAULT '📌',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel aktivitas
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  logged_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data kategori bawaan
INSERT INTO categories (name, color, icon, is_default) VALUES
  ('Olahraga', '#22C55E', '🏃', true),
  ('Makan',    '#F59E0B', '🍽️', true),
  ('Baca Buku','#3B82F6', '📚', true);

-- Aktifkan Row Level Security (RLS) — opsional tapi disarankan
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy: izinkan semua operasi (karena single user tanpa auth)
CREATE POLICY "allow_all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_activities" ON activities FOR ALL USING (true) WITH CHECK (true);
```

---

## Langkah 2 — Ambil Credentials

1. Di Supabase, klik **Settings** (ikon roda gigi) di sidebar
2. Pilih **API**
3. Copy dua nilai berikut:
   - **Project URL** (contoh: `https://abcxyz.supabase.co`)
   - **anon public** key (string panjang di bawah "Project API keys")

---

## Langkah 3 — Isi ke Aplikasi

Buka file `supabase.js` dan ganti baris berikut:

```js
// SEBELUM:
const SUPABASE_URL = 'GANTI_DENGAN_PROJECT_URL_KAMU';
const SUPABASE_ANON_KEY = 'GANTI_DENGAN_ANON_KEY_KAMU';

// SESUDAH (contoh):
const SUPABASE_URL = 'https://abcxyz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## Langkah 4 — Buka Aplikasi

Buka file `index.html` langsung di browser, atau gunakan live server:

```bash
# Opsi 1: Buka langsung
# Double-click file index.html

# Opsi 2: Gunakan VS Code Live Server extension
# Klik kanan index.html → "Open with Live Server"

# Opsi 3: Python (jika terinstall)
python -m http.server 8080
# Buka http://localhost:8080
```

---

## Langkah 5 — Install ke HP (PWA)

**Android (Chrome):**
1. Buka aplikasi di Chrome browser HP
2. Ketuk ikon ⋮ (titik tiga) → **Add to Home screen**
3. Ketuk **Add** → ikon aplikasi muncul di home screen!

**iPhone (Safari):**
1. Buka di Safari
2. Ketuk ikon **Share** (kotak dengan panah ke atas)
3. Pilih **Add to Home Screen**
4. Ketuk **Add**

> ⚠️ PWA memerlukan HTTPS untuk bisa diinstall di HP. Jika hanya menggunakan file lokal, gunakan Vercel/Netlify untuk deploy gratis.

---

## Deploy Gratis (Opsional)

Agar bisa diakses dari HP via HTTPS:

**Vercel:**
1. Upload folder ke GitHub
2. Buka [vercel.com](https://vercel.com) → Import project
3. Deploy otomatis, dapat URL HTTPS gratis

**Netlify:**
1. Buka [netlify.com](https://netlify.com)
2. Drag & drop seluruh folder ke dashboard
3. Langsung online!

---

## Struktur File

```
todolistapp/
├── index.html      ← Buka file ini di browser
├── style.css       ← Tampilan (tidak perlu diedit)
├── app.js          ← Logika aplikasi (tidak perlu diedit)
├── supabase.js     ← ⚠️ ISI CREDENTIALS DI SINI
├── manifest.json   ← PWA config
├── sw.js           ← Service Worker (offline)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md       ← File ini
```
