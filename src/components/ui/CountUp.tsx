import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  onComplete?: () => void
}

export function CountUp({ value, decimals = 2, prefix = '', suffix = '', className, onComplete }: CountUpProps) {
  const [display, setDisplay] = useState(value)
  const [changed, setChanged] = useState(false)
  const prevValue = useRef(value)
  const rafRef = useRef(0)
  const sweepRef = useRef(false)

  useEffect(() => {
    if (value === prevValue.current) return
    setChanged(true)
    sweepRef.current = true
    const start = prevValue.current
    const end = value
    const startTime = performance.now()
    const duration = 700

    const tick = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const ease = 1 - Math.pow(1 - t, 3)
      const current = start + (end - start) * ease
      setDisplay(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        prevValue.current = end
        setChanged(false)
        onComplete?.()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, onComplete])

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(display)

  return (
    <span className={`relative inline-block ${className ?? ''}`}>
      {prefix}{formatted}{suffix}
      {/* Underline sweep on change */}
      {changed && (
        <span
          className="absolute bottom-0 left-0 h-px bg-neutral-900"
          style={{
            width: '100%',
            transformOrigin: 'left',
            animation: 'sweepUnderline 0.5s ease-out forwards',
          }}
        />
      )}
    </span>
  )
}
