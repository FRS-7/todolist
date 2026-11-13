#!/usr/bin/env python3
"""
🛡️ BOT KEEP-ALIVE SUPABASE (Python 3)

Mencegah Supabase Free Tier ter-pause otomatis setelah 7 hari tidak aktif.
Skrip ini mengirimkan request ringan ke REST API Supabase untuk mereset timer inaktivitas.

PENGGUNAAN:
1. Sekali jalan:
   python scripts/keep_alive.py

2. Berjalan terus di background (daemon setiap 3 hari):
   python scripts/keep_alive.py --daemon

3. Kustomisasi interval (misal setiap 2 hari):
   python scripts/keep_alive.py --daemon --days 2
"""

import sys
import time
import os
import urllib.request
import urllib.error
from datetime import datetime

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://gcakfwokwtgidaddieif.supabase.co")
SUPABASE_ANON_KEY = os.environ.get(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjYWtmd29rd3RnaWRhZGRpZWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjI2NDQsImV4cCI6MjA5OTQ5ODY0NH0.K6o2T1qQSVV5FtyuUGYzyqEUL-qvfq5gGof8IG3lr3A"
)

def ping_supabase():
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/categories?select=id&limit=1"
    req = urllib.request.Request(endpoint, headers={
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "User-Agent": "Supabase-KeepAlive-Bot-Python/1.0"
    })

    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            latency = int((time.time() - start_time) * 1000)
            return resp.status, latency, resp.read().decode('utf-8', errors='ignore')
    except urllib.error.HTTPError as e:
        latency = int((time.time() - start_time) * 1000)
        return e.code, latency, str(e)
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        raise e

def run_ping():
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n[{now_str}] 🚀 Mengirim Keep-Alive Ping ke: {SUPABASE_URL}...")
    try:
        status, latency, body = ping_supabase()
        if 200 <= status < 300:
            print(f"✅ [SUKSES] HTTP {status} | Latency: {latency}ms")
            print("🛡️ Database aktif! Timer inaktivitas 7 hari Supabase berhasil direset.")
        else:
            print(f"⚠️ [STATUS ABNORMAL] HTTP {status} | Latency: {latency}ms")
            print(f"Respon: {body}")
    except Exception as err:
        print(f"❌ [GAGAL] Error saat mem-ping: {err}")
        print("💡 Catatan: Jika proyek sedang ter-pause, silakan unpause melalui dashboard Supabase.")

def main():
    args = sys.argv[1:]
    is_daemon = "--daemon" in args
    interval_days = 3.0

    if "--days" in args:
        try:
            idx = args.index("--days")
            interval_days = float(args[idx + 1])
        except (ValueError, IndexError):
            interval_days = 3.0

    interval_seconds = interval_days * 86400

    print("==========================================================")
    print("🤖 SUPABASE DATABASE KEEP-ALIVE BOT (Python)")
    print(f"🎯 Target: {SUPABASE_URL}")
    print(f"⚙️ Mode: {'Daemon (setiap ' + str(interval_days) + ' hari)' if is_daemon else 'Sekali Jalan'}")
    print("==========================================================")

    run_ping()

    if is_daemon:
        print(f"\n⏳ Bot aktif di background. Menunggu {interval_days} hari untuk ping berikutnya...")
        while True:
            time.sleep(interval_seconds)
            run_ping()

if __name__ == "__main__":
    main()

