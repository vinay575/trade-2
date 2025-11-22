# Database Setup Instructions

## 🚨 Error: DATABASE_URL not set

If you see the error `DATABASE_URL, ensure the database is provisioned`, you need to set up your database connection.

## Quick Setup (3 Steps)

### Step 1: Create `.env` file

Create a `.env` file in the root directory of your project:

```bash
# Windows PowerShell
New-Item -Path .env -ItemType File

# Or manually create a file named .env
```

### Step 2: Add DATABASE_URL

Copy the example environment file and edit it:

```bash
# Copy the example file
cp server/env.example .env
```

Or manually create `.env` with:

```env
# Application Environment
NODE_ENV=development

# PostgreSQL Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Session Secret
SESSION_SECRET=dev-secret-change-me-in-production-7389
```

### Step 3: Get a Database

#### Option A: Use Neon (Free PostgreSQL) - Recommended

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy the connection string
5. Paste it into your `.env` file as `DATABASE_URL`

Example:
```env
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

#### Option B: Use Local PostgreSQL

If you have PostgreSQL installed locally:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/trading_db
```

#### Option C: Use Other Cloud Providers

- **Supabase**: [supabase.com](https://supabase.com)
- **Railway**: [railway.app](https://railway.app)
- **Render**: [render.com](https://render.com)
- **AWS RDS**: [aws.amazon.com/rds](https://aws.amazon.com/rds)

---

## After Setting DATABASE_URL

### 1. Create Tables

```bash
npm run db:push
```

This will create all required tables:
- ✅ users
- ✅ wallets
- ✅ transactions
- ✅ orders
- ✅ holdings
- ✅ watchlists
- ✅ kyc_documents
- ✅ sessions

### 2. Verify Tables

```bash
npm run db:verify
```

### 3. Start the Application

```bash
npm run dev
```

The application will automatically:
- Connect to your database
- Use DatabaseStorage (instead of in-memory storage)
- Persist all data permanently

---

## What If I Don't Have a Database?

The application will work **without a database** using in-memory storage, but:
- ❌ Data is lost when server restarts
- ❌ No persistent user accounts
- ❌ No trading history saved

**For production, you MUST use a database!**

---

## Troubleshooting

### Error: "connection refused"
- Check your DATABASE_URL is correct
- Verify the database server is running
- Check firewall/network settings

### Error: "authentication failed"
- Verify username and password in DATABASE_URL
- Check database user permissions

### Error: "database does not exist"
- Create the database first
- Or use the default database from your provider

---

## Example .env File

```env
# Application Environment
NODE_ENV=development

# PostgreSQL Database (Neon example)
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Session Secret (required)
SESSION_SECRET=your-secret-key-here-change-in-production

# Optional: Individual PostgreSQL settings
PGHOST=ep-xxx-xxx.eu-central-1.aws.neon.tech
PGPORT=5432
PGDATABASE=neondb
PGUSER=neondb_owner
PGPASSWORD=your-password
```

---

## Need Help?

1. Check your `.env` file exists in the root directory
2. Verify `DATABASE_URL` is set correctly
3. Test connection: `npm run db:verify`
4. Check database provider status page

