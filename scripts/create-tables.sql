-- Trading Platform Database Schema
-- This script creates all necessary tables for user management, wallets, trading, and financial tracking

-- ============================================
-- 1. SESSIONS TABLE (Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR(255) PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- ============================================
-- 2. USERS TABLE (User Accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_image_url VARCHAR(512),
    role VARCHAR(32) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. KYC DOCUMENTS TABLE (Verification)
-- ============================================
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    document_type VARCHAR(64) NOT NULL,
    document_url TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(255),
    rejection_reason TEXT
);

-- ============================================
-- 4. WALLETS TABLE (User Money/Wallet Balance)
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(20, 8) NOT NULL DEFAULT '0',
    currency VARCHAR(16) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. TRANSACTIONS TABLE (Money Deductions/Additions)
-- ============================================
-- Tracks all money movements: deposits, withdrawals, trading transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL, -- 'deposit' or 'withdrawal'
    amount NUMERIC(20, 8) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    method VARCHAR(64), -- 'upi', 'card', 'crypto', 'bank_transfer', 'trading'
    transaction_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- ============================================
-- 6. ORDERS TABLE (Trading Orders with Profits/Losses)
-- ============================================
-- Stores all trading orders including buy/sell, with profit/loss tracking
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(64) NOT NULL, -- 'BTC/USD', 'ETH/USD', 'AAPL', etc.
    asset_type VARCHAR(32) NOT NULL, -- 'crypto', 'stock', 'forex'
    type VARCHAR(32) NOT NULL, -- 'market', 'limit', 'stop'
    side VARCHAR(16) NOT NULL, -- 'buy' or 'sell'
    quantity NUMERIC(20, 8) NOT NULL,
    price NUMERIC(20, 8),
    stop_price NUMERIC(20, 8),
    timeframe VARCHAR(16), -- '1m', '1h', '1d', '1w' for auto-close trades
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'filled', 'partial', 'cancelled', 'rejected', 'closed'
    filled_quantity NUMERIC(20, 8) DEFAULT '0',
    average_price NUMERIC(20, 8),
    close_price NUMERIC(20, 8), -- Price when trade was closed
    profit_loss NUMERIC(20, 8), -- Calculated profit or loss amount
    profit_loss_percent NUMERIC(20, 8), -- P&L as percentage
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    executed_at TIMESTAMP,
    closed_at TIMESTAMP -- When trade was auto-closed or manually closed
);

-- ============================================
-- 7. HOLDINGS TABLE (Portfolio Positions)
-- ============================================
CREATE TABLE IF NOT EXISTS holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(64) NOT NULL,
    asset_type VARCHAR(32) NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL,
    average_buy_price NUMERIC(20, 8) NOT NULL,
    current_price NUMERIC(20, 8),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_holdings_user_symbol ON holdings(user_id, symbol);

-- ============================================
-- 8. WATCHLISTS TABLE (User Watchlists)
-- ============================================
CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(64) NOT NULL,
    asset_type VARCHAR(32) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SUMMARY OF TABLES CREATED:
-- ============================================
-- 1. sessions - Authentication sessions
-- 2. users - User accounts and profiles
-- 3. kyc_documents - KYC verification documents
-- 4. wallets - User wallet balances (stores money)
-- 5. transactions - All money movements (deposits, withdrawals, trading)
-- 6. orders - Trading orders with profit/loss tracking
-- 7. holdings - Portfolio positions
-- 8. watchlists - User watchlists
--
-- KEY TABLES FOR YOUR REQUIREMENTS:
-- - users: Stores user data
-- - wallets: Stores user money/wallet balance
-- - transactions: Tracks all money deductions and additions
-- - orders: Stores all trading activity with profit/loss calculations
-- ============================================

