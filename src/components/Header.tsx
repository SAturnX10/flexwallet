import type { NavPage } from '../types'
import type { WalletSettings } from '../types'
import { Button } from './ui/Button'
import { Plus, Send } from 'lucide-react'

const PAGE_TITLES: Record<NavPage, string> = {
  overview: 'Overview',
  savings: 'Savings',
  activity: 'Activity',
  settings: 'Settings',
}

interface HeaderProps {
  page: NavPage
  settings: WalletSettings | null
  isConnected: boolean
  onAddFunds: () => void
  onSend: () => void
}

export function Header({ page, isConnected, onAddFunds, onSend }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-white">
      {/* Mobile wordmark */}
      <div className="md:hidden">
        <span className="font-bold text-sm tracking-[0.12em] uppercase text-neutral-900">
          FLEX WALLET
        </span>
      </div>
      {/* Desktop page title */}
      <div className="hidden md:block">
        <h1 className="text-base font-semibold text-neutral-900">{PAGE_TITLES[page]}</h1>
      </div>

      <div className="flex items-center gap-2">
        {isConnected && (
          <>
            <Button variant="secondary" size="sm" onClick={onSend}>
              <Send className="size-3.5" />
              Send
            </Button>
            <Button variant="primary" size="sm" onClick={onAddFunds}>
              <Plus className="size-3.5" />
              Add funds
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
