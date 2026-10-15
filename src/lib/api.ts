// Flex Wallet — API client
// All requests go through the Vite proxy → /api → server:3001

import type {
  WalletSettings, SavingsGoal, Transaction, PriceMap, AssetDef
} from '../types'

const BASE = '/api'

async function get<T>(path: string, query?: Record<string, string>): Promise<T> {
  const url = query
    ? `${BASE}${path}?${new URLSearchParams(query).toString()}`
    : `${BASE}${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export const walletApi = {
  get: (address: string) =>
    get<{ exists: boolean; wallet?: WalletSettings }>(`/wallet/${address}`),

  create: (address: string) =>
    post<{ ok: boolean }>('/wallet', { address }),

  update: (address: string, updates: Partial<WalletSettings>) =>
    patch<{ ok: boolean }>(`/wallet/${address}`, updates),
}

// ── Usernames ──────────────────────────────────────────────────────────────────

export const usernameApi = {
  check: (name: string) =>
    get<{ available: boolean; reason: string | null }>(`/username/check/${name}`),

  claim: (address: string, username: string) =>
    post<{ ok?: boolean; error?: string; username?: string }>(
      '/username/claim', { address, username },
    ),

  resolve: (name: string) =>
    get<{ found: boolean; address?: string; username?: string }>(`/username/resolve/${name}`),
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export const goalsApi = {
  list: (address: string) =>
    get<SavingsGoal[]>(`/goals/${address}`),

  create: (goal: {
    wallet_address: string
    name: string
    asset: string
    target_type: 'value' | 'quantity'
    target_amount: string
    source_assets: string[]
    min_contribution?: string
    max_contribution?: string
    daily_cap?: string
    confirm_each?: boolean
  }) => post<{ ok: boolean; id?: string; error?: string }>('/goals', goal),

  update: (id: string, updates: Partial<SavingsGoal>) =>
    patch<{ ok: boolean }>(`/goals/${id}`, updates),

  delete: (id: string) =>
    del<{ ok: boolean }>(`/goals/${id}`),
}

// ── Transactions ──────────────────────────────────────────────────────────────

export const txApi = {
  list: (address: string, opts?: {
    limit?: number; offset?: number; type?: string; search?: string; status?: string
  }) =>
    get<{ transactions: Transaction[]; total: number }>(
      `/transactions/${address}`,
      opts ? Object.fromEntries(Object.entries(opts).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) : undefined,
    ),

  create: (tx: Partial<Transaction> & { wallet_address: string; type: string; asset: string; amount: string }) =>
    post<{ ok: boolean; id: string; duplicate?: boolean }>('/transactions', tx),

  update: (id: string, updates: { status?: string; tx_hash?: string; error_text?: string }) =>
    patch<{ ok: boolean }>(`/transactions/${id}`, updates),
}

// ── Assets & Prices ───────────────────────────────────────────────────────────

export const assetsApi = {
  list: () => get<AssetDef[]>('/assets'),
  prices: () => get<{
    prices: PriceMap
    label: string
    note: string
  }>('/prices'),
}
