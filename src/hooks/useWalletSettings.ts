/**
 * Flex Wallet — wallet settings hook
 *
 * Persists to localStorage (keyed by address). The Netlify API is only
 * called for username registration, which needs server-side coordination.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { settingsStore, usernameCache } from '../lib/store'
import type { WalletSettings } from '../types'

export function useWalletSettings() {
  const { address, isConnected } = useAccount()
  const [settings, setSettings] = useState<WalletSettings | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    if (!address) { setSettings(null); return }
    setLoading(true)
    // Hydrate from localStorage — synchronous, always available
    const stored = settingsStore.get(address)
    // Also restore any cached username in case the settings were saved before claim
    const cachedUsername = usernameCache.get(address)
    if (cachedUsername && !stored.username) {
      stored.username = cachedUsername
    }
    setSettings(stored)
    setLoading(false)
  }, [address])

  useEffect(() => {
    if (isConnected && address) {
      load()
    } else {
      setSettings(null)
    }
  }, [isConnected, address, load])

  const update = useCallback((updates: Partial<WalletSettings>) => {
    if (!address) return
    const next = settingsStore.update(address, updates)
    setSettings(next)
  }, [address])

  const reload = useCallback(() => {
    load()
  }, [load])

  return { settings, loading, update, reload }
}
