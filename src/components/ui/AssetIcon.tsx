// Monochrome asset icon component
import { cn } from '../../lib/utils'

interface AssetIconProps {
  ticker: string
  size?: number
  className?: string
}

const TICKER_LABELS: Record<string, string> = {
  USDC: 'UC', EURC: 'EC', USYC: 'UY', cirBTC: 'BT',
  AUDF: 'AU', BRLA: 'BR', JPYC: 'JP', KRW1: 'KR',
  QCAD: 'CA', MXNB: 'MX', PHPC: 'PH', ZARU: 'ZA',
}

const TICKER_BG: Record<string, string> = {
  USDC: 'bg-neutral-900', EURC: 'bg-neutral-800', USYC: 'bg-neutral-700',
  cirBTC: 'bg-neutral-600', AUDF: 'bg-neutral-500', BRLA: 'bg-neutral-500',
  JPYC: 'bg-neutral-400', KRW1: 'bg-neutral-400', QCAD: 'bg-neutral-300',
  MXNB: 'bg-neutral-300', PHPC: 'bg-neutral-300', ZARU: 'bg-neutral-200',
}

export function AssetIcon({ ticker, size = 36, className }: AssetIconProps) {
  const label = TICKER_LABELS[ticker] ?? ticker.slice(0, 2).toUpperCase()
  const bg = TICKER_BG[ticker] ?? 'bg-neutral-400'
  const textColor = ['QCAD','MXNB','PHPC','ZARU'].includes(ticker) ? 'text-neutral-700' : 'text-white'

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center flex-shrink-0 font-bold',
        bg, textColor, className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {label}
    </div>
  )
}
