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

REM ---- Alte Vite/Node-Prozesse im Projektverzeichnis und auf dem Port beenden ----
echo Pruefe auf laufende Spiel-Prozesse ...

powershell -NoProfile -Command ^
    "$port = %PORT%; " ^
    "$projDir = '%~dp0'; " ^
    "$projDir = $projDir.TrimEnd('\\'); " ^
    "$killed = @(); " ^
    "$procs = Get-Process -Name 'node' -ErrorAction SilentlyContinue | Where-Object { " ^
    "  try { $_.CommandLine -match [regex]::Escape($projDir) } catch { $false } " ^
    "}; " ^
    "if ($procs) { $procs | ForEach-Object { $killed += $_.Id; Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue } }; " ^
    "$connections = cmd /c 'netstat -ano ^| findstr \":%PORT% \" ^| findstr \"LISTEN\"' 2>$null; " ^
    "if ($connections) { " ^
    "  $connections | ForEach-Object { " ^
    "    $pid = $_ -replace '.*\s+(\d+)$','$1'; " ^
    "    if ($pid -and ($killed -notcontains $pid)) { $killed += $pid; Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } " ^
    "  } " ^
    "}; " ^
    "if ($killed.Count -eq 0) { Write-Host '  -> Keine alten Prozesse gefunden.' } " ^
    "else { $killed | ForEach-Object { Write-Host ('  -> Beende Prozess PID ' + $_) } }"

REM Kurz warten, damit Prozesse sich schliessen koennen
timeout /t 2 /nobreak >nul

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
