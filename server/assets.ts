/**
 * Flex Wallet — Asset registry
 *
 * 12 supported assets. Each flag is explicit.
 * Adding a future Arc asset is data-only: add an entry here.
 *
 * IMPORTANT: Never claim an asset is insured, risk-free, worldwide
 * or redeemable on demand unless verified.
 */

export type AssetCategory = 'stablecoin' | 'tokenized-fund' | 'volatile' | 'local-currency'
export type AssetStatus = 'available' | 'receiving-only' | 'swap-unavailable' | 'insufficient-liquidity' | 'restricted' | 'unsupported'

export interface AssetDefinition {
  ticker: string
  name: string
  currency: string          // underlying fiat / reference currency
  category: AssetCategory
  network: string
  issuer: string
  contractNote: string      // brief note on contract/issuance; not a guarantee
  decimals: number
  // Capability flags
  canReceive: boolean
  canSend: boolean
  canConvert: boolean       // can swap via a route
  canSaveIn: boolean        // eligible as savings goal asset
  status: AssetStatus
  // UI
  colorHex: string          // monochrome accent per asset (dark to light grays)
  iconSymbol: string        // symbol for web3icons or fallback text
  disclaimer?: string       // shown in UI where relevant
}

export const ASSET_REGISTRY: AssetDefinition[] = [
  {
    ticker: 'USDC',
    name: 'USD Coin',
    currency: 'USD',
    category: 'stablecoin',
    network: 'Arc Testnet',
    issuer: 'Circle Internet Financial',
    contractNote: 'ERC-20; regulated stablecoin issued by Circle',
    decimals: 6,
    canReceive: true,
    canSend: true,
    canConvert: true,
    canSaveIn: true,
    status: 'available',
    colorHex: '#1a1a1a',
    iconSymbol: 'USDC',
  },
  {
    ticker: 'EURC',
    name: 'Euro Coin',
    currency: 'EUR',
    category: 'stablecoin',
    network: 'Arc Testnet',
    issuer: 'Circle Internet Financial',
    contractNote: 'ERC-20; euro-denominated stablecoin issued by Circle',
    decimals: 6,
    canReceive: true,
    canSend: true,
    canConvert: true,
    canSaveIn: true,
    status: 'available',
    colorHex: '#2d2d2d',
    iconSymbol: 'EURC',
  },
  {
    ticker: 'USYC',
    name: 'US Yield Coin',
    currency: 'USD',
    category: 'tokenized-fund',
    network: 'Arc Testnet',
    issuer: 'Hashnote',
    contractNote: 'Tokenized US Treasury money-market fund. Not a stablecoin. Value fluctuates; no guaranteed yield.',
    decimals: 6,
    canReceive: true,
    canSend: true,
    canConvert: false,
    canSaveIn: true,
    status: 'receiving-only',
    colorHex: '#3a3a3a',
    iconSymbol: 'USYC',
    disclaimer: 'USYC is a tokenized money-market fund, not a stablecoin. Value fluctuates and yield is not guaranteed.',
  },
  {
    ticker: 'cirBTC',
    name: 'Circle BTC',
    currency: 'BTC',
    category: 'volatile',
    network: 'Arc Testnet',
    issuer: 'Circle Internet Financial',
    contractNote: 'Tokenized Bitcoin exposure on Arc. Volatile; value tracks BTC market price.',
    decimals: 8,
    canReceive: true,
    canSend: true,
    canConvert: true,
    canSaveIn: true,
    status: 'available',
    colorHex: '#4a4a4a',
    iconSymbol: 'BTC',
    disclaimer: 'cirBTC tracks Bitcoin market price and is subject to high volatility.',
  },
  {
    ticker: 'AUDF',
    name: 'Australian Dollar on Flow',
    currency: 'AUD',
    category: 'local-currency',
    network: 'Arc Testnet',
    issuer: 'Novatti',
    contractNote: 'AUD-pegged stablecoin',
    decimals: 6,
    canReceive: true,
    canSend: false,
    canConvert: false,
    canSaveIn: false,
    status: 'receiving-only',
    colorHex: '#555555',
    iconSymbol: 'AUDF',
  },
  {
    ticker: 'BRLA',
    name: 'Brazilian Real',
    currency: 'BRL',
    category: 'local-currency',
    network: 'Arc Testnet',
    issuer: 'BRLA Digital',
    contractNote: 'BRL-pegged stablecoin',
    decimals: 6,
    canReceive: true,
    canSend: false,
    canConvert: false,
    canSaveIn: false,
    status: 'receiving-only',
    colorHex: '#606060',
    iconSymbol: 'BRLA',
  },
  {
    ticker: 'JPYC',
    name: 'JPY Coin',
    currency: 'JPY',
    category: 'local-currency',
    network: 'Arc Testnet',
    issuer: 'JPYC Inc.',
    contractNote: 'JPY-pegged stablecoin',
    decimals: 18,
    canReceive: true,
    canSend: false,
    canConvert: false,
    canSaveIn: false,
    status: 'receiving-only',
    colorHex: '#6b6b6b',
    iconSymbol: 'JPYC',
  },
  {
    ticker: 'KRW1',
    name: 'Korean Won',
    currency: 'KRW',
    category: 'local-currency',
    network: 'Arc Testnet',
    issuer: 'Hanwha',
    contractNote: 'KRW-pegged stablecoin',
    decimals: 6,
    canReceive: true,
    canSend: false,
    canConvert: false,
    canSaveIn: false,
    status: 'receiving-only',
    colorHex: '#767676',
    iconSymbol: 'KRW1',
  },
  {
    ticker: 'QCAD',
    name: 'QuadrigaCX CAD',
    currency: 'CAD',
    category: 'local-currency',
    network: 'Arc Testnet',
    issuer: 'Stablecorp',
    contractNote: 'CAD-pegged stablecoin',
    decimals: 2,
    canReceive: true,
    canSend: false,
    canConvert: false,
    canSaveIn: false,
    status: 'receiving-only',
    colorHex: '#818181',
    iconSymbol: 'QCAD',
  },
  {
    ticker: 'MXNB',
    name: 'Mexican Peso Bit',
    currency: 'MXN',
    category: 'local-currency',
    network: 'Arc Testnet',
    issuer: 'Bitso',
    contractNote: 'MXN-pegged stablecoin',
    decimals: 6,
    canReceive: true,
    canSend: false,
    canConvert: false,
    canSaveIn: false,
    status: 'receiving-only',
    colorHex: '#8c8c8c',
    iconSymbol: 'MXNB',
  },
  {
    ticker: 'PHPC',
    name: 'Philippine Peso Coin',
    currency: 'PHP',
    category: 'local-currency',
    network: 'Arc Testnet',
    issuer: 'PHX Digital',
    contractNote: 'PHP-pegged stablecoin',
    decimals: 6,
    canReceive: true,
    canSend: false,
    canConvert: false,
    canSaveIn: false,
    status: 'receiving-only',
    colorHex: '#979797',
    iconSymbol: 'PHPC',
  },
  {
    ticker: 'ZARU',
    name: 'South African Rand',
    currency: 'ZAR',
    category: 'local-currency',
    network: 'Arc Testnet',
    issuer: 'Standard Bank',
    contractNote: 'ZAR-pegged stablecoin',
    decimals: 6,
    canReceive: true,
    canSend: false,
    canConvert: false,
    canSaveIn: false,
    status: 'receiving-only',
    colorHex: '#a2a2a2',
    iconSymbol: 'ZARU',
  },
]

export function getAsset(ticker: string): AssetDefinition | undefined {
  return ASSET_REGISTRY.find(a => a.ticker === ticker)
}

export const RESERVED_USERNAMES = new Set([
  'admin', 'flex', 'flexwallet', 'wallet', 'support', 'help',
  'usdc', 'circle', 'arc', 'root', 'system', 'api', 'me', 'you',
  'send', 'receive', 'savings', 'activity', 'settings', 'overview',
])
