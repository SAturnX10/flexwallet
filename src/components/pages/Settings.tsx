import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Copy, Check, AlertTriangle } from 'lucide-react'
import { useDisconnect } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import type { WalletSettings, AssetDef } from '../../types'
import { Button } from '../ui/Button'
import { AssetIcon } from '../ui/AssetIcon'
import { formatAddress } from '../../lib/utils'
import { toast } from 'sonner'
import { staggerContainer, staggerItem } from '../../hooks/useMotion'

interface SettingsProps {
  settings: WalletSettings
  onUpdate: (updates: Partial<WalletSettings>) => Promise<void>
  onClaimUsername: () => void
  assets: AssetDef[]
}

function SettingsGroup({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-neutral-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        {title}
        {open ? <ChevronDown className="size-4 text-neutral-400" /> : <ChevronRight className="size-4 text-neutral-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-neutral-100 px-5 py-4 space-y-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Toggle({ value, onChange, label, description }: { value: boolean; onChange: (v: boolean) => unknown; label: string; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="text-sm font-medium text-neutral-700">{label}</div>
        {description && <div className="text-xs text-neutral-400 mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 mt-0.5 ${value ? 'bg-neutral-900' : 'bg-neutral-200'}`}
        role="switch"
        aria-checked={value}
      >
        <motion.span
          className="inline-block size-4 rounded-full bg-white shadow-sm"
          animate={{ x: value ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      </button>
    </div>
  )
}

function SelectInput({ value, options, onChange, label }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => unknown
  label: string
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 bg-white"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function Settings({ settings, onUpdate, onClaimUsername, assets }: SettingsProps) {
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard')
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-3"
    >
      {/* General */}
      <motion.div variants={staggerItem}>
        <SettingsGroup title="General" defaultOpen>
          <SelectInput
            label="Display currency"
            value={settings.preferred_currency}
            options={['USD','EUR','GBP','AUD','CAD','JPY','SGD','HKD'].map(c => ({ value: c, label: c }))}
            onChange={v => { void onUpdate({ preferred_currency: v }) }}
          />
          <Toggle
            value={settings.reduce_motion}
            onChange={v => { void onUpdate({ reduce_motion: v }) }}
            label="Reduce motion"
            description="Minimizes animations app-wide. Also follows your system setting."
          />
        </SettingsGroup>
      </motion.div>

      {/* Wallet */}
      <motion.div variants={staggerItem}>
        <SettingsGroup title="Wallet" defaultOpen>
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Address</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-neutral-700 flex-1 truncate">{formatAddress(settings.address)}</span>
              <button onClick={() => copy(settings.address)} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Username</div>
            {settings.username ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-700 font-medium">@{settings.username}</span>
                <button onClick={onClaimUsername} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">Change</button>
              </div>
            ) : (
              <button
                onClick={onClaimUsername}
                className="text-sm text-neutral-900 font-medium hover:underline"
              >
                Claim a username →
              </button>
            )}
            {settings.username_claimed_at && (
              <p className="text-xs text-neutral-400 mt-1">
                Changing releases your current name after a 7-day hold. Funds sent to a released name won't arrive.
              </p>
            )}
          </div>

          <ConnectKitButton.Custom>
            {({ isConnected, show }) => (
              isConnected ? (
                <Button variant="secondary" size="sm" onClick={() => { disconnect(); toast('Wallet disconnected') }}>
                  Disconnect wallet
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={show}>Connect wallet</Button>
              )
            )}
          </ConnectKitButton.Custom>
        </SettingsGroup>
      </motion.div>

      {/* Assets */}
      <motion.div variants={staggerItem}>
        <SettingsGroup title="Assets">
          {/* Preferred asset — always visible */}
          {assets.length > 0 && (
            <div>
              <SelectInput
                label="Preferred asset"
                value={settings.preferred_asset}
                options={assets.filter(a => a.canReceive).map(a => ({
                  value: a.ticker,
                  label: `${a.ticker} — ${a.name}`,
                }))}
                onChange={v => { void onUpdate({ preferred_asset: v }) }}
              />
              <p className="text-xs text-neutral-400 mt-1.5">
                This is the asset you want to hold. Auto-conversion targets this asset when enabled.
              </p>
            </div>
          )}

          <p className="text-xs text-neutral-500 pt-1">
            Toggle which assets appear in your wallet. Receiving and sending capabilities are determined by each asset's support status.
          </p>

          {assets.length === 0 && (
            <p className="text-xs text-neutral-400 italic">Loading assets…</p>
          )}

          <div className="space-y-2">
            {assets.map(asset => {
              const enabled = settings.enabled_assets.includes(asset.ticker)
              return (
                <div key={asset.ticker} className="flex items-center gap-3 py-1">
                  <AssetIcon ticker={asset.ticker} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-800">{asset.ticker}</div>
                    <div className="text-xs text-neutral-400">{asset.name} · <span className="capitalize">{asset.status.replace(/-/g, ' ')}</span></div>
                  </div>
                  <button
                    onClick={() => {
                      const next = enabled
                        ? settings.enabled_assets.filter(t => t !== asset.ticker)
                        : [...settings.enabled_assets, asset.ticker]
                      void onUpdate({ enabled_assets: next })
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all flex-shrink-0 ${
                      enabled ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
                    }`}
                  >
                    {enabled ? 'On' : 'Off'}
                  </button>
                </div>
              )
            })}
          </div>
        </SettingsGroup>
      </motion.div>

      {/* Auto-conversion */}
      <motion.div variants={staggerItem}>
        <SettingsGroup title="Automatic conversions">
          <Toggle
            value={settings.auto_convert}
            onChange={v => { void onUpdate({ auto_convert: v }) }}
            label="Enable auto-conversion"
            description="When an eligible asset arrives, convert it to your preferred asset. Off by default. Only runs when a valid route exists; otherwise keeps the original asset."
          />

          {settings.auto_convert && (
            <div className="space-y-3 pt-2 border-t border-neutral-50">
              <SelectInput
                label="Destination asset (overrides preferred asset for conversions)"
                value={settings.preferred_asset}
                options={assets.filter(a => a.canConvert).map(a => ({ value: a.ticker, label: `${a.ticker} — ${a.name}` }))}
                onChange={v => { void onUpdate({ preferred_asset: v }) }}
              />
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Max slippage (%)</label>
                <input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                  value={settings.auto_convert_settings?.max_slippage ?? '0.5'}
                  onChange={e => { void onUpdate({ auto_convert_settings: { ...settings.auto_convert_settings, max_slippage: e.target.value } }) }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Daily limit (USD)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                  value={settings.auto_convert_settings?.daily_limit ?? ''}
                  placeholder="No limit"
                  onChange={e => { void onUpdate({ auto_convert_settings: { ...settings.auto_convert_settings, daily_limit: e.target.value } }) }}
                />
              </div>
              <Toggle
                value={settings.auto_convert_settings?.confirm_each ?? false}
                onChange={v => { void onUpdate({ auto_convert_settings: { ...settings.auto_convert_settings, confirm_each: v } }) }}
                label="Confirm each conversion"
                description="Ask for approval before each swap. Recommended for large amounts."
              />
              <Toggle
                value={settings.auto_convert_settings?.notify ?? true}
                onChange={v => { void onUpdate({ auto_convert_settings: { ...settings.auto_convert_settings, notify: v } }) }}
                label="Notify on conversion"
              />
              <Toggle
                value={settings.auto_convert_settings?.pause_all ?? false}
                onChange={v => { void onUpdate({ auto_convert_settings: { ...settings.auto_convert_settings, pause_all: v } }) }}
                label="Pause all conversions"
                description="Temporarily halts all auto-conversions without changing your rules."
              />
            </div>
          )}
        </SettingsGroup>
      </motion.div>

      {/* Sending */}
      <motion.div variants={staggerItem}>
        <SettingsGroup title="Sending">
          <Toggle
            value={settings.sending_enabled}
            onChange={v => { void onUpdate({ sending_enabled: v }) }}
            label="Allow sending"
            description="Disable to prevent any outbound transfers."
          />
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Per-send limit (USD)</label>
            <input
              type="number"
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              value={settings.per_send_limit}
              onChange={e => { void onUpdate({ per_send_limit: e.target.value }) }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Daily send limit (USD)</label>
            <input
              type="number"
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              value={settings.daily_send_limit}
              onChange={e => { void onUpdate({ daily_send_limit: e.target.value }) }}
            />
          </div>
        </SettingsGroup>
      </motion.div>

      {/* Security */}
      <motion.div variants={staggerItem}>
        <SettingsGroup title="Security">
          <Toggle
            value={settings.emergency_pause}
            onChange={v => {
              void onUpdate({ emergency_pause: v, sending_enabled: v ? false : settings.sending_enabled })
              if (v) toast('Emergency pause enabled. Sending and conversions are blocked.')
              else toast('Emergency pause lifted.')
            }}
            label="Emergency pause"
            description="Immediately blocks all sends and conversions. Use if you suspect unauthorized access."
          />
          {settings.emergency_pause && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2.5">
              <AlertTriangle className="size-3.5 flex-shrink-0" />
              Emergency pause is active. All sending and auto-conversion is blocked.
            </div>
          )}
        </SettingsGroup>
      </motion.div>
    </motion.div>
  )
}
