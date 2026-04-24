# PDF Converter Backend Server Starter (PowerShell)
# Run this script in PowerShell to start the backend server

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host " PDF Converter - Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Then run this script again."
    Write-Host ""
    Read-Host "Press Enter to close"
    exit 1
}

Write-Host ""

# Check if npm packages are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠ npm packages not found. Installing dependencies..." -ForegroundColor Yellow
    Write-Host ""
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed!" -ForegroundColor Red
        Read-Host "Press Enter to close"
        exit 1
    }
    Write-Host ""
}

Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Start the server
Write-Host "Starting PDF Converter Backend Server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Server will run on: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

npm start
