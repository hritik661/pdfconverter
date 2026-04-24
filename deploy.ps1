# Vercel Deployment Script for PDF Converter (PowerShell)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " PDF Converter - Vercel Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✓ Vercel CLI found: $vercelVersion" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Vercel CLI is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Vercel CLI first:" -ForegroundColor Yellow
    Write-Host "npm install -g vercel"
    Write-Host ""
    Write-Host "Or install with yarn:" -ForegroundColor Yellow
    Write-Host "yarn global add vercel"
    Write-Host ""
    Read-Host "Press Enter to close"
    exit 1
}

Write-Host ""

# Check if user is logged in
Write-Host "Checking Vercel authentication..." -ForegroundColor Yellow
try {
    $whoami = vercel whoami 2>$null
    Write-Host "✓ Vercel authentication confirmed" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Not logged in to Vercel!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please login first:" -ForegroundColor Yellow
    Write-Host "vercel login"
    Write-Host ""
    Read-Host "Press Enter to close"
    exit 1
}

Write-Host ""

# Deploy to Vercel
Write-Host "Starting deployment to Vercel..." -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "This will deploy your PDF Converter app" -ForegroundColor Cyan
Write-Host "Make sure your environment variables are set" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

vercel --prod

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✓ Deployment successful!" -ForegroundColor Green
Write-Host "Your app is now live on Vercel" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy the deployment URL" -ForegroundColor White
Write-Host "2. Set environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "3. Test the payment integration" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to close"