@echo off
echo Starting Azure AI Content Safety - Frontend
echo.
cd /d d:\repos\contentsafety\frontend
echo Checking node_modules...
if not exist node_modules (
    echo Running npm install...
    npm install
)
echo.
echo App will be available at:  http://localhost:5173
echo Backend proxy target:      http://localhost:8000
echo.
npm run dev

