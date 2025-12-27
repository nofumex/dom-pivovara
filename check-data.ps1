# Скрипт для проверки данных в Neon БД

$connectionString = Read-Host "Введите ваш Direct Connection String из Neon"

Write-Host "`nПроверка количества записей в таблицах..." -ForegroundColor Yellow
Write-Host ""

$queries = @(
    "SELECT 'User' as table_name, COUNT(*) as count FROM public.\"User\";",
    "SELECT 'Category' as table_name, COUNT(*) as count FROM public.\"Category\";",
    "SELECT 'Product' as table_name, COUNT(*) as count FROM public.\"Product\";",
    "SELECT 'Order' as table_name, COUNT(*) as count FROM public.\"Order\";"
)

foreach ($query in $queries) {
    try {
        $result = psql $connectionString -c $query 2>&1
        Write-Host $result -ForegroundColor Cyan
    } catch {
        Write-Host "Ошибка: $_" -ForegroundColor Red
    }
}

Write-Host "`nЕсли видите числа > 0, данные есть в БД!" -ForegroundColor Green
Write-Host "Если видите 0, возможно подключение к другой БД." -ForegroundColor Yellow

















