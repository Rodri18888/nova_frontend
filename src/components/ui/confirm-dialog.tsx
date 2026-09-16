import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  loading?: boolean
  confirmDisabled?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  loading = false,
  confirmDisabled = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="bg-destructive/15 text-red-700 dark:text-red-300 border border-destructive/40 hover:bg-destructive/25"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={loading || confirmDisabled}
            onClick={onConfirm}
            className="bg-success/20 text-emerald-700 dark:text-emerald-300 border border-success/40 hover:bg-success/30"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
