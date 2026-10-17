@echo off
setlocal enabledelayedexpansion
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

REM ---- IP-Adressen ermitteln ----
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "IP=%%a"
    goto :ipfound
)
:ipfound
set "LOCAL_IP=%IP: =%"

REM Oeffentliche IP im Hintergrund abfragen (max 3 Sekunden)
set "PUBLIC_IP=Unbekannt"
if "%PUBLIC_IP_CACHE%"=="" (
    powershell -NoProfile -Command ^
        "$wc = New-Object System.Net.WebClient; $wc.Headers.Add('User-Agent', 'Mozilla/5.0'); " ^
        "try { $wc.DownloadString('https://api.ipify.org') } catch { '' }" > "%TEMP%\public_ip.tmp" 2>nul
    if exist "%TEMP%\public_ip.tmp" (
        set /p PUBLIC_IP=<"%TEMP%\public_ip.tmp"
        del "%TEMP%\public_ip.tmp" 2>nul
    )
)

echo.
echo ============================================
echo   Kaiser von Deutschland
echo ============================================
echo.
echo   Port:         %PORT%
echo.
echo   Lokal:        %URL%
echo   Netzwerk:     http://%LOCAL_IP%:%PORT%
echo   Internet:     http://%PUBLIC_IP%:%PORT%
echo.
echo   Hinweise:
echo   - Netzwerk-Zugriff nur, wenn die Firewall
echo     den Port %PORT% freigibt.
echo   - Internet-Zugriff erfordert zusaetzlich
echo     eine Portweiterleitung im Router.
echo   - Mobilgeraet: Gleiches WLAN wie dieser PC.
echo.
echo ============================================
echo.
start "" cmd /c "timeout /t 4 /nobreak >nul & start "" "%URL%""
call npm run dev

if errorlevel 1 pause
endlocal
