import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { springs } from '../../hooks/useMotion'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  sheet?: boolean // mobile bottom sheet
}

export function Modal({ open, onClose, title, children, size = 'md', sheet = false }: ModalProps) {
  // Trap escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.div
            className={`relative w-full ${widths[size]} ${sheet ? 'rounded-t-2xl sm:rounded-2xl' : 'rounded-2xl'} bg-white shadow-2xl overflow-hidden mx-4 sm:mx-0`}
            initial={sheet ? { y: '100%' } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={sheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={sheet ? { y: '100%' } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={sheet ? springs.sheet : { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle for sheets */}
            {sheet && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-neutral-200" />
              </div>
            )}
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-600"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            {!title && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-600 z-10"
              >
                <X className="size-4" />
              </button>
            )}
            <div className="px-5 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
