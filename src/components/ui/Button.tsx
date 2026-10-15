import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart'> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className, disabled, onClick, ...props }, ref) => {
    const base = 'relative inline-flex items-center justify-center font-semibold transition-all select-none overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950 rounded-xl',
      secondary: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 rounded-xl',
      tertiary: 'bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg',
      danger: 'bg-red-600 text-white hover:bg-red-700 rounded-xl',
    }

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-sm gap-2',
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        onClick={onClick}
      >
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
          </span>
        )}
        <span className={loading ? 'opacity-0' : ''}>{children}</span>
      </motion.button>
    )
  },
)

Button.displayName = 'Button'
