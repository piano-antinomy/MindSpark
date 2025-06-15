@echo off
echo 🚀 Starting MindSpark Java Backend...
echo 📋 Checking Java version...
java -version

echo.
echo 📦 Compiling and running the application...

REM Clean and compile
mvn clean compile

if %errorlevel% neq 0 (
    echo ❌ Compilation failed!
    pause
    exit /b 1
)

echo.
echo 🏃 Running the server...
mvn exec:java

echo.
echo 👋 Server stopped.
pause 