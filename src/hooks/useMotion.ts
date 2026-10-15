// Flex Wallet — motion preferences

import { useState, useEffect } from 'react'

export function useMotionPreference(reduceMotionSetting: boolean) {
  const [systemReduceMotion, setSystemReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setSystemReduceMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setSystemReduceMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return systemReduceMotion || reduceMotionSetting
}

export const springs = {
  snappy: { type: 'spring' as const, stiffness: 420, damping: 32 },
  gentle: { type: 'spring' as const, stiffness: 300, damping: 26 },
  sheet: { type: 'spring' as const, stiffness: 400, damping: 36 },
}

export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.24, ease: [0.25, 0.1, 0.25, 1.0] as [number, number, number, number] },
}

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1.0] as [number, number, number, number] },
}
