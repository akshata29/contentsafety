@echo off
echo Starting Azure AI Content Safety - Backend
echo.
call d:\repos\contentsafety\.venv\Scripts\activate.bat
cd /d d:\repos\contentsafety\backend
echo Virtual env: %VIRTUAL_ENV%
echo.
echo API docs will be available at:  http://localhost:8000/docs
echo Health check:                   http://localhost:8000/api/health
echo.
uvicorn main:app --reload --port 8000 --host 0.0.0.0

