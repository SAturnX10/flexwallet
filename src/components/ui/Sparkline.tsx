import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
  className?: string
}

export function Sparkline({ data, color = '#171717', height = 40, width = 160, className }: SparklineProps) {
  const [progress, setProgress] = useState(0)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    setProgress(0)
    const timeout = setTimeout(() => setProgress(1), 50)
    return () => clearTimeout(timeout)
  }, [data.join(',')])

  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 4

  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + ((max - v) / range) * (height - pad * 2),
    value: v,
  }))

  const linePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(2)} ${height} L ${pts[0].x.toFixed(2)} ${height} Z`

  const pathLength = pts.reduce((acc, p, i) => {
    if (i === 0) return 0
    const prev = pts[i - 1]
    return acc + Math.hypot(p.x - prev.x, p.y - prev.y)
  }, 0)

  const lastPt = pts[pts.length - 1]
  const hoverPt = hoverIndex != null ? pts[hoverIndex] : null

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * width
    const closest = pts.reduce((best, p, i) => {
      return Math.abs(p.x - x) < Math.abs(pts[best].x - x) ? i : best
    }, 0)
    setHoverIndex(closest)
  }

  return (
    <div className={`relative select-none ${className ?? ''}`} style={{ width, height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Area fill */}
        <path d={areaPath} fill={color} opacity={0.06} />
        {/* Animated line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: progress, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ pathLength: pathLength > 0 ? undefined : 1 }}
        />
        {/* Latest point pulse */}
        {hoverIndex == null && (
          <>
            <circle cx={lastPt.x} cy={lastPt.y} r={3} fill={color} />
            <motion.circle
              cx={lastPt.x} cy={lastPt.y} r={6}
              fill="none" stroke={color} strokeWidth={1}
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            />
          </>
        )}
        {/* Scrub indicator */}
        {hoverPt && (
          <>
            <line x1={hoverPt.x} y1={pad} x2={hoverPt.x} y2={height - pad}
              stroke={color} strokeWidth={1} strokeDasharray="3 2" opacity={0.3} />
            <circle cx={hoverPt.x} cy={hoverPt.y} r={4} fill={color} />
          </>
        )}
      </svg>
      {/* Tooltip */}
      {hoverPt && hoverIndex != null && (
        <div
          className="absolute pointer-events-none z-10 bg-neutral-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap"
          style={{
            left: Math.min(hoverPt.x, width - 70),
            top: hoverPt.y - 32,
            transform: 'translateX(-50%)',
          }}
        >
          {hoverPt.value.toFixed(2)}
        </div>
      )}
    </div>
  )
}
