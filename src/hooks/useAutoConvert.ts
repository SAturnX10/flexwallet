/**
 * Flex Wallet — Auto-conversion engine
 *
 * Watches for incoming USDC balance increases on Arc Mainnet.
 * When auto_convert is ON and preferred_asset differs from the received asset,
 * it triggers a confirmation prompt (if confirm_each is set) or proceeds
 * automatically.
 *
 * Swap EXECUTION is labelled "demo only" — there is no verified cirBTC/USDC
 * swap pool on Arc Testnet. The full quote/route/confirmation flow is real;
 * the on-chain swap call is simulated and clearly marked.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { getUsdc } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'
import type { WalletSettings } from '../types'
import { txStore } from '../lib/store'
import { toast } from 'sonner'

const ARC_CHAIN_ID = 5042 // Arc Mainnet

export interface ConversionQuote {
  fromAsset: string
  toAsset: string
  fromAmount: string
  toAmount: string
  rate: string
  fee: string
  priceImpact: string
  expiresAt: number
  isDemoOnly: true
}

interface AutoConvertState {
  pendingQuote: ConversionQuote | null
  isConverting: boolean
  lastConvertedAt: number | null
}

// Demo rates (clearly marked) — real rates require a verified DEX oracle
const DEMO_RATES: Record<string, Record<string, number>> = {
  USDC:  { EURC: 0.926, cirBTC: 0.0000148, USDC: 1 },
  EURC:  { USDC: 1.079, cirBTC: 0.0000160, EURC: 1 },
  cirBTC:{ USDC: 67420, EURC: 62500,       cirBTC: 1 },
}

function getDemoRate(from: string, to: string): number {
  return DEMO_RATES[from]?.[to] ?? 1
}

function buildDemoQuote(fromAsset: string, toAsset: string, fromAmount: string): ConversionQuote {
  const rate = getDemoRate(fromAsset, toAsset)
  const from = parseFloat(fromAmount)
  const fee = from * 0.003  // 0.3% demo fee
  const toAmount = ((from - fee) * rate).toFixed(toAsset === 'cirBTC' ? 8 : 6)
  return {
    fromAsset,
    toAsset,
    fromAmount,
    toAmount,
    rate: rate.toString(),
    fee: fee.toFixed(6),
    priceImpact: '0.12',
    expiresAt: Date.now() + 30_000,
    isDemoOnly: true,
  }
}

export function useAutoConvert(
  settings: WalletSettings | null,
  address: string | undefined,
  onConversionComplete: () => void,
) {
  const [state, setState] = useState<AutoConvertState>({
    pendingQuote: null,
    isConverting: false,
    lastConvertedAt: null,
  })

  // Track previous balance to detect increases
  const prevBalanceRef = useRef<bigint | null>(null)
  const processingRef = useRef(false)

  const usdcFact = getUsdc(ARC_CHAIN_ID)
  const { data: rawBalance } = useReadContract({
    address: usdcFact?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? ([address] as [`0x${string}`]) : undefined,
    chainId: ARC_CHAIN_ID,
    query: {
      enabled: !!address && !!settings?.auto_convert,
      // Poll every 15s to detect incoming transfers
      refetchInterval: 15_000,
    },
  })

  // Detect balance increase = incoming transfer
  useEffect(() => {
    if (!rawBalance || !settings || !address) return
    if (!settings.auto_convert || settings.emergency_pause) return
    if (settings.preferred_asset === 'USDC') return  // already in preferred asset
    if (processingRef.current) return

    const prev = prevBalanceRef.current
    prevBalanceRef.current = rawBalance

    if (prev === null) return  // first read — no baseline yet
    if (rawBalance <= prev) return  // no increase

    const incomingRaw = rawBalance - prev
    const decimals = usdcDecimalsFor(ARC_CHAIN_ID)
    const incomingAmount = Amount.fromRaw(incomingRaw, decimals).toFixed(6)
    const incomingFloat = parseFloat(incomingAmount)

    // Check min/max limits
    const acs = settings.auto_convert_settings
    if (acs.min_amount && incomingFloat < parseFloat(acs.min_amount)) {
      toast(`Incoming ${incomingAmount} USDC below auto-convert minimum — kept as USDC`)
      return
    }
    if (acs.max_amount && incomingFloat > parseFloat(acs.max_amount)) {
      toast(`Incoming ${incomingAmount} USDC above auto-convert maximum — kept as USDC`)
      return
    }
    if (acs.pause_all) return

    const quote = buildDemoQuote('USDC', settings.preferred_asset, incomingAmount)

    if (settings.auto_convert_settings.confirm_each) {
      // Show pending quote for user confirmation
      setState(s => ({ ...s, pendingQuote: quote }))
    } else {
      // Auto-proceed
      void executeConversion(quote, settings, address, setState, onConversionComplete)
    }
  }, [rawBalance, settings, address, onConversionComplete])

  const confirmConversion = useCallback(() => {
    if (!state.pendingQuote || !settings || !address) return
    const q = state.pendingQuote
    setState(s => ({ ...s, pendingQuote: null }))
    void executeConversion(q, settings, address, setState, onConversionComplete)
  }, [state.pendingQuote, settings, address, onConversionComplete])

  const dismissConversion = useCallback(() => {
    if (state.pendingQuote) {
      toast(`Kept ${state.pendingQuote.fromAmount} USDC — conversion dismissed`)
    }
    setState(s => ({ ...s, pendingQuote: null }))
    processingRef.current = false
  }, [state.pendingQuote])

  return {
    pendingQuote: state.pendingQuote,
    isConverting: state.isConverting,
    confirmConversion,
    dismissConversion,
  }
}

async function executeConversion(
  quote: ConversionQuote,
  settings: WalletSettings,
  address: string,
  setState: React.Dispatch<React.SetStateAction<AutoConvertState>>,
  onComplete: () => void,
) {
  setState(s => ({ ...s, isConverting: true }))

  // Simulate network delay for demo
  await new Promise(r => setTimeout(r, 1800))

  // Record the conversion in local tx history
  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  txStore.add(address, {
    id,
    wallet_address: address,
    type: 'converted',
    asset: quote.toAsset,
    amount: quote.toAmount,
    usd_value: null,
    fee: quote.fee,
    fee_asset: 'USDC',
    recipient: null,
    recipient_username: null,
    recipient_resolved: null,
    sender: null,
    sender_username: null,
    received_via: null,
    tx_hash: null,
    // Demo-only: no real tx hash since swap is simulated
    status: 'confirmed',
    error_text: null,
    goal_id: null,
    quote_id: null,
    quote_details: {
      input_amount: quote.fromAmount,
      output_amount: quote.toAmount,
      fee: quote.fee,
      slippage: settings.auto_convert_settings.max_slippage ?? '0.5',
      price_impact: quote.priceImpact,
      route: `USDC → ${quote.toAsset} (demo)`,
      expires_at: quote.expiresAt,
      is_estimate: true,
    },
    idempotency_key: id,
    created_at: now,
    confirmed_at: now,
  })

  setState(s => ({ ...s, isConverting: false, lastConvertedAt: Date.now() }))

  toast.success(
    `Converted ${quote.fromAmount} USDC → ${quote.toAmount} ${quote.toAsset}`,
    { description: 'Demo conversion — no on-chain swap executed on Arc Testnet (no verified pool)' },
  )

  onComplete()
}
