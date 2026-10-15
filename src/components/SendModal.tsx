import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { erc20Abi } from 'viem'
import { Search, AlertCircle, Loader2, Check, ExternalLink } from 'lucide-react'
import type { WalletSettings, AssetDef, ResolvedRecipient } from '../types'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { AssetIcon } from './ui/AssetIcon'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { parseAmount, Amount, usdcDecimalsFor } from '@/onchain-money'
import { useReadContract } from 'wagmi'
import { usernameApi } from '../lib/api'
import { txStore } from '../lib/store'
import { isValidAddress, isValidUsername, generateIdempotencyKey, formatAddress } from '../lib/utils'
import { toast } from 'sonner'

const ARC_CHAIN_ID = 5042 // Arc Mainnet

interface SendModalProps {
  open: boolean
  onClose: () => void
  settings: WalletSettings
  assets: AssetDef[]
}

type Step = 'form' | 'review' | 'pending' | 'success' | 'error'

export function SendModal({ open, onClose, settings, assets }: SendModalProps) {
  const { address } = useAccount()
  const [step, setStep] = useState<Step>('form')
  const [recipient, setRecipient] = useState('')
  const [resolvedRecipient, setResolvedRecipient] = useState<ResolvedRecipient | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(settings.preferred_asset)
  const [amount, setAmount] = useState('')
  const [formError, setFormError] = useState('')
  const [idempotencyKey] = useState(generateIdempotencyKey)
  const [txId, setTxId] = useState('')

  const usdcFact = getUsdc(ARC_CHAIN_ID)
  const { data: rawBalance } = useReadContract({
    address: usdcFact?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!address },
  })

  const balance = rawBalance != null
    ? Amount.fromRaw(rawBalance, usdcDecimalsFor(ARC_CHAIN_ID)).toFixed(6)
    : '0'

  const { writeContract, data: txHash, isPending, isError, error: txError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  // Resolve recipient (address or username)
  const resolveRecipient = useCallback(async (value: string) => {
    const v = value.trim()
    if (!v) { setResolvedRecipient(null); setResolveError(''); return }

    if (isValidAddress(v)) {
      if (v.toLowerCase() === address?.toLowerCase()) {
        setResolveError('Cannot send to your own address')
        setResolvedRecipient(null)
        return
      }
      setResolvedRecipient({ address: v, username: null, displayName: formatAddress(v) })
      setResolveError('')
      return
    }

    const name = v.startsWith('@') ? v.slice(1) : v
    if (isValidUsername(name)) {
      setResolving(true)
      setResolveError('')
      try {
        const res = await usernameApi.resolve(name)
        if (res.found && res.address) {
          if (res.address.toLowerCase() === address?.toLowerCase()) {
            setResolveError('Cannot send to yourself')
            setResolvedRecipient(null)
          } else {
            setResolvedRecipient({
              address: res.address,
              username: res.username ?? name,
              displayName: `@${res.username ?? name}, ${formatAddress(res.address)}`,
            })
          }
        } else {
          setResolveError(`Username @${name} not found`)
          setResolvedRecipient(null)
        }
      } finally {
        setResolving(false)
      }
    } else if (v.length > 2) {
      setResolveError('Enter a valid wallet address or @username')
      setResolvedRecipient(null)
    }
  }, [address])

  useEffect(() => {
    const t = setTimeout(() => { void resolveRecipient(recipient) }, 400)
    return () => clearTimeout(t)
  }, [recipient, resolveRecipient])

  // Track transaction result
  useEffect(() => {
    if (isSuccess && txHash && txId && address) {
      txStore.update(address, txId, { status: 'confirmed', tx_hash: txHash })
      setStep('success')
    }
  }, [isSuccess, txHash, txId, address])

  useEffect(() => {
    if (isError && txId && address) {
      const msg = txError?.message?.includes('rejected') ? 'Transaction cancelled.' : (txError?.message ?? 'Transaction failed')
      txStore.update(address, txId, { status: 'failed', error_text: msg })
      setStep('error')
    }
  }, [isError, txError, txId, address])

  const validate = (): string | null => {
    if (!resolvedRecipient) return 'Enter a valid recipient'
    if (!amount || parseFloat(amount) <= 0) return 'Enter an amount'
    if (parseFloat(amount) > parseFloat(balance)) return 'Insufficient balance'
    if (parseFloat(amount) > parseFloat(settings.per_send_limit)) return `Exceeds per-send limit of ${settings.per_send_limit}`
    if (!settings.sending_enabled || settings.emergency_pause) return 'Sending is currently disabled'
    const asset = assets.find(a => a.ticker === selectedAsset)
    if (!asset?.canSend) return 'This asset cannot be sent'
    return null
  }

  const handleReview = () => {
    const err = validate()
    if (err) { setFormError(err); return }
    setFormError('')
    setStep('review')
  }

  const handleSend = () => {
    if (!resolvedRecipient || !usdcFact || !address) return
    setStep('pending')

    try {
      // Record pending tx in localStorage
      const txRecord = txStore.add(address, {
        id: idempotencyKey,
        wallet_address: address,
        type: 'sent',
        asset: selectedAsset,
        amount,
        recipient: resolvedRecipient.address,
        recipient_username: resolvedRecipient.username ?? null,
        recipient_resolved: resolvedRecipient.address,
        status: 'pending',
        created_at: Date.now() / 1000,
        usd_value: null, fee: null, fee_asset: null, sender: null,
        sender_username: null, received_via: null, tx_hash: null,
        error_text: null, goal_id: null, quote_id: null, quote_details: null,
        idempotency_key: idempotencyKey, confirmed_at: null,
      })
      setTxId(txRecord.id)

      const parsed = parseAmount(ARC_CHAIN_ID, amount)
      writeContract({
        address: usdcFact.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [resolvedRecipient.address as `0x${string}`, parsed.raw],
        chainId: ARC_CHAIN_ID,
      })
    } catch {
      setStep('error')
    }
  }

  const handleClose = () => {
    setStep('form')
    setRecipient('')
    setResolvedRecipient(null)
    setAmount('')
    setFormError('')
    onClose()
  }

  const explorerUrl = txHash ? buildTxExplorerUrl(ARC_CHAIN_ID, txHash) : null
  const asset = assets.find(a => a.ticker === selectedAsset)
  const sendableAssets = assets.filter(a => a.canSend && settings.enabled_assets.includes(a.ticker))

  return (
    <Modal open={open} onClose={handleClose} title="Send" size="md">
      {step === 'form' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Recipient</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
              <input
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                placeholder="Address or @username"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                autoComplete="off"
              />
            </div>
            {resolving && <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1"><Loader2 className="size-3 animate-spin" />Resolving...</p>}
            {resolvedRecipient && !resolving && (
              <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1"><Check className="size-3" />{resolvedRecipient.displayName}</p>
            )}
            {resolveError && <p className="text-xs text-red-600 mt-1">{resolveError}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Asset</label>
            <div className="flex gap-2 flex-wrap">
              {sendableAssets.map(a => (
                <button
                  key={a.ticker}
                  onClick={() => setSelectedAsset(a.ticker)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    selectedAsset === a.ticker ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600'
                  }`}
                >
                  <AssetIcon ticker={a.ticker} size={16} />
                  {a.ticker}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Amount</label>
              <button
                className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                onClick={() => setAmount(balance)}
              >
                Max: {parseFloat(balance).toFixed(2)} {selectedAsset}
              </button>
            </div>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 tabular-nums"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2.5 rounded-xl">
              <AlertCircle className="size-3.5" />{formError}
            </div>
          )}

          <Button variant="primary" size="lg" className="w-full" onClick={handleReview}
            disabled={!resolvedRecipient || !amount || !!resolveError}>
            Review send
          </Button>
        </div>
      )}

      {step === 'review' && resolvedRecipient && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-100 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">To</span>
              <span className="font-medium text-neutral-900 text-right">
                {resolvedRecipient.username && <span className="text-neutral-400 mr-1">@{resolvedRecipient.username}</span>}
                <span className="font-mono">{formatAddress(resolvedRecipient.address)}</span>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Amount</span>
              <span className="font-semibold tabular-nums text-neutral-900">{amount} {selectedAsset}</span>
            </div>
            {asset?.disclaimer && (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5">
                <AlertCircle className="size-3.5 flex-shrink-0 mt-0.5" />{asset.disclaimer}
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-500 text-center">This action cannot be undone. Verify the recipient address before sending.</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setStep('form')}>Back</Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleSend}
              loading={isPending || isConfirming}>
              {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Send'}
            </Button>
          </div>
        </div>
      )}

      {step === 'pending' && (
        <div className="py-8 text-center space-y-3">
          <Loader2 className="size-8 animate-spin text-neutral-400 mx-auto" />
          <p className="text-sm font-medium text-neutral-700">
            {isPending ? 'Waiting for wallet confirmation...' : 'Confirming on-chain...'}
          </p>
          <p className="text-xs text-neutral-400">Do not close this window.</p>
        </div>
      )}

      {step === 'success' && (
        <div className="py-6 text-center space-y-4">
          <div className="size-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Check className="size-6" />
          </div>
          <div>
            <p className="text-base font-semibold text-neutral-900">Sent</p>
            <p className="text-sm text-neutral-500 mt-1">{amount} {selectedAsset} to {resolvedRecipient?.displayName}</p>
          </div>
          {explorerUrl && (
            <a href={explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700">
              View on explorer <ExternalLink className="size-3" />
            </a>
          )}
          <Button variant="primary" size="md" className="w-full" onClick={handleClose}>Done</Button>
        </div>
      )}

      {step === 'error' && (
        <div className="py-6 text-center space-y-4">
          <AlertCircle className="size-10 text-red-400 mx-auto" />
          <div>
            <p className="text-base font-semibold text-neutral-900">Send failed</p>
            <p className="text-xs text-neutral-500 mt-1">
              {txError?.message?.includes('rejected') ? 'Transaction cancelled.' : 'The transaction failed. No funds left your wallet.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setStep('form')}>Try again</Button>
            <Button variant="tertiary" size="md" className="flex-1" onClick={handleClose}>Cancel</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
