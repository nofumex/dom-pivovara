# Database Setup Script for Dom Pivovara
# This script helps set up the PostgreSQL database

Write-Host "=== Dom Pivovara Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    Write-Host "✓ PostgreSQL service found: $($pgService.Name) - Status: $($pgService.Status)" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL service not found. Please install PostgreSQL first." -ForegroundColor Red
    exit 1
}

# Check if port 5432 is accessible
Write-Host "Checking port 5432..." -ForegroundColor Yellow
$portCheck = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($portCheck) {
    Write-Host "✓ Port 5432 is accessible" -ForegroundColor Green
} else {
    Write-Host "✗ Port 5432 is not accessible. Please check PostgreSQL configuration." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure your .env file has the correct DATABASE_URL" -ForegroundColor White
Write-Host "2. Run: npm run db:generate" -ForegroundColor White
Write-Host "3. Run: npm run db:migrate" -ForegroundColor White
Write-Host "4. Run: npm run db:seed" -ForegroundColor White
Write-Host ""
Write-Host "If the database doesn't exist, create it manually:" -ForegroundColor Yellow
Write-Host "  psql -U postgres -c 'CREATE DATABASE dom_pivovara;'" -ForegroundColor Gray
Write-Host ""























