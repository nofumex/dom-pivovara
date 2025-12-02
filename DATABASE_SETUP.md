# Database Setup Guide

## Quick Start with Docker Compose

The easiest way to run PostgreSQL for this project is using Docker Compose.

### 1. Start PostgreSQL Database

```bash
# Start the database container
docker compose up -d

# Check if it's running
docker compose ps
```

The database will be available at `localhost:5432` with:
- **User**: `postgres`
- **Password**: `textilcomplex111`
- **Database**: `dom_pivovara`

### 2. Run Database Migrations

After starting the database, run the migrations:

```bash
# Generate Prisma Client
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed initial data (creates admin user and test products)
npm run db:seed
```

### 3. Stop the Database

When you're done working:

```bash
# Stop the database
docker compose down

# Stop and remove all data (WARNING: deletes all data!)
docker compose down -v
```

## Manual PostgreSQL Setup

If you prefer to use a local PostgreSQL installation:

1. Install PostgreSQL on your system
2. Create a database:
   ```sql
   CREATE DATABASE dom_pivovara;
   ```
3. Update `.env` with your PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://your_user:your_password@localhost:5432/dom_pivovara?schema=public"
   DIRECT_URL="postgresql://your_user:your_password@localhost:5432/dom_pivovara?schema=public"
   ```
4. Run migrations as described above

## Troubleshooting

### Database Connection Error

If you see `Can't reach database server at localhost:5432`:

1. **Check if Docker is running**:
   ```bash
   docker --version
   docker compose ps
   ```

2. **Check if PostgreSQL container is running**:
   ```bash
   docker compose ps
   ```
   If not running, start it:
   ```bash
   docker compose up -d
   ```

3. **Check container logs**:
   ```bash
   docker compose logs postgres
   ```

4. **Verify .env file**:
   - Make sure `.env` exists in the project root
   - Check that `DATABASE_URL` matches the docker-compose configuration

### Port Already in Use

If port 5432 is already in use:

1. **Option 1**: Stop your local PostgreSQL service
2. **Option 2**: Change the port in `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Use 5433 instead of 5432
   ```
   Then update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:textilcomplex111@localhost:5433/dom_pivovara?schema=public"
   ```

### Reset Database

To completely reset the database:

```bash
# Stop and remove containers and volumes
docker compose down -v

# Start fresh
docker compose up -d

# Run migrations and seed
npm run db:migrate
npm run db:seed
```

## Accessing the Database

### Using Prisma Studio

```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555` to browse and edit your database.

### Using psql (PostgreSQL CLI)

```bash
# Connect via Docker
docker compose exec postgres psql -U postgres -d dom_pivovara

# Or if using local PostgreSQL
psql -U postgres -d dom_pivovara
```


