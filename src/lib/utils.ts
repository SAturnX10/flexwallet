// Flex Wallet — shared utilities

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatAddress(addr: string): string {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function formatAmount(amount: string | number, decimals = 2): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(n)) return '0.00'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${formatAmount(amount)}`
  }
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() / 1000 - ts
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDateTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr)
}

export function isValidUsername(name: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(name.toLowerCase())
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Compute savings progress percentage (0-100), capped at 100 */
export function goalProgress(current: string, target: string): number {
  const c = parseFloat(current)
  const t = parseFloat(target)
  if (!t || !c) return 0
  return clamp((c / t) * 100, 0, 100)
}

export function assetDisplayName(ticker: string): string {
  const names: Record<string, string> = {
    USDC: 'USD Coin', EURC: 'Euro Coin', USYC: 'US Yield Coin',
    cirBTC: 'Circle BTC', AUDF: 'AUD on Flow', BRLA: 'Brazilian Real',
    JPYC: 'JPY Coin', KRW1: 'Korean Won', QCAD: 'CAD Coin',
    MXNB: 'Mexican Peso', PHPC: 'Philippine Peso', ZARU: 'South African Rand',
  }
  return names[ticker] ?? ticker
}
