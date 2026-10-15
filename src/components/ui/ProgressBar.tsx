import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface ProgressBarProps {
  value: number  // 0-100
  className?: string
  color?: 'neutral' | 'success'
  height?: number
  animated?: boolean
}

export function ProgressBar({ value, className, color = 'neutral', height = 4, animated = true }: ProgressBarProps) {
  const [filled, setFilled] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      // Trigger fill animation on mount
      const t = setTimeout(() => setFilled(true), 100)
      return () => clearTimeout(t)
    }
  }, [])

  const trackColor = 'bg-neutral-100'
  const fillColor = color === 'success' ? 'bg-emerald-600' : 'bg-neutral-900'

  return (
    <div className={cn('w-full rounded-full overflow-hidden', trackColor, className)} style={{ height }}>
      <motion.div
        className={cn('h-full rounded-full relative overflow-hidden', fillColor)}
        initial={{ width: 0 }}
        animate={animated ? { width: `${value}%` } : { width: `${value}%` }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Sweep shimmer after fill */}
        {filled && animated && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 0.6, delay: 0.8, ease: 'easeInOut' }}
          />
        )}
      </motion.div>
    </div>
  )
}
