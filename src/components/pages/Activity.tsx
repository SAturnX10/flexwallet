import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowUpRight, ArrowDownLeft, RefreshCw, PiggyBank, AlertCircle, ExternalLink, ChevronLeft } from 'lucide-react'
import type { WalletSettings, Transaction, TxType } from '../../types'
import { SkeletonRow } from '../ui/Skeleton'
import { txStore } from '../../lib/store'
import { formatRelativeTime, formatDateTime, formatAddress } from '../../lib/utils'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { staggerContainer, staggerItem } from '../../hooks/useMotion'

const ARC_CHAIN_ID = 5042 // Arc Mainnet

interface ActivityProps {
  settings: WalletSettings
  isDemo: boolean
}

const TX_TYPES: { id: TxType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'received', label: 'Received' },
  { id: 'sent', label: 'Sent' },
  { id: 'converted', label: 'Converted' },
  { id: 'savings_contribution', label: 'Savings' },
  { id: 'goal_completed', label: 'Goals' },
  { id: 'failed', label: 'Failed' },
]

function TxTypeIcon({ type }: { type: string }) {
  const map: Record<string, React.ReactNode> = {
    received: <ArrowDownLeft className="size-4" />,
    sent: <ArrowUpRight className="size-4" />,
    converted: <RefreshCw className="size-4" />,
    savings_contribution: <PiggyBank className="size-4" />,
    goal_completed: <PiggyBank className="size-4" />,
    failed: <AlertCircle className="size-4" />,
    cancelled: <AlertCircle className="size-4" />,
  }
  const colors: Record<string, string> = {
    received: 'bg-emerald-50 text-emerald-600',
    sent: 'bg-neutral-100 text-neutral-600',
    converted: 'bg-neutral-100 text-neutral-600',
    savings_contribution: 'bg-neutral-100 text-neutral-600',
    goal_completed: 'bg-emerald-50 text-emerald-600',
    failed: 'bg-red-50 text-red-500',
    cancelled: 'bg-neutral-100 text-neutral-400',
  }
  return (
    <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[type] ?? 'bg-neutral-100 text-neutral-500'}`}>
      {map[type] ?? <ArrowUpRight className="size-4" />}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-red-50 text-red-600',
    cancelled: 'bg-neutral-100 text-neutral-500',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? 'bg-neutral-100 text-neutral-500'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function DetailPanel({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const explorerUrl = tx.tx_hash ? buildTxExplorerUrl(ARC_CHAIN_ID, tx.tx_hash) : null

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.22 }}
      className="absolute inset-0 bg-white z-10 overflow-y-auto"
    >
      <div className="sticky top-0 bg-white border-b border-neutral-100 px-5 py-4 flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>
        <h2 className="text-sm font-semibold text-neutral-900 capitalize">{tx.type.replace(/_/g, ' ')}</h2>
        <StatusBadge status={tx.status} />
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Amount */}
        <div className="text-center py-4 border-b border-neutral-50">
          <div className={`text-3xl font-bold tabular-nums display ${tx.type === 'received' || tx.type === 'goal_completed' ? 'text-emerald-700' : tx.type === 'failed' ? 'text-red-600' : 'text-neutral-900'}`}>
            {tx.type === 'received' ? '+' : tx.type === 'sent' ? '-' : ''}{tx.amount} {tx.asset}
          </div>
          {tx.usd_value && <div className="text-sm text-neutral-400 mt-1">${tx.usd_value} USD{tx.status !== 'confirmed' && ' (estimate)'}</div>}
        </div>

        {/* Details grid */}
        <div className="space-y-3">
          {[
            { label: 'Type', value: tx.type.replace(/_/g, ' ') },
            { label: 'Status', value: <StatusBadge status={tx.status} /> },
            { label: 'Date', value: formatDateTime(tx.created_at) },
            tx.confirmed_at ? { label: 'Confirmed', value: formatDateTime(tx.confirmed_at) } : null,
            tx.recipient ? { label: 'Recipient', value: <span className="font-mono text-xs">{formatAddress(tx.recipient)}</span> } : null,
            tx.recipient_username ? { label: 'Recipient name', value: `@${tx.recipient_username}` } : null,
            tx.recipient_resolved ? { label: 'Resolved address', value: <span className="font-mono text-xs">{formatAddress(tx.recipient_resolved)}</span> } : null,
            tx.sender ? { label: 'Sender', value: <span className="font-mono text-xs">{formatAddress(tx.sender)}</span> } : null,
            tx.sender_username ? { label: 'Sender name', value: `@${tx.sender_username}` } : null,
            tx.received_via ? { label: 'Received via', value: tx.received_via } : null,
            tx.fee ? { label: 'Network fee', value: `${tx.fee} ${tx.fee_asset ?? ''}` } : null,
            tx.error_text ? { label: 'Error', value: <span className="text-red-600">{tx.error_text}</span> } : null,
          ].filter(Boolean).map((row, i) => row && (
            <div key={i} className="flex items-start justify-between gap-4 text-sm">
              <span className="text-neutral-400 flex-shrink-0">{row.label}</span>
              <span className="text-neutral-800 font-medium text-right">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Quote details */}
        {tx.quote_details && (
          <div className="rounded-xl border border-neutral-100 p-4 space-y-2">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Quote (estimate)</div>
            {Object.entries(tx.quote_details).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-neutral-400 capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="font-medium text-neutral-700">{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Explorer link */}
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-xl py-3 transition-colors"
          >
            View on explorer <ExternalLink className="size-3.5" />
          </a>
        )}

        {/* Hash */}
        {tx.tx_hash && (
          <div className="text-center">
            <span className="text-xs font-mono text-neutral-400 break-all">{tx.tx_hash}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function Activity({ settings, isDemo }: ActivityProps) {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TxType | 'all'>('all')
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [offset, setOffset] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const walletAddr = isDemo ? 'demo' : settings.address

  useEffect(() => {
    setLoading(true)
    let all = txStore.get(walletAddr)
    if (typeFilter !== 'all') all = all.filter(t => t.type === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      all = all.filter(t =>
        t.asset.toLowerCase().includes(q) ||
        (t.recipient ?? '').toLowerCase().includes(q) ||
        (t.recipient_username ?? '').toLowerCase().includes(q) ||
        (t.sender ?? '').toLowerCase().includes(q) ||
        (t.tx_hash ?? '').toLowerCase().includes(q),
      )
    }
    setTxs(all.slice(0, offset + 20))
    setTotal(all.length)
    setLoading(false)
  }, [walletAddr, typeFilter, search, offset])

  const loadMore = () => setOffset(o => o + 20)

  return (
    <div ref={containerRef} className="relative space-y-4">
      {/* Search & filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
          <input
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              onClick={() => setSearch('')}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Type filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {TX_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                typeFilter === t.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-4 py-2.5 rounded-xl">
          <AlertCircle className="size-3.5" />
          Preview mode — no real transactions.
        </div>
      )}

      {/* Transaction list */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-0 divide-y divide-neutral-50">
        {loading && txs.length === 0 ? (
          [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
        ) : txs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-neutral-300 text-3xl mb-3">—</div>
            <p className="text-sm text-neutral-500">
              {search || typeFilter !== 'all' ? 'No transactions match your search.' : 'No transactions yet.'}
            </p>
          </div>
        ) : (
          txs.map(tx => (
            <motion.button
              key={tx.id}
              variants={staggerItem}
              whileHover={{ backgroundColor: '#fafafa' }}
              className="w-full flex items-center gap-3 py-3 px-1 rounded-xl text-left group"
              onClick={() => setSelected(tx)}
            >
              <TxTypeIcon type={tx.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-neutral-900 capitalize">{tx.type.replace(/_/g, ' ')}</span>
                  {tx.status === 'pending' && <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Pending</span>}
                  {tx.status === 'failed' && <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Failed</span>}
                </div>
                <div className="text-xs text-neutral-400 truncate mt-0.5">
                  {formatRelativeTime(tx.created_at)}
                  {tx.recipient_username && ` · @${tx.recipient_username}`}
                  {tx.sender_username && ` · from @${tx.sender_username}`}
                  {tx.received_via && ` · via ${tx.received_via}`}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-semibold tabular-nums ${
                  tx.type === 'received' || tx.type === 'goal_completed' ? 'text-emerald-700' :
                  tx.type === 'failed' ? 'text-red-500' : 'text-neutral-700'
                }`}>
                  {tx.type === 'received' ? '+' : tx.type === 'sent' ? '-' : ''}{tx.amount} {tx.asset}
                </div>
                {tx.usd_value && <div className="text-xs text-neutral-400">${tx.usd_value}</div>}
              </div>
            </motion.button>
          ))
        )}
      </motion.div>

      {/* Load more */}
      {txs.length < total && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-3 text-sm text-neutral-500 hover:text-neutral-700 transition-colors border border-neutral-100 rounded-xl"
        >
          {loading ? 'Loading...' : `Load more (${total - txs.length} remaining)`}
        </button>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <DetailPanel tx={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
