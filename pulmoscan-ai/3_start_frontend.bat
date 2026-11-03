@echo off
REM Starts the website on http://localhost:5173  (keep this window open)
cd /d "%~dp0"
if not exist node_modules ( call npm install || ( pause & exit /b 1 ) )
call npm run dev
pause
