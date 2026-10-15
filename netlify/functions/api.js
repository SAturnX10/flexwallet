/**
 * Flex Wallet — Netlify catch-all API function
 * Uses sql.js (pure WASM SQLite) — no native deps required.
 */

import { getDb } from './_db.js'
import { randomUUID } from 'crypto'

const ASSET_REGISTRY = [
  { ticker:'USDC', name:'USD Coin', currency:'USD', category:'stablecoin', network:'Arc Testnet', issuer:'Circle Internet Financial', contractNote:'ERC-20; regulated stablecoin issued by Circle', decimals:6, canReceive:true, canSend:true, canConvert:true, canSaveIn:true, status:'available', colorHex:'#1a1a1a', iconSymbol:'USDC' },
  { ticker:'EURC', name:'Euro Coin', currency:'EUR', category:'stablecoin', network:'Arc Testnet', issuer:'Circle Internet Financial', contractNote:'ERC-20; euro-denominated stablecoin issued by Circle', decimals:6, canReceive:true, canSend:true, canConvert:true, canSaveIn:true, status:'available', colorHex:'#2d2d2d', iconSymbol:'EURC' },
  { ticker:'USYC', name:'US Yield Coin', currency:'USD', category:'tokenized-fund', network:'Arc Testnet', issuer:'Hashnote', contractNote:'Tokenized US Treasury money-market fund. Not a stablecoin. Value fluctuates; no guaranteed yield.', decimals:6, canReceive:true, canSend:true, canConvert:false, canSaveIn:true, status:'receiving-only', colorHex:'#3a3a3a', iconSymbol:'USYC', disclaimer:'USYC is a tokenized money-market fund, not a stablecoin. Value fluctuates and yield is not guaranteed.' },
  { ticker:'cirBTC', name:'Circle BTC', currency:'BTC', category:'volatile', network:'Arc Testnet', issuer:'Circle Internet Financial', contractNote:'Tokenized Bitcoin exposure on Arc. Volatile; value tracks BTC market price.', decimals:8, canReceive:true, canSend:true, canConvert:true, canSaveIn:true, status:'available', colorHex:'#4a4a4a', iconSymbol:'BTC', disclaimer:'cirBTC tracks Bitcoin market price and is subject to high volatility.' },
  { ticker:'AUDF', name:'Australian Dollar on Flow', currency:'AUD', category:'local-currency', network:'Arc Testnet', issuer:'Novatti', contractNote:'AUD-pegged stablecoin', decimals:6, canReceive:true, canSend:false, canConvert:false, canSaveIn:false, status:'receiving-only', colorHex:'#555555', iconSymbol:'AUDF' },
  { ticker:'BRLA', name:'Brazilian Real', currency:'BRL', category:'local-currency', network:'Arc Testnet', issuer:'BRLA Digital', contractNote:'BRL-pegged stablecoin', decimals:6, canReceive:true, canSend:false, canConvert:false, canSaveIn:false, status:'receiving-only', colorHex:'#606060', iconSymbol:'BRLA' },
  { ticker:'JPYC', name:'JPY Coin', currency:'JPY', category:'local-currency', network:'Arc Testnet', issuer:'JPYC Inc.', contractNote:'JPY-pegged stablecoin', decimals:18, canReceive:true, canSend:false, canConvert:false, canSaveIn:false, status:'receiving-only', colorHex:'#6b6b6b', iconSymbol:'JPYC' },
  { ticker:'KRW1', name:'Korean Won', currency:'KRW', category:'local-currency', network:'Arc Testnet', issuer:'Hanwha', contractNote:'KRW-pegged stablecoin', decimals:6, canReceive:true, canSend:false, canConvert:false, canSaveIn:false, status:'receiving-only', colorHex:'#767676', iconSymbol:'KRW1' },
  { ticker:'QCAD', name:'QuadrigaCX CAD', currency:'CAD', category:'local-currency', network:'Arc Testnet', issuer:'Stablecorp', contractNote:'CAD-pegged stablecoin', decimals:2, canReceive:true, canSend:false, canConvert:false, canSaveIn:false, status:'receiving-only', colorHex:'#818181', iconSymbol:'QCAD' },
  { ticker:'MXNB', name:'Mexican Peso Bit', currency:'MXN', category:'local-currency', network:'Arc Testnet', issuer:'Bitso', contractNote:'MXN-pegged stablecoin', decimals:6, canReceive:true, canSend:false, canConvert:false, canSaveIn:false, status:'receiving-only', colorHex:'#8c8c8c', iconSymbol:'MXNB' },
  { ticker:'PHPC', name:'Philippine Peso Coin', currency:'PHP', category:'local-currency', network:'Arc Testnet', issuer:'PHX Digital', contractNote:'PHP-pegged stablecoin', decimals:6, canReceive:true, canSend:false, canConvert:false, canSaveIn:false, status:'receiving-only', colorHex:'#979797', iconSymbol:'PHPC' },
  { ticker:'ZARU', name:'South African Rand', currency:'ZAR', category:'local-currency', network:'Arc Testnet', issuer:'Standard Bank', contractNote:'ZAR-pegged stablecoin', decimals:6, canReceive:true, canSend:false, canConvert:false, canSaveIn:false, status:'receiving-only', colorHex:'#a2a2a2', iconSymbol:'ZARU' },
]

