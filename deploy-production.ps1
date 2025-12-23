# Production Deployment Script for Windows
# This script handles the locked directory issue on Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "QuizMaker Production Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Try to clean up .open-next directory
Write-Host "Step 1: Cleaning up build directory..." -ForegroundColor Yellow

if (Test-Path .open-next) {
    Write-Host "Found existing .open-next directory. Attempting to remove..." -ForegroundColor Gray
    
    # Stop any Node processes that might be locking the directory
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "*$PWD*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 2
    
    # Try to remove the directory
    try {
        Remove-Item -Path .open-next -Recurse -Force -ErrorAction Stop
        Write-Host "✓ Successfully removed .open-next directory" -ForegroundColor Green
    } catch {
        Write-Host "✗ Could not remove .open-next directory automatically" -ForegroundColor Red
        Write-Host ""
        Write-Host "MANUAL ACTION REQUIRED:" -ForegroundColor Yellow
        Write-Host "1. Close all File Explorer windows showing this project" -ForegroundColor White
        Write-Host "2. Close any editors with .open-next files open" -ForegroundColor White
        Write-Host "3. Manually delete the .open-next folder" -ForegroundColor White
        Write-Host "4. Run this script again" -ForegroundColor White
        Write-Host ""
        Read-Host "Press Enter after you have done the above steps to retry"
        
        # Try again
        try {
            Remove-Item -Path .open-next -Recurse -Force -ErrorAction Stop
            Write-Host "✓ Successfully removed .open-next directory" -ForegroundColor Green
        } catch {
            Write-Host "✗ Still locked. Please restart your computer and try again." -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""

# Step 2: Run the build and deployment
Write-Host "Step 2: Building and deploying to Cloudflare..." -ForegroundColor Yellow
Write-Host ""

npm run deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your application is now live at:" -ForegroundColor Cyan
    Write-Host "https://aisprints-starter.nithinjain.workers.dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error message above." -ForegroundColor Yellow
    exit 1
}

