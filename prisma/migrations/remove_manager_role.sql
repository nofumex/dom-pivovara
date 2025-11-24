-- Миграция для удаления роли MANAGER из enum UserRole
-- Выполните этот скрипт вручную в базе данных

-- 1. Обновляем всех пользователей с ролью MANAGER на ADMIN
UPDATE "User" SET role = 'ADMIN' WHERE role = 'MANAGER';

-- 2. Удаляем значение по умолчанию для колонки role
ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT;

-- 3. Создаем новый enum без MANAGER
CREATE TYPE "UserRole_new" AS ENUM ('CUSTOMER', 'ADMIN', 'VIEWER');

-- 4. Изменяем тип колонки на новый enum
ALTER TABLE "User" ALTER COLUMN role TYPE "UserRole_new" USING role::text::"UserRole_new";

-- 5. Восстанавливаем значение по умолчанию
ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'CUSTOMER'::"UserRole_new";

-- 6. Удаляем старый enum
DROP TYPE "UserRole";

-- 7. Переименовываем новый enum в старое имя
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

