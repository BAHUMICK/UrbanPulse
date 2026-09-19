# Ensure script working directory is strictly D:\UrbanPulse\backend
$BackendDir = "D:\UrbanPulse\backend"
Set-Location -LiteralPath $BackendDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   UrbanPulse - Starting Backend REST API" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Working Directory: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

if (-not $env:DB_PASSWORD) {
    Write-Host "Please enter your PostgreSQL password for user 'postgres':" -ForegroundColor Yellow
    $securePass = Read-Host -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
    $plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    $env:DB_PASSWORD = $plainPass
}

Write-Host "`nStarting Express server on http://localhost:5000..." -ForegroundColor Green
node "$BackendDir\src\index.js"
