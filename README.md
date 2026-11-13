# 📋 Catatan Aktivitas Harian & Reading Companion 📚

Aplikasi web modern (PWA) untuk mencatat aktivitas harian, melacak progres membaca buku dengan pengingat notifikasi otomatis, dan dilengkapi bot anti-pause untuk menjaga database Supabase tetap aktif selamanya.

---

## ✨ Fitur Utama

### 1. ✏️ Catatan Aktivitas Harian
- Jam real-time presisi dengan tanggal dan hari lokal Indonesia.
- Catat aktivitas cepat (otomatis waktu sekarang atau atur manual).
- Kategori dengan ikon emoji dan warna kustom.
- Edit dan hapus aktivitas dengan konfirmasi aman.
- Rekap bulanan interaktif dengan ringkasan per kategori dan ekspor laporan ke PDF.

### 2. 📚 Fitur Khusus Membaca Buku (Reading Companion)
- **🔔 Pengingat Membaca Harian (Smart Notifications):**
  - Jadwalkan jam pengingat harian (misal: pukul 20:00).
  - Notifikasi browser (Web Notification API) + nada lembut lonceng (Web Audio API).
  - Pengecekan otomatis: Mengingatkan jika hari ini kamu belum membaca buku!
  - Tombol uji coba notifikasi langsung.
- **⏱️ Focus Reading Timer & Stopwatch:**
  - Pilihan preset: 15m, 25m (Pomodoro), 30m, 45m, 60m, atau mode stopwatch bebas.
  - Pilih buku yang sedang dibaca dan catat rentang halaman (misal hal 25–45).
  - Otomatis mencatat aktivitas ke Supabase dengan kategori 'Baca Buku' dan memperbarui progres halaman buku saat sesi selesai!
  - Nada penyelesaian sesi yang menyenangkan.
- **📖 Rak Buku Saya (My Bookshelf):**
  - Simpan daftar buku dengan judul, penulis, total halaman, dan halaman saat ini.
  - Progress bar visual dengan persentase halaman yang dibaca.
  - Filter status: *Sedang Dibaca*, *Ingin Dibaca*, *Selesai*.
  - Kutipan dan catatan penting untuk setiap buku.
  - Tombol update progres halaman kilat.
  - **Smart Sync:** Tersimpan di Supabase dengan fallback offline otomatis ke LocalStorage.
- **🔥 Streak Membaca & Kutipan Inspiratif:**
  - Menghitung berapa hari berturut-turut kamu membaca.
  - Kutipan motivasi membaca harian (Bung Hatta, Najwa Shihab, Dr. Seuss, Pramoedya Ananta Toer, dll).

### 3. 🛡️ Bot Anti-Pause Supabase (Database Never Dies)
- **GitHub Actions Bot:** Otomatis mem-ping database setiap **3 hari sekali** di cloud GitHub, sehingga database Supabase Free Tier tidak akan pernah ter-pause (aturan 7 hari inaktivitas).
- **In-App DB Health Widget:** Indikator `🟢 DB Online` di header dengan fitur ping langsung dan pengetesan latensi (ms).
- **Skrip Bot Mandiri:** Tersedia skrip Node.js, Python, dan PowerShell di folder `scripts/` yang siap dijalankan kapan saja.
- Panduan lengkap tersedia di [`PANDUAN_ANTI_PAUSE_DATABASE.md`](file:///PANDUAN_ANTI_PAUSE_DATABASE.md).

---

## 🚀 Setup Database Supabase

Jika ingin membuat seluruh tabel baru di Supabase:

1. Buka [supabase.com](https://supabase.com) dan masuk ke project-mu.
2. Buka menu **SQL Editor** di sidebar kiri.
3. Buka file [`setup_database.sql`](file:///setup_database.sql), copy seluruh isinya dan klik **Run**.

SQL tersebut membuat tabel:
- `categories` (Kategori aktivitas)
- `activities` (Catatan aktivitas)
- `books` (Koleksi buku dan progres halaman)
- `db_pings` (Log keep-alive ping)

*(Catatan: Aplikasi tetap berjalan lancar dengan penyimpanan lokal sekalipun tabel `books` belum dibuat di Supabase).*

---

## 🤖 Menjalankan Bot Keep-Alive

### Opsi 1: Otomatis via GitHub Actions (Rekomendasi)
Cukup push repository ini ke GitHub:
```bash
git add .
git commit -m "Add reading features and keep-alive bot"
git push origin main
```
Workflow di [`.github/workflows/supabase-keepalive.yml`](file:///.github/workflows/supabase-keepalive.yml) akan otomatis berjalan setiap 3 hari sekali.

### Opsi 2: Skrip Mandiri di Laptop / Server
```bash
# Node.js:
node scripts/keep_alive.js

# Python:
python scripts/keep_alive.py

# Windows (Double-click file batch):
scripts/run_keep_alive.bat
```

---

## 📱 PWA (Install ke HP)

- **Android (Chrome):** Buka URL aplikasi di Chrome → Menu ⋮ → **Add to Home screen**.
- **iPhone (Safari):** Buka URL di Safari → Ikon Share → **Add to Home Screen**.

---

## 📁 Struktur File

```
todolist/
├── .github/
│   └── workflows/
│       └── supabase-keepalive.yml  ← 🤖 Bot GitHub Actions (setiap 3 hari)
├── scripts/
│   ├── keep_alive.js               ← Bot Node.js mandiri
│   ├── keep_alive.py               ← Bot Python mandiri
│   ├── run_keep_alive.ps1          ← Skrip PowerShell ping
│   └── run_keep_alive.bat          ← Double-click ping Windows
├── index.html                      ← Halaman web utama
├── style.css                       ← Tampilan dan styling modern dark-mode
├── app.js                          ← Logika aplikasi, timer, notifikasi & rak buku
├── supabase.js                     ← Kredensial Supabase & helper fungsi
├── setup_database.sql              ← Skrip SQL lengkap untuk Supabase
├── PANDUAN_ANTI_PAUSE_DATABASE.md  ← Panduan lengkap anti-pause database
├── manifest.json                   ← Konfigurasi PWA
├── sw.js                           ← Service Worker & Push Notification
└── icons/
    ├── icon-192.png
    └── icon-512.png
```
