@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set /p "YOUTUBE_URL=Paste one YouTube URL: "
if "%YOUTUBE_URL%"=="" (
  echo No URL was entered.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%daily-youtube.ps1" "%YOUTUBE_URL%"
set "RESULT=%ERRORLEVEL%"
echo.
if not "%RESULT%"=="0" echo The workflow stopped with an error. The files already downloaded were kept.
pause
exit /b %RESULT%
