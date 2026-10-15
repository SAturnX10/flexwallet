/**
 * Flex Wallet — Auto-conversion confirmation modal
 * Shown when confirm_each is ON and an incoming transfer is detected.
 */

import { useState, useEffect } from 'react'
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { AssetIcon } from './ui/AssetIcon'
import type { ConversionQuote } from '../hooks/useAutoConvert'

interface ConversionModalProps {
  quote: ConversionQuote
  isConverting: boolean
  onConfirm: () => void
  onDismiss: () => void
}

export function ConversionModal({ quote, isConverting, onConfirm, onDismiss }: ConversionModalProps) {
  // oxlint-disable-next-line react/purity -- lazy initializer called once, not during render
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.round((quote.expiresAt - Date.now()) / 1000)))

  useEffect(() => {
    if (secondsLeft <= 0) { onDismiss(); return }
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(t); onDismiss(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal open title="Auto-conversion" onClose={onDismiss} size="sm">
      <div className="space-y-5">
        {/* Quote visual */}
        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AssetIcon ticker={quote.fromAsset} size={32} />
              <div>
                <div className="text-xs text-neutral-400">From</div>
                <div className="text-base font-bold tabular-nums text-neutral-900">
                  {quote.fromAmount} {quote.fromAsset}
                </div>
              </div>
            </div>
            <RefreshCw className="size-4 text-neutral-400" />
            <div className="flex items-center gap-2 text-right">
              <div>
                <div className="text-xs text-neutral-400">To</div>
                <div className="text-base font-bold tabular-nums text-neutral-900">
                  {quote.toAmount} {quote.toAsset}
                </div>
              </div>
              <AssetIcon ticker={quote.toAsset} size={32} />
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-3 space-y-1.5">
            {[
              { label: 'Rate', value: `1 ${quote.fromAsset} = ${parseFloat(quote.rate) < 0.001 ? parseFloat(quote.rate).toExponential(4) : parseFloat(quote.rate).toFixed(6)} ${quote.toAsset}` },
              { label: 'Fee (0.3%)', value: `${quote.fee} ${quote.fromAsset}` },
              { label: 'Price impact', value: `${quote.priceImpact}%` },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-xs">
                <span className="text-neutral-400">{r.label}</span>
                <span className="text-neutral-700 font-medium tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Demo notice */}
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2.5">
          <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Demo only.</strong> No live cirBTC/USDC swap pool exists on Arc Testnet.
            This records the conversion in your activity feed but does not execute an on-chain swap.
          </span>
        </div>

        {/* Expiry */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <Clock className="size-3.5" />
          Quote expires in {secondsLeft}s
          {/* Shrinking timer bar */}
          <div className="flex-1 h-0.5 bg-neutral-100 rounded-full overflow-hidden ml-1">
            <div
              className="h-full bg-neutral-400 rounded-full transition-all duration-1000"
              style={{ width: `${(secondsLeft / 30) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="md" className="flex-1" onClick={onDismiss} disabled={isConverting}>
            Keep USDC
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            loading={isConverting}
            onClick={onConfirm}
          >
            Convert →
          </Button>
        </div>
      </div>
    </Modal>
  )
}
