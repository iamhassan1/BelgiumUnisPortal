@echo off
echo ===================================================
echo   Starting Belgium Master's Portal
echo   Opening http://localhost:8000 in your browser...
echo   Press Ctrl+C to stop the server
echo ===================================================
start http://localhost:8000
python -m http.server 8000
