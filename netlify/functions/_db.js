/**
 * Shared SQLite db for Netlify Functions using sql.js (pure WASM, no native deps).
 *
 * Note: /tmp is ephemeral in Lambda — data resets on cold starts.
 * For persistence across invocations, swap for a hosted DB (Turso, PlanetScale).
 */

import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = process.env.DB_DIR ?? '/tmp/flexwallet'
mkdirSync(DATA_DIR, { recursive: true })
const DB_PATH = join(DATA_DIR, 'flexwallet.db')

// sql.js init is async — we export a promise that resolves to a db wrapper
let _db = null

async function getDb() {
  if (_db) return _db

  const SQL = await initSqlJs()
  let db

  if (existsSync(DB_PATH)) {
    const buf = readFileSync(DB_PATH)
    db = new SQL.Database(buf)
  } else {
    db = new SQL.Database()
  }

  // Persist after every write
  function save() {
    const data = db.export()
    writeFileSync(DB_PATH, Buffer.from(data))
  }

  const SCHEMA = `
    CREATE TABLE IF NOT EXISTS wallets (
      address TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      username_claimed_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
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
    );
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      name TEXT NOT NULL,
      asset TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_amount TEXT NOT NULL,
      current_amount TEXT NOT NULL DEFAULT '0',
      source_assets TEXT NOT NULL DEFAULT '[]',
      min_contribution TEXT,
      max_contribution TEXT,
      daily_cap TEXT,
      confirm_each INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      completed_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      type TEXT NOT NULL,
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
      status TEXT NOT NULL DEFAULT 'pending',
      error_text TEXT,
      goal_id TEXT,
      quote_id TEXT,
      quote_details TEXT,
      idempotency_key TEXT UNIQUE,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      confirmed_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS usernames (
      username TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      claimed_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      released_at INTEGER,
      hold_until INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_tx_wallet ON transactions(wallet_address, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_goals_wallet ON savings_goals(wallet_address);
  `
  db.run(SCHEMA)
  save()

  // Wrap with a simpler synchronous interface
  _db = {
    // Returns first row as plain object or null
    get(sql, ...params) {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      if (stmt.step()) {
        const row = stmt.getAsObject()
        stmt.free()
        return row
      }
      stmt.free()
      return null
    },
    // Returns all rows as plain objects
    all(sql, ...params) {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      const rows = []
      while (stmt.step()) rows.push(stmt.getAsObject())
      stmt.free()
      return rows
    },
    // Runs a mutating statement, saves db to disk
    run(sql, ...params) {
      db.run(sql, params)
      save()
    },
    prepare(sql) {
      const self = this
      return {
        get: (...p) => self.get(sql, ...p),
        all: (...p) => self.all(sql, ...p),
        run: (...p) => self.run(sql, ...p),
      }
    },
  }

  return _db
}

export { getDb }
