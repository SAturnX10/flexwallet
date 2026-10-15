import { useState, useEffect } from 'react'
import { Loader2, Check, X } from 'lucide-react'
import type { WalletSettings } from '../types'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { usernameApi } from '../lib/api'
import { usernameCache } from '../lib/store'
import { isValidUsername } from '../lib/utils'
import { toast } from 'sonner'

interface UsernameModalProps {
  open: boolean
  onClose: () => void
  settings: WalletSettings
  onClaimed: (username: string) => unknown
}

export function UsernameModal({ open, onClose, settings, onClaimed }: UsernameModalProps) {
  const [input, setInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [reason, setReason] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!input || input.length < 3) { setAvailable(null); setReason(''); return }
    const name = input.toLowerCase()
    if (!isValidUsername(name)) {
      setAvailable(false)
      setReason('3-20 characters, lowercase letters, numbers and underscores only')
      return
    }
    setChecking(true)
    const doCheck = async () => {
      try {
        const res = await usernameApi.check(name)
        setAvailable(res.available)
        setReason(res.reason === 'taken' ? 'Already taken' : res.reason === 'reserved' ? 'Reserved name' : res.reason === 'invalid_format' ? 'Invalid format' : '')
      } finally {
        setChecking(false)
      }
    }
    const t = setTimeout(() => { void doCheck() }, 400)
    return () => clearTimeout(t)
  }, [input])

  const handleClaim = async () => {
    if (!available || !settings.address) return
    setClaiming(true)
    try {
      const res = await usernameApi.claim(settings.address, input.toLowerCase())
      if (res.ok && res.username) {
        // Persist locally so it survives server cold starts
        usernameCache.set(settings.address, res.username)
        onClaimed(res.username)
        setConfirmed(true)
        toast.success(`@${res.username} claimed`)
      } else {
        toast.error(res.error ?? 'Could not claim username')
      }
    } finally {
      setClaiming(false)
    }
  }

  const handleClose = () => {
    setInput('')
    setAvailable(null)
    setReason('')
    setConfirmed(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Claim username" size="sm">
      {confirmed ? (
        <div className="py-4 text-center space-y-4">
          <div className="size-12 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto">
            <Check className="size-6" />
          </div>
          <div>
            <p className="text-base font-semibold text-neutral-900">@{settings.username} is yours</p>
            <p className="text-xs text-neutral-400 mt-1">Others can now send to you by username or address.</p>
          </div>
          <Button variant="primary" size="md" className="w-full" onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Choose a unique username (3-20 characters). Others can send funds to @yourname, which resolves to this wallet.
          </p>

          {settings.username && (
            <div className="text-xs text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
              You already have @{settings.username}. Changing it releases your current name after a 7-day hold. Funds sent to a released name won't arrive.
            </div>
          )}

          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400 font-medium pointer-events-none">@</span>
              <input
                className="w-full pl-7 pr-10 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                placeholder="yourname"
                value={input}
                onChange={e => setInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={20}
                autoComplete="off"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && <Loader2 className="size-4 animate-spin text-neutral-400" />}
                {!checking && available === true && <Check className="size-4 text-emerald-600" />}
                {!checking && available === false && <X className="size-4 text-red-500" />}
              </div>
            </div>
            {reason && <p className={`text-xs mt-1 ${available === false ? 'text-red-500' : 'text-neutral-400'}`}>{reason}</p>}
            {available === true && <p className="text-xs text-emerald-600 mt-1">Available!</p>}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={handleClose}>Cancel</Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              disabled={!available}
              loading={claiming}
              onClick={() => { void handleClaim() }}
            >
              Claim @{input || 'username'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
