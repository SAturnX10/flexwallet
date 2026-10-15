/**
 * Flex Wallet — static asset registry and demo prices.
 * These never need a server round-trip: they are bundled directly into the
 * frontend so they are always available, even when the Netlify Function is
 * cold or unavailable.
 */

import type { AssetDef, PriceMap } from '../types'

export const ASSET_REGISTRY: AssetDef[] = [
  {
    ticker: 'USDC', name: 'USD Coin', currency: 'USD',
    category: 'stablecoin', network: 'Arc',
    issuer: 'Circle Internet Financial',
    contractNote: 'ERC-20; regulated stablecoin issued by Circle.',
    decimals: 6, canReceive: true, canSend: true, canConvert: true, canSaveIn: true,
    status: 'available', colorHex: '#1a1a1a', iconSymbol: 'USDC',
  },
  {
    ticker: 'EURC', name: 'Euro Coin', currency: 'EUR',
    category: 'stablecoin', network: 'Arc',
    issuer: 'Circle Internet Financial',
    contractNote: 'ERC-20; euro-denominated stablecoin issued by Circle.',
    decimals: 6, canReceive: true, canSend: true, canConvert: true, canSaveIn: true,
    status: 'available', colorHex: '#2d2d2d', iconSymbol: 'EURC',
  },
  {
    ticker: 'USYC', name: 'US Yield Coin', currency: 'USD',
    category: 'tokenized-fund', network: 'Arc',
    issuer: 'Hashnote',
    contractNote: 'Tokenized US Treasury money-market fund. Not a stablecoin. Value fluctuates; no guaranteed yield.',
    decimals: 6, canReceive: true, canSend: true, canConvert: false, canSaveIn: true,
    status: 'receiving-only', colorHex: '#3a3a3a', iconSymbol: 'USYC',
    disclaimer: 'USYC is a tokenized money-market fund, not a stablecoin. Value fluctuates and yield is not guaranteed.',
  },
  {
    ticker: 'cirBTC', name: 'Circle BTC', currency: 'BTC',
    category: 'volatile', network: 'Arc',
    issuer: 'Circle Internet Financial',
    contractNote: 'Tokenized Bitcoin exposure on Arc. Volatile; value tracks BTC market price.',
    decimals: 8, canReceive: true, canSend: true, canConvert: true, canSaveIn: true,
    status: 'available', colorHex: '#4a4a4a', iconSymbol: 'BTC',
    disclaimer: 'cirBTC tracks Bitcoin market price and is subject to high volatility.',
  },
  {
    ticker: 'AUDF', name: 'Australian Dollar on Flow', currency: 'AUD',
    category: 'local-currency', network: 'Arc', issuer: 'Novatti',
    contractNote: 'AUD-pegged stablecoin.',
    decimals: 6, canReceive: true, canSend: false, canConvert: false, canSaveIn: false,
    status: 'receiving-only', colorHex: '#555555', iconSymbol: 'AUDF',
  },
  {
    ticker: 'BRLA', name: 'Brazilian Real', currency: 'BRL',
    category: 'local-currency', network: 'Arc', issuer: 'BRLA Digital',
    contractNote: 'BRL-pegged stablecoin.',
    decimals: 6, canReceive: true, canSend: false, canConvert: false, canSaveIn: false,
    status: 'receiving-only', colorHex: '#606060', iconSymbol: 'BRLA',
  },
  {
    ticker: 'JPYC', name: 'JPY Coin', currency: 'JPY',
    category: 'local-currency', network: 'Arc', issuer: 'JPYC Inc.',
    contractNote: 'JPY-pegged stablecoin.',
    decimals: 18, canReceive: true, canSend: false, canConvert: false, canSaveIn: false,
    status: 'receiving-only', colorHex: '#6b6b6b', iconSymbol: 'JPYC',
  },
  {
    ticker: 'KRW1', name: 'Korean Won', currency: 'KRW',
    category: 'local-currency', network: 'Arc', issuer: 'Hanwha',
    contractNote: 'KRW-pegged stablecoin.',
    decimals: 6, canReceive: true, canSend: false, canConvert: false, canSaveIn: false,
    status: 'receiving-only', colorHex: '#767676', iconSymbol: 'KRW1',
  },
  {
    ticker: 'QCAD', name: 'QuadrigaCX CAD', currency: 'CAD',
    category: 'local-currency', network: 'Arc', issuer: 'Stablecorp',
    contractNote: 'CAD-pegged stablecoin.',
    decimals: 2, canReceive: true, canSend: false, canConvert: false, canSaveIn: false,
    status: 'receiving-only', colorHex: '#818181', iconSymbol: 'QCAD',
  },
  {
    ticker: 'MXNB', name: 'Mexican Peso Bit', currency: 'MXN',
    category: 'local-currency', network: 'Arc', issuer: 'Bitso',
    contractNote: 'MXN-pegged stablecoin.',
    decimals: 6, canReceive: true, canSend: false, canConvert: false, canSaveIn: false,
    status: 'receiving-only', colorHex: '#8c8c8c', iconSymbol: 'MXNB',
  },
  {
    ticker: 'PHPC', name: 'Philippine Peso Coin', currency: 'PHP',
    category: 'local-currency', network: 'Arc', issuer: 'PHX Digital',
    contractNote: 'PHP-pegged stablecoin.',
    decimals: 6, canReceive: true, canSend: false, canConvert: false, canSaveIn: false,
    status: 'receiving-only', colorHex: '#979797', iconSymbol: 'PHPC',
  },
  {
    ticker: 'ZARU', name: 'South African Rand', currency: 'ZAR',
    category: 'local-currency', network: 'Arc', issuer: 'Standard Bank',
    contractNote: 'ZAR-pegged stablecoin.',
    decimals: 6, canReceive: true, canSend: false, canConvert: false, canSaveIn: false,
    status: 'receiving-only', colorHex: '#a2a2a2', iconSymbol: 'ZARU',
  },
]

/**
 * Demo prices — clearly labelled as illustrative.
 * A real integration would fetch from a verified price oracle.
 */
export const DEMO_PRICES: PriceMap = {
  USDC:   { usd: 1.00,      source: 'demo' },
  EURC:   { usd: 1.08,      source: 'demo' },
  USYC:   { usd: 1.0031,    source: 'demo' },
  cirBTC: { usd: 67420.00,  source: 'demo' },
  AUDF:   { usd: 0.65,      source: 'demo' },
  BRLA:   { usd: 0.20,      source: 'demo' },
  JPYC:   { usd: 0.0067,    source: 'demo' },
  KRW1:   { usd: 0.00075,   source: 'demo' },
  QCAD:   { usd: 0.73,      source: 'demo' },
  MXNB:   { usd: 0.057,     source: 'demo' },
  PHPC:   { usd: 0.018,     source: 'demo' },
  ZARU:   { usd: 0.055,     source: 'demo' },
}

export const PRICE_NOTE = 'Prices are illustrative only (demo). Real prices require a verified oracle integration.'
