@echo off
REM PDF Converter Backend Server Starter
REM This script starts the Node.js backend server

echo.
echo ========================================
echo  PDF Converter - Backend Server
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js found
node --version
echo.

REM Check if npm packages are installed
if not exist "node_modules" (
    echo ⚠ npm packages not found. Installing dependencies...
    echo.
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed!
        pause
        exit /b 1
    )
    echo.
)

echo ✓ Dependencies installed
echo.

REM Start the server
echo Starting PDF Converter Backend Server...
echo.
echo 🚀 Server will run on: http://localhost:3000
echo.
echo ============================================
echo Press Ctrl+C to stop the server
echo ============================================
echo.

call npm start
pause
