# Database Setup Guide

This document explains all the database tables created for the trading platform and how to set them up.

## 📊 Database Tables Overview

### ✅ All Required Tables Are Defined

The following tables are created to store all your trading platform data:

#### 1. **users** - User Accounts
- Stores user data: email, password, name, profile image, role
- Fields: `id`, `email`, `password`, `first_name`, `last_name`, `profile_image_url`, `role`, `created_at`, `updated_at`

#### 2. **wallets** - User Money/Wallet Balance
- Stores user wallet balances (the money users have)
- Fields: `id`, `user_id`, `balance` (NUMERIC 20,8), `currency`, `created_at`, `updated_at`
- **This is where user money is stored**

#### 3. **transactions** - Money Deductions & Additions
- Tracks ALL money movements:
  - Deposits (money added to wallet)
  - Withdrawals (money deducted from wallet)
  - Trading transactions (money deducted on buy, added on sell)
- Fields: `id`, `wallet_id`, `type` (deposit/withdrawal), `amount`, `status`, `method`, `created_at`, `completed_at`
- **This tracks every money deduction and addition**

#### 4. **orders** - Trading Orders with Profits/Losses
- Stores all trading activity:
  - Buy orders (money deducted)
  - Sell orders (money added)
  - Profit/Loss calculations
- Fields:
  - Order info: `symbol`, `asset_type`, `type`, `side`, `quantity`, `price`
  - Execution: `status`, `filled_quantity`, `average_price`, `executed_at`
  - **Profit/Loss**: `close_price`, `profit_loss`, `profit_loss_percent`, `closed_at`
- **This stores all trading data and profit/loss calculations**

#### 5. **holdings** - Portfolio Positions
- Stores current portfolio holdings
- Fields: `user_id`, `symbol`, `quantity`, `average_buy_price`, `current_price`

#### 6. **watchlists** - User Watchlists
- Stores user's watchlist items
- Fields: `user_id`, `symbol`, `asset_type`, `position`

#### 7. **kyc_documents** - KYC Verification
- Stores KYC verification documents
- Fields: `user_id`, `status`, `document_type`, `document_url`

#### 8. **sessions** - Authentication Sessions
- Stores user session data for authentication
- Fields: `sid`, `sess`, `expire`

---

## 🚀 How to Create Tables

### Option 1: Using Drizzle (Recommended)

```bash
# This will create all tables based on the schema
npm run db:push
```

### Option 2: Using SQL Script

```bash
# Run the SQL script directly
psql $DATABASE_URL < scripts/create-tables.sql
```

### Option 3: Verify Tables Exist

```bash
# Check if all tables are created
npm run db:verify
```

---

## 💰 How Money Tracking Works

### Wallet Balance (wallets table)
- Each user has ONE wallet
- `balance` field stores the current available money
- Default balance: $10,000 for new users

### Money Deductions (transactions table)
When a user **buys** a trade:
1. Money is **deducted** from `wallets.balance`
2. A `transactions` record is created with:
   - `type: "withdrawal"` (money going out)
   - `amount: <trade_cost>`
   - `method: "trading"`
   - `status: "completed"`

### Money Additions (transactions table)
When a user **sells** a trade:
1. Money is **added** to `wallets.balance`
2. A `transactions` record is created with:
   - `type: "deposit"` (money coming in)
   - `amount: <sale_proceeds>`
   - `method: "trading"`
   - `status: "completed"`

### Trading History (orders table)
- Every buy/sell order is saved in `orders` table
- When a trade is closed, profit/loss is calculated:
  - `profit_loss`: Dollar amount (positive = profit, negative = loss)
  - `profit_loss_percent`: Percentage gain/loss
  - `close_price`: Price when trade was closed

---

## 📈 Profit/Loss Calculation

Profit/Loss is stored in the `orders` table:

- **For BUY orders:**
  - `profit_loss = (close_price - entry_price) × quantity`
  - `profit_loss_percent = (profit_loss / (entry_price × quantity)) × 100`

- **For SELL orders:**
  - `profit_loss = (entry_price - close_price) × quantity`
  - `profit_loss_percent = (profit_loss / (entry_price × quantity)) × 100`

---

## 🔍 Verifying Your Setup

After creating tables, verify everything is working:

1. **Check tables exist:**
   ```bash
   npm run db:verify
   ```

2. **Check wallet creation:**
   - When a user signs up, a wallet is automatically created
   - Default balance: $10,000

3. **Check transaction recording:**
   - Place a buy order → Check `transactions` table for withdrawal
   - Place a sell order → Check `transactions` table for deposit

4. **Check order recording:**
   - All trades are saved in `orders` table
   - Profit/loss is calculated when trades are closed

---

## 📝 Summary

✅ **User Data** → `users` table  
✅ **Money/Wallet** → `wallets` table (balance field)  
✅ **Money Deductions** → `transactions` table (type: withdrawal)  
✅ **Money Additions** → `transactions` table (type: deposit)  
✅ **Trading** → `orders` table  
✅ **Profits/Losses** → `orders` table (profit_loss, profit_loss_percent fields)  
✅ **Trading History** → `orders` table (all orders with status, timestamps)  

All tables are properly set up with foreign key relationships and cascade deletes for data integrity.