const DEMO_PRICES = {
  USDC:1.00, EURC:1.08, USYC:1.0031, cirBTC:67420.00,
  AUDF:0.65, BRLA:0.20, JPYC:0.0067, KRW1:0.00075,
  QCAD:0.73, MXNB:0.057, PHPC:0.018, ZARU:0.055,
}

const RESERVED = new Set(['admin','flex','flexwallet','wallet','support','help',
  'usdc','circle','arc','root','system','api','me','you',
  'send','receive','savings','activity','settings','overview'])

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
}

function json(body, status = 200) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...CORS },
    body: JSON.stringify(body),
  }
}

/**
 * Extract the API path from the event.
 * Netlify passes the original request path in event.path.
 * We strip the /api prefix to get the route.
 */
function getApiPath(event) {
  // event.path is the original request path, e.g. /api/username/claim
  const raw = event.path || '/'
  // Strip /api prefix (may also arrive as /.netlify/functions/api/... if called directly)
  return raw
    .replace(/^\/.netlify\/functions\/api/, '')
    .replace(/^\/api/, '')
    || '/'
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  const db = await getDb()
  const method = event.httpMethod
  const apiPath = getApiPath(event)
  const parts = apiPath.split('/').filter(Boolean)

  let body = {}
  try {
    if (event.body) body = JSON.parse(event.body)
  } catch { /* empty body */ }

  const qs = event.queryStringParameters ?? {}

  try {
    // ── Health ──────────────────────────────────────────────────────────────
    if (method === 'GET' && parts[0] === 'health') {
      return json({ ok: true, ts: Date.now(), path: apiPath, parts })
    }

    // ── Assets & Prices ─────────────────────────────────────────────────────
    if (method === 'GET' && parts[0] === 'assets') return json(ASSET_REGISTRY)

    if (method === 'GET' && parts[0] === 'prices') {
      const prices = {}
      for (const [k, v] of Object.entries(DEMO_PRICES)) prices[k] = { usd: v, source: 'demo' }
      return json({ prices, label: 'demo', note: 'Prices are illustrative only. Real prices require a verified oracle integration.' })
    }

    // ── Wallet ───────────────────────────────────────────────────────────────
    if (method === 'GET' && parts[0] === 'wallet' && parts[1]) {
      const row = db.prepare('SELECT * FROM wallets WHERE address = ?').get(parts[1])
      if (!row) return json({ exists: false })
      return json({ exists: true, wallet: {
        ...row,
        enabled_assets: safeJson(row.enabled_assets, ['USDC']),
        auto_convert_settings: safeJson(row.auto_convert_settings, {}),
        savings_settings: safeJson(row.savings_settings, {}),
        saved_recipients: safeJson(row.saved_recipients, []),
        onboarded: row.onboarded === 1,
        reduce_motion: row.reduce_motion === 1,
        auto_convert: row.auto_convert === 1,
        sending_enabled: row.sending_enabled === 1,
        emergency_pause: row.emergency_pause === 1,
      }})
    }

    if (method === 'POST' && parts[0] === 'wallet' && !parts[1]) {
      if (!body.address) return json({ error: 'address required' }, 400)
      db.prepare('INSERT OR IGNORE INTO wallets (address) VALUES (?)').run(body.address)
      return json({ ok: true })
    }

    if (method === 'PATCH' && parts[0] === 'wallet' && parts[1]) {
      const allowed = ['onboarded','preferred_asset','preferred_currency','reduce_motion',
        'auto_convert','auto_convert_settings','sending_enabled','per_send_limit',
        'daily_send_limit','emergency_pause','enabled_assets','savings_settings',
        'number_format','saved_recipients']
      const pairs = Object.entries(body).filter(([k]) => allowed.includes(k))
      if (!pairs.length) return json({ ok: true })
      const serialized = pairs.map(([k, v]) => {
        if (typeof v === 'object' && v !== null) return [k, JSON.stringify(v)]
        if (typeof v === 'boolean') return [k, v ? 1 : 0]
        return [k, v]
      })
      const set = serialized.map(([k]) => `${k} = ?`).join(', ')
      db.prepare(`UPDATE wallets SET ${set} WHERE address = ?`).run(...serialized.map(([,v]) => v), parts[1])
      return json({ ok: true })
    }

    // ── Usernames ─────────────────────────────────────────────────────────────
    if (method === 'GET' && parts[0] === 'username' && parts[1] === 'check' && parts[2]) {
      const name = parts[2].toLowerCase()
      if (!USERNAME_RE.test(name)) return json({ available: false, reason: 'invalid_format' })
      if (RESERVED.has(name)) return json({ available: false, reason: 'reserved' })
      const row = db.prepare('SELECT username FROM usernames WHERE username = ? AND released_at IS NULL').get(name)
      return json({ available: !row, reason: row ? 'taken' : null })
    }

    if (method === 'POST' && parts[0] === 'username' && parts[1] === 'claim') {
      const { address, username } = body
      if (!address || !username) return json({ error: 'address and username required' }, 400)
      const name = username.toLowerCase()
      if (!USERNAME_RE.test(name)) return json({ error: 'invalid_format' }, 400)
      if (RESERVED.has(name)) return json({ error: 'reserved' }, 400)

      const existing = db.prepare('SELECT username FROM usernames WHERE username = ? AND released_at IS NULL').get(name)
      if (existing) return json({ error: 'taken' }, 409)

      // If address already has a wallet row, release its old username
      const wallet = db.prepare('SELECT username FROM wallets WHERE address = ?').get(address)
      if (wallet?.username) {
        const holdUntil = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
        db.prepare("UPDATE usernames SET released_at = strftime('%s','now'), hold_until = ? WHERE username = ? AND wallet_address = ?")
          .run(holdUntil, wallet.username, address)
      }

      // Ensure the wallet row exists (first-time callers may not have it yet)
      db.prepare('INSERT OR IGNORE INTO wallets (address) VALUES (?)').run(address)

      db.prepare('INSERT OR REPLACE INTO usernames (username, wallet_address) VALUES (?, ?)').run(name, address)
      db.prepare("UPDATE wallets SET username = ?, username_claimed_at = strftime('%s','now') WHERE address = ?").run(name, address)

      return json({ ok: true, username: name })
    }

    if (method === 'GET' && parts[0] === 'username' && parts[1] === 'resolve' && parts[2]) {
      const name = parts[2].replace(/^@/, '').toLowerCase()
      const row = db.prepare('SELECT wallet_address FROM usernames WHERE username = ? AND released_at IS NULL').get(name)
      if (!row) return json({ found: false })
      const wallet = db.prepare('SELECT address, username FROM wallets WHERE address = ?').get(row.wallet_address)
      return wallet ? json({ found: true, address: wallet.address, username: wallet.username }) : json({ found: false })
    }

    // ── Savings goals ──────────────────────────────────────────────────────────
    if (method === 'GET' && parts[0] === 'goals' && parts[1]) {
      const rows = db.prepare('SELECT * FROM savings_goals WHERE wallet_address = ? ORDER BY sort_order, created_at').all(parts[1])
      return json(rows.map(r => ({ ...r, source_assets: safeJson(r.source_assets, []) })))
    }

    if (method === 'POST' && parts[0] === 'goals' && !parts[1]) {
      const { wallet_address, name, asset, target_type, target_amount, source_assets, min_contribution, max_contribution, daily_cap, confirm_each } = body
      const assetDef = ASSET_REGISTRY.find(a => a.ticker === asset)
      if (!assetDef) return json({ error: 'unknown_asset' }, 400)
      if (!assetDef.canSaveIn) return json({ error: 'asset_not_savings_eligible' }, 400)
      const id = randomUUID()
      db.prepare('INSERT INTO savings_goals (id,wallet_address,name,asset,target_type,target_amount,source_assets,min_contribution,max_contribution,daily_cap,confirm_each) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(
        id, wallet_address, name, asset, target_type, target_amount,
        JSON.stringify(source_assets || []),
        min_contribution||null, max_contribution||null, daily_cap||null, confirm_each ? 1 : 0,
      )
      return json({ ok: true, id })
    }

    if (method === 'PATCH' && parts[0] === 'goals' && parts[1]) {
      const allowed = ['name','asset','target_type','target_amount','source_assets',
        'min_contribution','max_contribution','daily_cap','confirm_each','status','sort_order']
      const pairs = Object.entries(body).filter(([k]) => allowed.includes(k))
      if (!pairs.length) return json({ ok: true })
      const serialized = pairs.map(([k, v]) => {
        if (Array.isArray(v)) return [k, JSON.stringify(v)]
        if (typeof v === 'boolean') return [k, v ? 1 : 0]
        return [k, v]
      })
      const set = serialized.map(([k]) => `${k} = ?`).join(', ')
      const vals = serialized.map(([,v]) => v)
      if (body.status === 'completed') {
        db.prepare(`UPDATE savings_goals SET ${set}, completed_at = COALESCE(completed_at, strftime('%s','now')), updated_at = strftime('%s','now') WHERE id = ?`).run(...vals, parts[1])
      } else {
        db.prepare(`UPDATE savings_goals SET ${set}, updated_at = strftime('%s','now') WHERE id = ?`).run(...vals, parts[1])
      }
      return json({ ok: true })
    }

    if (method === 'DELETE' && parts[0] === 'goals' && parts[1]) {
      db.prepare('DELETE FROM savings_goals WHERE id = ?').run(parts[1])
      return json({ ok: true })
    }

    // ── Transactions ───────────────────────────────────────────────────────────
    if (method === 'GET' && parts[0] === 'transactions' && parts[1]) {
      const address = parts[1]
      const limit = Number(qs.limit) || 50
      const offset = Number(qs.offset) || 0
      const type = qs.type, search = qs.search, status = qs.status

      let sql = 'SELECT * FROM transactions WHERE wallet_address = ?'
      const args = [address]
      if (type) { sql += ' AND type = ?'; args.push(type) }
      if (status) { sql += ' AND status = ?'; args.push(status) }
      if (search) {
        sql += ' AND (asset LIKE ? OR recipient LIKE ? OR recipient_username LIKE ? OR sender LIKE ? OR tx_hash LIKE ?)'
        const q = `%${search}%`; args.push(q, q, q, q, q)
      }
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      args.push(limit, offset)

      const rows = db.prepare(sql).all(...args)
      const countRow = db.prepare('SELECT COUNT(*) AS n FROM transactions WHERE wallet_address = ?').get(address)
      const total = countRow ? Number(countRow.n) : 0
      return json({
        transactions: rows.map(r => ({ ...r, quote_details: r.quote_details ? safeJson(r.quote_details, null) : null })),
        total,
      })
    }

    if (method === 'POST' && parts[0] === 'transactions' && !parts[1]) {
      const t = body
      if (t.idempotency_key) {
        const existing = db.prepare('SELECT id FROM transactions WHERE idempotency_key = ?').get(t.idempotency_key)
        if (existing) return json({ ok: true, id: existing.id, duplicate: true })
      }
      const id = randomUUID()
      db.prepare('INSERT INTO transactions (id,wallet_address,type,asset,amount,usd_value,fee,fee_asset,recipient,recipient_username,recipient_resolved,sender,sender_username,received_via,tx_hash,status,error_text,goal_id,quote_id,quote_details,idempotency_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
        id, t.wallet_address, t.type, t.asset, t.amount,
        t.usd_value??null, t.fee??null, t.fee_asset??null,
        t.recipient??null, t.recipient_username??null, t.recipient_resolved??null,
        t.sender??null, t.sender_username??null, t.received_via??null,
        t.tx_hash??null, t.status??'pending', t.error_text??null,
        t.goal_id??null, t.quote_id??null,
        t.quote_details ? JSON.stringify(t.quote_details) : null,
        t.idempotency_key??null,
      )
      return json({ ok: true, id })
    }

    if (method === 'PATCH' && parts[0] === 'transactions' && parts[1]) {
      const allowed = ['status','tx_hash','error_text','confirmed_at']
      const pairs = Object.entries(body).filter(([k]) => allowed.includes(k))
      if (!pairs.length) return json({ ok: true })
      const set = pairs.map(([k]) => `${k} = ?`).join(', ')
      const vals = pairs.map(([,v]) => v)
      if (body.status === 'confirmed') {
        db.prepare(`UPDATE transactions SET ${set}, confirmed_at = strftime('%s','now') WHERE id = ?`).run(...vals, parts[1])
      } else {
        db.prepare(`UPDATE transactions SET ${set} WHERE id = ?`).run(...vals, parts[1])
      }
      return json({ ok: true })
    }

    return json({ error: 'not_found', path: apiPath, parts }, 404)
  } catch (err) {
    console.error('[api]', err)
    return json({ error: 'internal_error', message: String(err?.message) }, 500)
  }
}

function safeJson(val, fallback) {
  if (val == null) return fallback
  if (typeof val === 'object') return val
  try { return JSON.parse(val) } catch { return fallback }
}
