@echo off
REM Vercel Deployment Script for PDF Converter
echo.
echo ========================================
echo  PDF Converter - Vercel Deployment
echo ========================================
echo.

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Vercel CLI is not installed!
    echo.
    echo Please install Vercel CLI first:
    echo npm install -g vercel
    echo.
    echo Or install with yarn:
    echo yarn global add vercel
    echo.
    pause
    exit /b 1
)

echo ✓ Vercel CLI found
vercel --version
echo.

REM Check if user is logged in
echo Checking Vercel authentication...
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo ERROR: Not logged in to Vercel!
    echo.
    echo Please login first:
    echo vercel login
    echo.
    pause
    exit /b 1
)

echo ✓ Vercel authentication confirmed
echo.

REM Deploy to Vercel
echo Starting deployment to Vercel...
echo.
echo ============================================
echo This will deploy your PDF Converter app
echo Make sure your environment variables are set
echo ============================================
echo.

vercel --prod

if errorlevel 1 (
    echo.
    echo ERROR: Deployment failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ============================================
echo ✓ Deployment successful!
echo Your app is now live on Vercel
echo ============================================
echo.
echo Next steps:
echo 1. Copy the deployment URL
echo 2. Set environment variables in Vercel dashboard
echo 3. Test the payment integration
echo.
pause