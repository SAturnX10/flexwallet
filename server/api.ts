/**
 * Flex Wallet — shared API routes (used by both dev server and production start)
 */

import { Elysia } from 'elysia'
import { db } from './db'
import { ASSET_REGISTRY, getAsset, RESERVED_USERNAMES } from './assets'
import type { WalletRow, SavingsGoalRow, TransactionRow } from './db'
import { randomUUID } from 'crypto'

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

const DEMO_PRICES: Record<string, number> = {
  USDC: 1.00,
  EURC: 1.08,
  USYC: 1.0031,
  cirBTC: 67420.00,
  AUDF: 0.65,
  BRLA: 0.20,
  JPYC: 0.0067,
  KRW1: 0.00075,
  QCAD: 0.73,
  MXNB: 0.057,
  PHPC: 0.018,
  ZARU: 0.055,
}

export function buildApi() {
  return new Elysia()

    // ── Wallet ────────────────────────────────────────────────────────────────

    .get('/api/wallet/:address', ({ params }) => {
      const { address } = params
      const row = db.prepare('SELECT * FROM wallets WHERE address = ?').get(address) as WalletRow | null
      if (!row) return { exists: false }
      return {
        exists: true,
        wallet: {
          ...row,
          enabled_assets: JSON.parse(row.enabled_assets),
          auto_convert_settings: JSON.parse(row.auto_convert_settings),
          savings_settings: JSON.parse(row.savings_settings),
          saved_recipients: JSON.parse(row.saved_recipients),
          onboarded: row.onboarded === 1,
          reduce_motion: row.reduce_motion === 1,
          auto_convert: row.auto_convert === 1,
          sending_enabled: row.sending_enabled === 1,
          emergency_pause: row.emergency_pause === 1,
        },
      }
    })

    .post('/api/wallet', async ({ body }) => {
      const { address } = body as { address: string }
      if (!address) return { error: 'address required' }
      db.prepare('INSERT OR IGNORE INTO wallets (address) VALUES (?)').run(address)
      return { ok: true }
    })

    .patch('/api/wallet/:address', ({ params, body }) => {
      const { address } = params
      const updates = body as Record<string, unknown>
      const allowed = [
        'onboarded', 'preferred_asset', 'preferred_currency',
        'reduce_motion', 'auto_convert', 'auto_convert_settings',
        'sending_enabled', 'per_send_limit', 'daily_send_limit',
        'emergency_pause', 'enabled_assets', 'savings_settings',
        'number_format', 'saved_recipients',
      ]
      const pairs = Object.entries(updates).filter(([k]) => allowed.includes(k))
      if (!pairs.length) return { ok: true }

      const serialized = pairs.map(([k, v]) => {
        if (typeof v === 'object' && v !== null) return [k, JSON.stringify(v)]
        if (typeof v === 'boolean') return [k, v ? 1 : 0]
        return [k, v]
      })

      const setClause = serialized.map(([k]) => `${k as string} = ?`).join(', ')
      const values = serialized.map(([, v]) => v)
      db.prepare(`UPDATE wallets SET ${setClause} WHERE address = ?`).run(...values, address)
      return { ok: true }
    })

    // ── Usernames ────────────────────────────────────────────────────────────

    .get('/api/username/check/:name', ({ params }) => {
      const name = params.name.toLowerCase()
      if (!USERNAME_REGEX.test(name)) return { available: false, reason: 'invalid_format' }
      if (RESERVED_USERNAMES.has(name)) return { available: false, reason: 'reserved' }
      const row = db.prepare(`
        SELECT * FROM usernames WHERE username = ? AND released_at IS NULL
      `).get(name) as { wallet_address: string } | null
      return { available: !row, reason: row ? 'taken' : null }
    })

    .post('/api/username/claim', ({ body }) => {
      const { address, username } = body as { address: string; username: string }
      const name = username.toLowerCase()
      if (!USERNAME_REGEX.test(name)) return { error: 'invalid_format' }
      if (RESERVED_USERNAMES.has(name)) return { error: 'reserved' }
      const existing = db.prepare(`
        SELECT * FROM usernames WHERE username = ? AND released_at IS NULL
      `).get(name)
      if (existing) return { error: 'taken' }

      const wallet = db.prepare('SELECT * FROM wallets WHERE address = ?').get(address) as WalletRow | null
      if (wallet?.username) {
        const holdUntil = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
        db.prepare(`
          UPDATE usernames SET released_at = unixepoch(), hold_until = ?
          WHERE username = ? AND wallet_address = ?
        `).run(holdUntil, wallet.username, address)
      }

      db.prepare('INSERT OR REPLACE INTO usernames (username, wallet_address) VALUES (?, ?)').run(name, address)
      db.prepare('UPDATE wallets SET username = ?, username_claimed_at = unixepoch() WHERE address = ?').run(name, address)
      return { ok: true, username: name }
    })

    .get('/api/username/resolve/:name', ({ params }) => {
      const name = params.name.replace(/^@/, '').toLowerCase()
      const row = db.prepare(`
        SELECT wallet_address FROM usernames WHERE username = ? AND released_at IS NULL
      `).get(name) as { wallet_address: string } | null
      if (!row) return { found: false }
      const wallet = db.prepare('SELECT address, username FROM wallets WHERE address = ?').get(row.wallet_address) as Pick<WalletRow, 'address' | 'username'> | null
      return wallet ? { found: true, address: wallet.address, username: wallet.username } : { found: false }
    })

    // ── Savings goals ─────────────────────────────────────────────────────────

    .get('/api/goals/:address', ({ params }) => {
      const rows = db.prepare(`
        SELECT * FROM savings_goals WHERE wallet_address = ? ORDER BY sort_order, created_at
      `).all(params.address) as SavingsGoalRow[]
      return rows.map(r => ({ ...r, source_assets: JSON.parse(r.source_assets) }))
    })

    .post('/api/goals', ({ body }) => {
      const g = body as {
        wallet_address: string; name: string; asset: string
        target_type: 'value' | 'quantity'; target_amount: string
        source_assets: string[]; min_contribution?: string
        max_contribution?: string; daily_cap?: string; confirm_each?: boolean
      }
      const asset = getAsset(g.asset)
      if (!asset) return { error: 'unknown_asset' }
      if (!asset.canSaveIn) return { error: 'asset_not_savings_eligible' }
      const id = randomUUID()
      db.prepare(`
        INSERT INTO savings_goals
          (id, wallet_address, name, asset, target_type, target_amount,
           source_assets, min_contribution, max_contribution, daily_cap, confirm_each)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        id, g.wallet_address, g.name, g.asset, g.target_type, g.target_amount,
        JSON.stringify(g.source_assets || []),
        g.min_contribution || null, g.max_contribution || null, g.daily_cap || null,
        g.confirm_each ? 1 : 0,
      )
      return { ok: true, id }
    })

    .patch('/api/goals/:id', ({ params, body }) => {
      const updates = body as Record<string, unknown>
      const allowed = ['name', 'asset', 'target_type', 'target_amount', 'source_assets',
        'min_contribution', 'max_contribution', 'daily_cap', 'confirm_each', 'status', 'sort_order']
      const pairs = Object.entries(updates).filter(([k]) => allowed.includes(k))
      if (!pairs.length) return { ok: true }
      const serialized = pairs.map(([k, v]) => {
        if (Array.isArray(v)) return [k, JSON.stringify(v)]
        if (typeof v === 'boolean') return [k, v ? 1 : 0]
        return [k, v]
      })
      const setClause = serialized.map(([k]) => `${k as string} = ?`).join(', ')
      const values = serialized.map(([, v]) => v)
      if (updates.status === 'completed') {
        db.prepare(`
          UPDATE savings_goals SET ${setClause}, completed_at = COALESCE(completed_at, unixepoch()), updated_at = unixepoch()
          WHERE id = ?
        `).run(...values, params.id)
      } else {
        db.prepare(`UPDATE savings_goals SET ${setClause}, updated_at = unixepoch() WHERE id = ?`).run(...values, params.id)
      }
      return { ok: true }
    })

    .delete('/api/goals/:id', ({ params }) => {
      db.prepare('DELETE FROM savings_goals WHERE id = ?').run(params.id)
      return { ok: true }
    })

    // ── Transactions ───────────────────────────────────────────────────────────

    .get('/api/transactions/:address', ({ params, query }) => {
      const { address } = params
      const limit = Number(query.limit) || 50
      const offset = Number(query.offset) || 0
      const type = query.type as string | undefined
      const search = query.search as string | undefined
      const status = query.status as string | undefined

      let sql = 'SELECT * FROM transactions WHERE wallet_address = ?'
      const args: unknown[] = [address]
      if (type) { sql += ' AND type = ?'; args.push(type) }
      if (status) { sql += ' AND status = ?'; args.push(status) }
      if (search) {
        sql += ' AND (asset LIKE ? OR recipient LIKE ? OR recipient_username LIKE ? OR sender LIKE ? OR tx_hash LIKE ?)'
        const q = `%${search}%`
        args.push(q, q, q, q, q)
      }
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      args.push(limit, offset)

      const rows = db.prepare(sql).all(...args) as TransactionRow[]
      const total = (db.prepare(
        'SELECT COUNT(*) as n FROM transactions WHERE wallet_address = ?',
      ).get(address) as { n: number }).n

      return {
        transactions: rows.map(r => ({
          ...r,
          quote_details: r.quote_details ? JSON.parse(r.quote_details) : null,
        })),
        total,
      }
    })

    .post('/api/transactions', ({ body }) => {
      const t = body as {
        wallet_address: string; type: string; asset: string; amount: string
        usd_value?: string; fee?: string; fee_asset?: string
        recipient?: string; recipient_username?: string; recipient_resolved?: string
        sender?: string; sender_username?: string; received_via?: string
        tx_hash?: string; status?: string; error_text?: string
        goal_id?: string; quote_id?: string; quote_details?: unknown
        idempotency_key?: string
      }

      if (t.idempotency_key) {
        const existing = db.prepare(
          'SELECT id FROM transactions WHERE idempotency_key = ?',
        ).get(t.idempotency_key) as { id: string } | null
        if (existing) return { ok: true, id: existing.id, duplicate: true }
      }

      const id = randomUUID()
      db.prepare(`
        INSERT INTO transactions
          (id, wallet_address, type, asset, amount, usd_value, fee, fee_asset,
           recipient, recipient_username, recipient_resolved, sender, sender_username,
           received_via, tx_hash, status, error_text, goal_id, quote_id, quote_details, idempotency_key)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        id, t.wallet_address, t.type, t.asset, t.amount,
        t.usd_value ?? null, t.fee ?? null, t.fee_asset ?? null,
        t.recipient ?? null, t.recipient_username ?? null, t.recipient_resolved ?? null,
        t.sender ?? null, t.sender_username ?? null, t.received_via ?? null,
        t.tx_hash ?? null, t.status ?? 'pending',
        t.error_text ?? null, t.goal_id ?? null, t.quote_id ?? null,
        t.quote_details ? JSON.stringify(t.quote_details) : null,
        t.idempotency_key ?? null,
      )
      return { ok: true, id }
    })

    .patch('/api/transactions/:id', ({ params, body }) => {
      const updates = body as Record<string, unknown>
      const allowed = ['status', 'tx_hash', 'error_text', 'confirmed_at']
      const pairs = Object.entries(updates).filter(([k]) => allowed.includes(k))
      if (!pairs.length) return { ok: true }
      const setClause = pairs.map(([k]) => `${k} = ?`).join(', ')
      const values = pairs.map(([, v]) => v)
      if (updates.status === 'confirmed') {
        db.prepare(`UPDATE transactions SET ${setClause}, confirmed_at = unixepoch() WHERE id = ?`).run(...values, params.id)
      } else {
        db.prepare(`UPDATE transactions SET ${setClause} WHERE id = ?`).run(...values, params.id)
      }
      return { ok: true }
    })

    // ── Assets & prices ───────────────────────────────────────────────────────

    .get('/api/assets', () => ASSET_REGISTRY)

    .get('/api/prices', () => {
      const prices: Record<string, { usd: number; source: 'demo' }> = {}
      for (const [ticker, usd] of Object.entries(DEMO_PRICES)) {
        prices[ticker] = { usd, source: 'demo' }
      }
      return {
        prices,
        label: 'demo',
        note: 'Prices are illustrative only. Real prices require a verified oracle integration.',
      }
    })

    // ── Health ────────────────────────────────────────────────────────────────

    .get('/api/health', () => ({ ok: true, ts: Date.now() }))
}
