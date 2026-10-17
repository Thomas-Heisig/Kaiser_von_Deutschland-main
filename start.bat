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

set "PS_KILL_SCRIPT=%CD%\.kill_procs.ps1"
> "%PS_KILL_SCRIPT%" (
echo $port = %PORT%;
echo $dir = "%~dp0".TrimEnd("\");
echo $k = @();
echo $procs = Get-Process -Name "node" -ErrorAction SilentlyContinue ^| Where-Object { try { $_.CommandLine -match [regex]::Escape($dir) } catch { $false } };
echo if ^($procs^) { $procs ^| ForEach-Object { $k += $_.Id; Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue } };
echo cmd /c 'netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTEN"' 2^>$null ^| ForEach-Object { $pid = $_ -replace ".*\s+(\d+)$","$1"; if ^($pid -and ^($k -notcontains $pid^)^) { $k += $pid; Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } };
echo if ^($k.Count -eq 0^) { Write-Host "  -^> Keine alten Prozesse gefunden." } else { $k ^| ForEach-Object { Write-Host ("  -^> Beende Prozess PID " + $_^) } }
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_KILL_SCRIPT%"
del "%PS_KILL_SCRIPT%" 2>nul

REM Kurz warten, damit Prozesse sich schliessen koennen
timeout /t 2 /nobreak >nul

REM ---- IP-Adressen ermitteln ----
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "IP=%%a"
    goto :ipfound
)
:ipfound
set "LOCAL_IP=%IP: =%"

REM Oeffentliche IP abfragen
set "PUBLIC_IP=Unbekannt"
set "IP_SCRIPT=%CD%\.public_ip.ps1"
> "%IP_SCRIPT%" echo $wc = New-Object System.Net.WebClient; $wc.Headers.Add("User-Agent", "Mozilla/5.0"); try { $wc.DownloadString("https://api.ipify.org") } catch { "" }
for /f "delims=" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -File "%IP_SCRIPT%"') do set "PUBLIC_IP=%%i"
del "%IP_SCRIPT%" 2>nul

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
