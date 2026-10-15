import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Pause, Play, Check, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { WalletSettings, SavingsGoal, PriceMap, AssetDef } from '../../types'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { AssetIcon } from '../ui/AssetIcon'
import { ProgressBar } from '../ui/ProgressBar'
import { Skeleton } from '../ui/Skeleton'
import { goalsStore } from '../../lib/store'
import { goalProgress, formatDateTime } from '../../lib/utils'
import { staggerContainer, staggerItem } from '../../hooks/useMotion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

interface SavingsProps {
  settings: WalletSettings
  prices: PriceMap
  assets: AssetDef[]
  isDemo: boolean
}

function GoalForm({
  onSubmit,
  onClose,
  initial,
  assets,
  walletAddress,
}: {
  onSubmit: (goal: SavingsGoal) => void
  onClose: () => void
  initial?: SavingsGoal
  assets: AssetDef[]
  walletAddress: string
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [asset, setAsset] = useState(initial?.asset ?? 'USDC')
  const [targetType, setTargetType] = useState<'value' | 'quantity'>(initial?.target_type ?? 'value')
  const [targetAmount, setTargetAmount] = useState(initial?.target_amount ?? '')
  const [sourceAssets, setSourceAssets] = useState<string[]>(initial?.source_assets ?? ['USDC'])
  const [loading, setLoading] = useState(false)

  const eligibleAssets = assets.filter(a => a.canSaveIn)

  const toggleSource = (ticker: string) => {
    setSourceAssets(prev =>
      prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker],
    )
  }

  const handleSubmit = () => {
    if (!name.trim() || !targetAmount) return
    setLoading(true)
    try {
      if (initial) {
        const updated = { ...initial, name, asset, target_type: targetType, target_amount: targetAmount, source_assets: sourceAssets }
        goalsStore.update(walletAddress, initial.id, { name, asset, target_type: targetType, target_amount: targetAmount, source_assets: sourceAssets })
        onSubmit(updated)
      } else {
        const id = crypto.randomUUID()
        const newGoal: SavingsGoal = { id, wallet_address: walletAddress, name, asset, target_type: targetType, target_amount: targetAmount, current_amount: '0', source_assets: sourceAssets, min_contribution: null, max_contribution: null, daily_cap: null, confirm_each: 0, status: 'active', completed_at: null, created_at: Date.now() / 1000, updated_at: Date.now() / 1000, sort_order: 0 }
        goalsStore.add(walletAddress, newGoal)
        onSubmit(newGoal)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Goal name</label>
        <input
          className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
          placeholder="e.g. Emergency fund"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Save in</label>
        <div className="flex flex-wrap gap-2">
          {eligibleAssets.map(a => (
            <button
              key={a.ticker}
              onClick={() => setAsset(a.ticker)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                asset === a.ticker ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
              }`}
            >
              <AssetIcon ticker={a.ticker} size={16} />
              {a.ticker}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Target type</label>
        <div className="flex gap-2">
          {(['value', 'quantity'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTargetType(t)}
              className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                targetType === t ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600'
              }`}
            >
              {t === 'value' ? 'Market value ($)' : 'Token quantity'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
          Target {targetType === 'value' ? 'value (USD)' : `amount (${asset})`}
        </label>
        <input
          type="number"
          min="0"
          className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 tabular-nums"
          placeholder="0.00"
          value={targetAmount}
          onChange={e => setTargetAmount(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Accept contributions from</label>
        <div className="flex flex-wrap gap-2">
          {['USDC', 'EURC', 'cirBTC'].map(t => (
            <button
              key={t}
              onClick={() => toggleSource(t)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                sourceAssets.includes(t) ? 'border-neutral-900 bg-neutral-50 text-neutral-900 border-2' : 'border-neutral-200 text-neutral-500'
              }`}
            >
              <AssetIcon ticker={t} size={14} />
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          loading={loading}
          disabled={!name.trim() || !targetAmount}
          onClick={handleSubmit}
        >
          {initial ? 'Save changes' : 'Create goal'}
        </Button>
      </div>
    </div>
  )
}

function CompletionModal({
  goal,
  onContinue,
  onChangeAsset,
  onPause,
  onFinish,
  onClose,
}: {
  goal: SavingsGoal
  onContinue: () => void
  onChangeAsset: () => void
  onPause: () => void
  onFinish: () => void
  onClose: () => void
}) {
  useEffect(() => {
    // Monochrome confetti burst
    void confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#1a1a1a', '#555', '#888', '#bbb', '#e0e0e0'],
      scalar: 0.8,
    })
  }, [])

  return (
    <div className="text-center space-y-5">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="size-16 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto"
      >
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Check className="size-8" strokeWidth={3} />
        </motion.div>
      </motion.div>

      <div>
        <h2 className="text-xl font-bold text-neutral-900">You've reached your target.</h2>
        <p className="text-sm text-neutral-500 mt-1">{goal.name} · {goal.target_amount} {goal.asset}</p>
      </div>

      <div className="space-y-2">
        <Button variant="primary" size="md" className="w-full" onClick={onContinue}>
          Continue saving
        </Button>
        <Button variant="secondary" size="md" className="w-full" onClick={onChangeAsset}>
          Change asset
        </Button>
        <Button variant="secondary" size="md" className="w-full" onClick={onPause}>
          Pause savings
        </Button>
        <Button variant="tertiary" size="md" className="w-full text-neutral-400" onClick={onFinish}>
          Finish goal
        </Button>
      </div>
      <button onClick={onClose} className="text-xs text-neutral-300 hover:text-neutral-500 transition-colors">
        Close
      </button>
    </div>
  )
}

export function Savings({ settings, prices, assets, isDemo }: SavingsProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null)
  const [completedGoal, setCompletedGoal] = useState<SavingsGoal | null>(null)
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)

  const walletAddr = isDemo ? 'demo' : settings.address

  useEffect(() => {
    setLoading(true)
    const g = goalsStore.get(walletAddr)
    setGoals(g)
    setLoading(false)
  }, [walletAddr])

  const handleCreate = (goal: SavingsGoal) => {
    setGoals(prev => [goal, ...prev])
    setShowForm(false)
    toast.success('Goal created')
  }

  const handleEdit = (goal: SavingsGoal) => {
    setGoals(prev => prev.map(g => g.id === goal.id ? goal : g))
    setEditGoal(null)
    toast.success('Goal updated')
  }

  const handleStatus = (goal: SavingsGoal, status: 'active' | 'paused' | 'completed') => {
    // oxlint-disable-next-line react/purity -- event handler, not render
    const now = Date.now() / 1000
    const updated = { status, completed_at: status === 'completed' ? now : goal.completed_at }
    goalsStore.update(walletAddr, goal.id, updated)
    if (status === 'completed') setCompletedGoal(goal)
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, ...updated } : g))
    toast.success(status === 'active' ? 'Goal resumed' : status === 'paused' ? 'Goal paused' : 'Goal completed')
  }

  const handleDelete = (id: string) => {
    goalsStore.remove(walletAddr, id)
    setGoals(prev => prev.filter(g => g.id !== id))
    toast.success('Goal removed')
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {isDemo && (
        <motion.div variants={staggerItem} className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-4 py-2.5 rounded-xl">
          <AlertCircle className="size-3.5" />
          Preview mode — demo data only. Cannot move real funds.
        </motion.div>
      )}

      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Savings goals</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Each goal saves independently. Goals never share funds.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="size-3.5" /> New goal
        </Button>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : goals.length === 0 ? (
        <motion.div variants={staggerItem} className="rounded-2xl border border-dashed border-neutral-200 px-6 py-12 text-center">
          <div className="text-neutral-300 text-4xl mb-3">○</div>
          <p className="text-sm font-medium text-neutral-600 mb-1">No goals yet</p>
          <p className="text-xs text-neutral-400 mb-4">Create a goal to start saving toward a target.</p>
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-3.5" /> Create goal
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {goals.map((goal) => {
              const progress = goalProgress(goal.current_amount, goal.target_amount)
              const isExpanded = expandedGoal === goal.id
              const price = prices[goal.asset]?.usd
              const currentUsd = price ? (parseFloat(goal.current_amount) * price).toFixed(2) : null
              const targetUsd = price && goal.target_type === 'quantity'
                ? (parseFloat(goal.target_amount) * price).toFixed(2)
                : null

              return (
                <motion.div
                  key={goal.id}
                  variants={staggerItem}
                  layout
                  className={`rounded-2xl border ${goal.status === 'completed' ? 'border-emerald-100 bg-emerald-50/30' : 'border-neutral-100'} overflow-hidden`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <AssetIcon ticker={goal.asset} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-neutral-900">{goal.name}</span>
                          {goal.status === 'paused' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">Paused</span>
                          )}
                          {goal.status === 'completed' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Completed</span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-400">{goal.asset} · {goal.target_type === 'value' ? 'Market value' : 'Token quantity'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold tabular-nums text-neutral-900">{progress.toFixed(0)}%</div>
                        {currentUsd && <div className="text-xs text-neutral-400">${currentUsd}</div>}
                      </div>
                    </div>

                    <ProgressBar
                      value={progress}
                      color={progress >= 100 ? 'success' : 'neutral'}
                      height={5}
                    />

                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-neutral-500 tabular-nums">{goal.current_amount} {goal.asset}</span>
                      <span className="text-xs text-neutral-500 tabular-nums">
                        of {goal.target_amount} {goal.asset}
                        {targetUsd && ` (~$${targetUsd})`}
                      </span>
                    </div>

                    {goal.target_type === 'value' && price && (
                      <div className="text-xs text-neutral-400 mt-1">
                        Price source: demo only
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="border-t border-neutral-100 px-5 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                        onClick={() => setEditGoal(goal)}
                        title="Edit"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      {goal.status === 'active' ? (
                        <button
                          className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                          onClick={() => handleStatus(goal, 'paused')}
                          title="Pause"
                        >
                          <Pause className="size-3.5" />
                        </button>
                      ) : goal.status === 'paused' ? (
                        <button
                          className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                          onClick={() => handleStatus(goal, 'active')}
                          title="Resume"
                        >
                          <Play className="size-3.5" />
                        </button>
                      ) : null}
                      <button
                        className="p-2 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                        onClick={() => handleDelete(goal.id)}
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <button
                      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                      onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                    >
                      Details {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-neutral-100 px-5 py-4 space-y-2"
                      >
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div><span className="text-neutral-400">Status:</span> <span className="font-medium text-neutral-700 capitalize">{goal.status}</span></div>
                          <div><span className="text-neutral-400">Created:</span> <span className="font-medium text-neutral-700">{formatDateTime(goal.created_at)}</span></div>
                          {goal.completed_at && <div><span className="text-neutral-400">Completed:</span> <span className="font-medium text-emerald-700">{formatDateTime(goal.completed_at)}</span></div>}
                          <div><span className="text-neutral-400">Sources:</span> <span className="font-medium text-neutral-700">{goal.source_assets.join(', ') || 'Any'}</span></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* New / Edit goal modal */}
      <Modal open={showForm || !!editGoal} onClose={() => { setShowForm(false); setEditGoal(null) }} title={editGoal ? 'Edit goal' : 'New savings goal'}>
        <GoalForm
          key={editGoal?.id ?? 'new'}
          onSubmit={editGoal ? handleEdit : handleCreate}
          onClose={() => { setShowForm(false); setEditGoal(null) }}
          initial={editGoal ?? undefined}
          assets={assets}
          walletAddress={settings.address}
        />
      </Modal>

      {/* Completion modal */}
      <Modal open={!!completedGoal} onClose={() => setCompletedGoal(null)}>
        {completedGoal && (
          <CompletionModal
            goal={completedGoal}
            onContinue={() => {
              setCompletedGoal(null)
              setShowForm(true)
            }}
            onChangeAsset={() => {
              setCompletedGoal(null)
              setEditGoal(completedGoal)
            }}
            onPause={() => {
              handleStatus(completedGoal, 'paused')
              setCompletedGoal(null)
            }}
            onFinish={() => {
              setCompletedGoal(null)
              toast.success('Goal finished')
            }}
            onClose={() => setCompletedGoal(null)}
          />
        )}
      </Modal>
    </motion.div>
  )
}
