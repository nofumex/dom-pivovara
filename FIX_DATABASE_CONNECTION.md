# Database Connection Issue - FIXED ✅

## Problem
The application was showing errors:
```
Can't reach database server at `localhost:5432`
```

## Root Cause
The `prisma/schema.prisma` file was empty, which prevented Prisma Client from being generated and connecting to the database.

## Solution Applied

1. ✅ **Created minimal Prisma schema** with datasource configuration
2. ✅ **Regenerated schema from database** using `npx prisma db pull`
3. ✅ **Verified database connection** - PostgreSQL is running and accessible
4. ✅ **Created docker-compose.yml** for easy database management (optional)

## Next Steps

### 1. Stop the Next.js Dev Server
If your dev server is running, stop it (Ctrl+C in the terminal where it's running).

### 2. Generate Prisma Client
```bash
npm run db:generate
```

### 3. Restart the Dev Server
```bash
npm run dev
```

The application should now connect to the database successfully!

## Database Status

- ✅ PostgreSQL service is running (`postgresql-x64-18`)
- ✅ Port 5432 is accessible
- ✅ Database `dom_pivovara` exists
- ✅ All tables are present (User, Product, Order, etc.)
- ✅ Schema has been regenerated from the database

## Optional: Using Docker Compose

If you prefer to use Docker for the database (instead of local PostgreSQL):

1. **Install Docker Desktop** for Windows
2. **Start the database**:
   ```bash
   docker compose up -d
   ```
3. **Update `.env`** if needed to match docker-compose credentials

See `DATABASE_SETUP.md` for more details.

## Troubleshooting

If you still see connection errors after generating Prisma Client:

1. **Check PostgreSQL is running**:
   ```powershell
   Get-Service -Name "*postgresql*"
   ```

2. **Verify .env file**:
   - Make sure `.env` exists in project root
   - Check `DATABASE_URL` matches your PostgreSQL credentials

3. **Test connection manually**:
   ```powershell
   $env:PGPASSWORD='textilcomplex111'
   psql -U postgres -h localhost -p 5432 -d dom_pivovara -c "SELECT 1;"
   ```

4. **Regenerate Prisma Client** (if needed):
   ```bash
   npm run db:generate
   ```





