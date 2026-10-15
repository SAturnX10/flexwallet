import { motion } from 'framer-motion'
import { LayoutDashboard, PiggyBank, Activity, Settings } from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import type { NavPage } from '../types'
import type { WalletSettings } from '../types'
import { formatAddress } from '../lib/utils'

interface SidebarProps {
  page: NavPage
  setPage: (p: NavPage) => void
  settings: WalletSettings | null
}

const NAV: { id: NavPage; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'savings', label: 'Savings', Icon: PiggyBank },
  { id: 'activity', label: 'Activity', Icon: Activity },
  { id: 'settings', label: 'Settings', Icon: Settings },
]

export function Sidebar({ page, setPage, settings }: SidebarProps) {
  const { address, isConnected } = useAccount()

  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-neutral-100 bg-white min-h-dvh px-3 py-5 flex-shrink-0">
      {/* Wordmark */}
      <div className="px-3 mb-8">
        <span className="font-bold text-sm tracking-[0.12em] uppercase text-neutral-900">
          FLEX WALLET
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 relative">
        {NAV.map(({ id, label, Icon }) => {
          const active = page === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ color: active ? '#0f0f0f' : '#737373' }}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-pill"
                  className="absolute inset-0 bg-neutral-100 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className="size-4 relative z-10 flex-shrink-0" />
              <span className="relative z-10">{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Wallet status */}
      <div className="border-t border-neutral-100 pt-4 mt-4 space-y-3">
        {isConnected && settings ? (
          <div className="px-3 space-y-1">
            <div className="text-xs text-neutral-400 font-medium">
              {settings.username ? `@${settings.username}` : 'No username'}
            </div>
            <div className="text-xs font-mono text-neutral-500">
              {address ? formatAddress(address) : ''}
            </div>
          </div>
        ) : null}
        <ConnectKitButton.Custom>
          {({ isConnected, show, address: addr }) => (
            <button
              onClick={show}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors text-left"
            >
              <div className={`size-6 rounded-lg flex items-center justify-center text-xs font-bold ${isConnected ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                {isConnected && addr ? addr.slice(2, 4).toUpperCase() : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-neutral-700 truncate">
                  {isConnected ? 'Connected' : 'Connect Wallet'}
                </div>
              </div>
            </button>
          )}
        </ConnectKitButton.Custom>
      </div>
    </aside>
  )
}

// Mobile bottom nav
export function BottomNav({ page, setPage }: { page: NavPage; setPage: (p: NavPage) => void }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-100 bg-white/90 backdrop-blur-sm pb-safe">
      <div className="flex items-center justify-around px-2 py-1.5">
        {NAV.map(({ id, label, Icon }) => {
          const active = page === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0"
              style={{ color: active ? '#0f0f0f' : '#9ca3af' }}
            >
              <div className="relative">
                {active && (
                  <motion.span
                    layoutId="bottom-pill"
                    className="absolute -inset-1.5 bg-neutral-100 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon className="size-5 relative z-10" />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
