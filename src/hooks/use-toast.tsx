import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cn } from '@/lib/utils'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToastVariant = 'default' | 'success' | 'error' | 'warning'

type Toast = {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

let count = 0
function genId() { return `toast-${++count}` }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = genId()
    setToasts(prev => [ { id, ...toast }, ...prev ].slice(0, TOAST_LIMIT))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, TOAST_REMOVE_DELAY)
  }, [])

  const dismissToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

const variantStyles: Record<ToastVariant, { root: string; icon: string }> = {
  default: { root: 'bg-card border-border', icon: '' },
  success: { root: 'bg-success/15 border-success/40', icon: '' },
  error: { root: 'bg-destructive/15 border-destructive/40', icon: '' },
  warning: { root: 'bg-warning/15 border-warning/40', icon: '' },
}

export function Toaster() {
  const { toasts, dismissToast } = useToast()

  return (
    <ToastPrimitives.Provider>
      {toasts.map(toast => {
        const styles = variantStyles[toast.variant || 'default']
        return (
          <ToastPrimitives.Root
            key={toast.id}
            open
            onOpenChange={() => dismissToast(toast.id)}
            className={cn(
              'fixed bottom-4 right-4 z-50 w-96 rounded-xl border shadow-lg p-4 pointer-events-auto',
              styles.root
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {toast.title && (
                  <ToastPrimitives.Title className="text-sm font-semibold text-foreground">
                    {toast.title}
                  </ToastPrimitives.Title>
                )}
                {toast.description && (
                  <ToastPrimitives.Description className="text-sm text-muted-foreground mt-0.5">
                    {toast.description}
                  </ToastPrimitives.Description>
                )}
              </div>
              <ToastPrimitives.Close className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Close</span>
              </ToastPrimitives.Close>
            </div>
          </ToastPrimitives.Root>
        )
      })}
      <ToastPrimitives.Viewport />
    </ToastPrimitives.Provider>
  )
}
