@echo off
cd /d "%~dp0"
echo Fit3D start ho raha hai... pehli baar 2-5 minute lag sakte hain.
call npm install
if errorlevel 1 (
  echo.
  echo ERROR aaya. Upar ka laal text copy karke Claude ko bhejo.
  pause
  exit /b 1
)
start "" http://localhost:3000
echo.
echo App chal rahi hai: http://localhost:3000  (band karne ke liye ye window band karo)
call npm run dev
pause
