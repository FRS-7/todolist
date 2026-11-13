# 🛡️ Panduan Sistem Anti-Pause Supabase Database

Panduan lengkap agar database Supabase-mu **tidak pernah mati, tidur, atau ter-pause otomatis**.

---

## ❓ Mengapa Database Supabase Bisa Ter-pause?

Pada paket **Supabase Free Tier (Gratis)**:
- Supabase memiliki aturan bahwa jika suatu proyek **tidak menerima request API atau aktivitas database selama 7 hari berturut-turut**, proyek tersebut akan otomatis di-**pause** (dinonaktifkan sementara) untuk menghemat sumber daya server.
- Setelah ter-pause, aplikasi web tidak bisa membaca/menyimpan data sampai kamu login ke dashboard Supabase dan menekan tombol **"Restore project" / "Unpause"**.

---

## 🤖 Solusi: Bot Keep-Alive Otomatis (Sudah Terpasang)

Untuk mencegah hal tersebut, kami telah menyiapkan **4 lapisan pengaman anti-pause**:

### 1. 🌟 GitHub Actions Bot (Otomatis di Cloud — 100% Gratis & Terbaik)
File: [`.github/workflows/supabase-keepalive.yml`](file:///.github/workflows/supabase-keepalive.yml)

- **Cara kerja:** GitHub Actions akan otomatis menjalankan bot di cloud GitHub **setiap 3 hari sekali** (pukul 11:00 WIB).
- **Kelebihan:** Berjalan di cloud GitHub secara gratis tanpa perlu membuka laptop atau komputer!
- **Status:** Begitu kamu melakukan `git push` ke GitHub, workflow ini langsung aktif!
- **Pemicuan manual:** Kamu juga bisa memicu ping kapan saja melalui tab **Actions** di GitHub repository-mu lalu klik **Run workflow**.

---

### 2. ⚡ In-App Keep-Alive & Indikator Database
Tersedia langsung di header website:
- **Badge Status:** Di pojok kanan atas website terdapat badge status `🟢 DB Online`.
- **Fitur Ping Manual:** Jika diklik, akan muncul modal detail koneksi lengkap dengan tombol **"⚡ Ping Database Sekarang"**.
- Setiap kali kamu membuka aplikasi, aplikasi otomatis melakukan request ringan ke Supabase yang otomatis mereset hitungan 7 hari.

---

### 3. 💻 Skrip Bot Mandiri (Node.js & Python)
Jika kamu memiliki VPS, server rumah, atau ingin menjalankan bot di latar belakang komputermu:

#### Opsi A — Node.js
```bash
# Sekali jalan (cek koneksi):
node scripts/keep_alive.js

# Berjalan di background (otomatis ping setiap 3 hari):
node scripts/keep_alive.js --daemon
```

#### Opsi B — Python
```bash
# Sekali jalan:
python scripts/keep_alive.py

# Berjalan di background (otomatis ping setiap 3 hari):
python scripts/keep_alive.py --daemon
```

#### Opsi C — Windows (Double Click)
- Cukup double-click file [`scripts/run_keep_alive.bat`](file:///scripts/run_keep_alive.bat) di File Explorer Windows untuk langsung mem-ping database.

---

### 4. 🌐 Alternatif Tambahan: cron-job.org (Gratis Selamanya)
Jika kamu ingin pengingat eksternal gratis tanpa perlu menyalakan komputer:
1. Buka [cron-job.org](https://cron-job.org) dan daftar gratis.
2. Klik **Create Cronjob**.
3. Masukkan konfigurasi berikut:
   - **Title:** `Supabase Keepalive`
   - **URL:** `https://gcakfwokwtgidaddieif.supabase.co/rest/v1/categories?select=id&limit=1`
   - **Execution schedule:** Every 3 days (Setiap 3 hari)
   - **Advanced > Headers:**
     - Header 1: `apikey` : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (anon key)
     - Header 2: `Authorization` : `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. Klik **Save**. Selesai! Layanan ini akan mem-ping Supabase-mu selamanya tanpa henti.

---

## 🚨 Apa yang Harus Dilakukan Jika Database Terlanjur Ter-pause?

Jika suatu saat kamu tidak membuka web selama lebih dari 7 hari dan bot belum sempat aktif:
1. Buka [supabase.com/dashboard](https://supabase.com/dashboard)
2. Klik proyekmu (`gcakfwokwtgidaddieif`)
3. Klik tombol hijau **"Restore project"**
4. Tunggu sekitar 1–2 menit hingga status berubah menjadi **Active**
5. Database dan aplikasimu kembali normal seperti semula!

