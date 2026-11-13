/**
 * 🛡️ BOT KEEP-ALIVE SUPABASE (Node.js)
 *
 * Mencegah Supabase Free Tier ter-pause otomatis setelah 7 hari tidak aktif.
 * Skrip ini mengirimkan request ringan ke REST API Supabase untuk mereset timer inaktivitas.
 *
 * PENGGUNAAN:
 * 1. Sekali jalan:
 *    node scripts/keep_alive.js
 *
 * 2. Berjalan terus di background (daemon setiap 3 hari):
 *    node scripts/keep_alive.js --daemon
 *
 * 3. Kustomisasi interval (misal setiap 2 hari):
 *    node scripts/keep_alive.js --daemon --days 2
 */

const https = require('https');

// Kredensial Supabase (bisa di-override lewat Environment Variables)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gcakfwokwtgidaddieif.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjYWtmd29rd3RnaWRhZGRpZWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjI2NDQsImV4cCI6MjA5OTQ5ODY0NH0.K6o2T1qQSVV5FtyuUGYzyqEUL-qvfq5gGof8IG3lr3A';

// Parsing argumen CLI
const args = process.argv.slice(2);
const isDaemon = args.includes('--daemon');
const daysIdx = args.indexOf('--days');
const intervalDays = daysIdx !== -1 && args[daysIdx + 1] ? parseFloat(args[daysIdx + 1]) : 3;
const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

function pingSupabase() {
  return new Promise((resolve, reject) => {
    const urlObj = new URL('/rest/v1/categories?select=id&limit=1', SUPABASE_URL);
    const start = Date.now();

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'Supabase-KeepAlive-Bot/1.0'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const latency = Date.now() - start;
        resolve({
          statusCode: res.statusCode,
          latency,
          body
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request Timeout (10 detik)'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function runPing() {
  const now = new Date().toLocaleString('id-ID', { timeZoneName: 'short' });
  console.log(`\n[${now}] 🚀 Mengirim Keep-Alive Ping ke: ${SUPABASE_URL}...`);

  try {
    const res = await pingSupabase();
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`✅ [SUKSES] HTTP ${res.statusCode} | Latency: ${res.latency}ms`);
      console.log(`🛡️ Database aktif! Timer inaktivitas 7 hari Supabase berhasil direset.`);
    } else {
      console.warn(`⚠️ [STATUS ABNORMAL] HTTP ${res.statusCode} | Latency: ${res.latency}ms`);
      console.warn(`Respon: ${res.body}`);
    }
  } catch (err) {
    console.error(`❌ [GAGAL] Error saat mem-ping: ${err.message}`);
    console.error(`💡 Catatan: Jika status 503/500, proyek mungkin sedang ter-pause di Supabase dashboard.`);
  }
}

async function main() {
  console.log('========================================================');
  console.log('🤖 SUPABASE DATABASE KEEP-ALIVE BOT');
  console.log(`🎯 Target: ${SUPABASE_URL}`);
  console.log(`⚙️ Mode: ${isDaemon ? `Daemon (Otomatis setiap ${intervalDays} hari)` : 'Sekali Jalan (One-Shot)'}`);
  console.log('========================================================');

  await runPing();

  if (isDaemon) {
    console.log(`\n⏳ Bot sedang berjalan di latar belakang.`);
    console.log(`⏰ Ping berikutnya akan dijalankan dalam ${intervalDays} hari (${intervalDays * 24} jam)...`);
    setInterval(runPing, intervalMs);
  }
}

main();

