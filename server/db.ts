/**
 * Flex Wallet — SQLite database layer
 * Uses bun:sqlite for durability across sandbox pause/resume
 */

import { Database } from 'bun:sqlite'
import path from 'path'
import { mkdirSync } from 'fs'

const DATA_DIR = path.resolve(process.cwd(), 'data')
mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = path.join(DATA_DIR, 'flexwallet.db')
export const db = new Database(DB_PATH, { create: true })

// Enable WAL mode for better concurrent access
db.run('PRAGMA journal_mode = WAL')
db.run('PRAGMA foreign_keys = ON')

// ─── Schema ───────────────────────────────────────────────────────────────────

db.run(`
  CREATE TABLE IF NOT EXISTS wallets (
    address TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    username_claimed_at INTEGER,
    username_released_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    onboarded INTEGER NOT NULL DEFAULT 0,
    preferred_asset TEXT NOT NULL DEFAULT 'USDC',
    preferred_currency TEXT NOT NULL DEFAULT 'USD',
    reduce_motion INTEGER NOT NULL DEFAULT 0,
    auto_convert INTEGER NOT NULL DEFAULT 0,
    auto_convert_settings TEXT NOT NULL DEFAULT '{}',
    sending_enabled INTEGER NOT NULL DEFAULT 1,
    per_send_limit TEXT NOT NULL DEFAULT '500',
    daily_send_limit TEXT NOT NULL DEFAULT '2000',
    emergency_pause INTEGER NOT NULL DEFAULT 0,
    enabled_assets TEXT NOT NULL DEFAULT '["USDC"]',
    savings_settings TEXT NOT NULL DEFAULT '{}',
    number_format TEXT NOT NULL DEFAULT 'en-US',
    saved_recipients TEXT NOT NULL DEFAULT '[]'
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    name TEXT NOT NULL,
    asset TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('value','quantity')),
    target_amount TEXT NOT NULL,
    current_amount TEXT NOT NULL DEFAULT '0',
    source_assets TEXT NOT NULL DEFAULT '[]',
    min_contribution TEXT,
    max_contribution TEXT,
    daily_cap TEXT,
    confirm_each INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','completed')),
    completed_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(wallet_address) REFERENCES wallets(address)
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('received','sent','converted','savings_contribution','goal_completed','failed','cancelled')),
    asset TEXT NOT NULL,
    amount TEXT NOT NULL,
    usd_value TEXT,
    fee TEXT,
    fee_asset TEXT,
    recipient TEXT,
    recipient_username TEXT,
    recipient_resolved TEXT,
    sender TEXT,
    sender_username TEXT,
    received_via TEXT,
    tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','failed','cancelled')),
    error_text TEXT,
    goal_id TEXT,
    quote_id TEXT,
    quote_details TEXT,
    idempotency_key TEXT UNIQUE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    confirmed_at INTEGER,
    FOREIGN KEY(wallet_address) REFERENCES wallets(address)
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS usernames (
    username TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    claimed_at INTEGER NOT NULL DEFAULT (unixepoch()),
    released_at INTEGER,
    hold_until INTEGER
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS price_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset TEXT NOT NULL,
    price_usd TEXT NOT NULL,
    fetched_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`)

db.run(`
  CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address, created_at DESC)
`)
db.run(`
  CREATE INDEX IF NOT EXISTS idx_savings_goals_wallet ON savings_goals(wallet_address)
`)
db.run(`
  CREATE INDEX IF NOT EXISTS idx_price_snapshots_asset ON price_snapshots(asset, fetched_at DESC)
`)

// ─── Helper types ─────────────────────────────────────────────────────────────

export interface WalletRow {
  address: string
  username: string | null
  username_claimed_at: number | null
  username_released_at: number | null
  created_at: number
  onboarded: number
  preferred_asset: string
  preferred_currency: string
  reduce_motion: number
  auto_convert: number
  auto_convert_settings: string
  sending_enabled: number
  per_send_limit: string
  daily_send_limit: string
  emergency_pause: number
  enabled_assets: string
  savings_settings: string
  number_format: string
  saved_recipients: string
}

export interface SavingsGoalRow {
  id: string
  wallet_address: string
  name: string
  asset: string
  target_type: 'value' | 'quantity'
  target_amount: string
  current_amount: string
  source_assets: string
  min_contribution: string | null
  max_contribution: string | null
  daily_cap: string | null
  confirm_each: number
  status: 'active' | 'paused' | 'completed'
  completed_at: number | null
  created_at: number
  updated_at: number
  sort_order: number
}

export interface TransactionRow {
  id: string
  wallet_address: string
  type: string
  asset: string
  amount: string
  usd_value: string | null
  fee: string | null
  fee_asset: string | null
  recipient: string | null
  recipient_username: string | null
  recipient_resolved: string | null
  sender: string | null
  sender_username: string | null
  received_via: string | null
  tx_hash: string | null
  status: string
  error_text: string | null
  goal_id: string | null
  quote_id: string | null
  quote_details: string | null
  idempotency_key: string | null
  created_at: number
  confirmed_at: number | null
}

export interface UsernameRow {
  username: string
  wallet_address: string
  claimed_at: number
  released_at: number | null
  hold_until: number | null
}

export interface PriceSnapshotRow {
  id: number
  asset: string
  price_usd: string
  fetched_at: number
}
