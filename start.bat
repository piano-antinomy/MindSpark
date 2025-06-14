@echo off
echo 🚀 Starting MindSpark Learning Platform...
echo ======================================

REM Check if Python is installed
python3 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python 3 is not installed. Please install Python 3.7+ to continue.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 14+ to continue.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...

REM Install backend dependencies
echo Installing Python dependencies...
cd backend
if not exist "venv" (
    echo Creating Python virtual environment...
    python3 -m venv venv
)

call venv\Scripts\activate
pip install -r requirements.txt >nul 2>&1

REM Install frontend dependencies
echo Installing Node.js dependencies...
cd ..\website
npm install >nul 2>&1

echo ✅ Dependencies installed successfully!
echo.

REM Start backend server
echo 🐍 Starting Python Flask backend server...
cd ..\backend
call venv\Scripts\activate
start /B python app.py

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
echo 🌐 Starting Node.js frontend server...
cd ..\website
start /B npm start

REM Wait for frontend to start
timeout /t 3 /nobreak >nul

echo.
echo 🎉 MindSpark Learning Platform is running!
echo ======================================
echo 🌐 Frontend: http://localhost:3000
echo 🔗 Backend API: http://localhost:5000
echo.
echo 📚 Test Credentials:
echo    Username: student1  ^|  Password: password123
echo    Username: demo      ^|  Password: demo123
echo.
echo Press any key to stop both servers...
pause >nul

REM Kill processes (simple approach for demo)
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

echo 🛑 MindSpark servers stopped.
pause 