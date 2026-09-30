# EyeRaksha Services Startup Script (PowerShell)
# Start all 3 services needed for development

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   EyeRaksha - Service Startup Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$projectDir = $PSScriptRoot
$pythonCmd = (Get-Command py, python -ErrorAction SilentlyContinue | Select-Object -First 1)

if ($null -eq $pythonCmd) {
    Write-Host "ERROR: Neither 'py' nor 'python' was found in system PATH." -ForegroundColor Red
    exit 1
}
$pythonPath = $pythonCmd.Source


# Change to project directory
Set-Location $projectDir

Write-Host "[1/3] Starting Mock Screening Adapter (Python on port 5000)..." -ForegroundColor Yellow
Start-Process -FilePath $pythonPath -ArgumentList "mock_adapter.py" -WindowStyle Normal

Write-Host "[2/3] Waiting 2 seconds for adapter to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "[3/3] Starting Backend API Server (Node.js on port 8080)..." -ForegroundColor Yellow
$backendArgs = @"
`$env:MATLAB_SCREENING_ADAPTER_URL='http://127.0.0.1:5000/api/screen'; Set-Location '$projectDir\backend'; npm run server
"@
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $backendArgs -WindowStyle Normal

Write-Host "[4/4] Starting Frontend Dev Server (Vite on port 5173)..." -ForegroundColor Yellow
$frontendArgs = @"
Set-Location '$projectDir'; npm run dev
"@
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $frontendArgs -WindowStyle Normal

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "All services started!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:   http://127.0.0.1:8080" -ForegroundColor White
Write-Host "  Adapter:   http://127.0.0.1:5000" -ForegroundColor White
Write-Host "`nVerify Backend: http://127.0.0.1:8080/api/status" -ForegroundColor Cyan
Write-Host "`nNote: Close terminal windows to stop services`n" -ForegroundColor Yellow
