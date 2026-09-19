$baseUrl = "http://localhost:5000"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Testing UrbanPulse Backend Endpoints" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. GET /api/health
Write-Host "`n[1/3] Testing GET /api/health..." -ForegroundColor Yellow
try {
    $healthRes = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    $healthRes | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Health check failed: $_" -ForegroundColor Red
    exit 1
}

# 2. GET /api/issues
Write-Host "`n[2/3] Testing GET /api/issues..." -ForegroundColor Yellow
try {
    $issuesRes = Invoke-RestMethod -Uri "$baseUrl/api/issues" -Method Get
    Write-Host "Total issues returned: $($issuesRes.count)"
    $issuesRes.data | Format-Table -Property id, title, category, severity, status
} catch {
    Write-Host "Get issues failed: $_" -ForegroundColor Red
    exit 1
}

# 3. POST /api/issues
Write-Host "`n[3/3] Testing POST /api/issues..." -ForegroundColor Yellow
$newIssue = @{
    title = "Damaged Pedestrian Guardrail"
    category = "Road Safety"
    description = "Metal railing bent and detached following minor vehicle collision near pedestrian subway entrance."
    latitude = 22.574100
    longitude = 88.432900
    severity = "Medium"
    status = "Reported"
} | ConvertTo-Json

try {
    $postRes = Invoke-RestMethod -Uri "$baseUrl/api/issues" -Method Post -Body $newIssue -ContentType "application/json"
    $postRes | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Post issue failed: $_" -ForegroundColor Red
    exit 1
}

# 4. Verify updated count
Write-Host "`n[Verification] Checking updated count after POST..." -ForegroundColor Green
$verifyRes = Invoke-RestMethod -Uri "$baseUrl/api/issues" -Method Get
Write-Host "New total issues count in database: $($verifyRes.count)"
