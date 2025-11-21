# Next-Gen Trading Platform (2026)

## Overview

A premium, desktop-first multi-asset trading platform designed for professional traders and high-end retail users. The platform supports trading across stocks, crypto, and forex with real-time data streaming, advanced analytics, and a unique futuristic aesthetic featuring bold orange-to-black gradients, glass-morphism effects, and neon accents.

**Tech Stack:**
- **Frontend:** React 18 with TypeScript, Vite bundler
- **Styling:** Tailwind CSS with shadcn/ui components, custom design tokens
- **Backend:** Express.js with TypeScript
- **Database:** PostgreSQL via Neon serverless with Drizzle ORM
- **Real-time:** WebSocket (ws) for live market data
- **State Management:** TanStack Query (React Query) for server state
- **Authentication:** Replit Auth with OpenID Connect
- **Session Management:** express-session with PostgreSQL store

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component Structure:**
- Built on React 18 with TypeScript for type safety
- Uses Vite as the build tool and development server
- Component library based on shadcn/ui (Radix UI primitives)
- Custom components: `GlassCard`, `PriceDisplay`, `TickerCard` for trading-specific UI
- Responsive breakpoints: 1440px (primary), 1024px, 768px, 360px (desktop-first approach)

**Routing & Navigation:**
- Uses `wouter` for lightweight client-side routing
- Main routes: Dashboard, Market Watch, Trading Terminal, Portfolio, Wallet, KYC, Settings, Admin
- Sidebar navigation with protected routes requiring authentication

**State Management:**
- TanStack Query for all server state, API requests, and caching
- Custom hooks pattern: `useAuth`, `useWallet`, `useMarketWebSocket`
- Query client configured with infinite stale time and disabled auto-refetch

**Design System:**
- Dark-mode primary theme with custom CSS variables
- Color scheme: `#0F0F12` background, `#1B1B1F` panels, `#FF7A00→#FF4500` gradient
- Typography: Condensed fonts for headers (Roboto Condensed), Inter for body
- Glass-morphism effects with backdrop blur and subtle neon borders
- WCAG AA compliant contrast ratios

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript running on Node.js
- ESM module format throughout
- Custom middleware for request logging and JSON body parsing with raw body preservation

**API Design:**
- RESTful endpoints under `/api/*` prefix
- Authentication required for all trading operations
- Endpoints organized by domain: auth, kyc, wallet, orders, holdings, watchlist
- Error handling with proper HTTP status codes and JSON error responses

**Database Layer:**
- Drizzle ORM for type-safe database queries
- Neon serverless PostgreSQL with WebSocket connection pooling
- Schema-first approach with Zod validation schemas derived from Drizzle tables
- Automatic fallback to in-memory storage when database is not available
- Database integration configured and ready (see Database Setup below)

**Real-time Communication:**
- WebSocket server for live market data streaming
- Endpoint: `/ws/market`
- Broadcasts price updates, volume, and market changes in real-time

### Database Schema

**Core Tables:**

1. **users** - User profiles and basic information
   - Stores user ID, email, name, profile image
   - Auto-generated UUIDs for primary keys
   - Timestamps for created/updated tracking

2. **sessions** - Session persistence for authentication
   - Required for Replit Auth integration
   - Stores session ID, data (JSON), and expiration
   - Indexed on expiration for efficient cleanup

