import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
  rows?: number
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:200%_100%] rounded-lg',
        className,
      )}
      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-neutral-100 p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-48" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="size-9 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}
