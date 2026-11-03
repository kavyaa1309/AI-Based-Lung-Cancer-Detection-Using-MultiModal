@echo off
REM Starts the analysis API on http://localhost:8000  (keep this window open)
cd /d "%~dp0backend"
call .venv\Scripts\activate.bat || ( echo Run 1_train_model.bat first. & pause & exit /b 1 )
uvicorn app:app --port 8000
pause
