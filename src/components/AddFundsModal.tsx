import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useAccount } from 'wagmi'
import type { WalletSettings } from '../types'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { toast } from 'sonner'

interface AddFundsModalProps {
  open: boolean
  onClose: () => void
  settings: WalletSettings
  onClaimUsername: () => void
}

export function AddFundsModal({ open, onClose, settings, onClaimUsername }: AddFundsModalProps) {
  const { address } = useAccount()
  const [copiedAddr, setCopiedAddr] = useState(false)
  const [copiedUser, setCopiedUser] = useState(false)

  const copy = (text: string, which: 'addr' | 'user') => {
    void navigator.clipboard.writeText(text)
    if (which === 'addr') { setCopiedAddr(true); setTimeout(() => setCopiedAddr(false), 2000) }
    else { setCopiedUser(true); setTimeout(() => setCopiedUser(false), 2000) }
    toast.success('Copied')
  }

  return (
    <Modal open={open} onClose={onClose} title="Add funds" size="md">
      <div className="space-y-5">
        <p className="text-sm text-neutral-600">
          Send supported assets to your wallet address or username. Assets sent on Arc Testnet arrive within seconds.
        </p>

        {/* Address */}
        <div>
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Wallet address</div>
          <div className="flex items-center gap-2 bg-neutral-50 rounded-xl border border-neutral-100 px-4 py-3">
            <span className="font-mono text-sm text-neutral-700 flex-1 truncate">{address}</span>
            <button
              onClick={() => address && copy(address, 'addr')}
              className="text-neutral-400 hover:text-neutral-700 transition-colors flex-shrink-0"
            >
              {copiedAddr ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>

        {/* Username */}
        {settings.username ? (
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Username</div>
            <div className="flex items-center gap-2 bg-neutral-50 rounded-xl border border-neutral-100 px-4 py-3">
              <span className="text-sm text-neutral-700 flex-1">@{settings.username}</span>
              <button
                onClick={() => copy(`@${settings.username!}`, 'user')}
                className="text-neutral-400 hover:text-neutral-700 transition-colors flex-shrink-0"
              >
                {copiedUser ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-1">Both your address and username receive to the same wallet.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-200 px-5 py-4 text-center">
            <p className="text-sm text-neutral-600 mb-2">No username yet. Claim one so others can send to <span className="font-medium">@yourname</span>.</p>
            <Button variant="secondary" size="sm" onClick={() => { onClose(); onClaimUsername() }}>
              Claim username
            </Button>
          </div>
        )}

        {/* Supported assets */}
        <div>
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Supported networks</div>
          <div className="text-xs text-neutral-500 bg-neutral-50 rounded-xl px-4 py-3 space-y-1">
            <div>Arc Testnet — USDC, EURC, cirBTC and more</div>
            <div className="text-neutral-400">Other chains require bridging first.</div>
          </div>
        </div>

        <Button variant="primary" size="md" className="w-full" onClick={onClose}>Done</Button>
      </div>
    </Modal>
  )
}
