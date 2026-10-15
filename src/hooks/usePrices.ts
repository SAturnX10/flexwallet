// Flex Wallet — price data hook
// Prices are bundled statically (demo). A real integration would poll a
// verified price oracle here. Static data means prices are always available
// immediately, with no network dependency.

import { useMemo } from 'react'
import { DEMO_PRICES } from '../lib/assets-static'
import type { PriceMap } from '../types'

export function usePrices() {
  const prices: PriceMap = useMemo(() => DEMO_PRICES, [])
  const priceNote = 'Prices are illustrative only (demo). Real prices require a verified oracle integration.'
  const loading = false

  const getUsdValue = (ticker: string, amount: string): number | null => {
    const p = prices[ticker]
    if (!p) return null
    return p.usd * parseFloat(amount || '0')
  }

  return { prices, priceNote, loading, getUsdValue }
}
