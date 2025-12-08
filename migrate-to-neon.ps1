# Скрипт миграции локальной PostgreSQL БД на Neon
# Использование: .\migrate-to-neon.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$LocalHost = "localhost",
    
    [Parameter(Mandatory=$false)]
    [int]$LocalPort = 5432,
    
    [Parameter(Mandatory=$false)]
    [string]$LocalUser = "postgres",
    
    [Parameter(Mandatory=$false)]
    [string]$LocalDb = "dom_pivovara",
    
    [Parameter(Mandatory=$false)]
    [string]$BackupFile = "dom_pivovara_backup.dump",
    
    [Parameter(Mandatory=$true)]
    [string]$NeonConnectionString
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Миграция БД на Neon" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия pg_dump
Write-Host "[1/4] Проверка наличия PostgreSQL утилит..." -ForegroundColor Yellow
$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue
$pgRestorePath = Get-Command pg_restore -ErrorAction SilentlyContinue

if (-not $pgDumpPath) {
    Write-Host "ОШИБКА: pg_dump не найден!" -ForegroundColor Red
    Write-Host "Установите PostgreSQL клиентские утилиты:" -ForegroundColor Yellow
    Write-Host "  choco install postgresql" -ForegroundColor Gray
    Write-Host "  или скачайте с https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    exit 1
}

Write-Host "✓ PostgreSQL утилиты найдены" -ForegroundColor Green
Write-Host ""

# Запрос пароля локальной БД
$securePassword = Read-Host "Введите пароль для локальной БД ($LocalUser@$LocalHost)" -AsSecureString
$localPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))

# Создание дампа
Write-Host "[2/4] Создание дампа локальной БД..." -ForegroundColor Yellow
$env:PGPASSWORD = $localPassword

try {
    pg_dump -h $LocalHost -p $LocalPort -U $LocalUser -d $LocalDb -F c -f $BackupFile -v
    if ($LASTEXITCODE -ne 0) {
        throw "Ошибка при создании дампа"
    }
    Write-Host "✓ Дамп создан: $BackupFile" -ForegroundColor Green
} catch {
    Write-Host "ОШИБКА при создании дампа: $_" -ForegroundColor Red
    $env:PGPASSWORD = $null
    exit 1
}

$env:PGPASSWORD = $null
Write-Host ""

# Проверка размера файла
$fileSize = (Get-Item $BackupFile).Length / 1MB
Write-Host "Размер дампа: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
Write-Host ""

# Восстановление в Neon
Write-Host "[3/4] Восстановление данных в Neon..." -ForegroundColor Yellow
Write-Host "Connection string будет использован для восстановления" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Продолжить восстановление? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Восстановление отменено" -ForegroundColor Yellow
    exit 0
}

try {
    # Используем --no-owner чтобы избежать ошибок с несуществующим пользователем postgres
    pg_restore --no-owner -d $NeonConnectionString $BackupFile -v
    if ($LASTEXITCODE -ne 0) {
        throw "Ошибка при восстановлении"
    }
    Write-Host "✓ Данные успешно восстановлены в Neon" -ForegroundColor Green
} catch {
    Write-Host "ОШИБКА при восстановлении: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Попробуйте выполнить команду вручную:" -ForegroundColor Yellow
    Write-Host "  pg_restore --no-owner -d `"$NeonConnectionString`" $BackupFile -v" -ForegroundColor Gray
    exit 1
}

Write-Host ""

# Финальные инструкции
Write-Host "[4/4] Финальные шаги" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Обновите файл .env с новыми connection strings из Neon:" -ForegroundColor White
Write-Host "   - DATABASE_URL (pooled connection с -pooler)" -ForegroundColor Gray
Write-Host "   - DIRECT_URL (direct connection без -pooler)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Выполните команды:" -ForegroundColor White
Write-Host "   npm run db:generate" -ForegroundColor Gray
Write-Host "   npm run db:migrate" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Проверьте подключение:" -ForegroundColor White
Write-Host "   npm run db:studio" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Протестируйте приложение:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "✓ Миграция завершена!" -ForegroundColor Green
Write-Host ""

