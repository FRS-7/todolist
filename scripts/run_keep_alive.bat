@echo off
title Supabase Database Keep-Alive Ping
powershell -ExecutionPolicy Bypass -File "%~dp0run_keep_alive.ps1"
echo.
echo Tekan sembarang tombol untuk keluar...
pause >nul

