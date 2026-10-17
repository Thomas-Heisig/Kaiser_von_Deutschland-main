@echo off
setlocal
title Kaiser von Deutschland
cd /d "%~dp0"

if "%PORT%"=="" set "PORT=4100"
set "URL=http://localhost:%PORT%"

where npm >nul 2>nul
if errorlevel 1 (
    echo [Fehler] Node.js/npm wurde nicht gefunden. Bitte Node.js installieren: https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Abhaengigkeiten werden installiert...
    call npm ci
    if errorlevel 1 (
        echo [Fehler] Installation fehlgeschlagen.
        pause
        exit /b 1
    )
)

powershell -NoProfile -Command "try { Invoke-WebRequest '%URL%' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 (
    echo Spiel laeuft bereits auf %URL%
    start "" "%URL%"
    exit /b 0
)

echo Starte Kaiser von Deutschland auf %URL% ...
start "" cmd /c "timeout /t 4 /nobreak >nul & start "" "%URL%""
call npm run dev

if errorlevel 1 pause
endlocal
