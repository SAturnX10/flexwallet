import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { ArrowUpRight, ArrowDownLeft, RefreshCw, PiggyBank, AlertCircle, ChevronRight } from 'lucide-react'
import { getUsdc } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'
import type { WalletSettings, SavingsGoal, Transaction, PriceMap } from '../../types'
import { AssetIcon } from '../ui/AssetIcon'
import { Sparkline } from '../ui/Sparkline'
import { ProgressBar } from '../ui/ProgressBar'
import { CountUp } from '../ui/CountUp'
import { Skeleton, SkeletonCard, SkeletonRow } from '../ui/Skeleton'
import { formatRelativeTime, goalProgress } from '../../lib/utils'
import { goalsStore, txStore } from '../../lib/store'
import { staggerContainer, staggerItem } from '../../hooks/useMotion'

const ARC_CHAIN_ID = 5042 // Arc Mainnet

interface OverviewProps {
  settings: WalletSettings
  prices: PriceMap
  onViewActivity: () => void
  onViewSavings: () => void
  onViewTransaction: (tx: Transaction) => void
  isDemo: boolean
}

// Generate demo sparkline data
function generateSparklineData(base: number, points = 20): number[] {
  const data: number[] = [base]
  for (let i = 1; i < points; i++) {
    const prev = data[i - 1]
    data.push(Math.max(0, prev + (Math.random() - 0.48) * base * 0.04))
  }
  return data
}

function TxIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    received: <ArrowDownLeft className="size-4 text-emerald-600" />,
    sent: <ArrowUpRight className="size-4 text-neutral-500" />,
    converted: <RefreshCw className="size-4 text-neutral-500" />,
    savings_contribution: <PiggyBank className="size-4 text-neutral-500" />,
    goal_completed: <PiggyBank className="size-4 text-emerald-600" />,
    failed: <AlertCircle className="size-4 text-red-500" />,
    cancelled: <AlertCircle className="size-4 text-neutral-400" />,
  }
  return (
    <div className="size-9 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0">
      {icons[type] ?? <ArrowUpRight className="size-4 text-neutral-400" />}
    </div>
  )
}

