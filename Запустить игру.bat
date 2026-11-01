@echo off
rem Spider vs Humans: runs the game on this computer, nothing to install.
rem Keep this file in the unpacked game folder (next to index.html and the "launcher" folder) and double-click it.
rem The game opens in the default browser; close this window to stop the game.
rem The server itself is launcher\serve.ps1 (Windows PowerShell, built into Windows 7-11).
setlocal
title Spider vs Humans
if exist "%~dp0launcher\serve.ps1" if exist "%~dp0index.html" goto run
echo.
echo   Unpack the whole archive first (right click - Extract All), then run this file from the unpacked folder.
powershell.exe -NoProfile -Command "Write-Host ([regex]::Unescape('  \u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0440\u0430\u0441\u043f\u0430\u043a\u0443\u0439\u0442\u0435 \u0430\u0440\u0445\u0438\u0432 \u0446\u0435\u043b\u0438\u043a\u043e\u043c: \u043f\u0440\u0430\u0432\u043e\u0439 \u043a\u043d\u043e\u043f\u043a\u043e\u0439 \u043f\u043e \u0430\u0440\u0445\u0438\u0432\u0443 -\u003e \u00ab\u0418\u0437\u0432\u043b\u0435\u0447\u044c \u0432\u0441\u0435\u00bb,\n  \u0437\u0430\u0442\u0435\u043c \u0437\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u0435 \u00ab\u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c \u0438\u0433\u0440\u0443.bat\u00bb \u0438\u0437 \u0440\u0430\u0441\u043f\u0430\u043a\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u043f\u0430\u043f\u043a\u0438.')) -ForegroundColor Yellow"
echo.
pause
exit /b 1

:run
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0launcher\serve.ps1"
set "code=%errorlevel%"
if "%code%"=="0" exit /b 0
if "%code%"=="3" exit /b 3
echo.
echo   The game launcher stopped with an error (code %code%).
powershell.exe -NoProfile -Command "Write-Host ([regex]::Unescape('  \u0418\u0433\u0440\u0430 \u043d\u0435 \u0437\u0430\u043f\u0443\u0441\u0442\u0438\u043b\u0430\u0441\u044c \u2014 \u0442\u0435\u043a\u0441\u0442 \u043e\u0448\u0438\u0431\u043a\u0438 \u0432\u044b\u0448\u0435 \u0432 \u044d\u0442\u043e\u043c \u043e\u043a\u043d\u0435.')) -ForegroundColor Yellow"
pause
exit /b %code%
