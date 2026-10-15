import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import { Button } from './ui/Button'
import { AssetIcon } from './ui/AssetIcon'
import { fadeUp } from '../hooks/useMotion'
import type { WalletSettings } from '../types'

interface OnboardingProps {
  onComplete: (updates: Partial<WalletSettings>) => unknown
  onPreview: () => void
  isLoading: boolean
}

type Step = 'welcome' | 'connect' | 'preferences'

const ASSETS = ['USDC', 'EURC', 'cirBTC']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD']

export function Onboarding({ onComplete, onPreview, isLoading }: OnboardingProps) {
  const { isConnected } = useAccount()
  const [step, setStep] = useState<Step>('welcome')
  const [preferredAsset, setPreferredAsset] = useState('USDC')
  const [preferredCurrency, setPreferredCurrency] = useState('USD')

  // Auto-advance from 'connect' to 'preferences' once wallet is connected
  useEffect(() => {
    if (isConnected && step === 'connect') {
      setStep('preferences')
    }
  }, [isConnected, step])

  const handleFinish = () => {
    onComplete({
      onboarded: true,
      preferred_asset: preferredAsset,
      preferred_currency: preferredCurrency,
      auto_convert: false,
    })
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-white px-4">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            {...fadeUp}
            className="w-full max-w-sm text-center space-y-8"
          >
            <div className="space-y-4">
              <div className="text-xs font-semibold tracking-[0.14em] uppercase text-neutral-400 mb-2">
                FLEX WALLET
              </div>
              <h1 className="text-4xl font-bold text-neutral-900 leading-tight tracking-tight">
                Your assets.<br />Your goals.<br />Your rules.
              </h1>
              <p className="text-neutral-500 text-base leading-relaxed">
                A calm wallet that manages supported assets automatically and helps you reach your savings goals.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => setStep('connect')}
              >
                Get started
              </Button>
              <Button
                variant="tertiary"
                size="md"
                className="w-full"
                onClick={onPreview}
              >
                Explore preview
              </Button>
            </div>

            <p className="text-xs text-neutral-400">
              Preview uses demo data. No funds, no wallet required.
            </p>
          </motion.div>
        )}

        {step === 'connect' && (
          <motion.div
            key="connect"
            {...fadeUp}
            className="w-full max-w-sm space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-neutral-900">Connect your wallet</h2>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Flex Wallet reads your address to show real balances and lets you sign transactions through your existing wallet. We never request your seed phrase or private keys.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-100 p-5 space-y-3 bg-neutral-50">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">What connecting does</div>
              <ul className="space-y-2">
                {[
                  'Shows your real on-chain balances',
                  'Lets you sign sends and conversions',
                  'Your keys stay in your wallet',
                  'Disconnect any time in Settings',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-neutral-600">
                    <span className="mt-1 size-1.5 rounded-full bg-neutral-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Wallet connected
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={isLoading}
                  onClick={() => setStep('preferences')}
                >
                  Continue
                </Button>
              </div>
            ) : (
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <Button variant="primary" size="lg" className="w-full" onClick={show}>
                    Connect wallet
                  </Button>
                )}
              </ConnectKitButton.Custom>
            )}

            <button
              onClick={() => setStep('welcome')}
              className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors w-full text-center"
            >
              Back
            </button>
          </motion.div>
        )}

        {step === 'preferences' && (
          <motion.div
            key="preferences"
            {...fadeUp}
            className="w-full max-w-sm space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Your preferences</h2>
              <p className="text-neutral-500 text-sm mt-1">You can change these any time in Settings.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                  Preferred asset
                </label>
                <div className="flex gap-2">
                  {ASSETS.map(a => (
                    <button
                      key={a}
                      onClick={() => setPreferredAsset(a)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                        preferredAsset === a
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                      }`}
                    >
                      <AssetIcon ticker={a} size={20} />
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                  Display currency
                </label>
                <div className="flex flex-wrap gap-2">
                  {CURRENCIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setPreferredCurrency(c)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                        preferredCurrency === c
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Auto-conversion</div>
                <p className="text-xs text-neutral-500">
                  Off by default. You can enable it in Settings after connecting — it converts incoming assets to your preferred asset when a valid route exists.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={isLoading}
              onClick={handleFinish}
            >
              Finish setup
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