export function Overview({ settings, prices, onViewActivity, onViewSavings, onViewTransaction, isDemo }: OverviewProps) {
  const { address } = useAccount()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [txs, setTxs] = useState<Transaction[]>([])
  const [goalsLoading, setGoalsLoading] = useState(true)
  const [txsLoading, setTxsLoading] = useState(true)

  // Real USDC balance from chain
  const usdcFact = getUsdc(ARC_CHAIN_ID)
  const { data: rawBalance, isLoading: balanceLoading } = useReadContract({
    address: usdcFact?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!address && !isDemo },
  })

  const usdcBalance = rawBalance != null
    ? Amount.fromRaw(rawBalance, usdcDecimalsFor(ARC_CHAIN_ID)).toFixed(2)
    : '0.00'

  const totalUsd = parseFloat(usdcBalance) * (prices['USDC']?.usd ?? 1)

  // Demo balances
  const demoBalance = '1,284.50'
  const demoUsd = 1284.50

  const displayBalance = isDemo ? demoBalance : usdcBalance
  const displayUsd = isDemo ? demoUsd : totalUsd

  const [sparkData] = useState(() => generateSparklineData(isDemo ? 1284.50 : 100))

  useEffect(() => {
    if (!address && !isDemo) return
    const walletAddr = isDemo ? 'demo' : address!
    // Both stores are synchronous localStorage reads
    setGoals(goalsStore.get(walletAddr).slice(0, 3))
    setGoalsLoading(false)
    setTxs(txStore.get(walletAddr).slice(0, 5))
    setTxsLoading(false)
  }, [address, isDemo])

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {isDemo && (
        <motion.div variants={staggerItem} className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-4 py-2.5 rounded-xl">
          <AlertCircle className="size-3.5 flex-shrink-0" />
          <span><strong>Preview mode</strong> — showing demo data only. Connect a wallet to see real balances. Demo mode cannot move real funds.</span>
        </motion.div>
      )}

      {/* Balance card */}
      <motion.div variants={staggerItem} className="rounded-2xl border border-neutral-100 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total balance</div>
            {balanceLoading && !isDemo ? (
              <Skeleton className="h-10 w-40" />
            ) : (
              <div className="flex items-baseline gap-2">
                <CountUp
                  value={displayUsd}
                  prefix="$"
                  className="text-4xl font-bold text-neutral-900 tabular-nums display tracking-tight"
                />
                <span className="text-sm text-neutral-400 font-medium">USD</span>
              </div>
            )}
            <div className="text-xs text-neutral-400">
              {isDemo ? 'Demo data' : `${displayBalance} USDC on Arc`}
            </div>
          </div>
          <div className="flex-shrink-0 pt-1">
            <Sparkline data={sparkData} width={140} height={44} />
          </div>
        </div>

        {/* Preferred asset */}
        <div className="pt-2 border-t border-neutral-50">
          <div className="text-xs text-neutral-400 mb-2">Preferred asset</div>
          <div className="flex items-center gap-2">
            <AssetIcon ticker={settings.preferred_asset} size={28} />
            <div>
              <div className="text-sm font-semibold text-neutral-900">{settings.preferred_asset}</div>
              <div className="text-xs text-neutral-400">
                {settings.auto_convert ? 'Auto-conversion on' : 'Auto-conversion off'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Savings goals */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">Your savings</h2>
          <button onClick={onViewSavings} className="text-xs text-neutral-400 hover:text-neutral-700 flex items-center gap-0.5 transition-colors">
            See all <ChevronRight className="size-3" />
          </button>
        </div>

        {goalsLoading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 px-5 py-8 text-center">
            <PiggyBank className="size-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500 mb-3">No savings goals yet.</p>
            <button onClick={onViewSavings} className="text-sm font-semibold text-neutral-900 hover:underline">
              Create your first goal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => {
              const progress = goalProgress(goal.current_amount, goal.target_amount)
              const usdVal = prices[goal.asset]?.usd
                ? (parseFloat(goal.current_amount) * prices[goal.asset].usd).toFixed(2)
                : goal.current_amount
              return (
                <motion.div
                  key={goal.id}
                  whileHover={{ y: -1 }}
                  className="rounded-2xl border border-neutral-100 p-4 cursor-pointer hover:border-neutral-200 transition-all"
                  onClick={onViewSavings}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <AssetIcon ticker={goal.asset} size={28} />
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{goal.name}</div>
                        <div className="text-xs text-neutral-400">{goal.asset}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums text-neutral-900">{progress.toFixed(0)}%</div>
                      <div className="text-xs text-neutral-400">${usdVal} saved</div>
                    </div>
                  </div>
                  <ProgressBar value={progress} color={progress >= 100 ? 'success' : 'neutral'} />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-neutral-400">{goal.current_amount} {goal.asset}</span>
                    <span className="text-xs text-neutral-400">of {goal.target_amount}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Recent activity */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">Recent activity</h2>
          <button onClick={onViewActivity} className="text-xs text-neutral-400 hover:text-neutral-700 flex items-center gap-0.5 transition-colors">
            See all <ChevronRight className="size-3" />
          </button>
        </div>

        {txsLoading ? (
          <div className="divide-y divide-neutral-50">
            {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : txs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 px-5 py-8 text-center">
            <Activity className="size-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {txs.map(tx => (
              <motion.button
                key={tx.id}
                whileHover={{ backgroundColor: '#fafafa' }}
                className="w-full flex items-center gap-3 py-3 px-1 rounded-xl text-left"
                onClick={() => onViewTransaction(tx)}
              >
                <TxIcon type={tx.type} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-neutral-900 capitalize">
                    {tx.type.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-neutral-400 truncate">
                    {formatRelativeTime(tx.created_at)}
                    {tx.status === 'pending' && ' · Pending'}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-semibold tabular-nums ${tx.type === 'received' ? 'text-emerald-700' : 'text-neutral-700'}`}>
                    {tx.type === 'received' ? '+' : ''}{tx.amount} {tx.asset}
                  </div>
                  {tx.usd_value && (
                    <div className="text-xs text-neutral-400">${tx.usd_value}</div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// Import missing Activity icon
function Activity({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}
