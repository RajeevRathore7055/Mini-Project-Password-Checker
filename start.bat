@echo off
echo.
echo  ================================
echo  SecurePass -- Starting Up
echo  ================================
echo.

echo [1/3] Checking MySQL...
mysql --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo  ERROR: MySQL not found. Install MySQL first.
  pause
  exit
)

echo [2/3] Starting Backend (FastAPI)...
cd backend
IF NOT EXIST venv (
  echo  Creating virtual environment...
  python -m venv venv
)
call venv\Scripts\activate
echo  Installing dependencies...
pip install -r requirements.txt -q
echo  Training ML model if needed...
python ml\train_model.py
echo  Launching FastAPI on http://localhost:8000
start "SecurePass Backend" uvicorn main:app --reload --port 8000
cd ..

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend (React)...
cd frontend
IF NOT EXIST node_modules (
  echo  Installing npm packages...
  npm install
)
echo  Launching React on http://localhost:3000
start "SecurePass Frontend" npm start
cd ..

echo.
echo  ================================
echo  SecurePass is running!
echo  Frontend : http://localhost:3000
echo  Backend  : http://localhost:8000
echo  API Docs : http://localhost:8000/docs
echo  Health   : http://localhost:8000/api/health
echo  ================================
echo.
echo  Super Admin Login:
echo  Name     : Super Admin
echo  Password : Admin@123
echo  ================================
pause
