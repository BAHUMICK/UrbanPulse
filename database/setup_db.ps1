Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   UrbanPulse - Stage 2: PostgreSQL Database Setup" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please enter your PostgreSQL password for user 'postgres':" -ForegroundColor Yellow
$securePass = Read-Host -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
$plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
$env:PGPASSWORD = $plainPass

Write-Host "`n[1/3] Creating 'urbanpulse' database..." -ForegroundColor Green
& "D:\postgresql\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE urbanpulse;"

Write-Host "`n[2/3] Applying schema and inserting 3 seed records..." -ForegroundColor Green
& "D:\postgresql\bin\psql.exe" -U postgres -h localhost -d urbanpulse -f "D:\UrbanPulse\database\schema.sql"

Write-Host "`n[3/3] Running verification queries..." -ForegroundColor Green
$verifyQuery = @"
SELECT 'TABLE_EXISTS' AS check_type, table_name 
FROM information_schema.tables 
WHERE table_name = 'issues';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'issues' 
ORDER BY ordinal_position;

SELECT count(*) AS total_issues_count 
FROM issues;

SELECT id, title, category, severity, status, created_at 
FROM issues;
"@

& "D:\postgresql\bin\psql.exe" -U postgres -h localhost -d urbanpulse -c $verifyQuery | Tee-Object -FilePath "D:\UrbanPulse\database\verification.txt"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "  Database setup & verification completed!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
