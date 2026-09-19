Write-Host "Launching UrbanPulse Backend Startup Terminal..."
Start-Process cmd.exe -ArgumentList '/k', 'D:\UrbanPulse\backend\start_server.bat'

Write-Host "Waiting for backend server to listen on port 5000 (please enter password in the opened window)..."
$timeout = 90
$sw = [System.Diagnostics.Stopwatch]::StartNew()
while ($sw.Elapsed.TotalSeconds -lt $timeout) {
    $conn = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "Backend server is up and listening on http://localhost:5000!" -ForegroundColor Green
        exit 0
    }
    Start-Sleep -Seconds 2
}
Write-Host "Timed out waiting for backend server to start on port 5000." -ForegroundColor Red
exit 1
