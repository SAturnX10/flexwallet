/**
 * Flex Wallet — client-side persistence via localStorage
 *
 * All per-wallet data (settings, goals, transactions) lives in localStorage
 * keyed by wallet address. Username registration is the only server-side
 * coordination needed, since it must be globally unique.
 *
 * Keys:
 *   fw:settings:{address}   — WalletSettings
 *   fw:goals:{address}      — SavingsGoal[]
 *   fw:txs:{address}        — Transaction[]
 */

import type { WalletSettings, SavingsGoal, Transaction } from '../types'

const PREFIX = 'fw:'

function key(type: string, address: string) {
  return `${PREFIX}${type}:${address.toLowerCase()}`
}

function read<T>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(k: string, value: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(value))
  } catch {
    // storage quota — silently ignore
  }
}

// ── Settings ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = (address: string): WalletSettings => ({
  address,
  username: null,
  username_claimed_at: null,
  onboarded: false,
  preferred_asset: 'USDC',
  preferred_currency: 'USD',
  reduce_motion: false,
  auto_convert: false,
  auto_convert_settings: {},
  sending_enabled: true,
  per_send_limit: '500',
  daily_send_limit: '2000',
  emergency_pause: false,
  enabled_assets: ['USDC'],
  savings_settings: {},
  number_format: 'en-US',
  saved_recipients: [],
})

export const settingsStore = {
  get(address: string): WalletSettings {
    const stored = read<WalletSettings>(key('settings', address))
    if (stored) return { ...DEFAULT_SETTINGS(address), ...stored, address }
    return DEFAULT_SETTINGS(address)
  },

  set(address: string, settings: WalletSettings) {
    write(key('settings', address), settings)
  },

  update(address: string, updates: Partial<WalletSettings>): WalletSettings {
    const current = this.get(address)
    const next = { ...current, ...updates }
    this.set(address, next)
    return next
  },
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export const goalsStore = {
  get(address: string): SavingsGoal[] {
    return read<SavingsGoal[]>(key('goals', address)) ?? []
  },

  set(address: string, goals: SavingsGoal[]) {
    write(key('goals', address), goals)
  },

  add(address: string, goal: SavingsGoal) {
    const goals = this.get(address)
    this.set(address, [...goals, goal])
  },

  update(address: string, id: string, updates: Partial<SavingsGoal>) {
    const goals = this.get(address).map(g =>
      g.id === id ? { ...g, ...updates, updated_at: Math.floor(Date.now() / 1000) } : g
    )
    this.set(address, goals)
    return goals
  },

  remove(address: string, id: string) {
    const goals = this.get(address).filter(g => g.id !== id)
    this.set(address, goals)
  },
}

// ── Transactions ──────────────────────────────────────────────────────────────

const TX_LIMIT = 200 // keep last 200 transactions per wallet

export const txStore = {
  get(address: string): Transaction[] {
    return read<Transaction[]>(key('txs', address)) ?? []
  },

  add(address: string, tx: Transaction) {
    const txs = [tx, ...this.get(address)].slice(0, TX_LIMIT)
    write(key('txs', address), txs)
    return tx
  },

  update(address: string, id: string, updates: Partial<Transaction>) {
    const txs = this.get(address).map(t =>
      t.id === id ? { ...t, ...updates } : t
    )
    write(key('txs', address), txs)
  },
}

// ── Username cache (local mirror of server state) ─────────────────────────────

export const usernameCache = {
  /** Store the claimed username locally so it survives server cold starts */
  set(address: string, username: string) {
    write(key('username', address), { username, claimed_at: Date.now() })
    settingsStore.update(address, { username, username_claimed_at: Date.now() / 1000 })
  },
  get(address: string): string | null {
    const cached = read<{ username: string }>(key('username', address))
    return cached?.username ?? null
  },
}
