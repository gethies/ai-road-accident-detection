@echo off
echo ==============================================================
echo S.U.R.E - Accident Detection AI Server
echo ==============================================================
echo Starting the AI Engine and WebSocket Server...
echo Make sure you have python installed and paths configured.

cd /d "%~dp0"
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Virtual environment not found. Please setup .venv first.
    pause
    exit /b
)

python app.py
pause