3. **kycDocuments** - KYC verification documents
   - Links to users, tracks verification status (pending/approved/rejected)
   - Stores document type (passport, driver's license, national_id) and URLs
   - Audit trail with reviewer information and timestamps

4. **wallets** - User wallet balances
   - One wallet per user for managing trading funds
   - Decimal precision for accurate financial calculations
   - Tracks available and reserved balances

5. **transactions** - Financial transaction history
   - Records deposits, withdrawals, and trades
   - Links to wallets with foreign key cascade deletion
   - Immutable audit log with timestamps

6. **orders** - Trading orders
   - Supports market, limit, and stop orders
   - Tracks order lifecycle: pending, filled, partially_filled, cancelled
   - Multi-asset support: stocks, crypto, forex

7. **holdings** - User asset holdings
   - Portfolio positions with average price tracking
   - Real-time P&L calculations
   - Quantity tracking with decimal precision

8. **watchlists** - User watchlists for market tracking
   - Personalized asset monitoring
   - Supports multiple assets per user

### Authentication & Authorization

**Authentication Flow:**
- Replit Auth using OpenID Connect (OIDC) protocol
- Session-based authentication with secure HTTP-only cookies
- Token refresh mechanism for access token renewal
- Automatic redirect to login on 401 errors

**Session Management:**
- PostgreSQL-backed session store via `connect-pg-simple`
- 7-day session TTL (time-to-live)
- Secure cookies in production (HTTPS only)

**Authorization Pattern:**
- `isAuthenticated` middleware on all protected routes
- User context accessible via `req.user.claims.sub` (user ID)
- Per-user data isolation through user ID filtering

### External Dependencies

**Third-Party Services:**

1. **Neon Database** - Serverless PostgreSQL
   - Environment variable: `DATABASE_URL`
   - WebSocket-based connections for serverless compatibility
   - Automatic connection pooling

2. **Replit Auth** - Authentication provider
   - OIDC issuer URL: `https://replit.com/oidc`
   - Environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`
   - Passport.js strategy integration

**Key NPM Packages:**

1. **UI Components:**
   - `@radix-ui/*` - Accessible component primitives (20+ packages)
   - `class-variance-authority` - Component variant styling
   - `tailwindcss` - Utility-first CSS framework

2. **Data & State:**
   - `@tanstack/react-query` - Server state management
   - `drizzle-orm`, `drizzle-zod` - ORM and validation
   - `@neondatabase/serverless` - Neon database client

3. **Forms & Validation:**
   - `react-hook-form` - Form state management
   - `@hookform/resolvers` - Form validation resolvers
   - `zod` - Schema validation

4. **Real-time:**
   - `ws` - WebSocket server implementation
   - Custom WebSocket client in frontend

5. **Authentication:**
   - `passport`, `openid-client` - OAuth/OIDC implementation
   - `express-session`, `connect-pg-simple` - Session management

**Development Tools:**
- `vite` - Frontend build tool and dev server
- `tsx` - TypeScript execution for development
- `esbuild` - Production backend bundling
- Replit-specific plugins: runtime error overlay, cartographer, dev banner

**Asset Loading:**
- Google Fonts: Inter, Roboto Condensed, JetBrains Mono
- Font weights: 400-900 for flexible typography
- Preconnect optimization for faster font loading

## Database Setup

### Current Status

The application is configured to automatically connect to PostgreSQL when credentials are available, with graceful fallback to in-memory storage.

**Schema Status:** ✅ Complete
- All 8 tables defined in `shared/schema.ts` with proper types and relations
- Zod validation schemas auto-generated from Drizzle definitions
- Database connection logic in `server/db.ts` with auto-detection

**Connection Status:** ⚠️ Awaiting Credentials
- PostgreSQL module installed and configured
- Environment variables exist but need provisioning
- Application automatically falls back to MemStorage (data not persisted)

### Table Schema

All tables are defined and ready to deploy:

1. **sessions** - Authentication session storage with expiration index
2. **users** - User profiles (email, password, name, role, timestamps)
3. **kycDocuments** - KYC verification with status tracking
4. **wallets** - User balances with decimal precision (20,8)
5. **transactions** - Financial transaction history (deposits/withdrawals)
6. **orders** - Trading orders (market/limit/stop, multi-asset support)
7. **holdings** - Portfolio positions with P&L tracking
8. **watchlists** - Custom asset watchlists with ordering

### Setup Scripts

**Created for easy deployment:**
- `scripts/create-tables.sql` - SQL DDL statements for all tables
- `scripts/setup-database.ts` - Automated verification and setup script

### How to Activate Database

Once PostgreSQL credentials are provisioned in Replit:

1. Credentials will auto-populate: `DATABASE_URL`, `PGHOST`, `PGUSER`, `PGPASSWORD`
2. Run: `npm run db:push --force` to create all tables
3. Restart the application - it will auto-detect and connect
4. Storage automatically switches from MemStorage to DatabaseStorage

**No code changes needed** - the application detects the database and switches storage implementations automatically.