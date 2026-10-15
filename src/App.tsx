import { useState } from 'react'
import { useAccount } from 'wagmi'
import { AnimatePresence, motion } from 'framer-motion'
import type { NavPage, Transaction, WalletSettings } from './types'
import { useWalletSettings } from './hooks/useWalletSettings'
import { usePrices } from './hooks/usePrices'
import { useMotionPreference } from './hooks/useMotion'
import type { AssetDef } from './types'
import { ASSET_REGISTRY } from './lib/assets-static'
import { Sidebar, BottomNav } from './components/Sidebar'
import { Header } from './components/Header'
import { Onboarding } from './components/Onboarding'
import { Overview } from './components/pages/Overview'
import { Savings } from './components/pages/Savings'
import { Activity } from './components/pages/Activity'
import { Settings } from './components/pages/Settings'
import { SendModal } from './components/SendModal'
import { AddFundsModal } from './components/AddFundsModal'
import { UsernameModal } from './components/UsernameModal'
import { ConversionModal } from './components/ConversionModal'
import { useAutoConvert } from './hooks/useAutoConvert'
import { fadeUp } from './hooks/useMotion'

// Demo mode placeholder settings
const DEMO_SETTINGS: WalletSettings = {
  address: '0xdemo0000000000000000000000000000000000000',
  username: 'demo_user',
  username_claimed_at: null,
  onboarded: true,
  preferred_asset: 'USDC',
  preferred_currency: 'USD',
  reduce_motion: false,
  auto_convert: false,
  auto_convert_settings: {},
  sending_enabled: true,
  per_send_limit: '500',
  daily_send_limit: '2000',
  emergency_pause: false,
  enabled_assets: ['USDC', 'EURC', 'cirBTC'],
  savings_settings: {},
  number_format: 'en-US',
  saved_recipients: [],
}

export default function App() {
  const { isConnected, address } = useAccount()
  const { settings, loading: settingsLoading, update, reload } = useWalletSettings()
  const { prices } = usePrices()
  // Asset registry is static — no API call needed
  const assets: AssetDef[] = ASSET_REGISTRY
  const [page, setPage] = useState<NavPage>('overview')
  const [isDemo, setIsDemo] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showUsername, setShowUsername] = useState(false)
  const [_selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  // Prevent the onboarding from re-flashing while settings save after finish
  const [onboardingDone, setOnboardingDone] = useState(false)

  const effectiveSettings = isDemo ? DEMO_SETTINGS : settings
  const reduceMotion = useMotionPreference(effectiveSettings?.reduce_motion ?? false)

  // Auto-conversion engine — watches for incoming USDC and triggers swap
  const { pendingQuote, isConverting, confirmConversion, dismissConversion } = useAutoConvert(
    isDemo ? null : settings,
    address,
    reload,
  )



  // If connected but settings not loaded yet, wait
  const showOnboarding = !isDemo && !isConnected && !settingsLoading && !onboardingDone
  const showApp = isDemo || onboardingDone || (isConnected && settings?.onboarded)
  const showPreferences = !onboardingDone && isConnected && settings && !settings.onboarded

  const handleOnboardComplete = (updates: Partial<WalletSettings>) => {
    setOnboardingDone(true)
    update(updates)
  }

  const handleUsernameClaimed = (username: string) => {
    // update() writes to localStorage via settingsStore
    update({ username, username_claimed_at: Date.now() / 1000 })
    setShowUsername(false)
  }

  // Navigate to activity and show tx detail
  const handleViewTransaction = (tx: Transaction) => {
    setSelectedTx(tx)
    setPage('activity')
  }

  if (settingsLoading && isConnected && !isDemo) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <div className="space-y-3 text-center">
          <div className="size-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-400">Loading wallet...</p>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardComplete} onPreview={() => setIsDemo(true)} isLoading={false} />
  }

  if (showPreferences && !isDemo) {
    return <Onboarding onComplete={handleOnboardComplete} onPreview={() => setIsDemo(true)} isLoading={false} />
  }

  if (!showApp) {
    return <Onboarding onComplete={handleOnboardComplete} onPreview={() => setIsDemo(true)} isLoading={false} />
  }

  // While reload is in flight after onboarding, settings may briefly be the
  // un-onboarded snapshot — use a safe fallback so the app can render.
  const currentSettings = effectiveSettings ?? DEMO_SETTINGS

  return (
    <div className={`min-h-dvh flex bg-white ${reduceMotion ? 'reduce-motion' : ''}`}>
      {/* Sidebar (desktop) */}
      <Sidebar page={page} setPage={setPage} settings={effectiveSettings} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          page={page}
          settings={effectiveSettings}
          isConnected={isConnected || isDemo}
          onAddFunds={() => isDemo ? undefined : setShowAddFunds(true)}
          onSend={() => isDemo ? undefined : setShowSend(true)}
        />

        {/* Demo banner */}
        {isDemo && (
          <div className="flex items-center justify-between px-5 py-2 bg-neutral-50 border-b border-neutral-100 text-xs">
            <span className="text-neutral-500 font-medium">Preview mode — demo data only</span>
            <button
              onClick={() => setIsDemo(false)}
              className="text-neutral-900 font-semibold hover:underline"
            >
              Connect wallet →
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 pb-24 md:pb-6 max-w-2xl w-full mx-auto">
          <AnimatePresence mode="wait">
            {page === 'overview' && (
              <motion.div key="overview" {...fadeUp}>
                <Overview
                  settings={currentSettings}
                  prices={prices}
                  onViewActivity={() => setPage('activity')}
                  onViewSavings={() => setPage('savings')}
                  onViewTransaction={handleViewTransaction}
                  isDemo={isDemo}
                />
              </motion.div>
            )}
            {page === 'savings' && (
              <motion.div key="savings" {...fadeUp}>
                <Savings
                  settings={currentSettings}
                  prices={prices}
                  assets={assets}
                  isDemo={isDemo}
                />
              </motion.div>
            )}
            {page === 'activity' && (
              <motion.div key="activity" {...fadeUp}>
                <Activity
                  settings={currentSettings}
                  isDemo={isDemo}
                />
              </motion.div>
            )}
            {page === 'settings' && (
              <motion.div key="settings" {...fadeUp}>
                <Settings
                  settings={currentSettings}
                  onUpdate={isDemo ? () => Promise.resolve() : (u) => Promise.resolve(update(u))}
                  onClaimUsername={() => setShowUsername(true)}
                  assets={assets}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav page={page} setPage={setPage} />

      {/* Modals */}
      {!isDemo && (
        <>
          <SendModal
            open={showSend}
            onClose={() => setShowSend(false)}
            settings={currentSettings}
            assets={assets}
          />
          <AddFundsModal
            open={showAddFunds}
            onClose={() => setShowAddFunds(false)}
            settings={currentSettings}
            onClaimUsername={() => { setShowAddFunds(false); setShowUsername(true) }}
          />
          <UsernameModal
            open={showUsername}
            onClose={() => setShowUsername(false)}
            settings={currentSettings}
            onClaimed={handleUsernameClaimed}
          />
          {/* Auto-conversion confirmation — only shown when confirm_each is ON */}
          {pendingQuote && (
            <ConversionModal
              quote={pendingQuote}
              isConverting={isConverting}
              onConfirm={confirmConversion}
              onDismiss={dismissConversion}
            />
          )}
        </>
      )}
    </div>
  )
}
