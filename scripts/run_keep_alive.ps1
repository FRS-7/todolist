# 🛡️ Supabase Keep-Alive Ping (PowerShell)
# Jalankan skrip ini kapan saja untuk mem-ping database Supabase

$SUPABASE_URL = "https://gcakfwokwtgidaddieif.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjYWtmd29rd3RnaWRhZGRpZWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjI2NDQsImV4cCI6MjA5OTQ5ODY0NH0.K6o2T1qQSVV5FtyuUGYzyqEUL-qvfq5gGof8IG3lr3A"

$headers = @{
    "apikey"        = $SUPABASE_ANON_KEY
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    "User-Agent"    = "Supabase-KeepAlive-PowerShell/1.0"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Mengirim Ping Keep-Alive ke Supabase: $SUPABASE_URL" -ForegroundColor Cyan
Write-Host "📅 Waktu: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

$endpoint = "$SUPABASE_URL/rest/v1/categories?select=id&limit=1"

$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $response = Invoke-RestMethod -Uri $endpoint -Headers $headers -Method Get -TimeoutSec 10
    $sw.Stop()
    Write-Host "✅ [SUKSES] Database merespons dalam $($sw.ElapsedMilliseconds) ms!" -ForegroundColor Green
    Write-Host "🛡️ Timer inaktivitas 7 hari Supabase berhasil direset." -ForegroundColor Green
} catch {
    $sw.Stop()
    Write-Host "⚠️ [STATUS / ERROR]: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Latency: $($sw.ElapsedMilliseconds) ms" -ForegroundColor Gray
    Write-Host "💡 Catatan: Jika proyek sedang ter-pause, silakan unpause melalui dashboard Supabase." -ForegroundColor Cyan
}

