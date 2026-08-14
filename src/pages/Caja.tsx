import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { UserSession } from '@/App'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PageHeader } from '@/components/ui/page-header'

interface CashRegister { id: string; initialAmount: number; expectedAmount?: number; realAmount?: number; totalSales: number; totalReturns: number; status: string; user?: any; movements: any[]; openDate: string; closeDate?: string }

export function Caja({ user }: { user: UserSession }) {
  const { addToast } = useToast()
  const [current, setCurrent] = useState<CashRegister | null>(null)
  const [history, setHistory] = useState<CashRegister[]>([])
  const [loading, setLoading] = useState(true)
  const [openAmount, setOpenAmount] = useState('')
  const [closeAmount, setCloseAmount] = useState('')
  const [movementModal, setMovementModal] = useState(false)
  const [movType, setMovType] = useState<'entrada' | 'salida'>('salida')
  const [movAmount, setMovAmount] = useState('')
  const [movReason, setMovReason] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [c, h] = await Promise.all([api.cashRegister.getCurrent(), api.cashRegister.getHistory()])
      setCurrent(c); setHistory(h as CashRegister[])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleOpen = async () => {
    const amount = parseFloat(openAmount)
    if (isNaN(amount) || amount < 0) return
    try {
      await api.cashRegister.open({ initialAmount: amount })
      setOpenAmount(''); loadData()
      addToast({ title: 'Caja abierta', description: `Monto inicial: ${formatCurrency(amount)}`, variant: 'success' })
    } catch (err: any) { addToast({ title: 'Error', description: err.message, variant: 'error' }) }
  }

  const handleClose = async () => {
    const amount = parseFloat(closeAmount)
    if (isNaN(amount)) return
    try {
      await api.cashRegister.close({ realAmount: amount })
      setCloseAmount(''); loadData()
      addToast({ title: 'Caja cerrada', variant: 'success' })
    } catch (err: any) { addToast({ title: 'Error', description: err.message, variant: 'error' }) }
  }

  const handleMovement = async () => {
    const amount = parseFloat(movAmount)
    if (isNaN(amount) || amount <= 0 || !movReason.trim()) return
    try {
      await api.cashRegister.movement({ type: movType, amount, reason: movReason })
      setMovAmount(''); setMovReason(''); setMovementModal(false); loadData()
      addToast({ title: 'Movimiento registrado', variant: 'success' })
    } catch (err: any) { addToast({ title: 'Error', description: err.message, variant: 'error' }) }
  }

  if (loading) return <LoadingSpinner />

  const movementsTotal = current?.movements?.reduce((s, m) => m.type === 'entrada' ? s + m.amount : s - m.amount, 0) || 0

  return (
    <div className="space-y-6">
      <PageHeader title="Caja" description="Gestión del fondo de caja" />

      {!current ? (
        <Card>
          <CardHeader><CardTitle>Abrir Caja</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className="text-sm font-medium text-foreground">Monto Inicial ($)</label><Input type="number" value={openAmount} onChange={e => setOpenAmount(e.target.value)} placeholder="0.00" min="0" /></div>
            <Button onClick={handleOpen} className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-400/30">Abrir Caja</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Monto Inicial</p><p className="text-2xl font-bold text-foreground">{formatCurrency(current.initialAmount)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Ventas</p><p className="text-2xl font-bold text-emerald-300">{formatCurrency(current.totalSales)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Devoluciones</p><p className="text-2xl font-bold text-red-300">{formatCurrency(current.totalReturns)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Esperado</p><p className="text-2xl font-bold text-primary">{formatCurrency(current.initialAmount + current.totalSales - current.totalReturns + movementsTotal)}</p></CardContent></Card>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setMovementModal(true)} className="bg-sky-400/20 text-sky-300 border border-sky-400/30 hover:bg-sky-400/30"><ArrowUpRight className="w-4 h-4 mr-2" /> Movimiento</Button>
            <div className="flex gap-2 ml-auto">
              <Input type="number" value={closeAmount} onChange={e => setCloseAmount(e.target.value)} placeholder="Monto real..." className="w-48" />
              <Button onClick={handleClose} className="bg-red-400/20 text-red-200 border border-red-400/30 hover:bg-red-400/30">Cerrar Caja</Button>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle>Movimientos de Hoy</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50"><th className="text-left py-3 px-4">Hora</th><th className="text-left py-3 px-4">Tipo</th><th className="text-left py-3 px-4">Motivo</th><th className="text-right py-3 px-4">Monto</th></tr></thead>
                <tbody>
                  {current.movements.map(m => (
                    <tr key={m.id} className="border-b hover:bg-accent/50">
                      <td className="py-3 px-4">{new Date(m.createdAt).toLocaleTimeString('es-DO')}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${m.type === 'entrada' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-200'}`}>{m.type}</span></td>
                      <td className="py-3 px-4">{m.reason}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${m.type === 'entrada' ? 'text-emerald-300' : 'text-red-300'}`}>{m.type === 'entrada' ? '+' : '-'}{formatCurrency(m.amount)}</td>
                    </tr>
                  ))}
                  {current.movements.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Sin movimientos</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader><CardTitle>Historial de Cierres</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50"><th className="text-left py-3 px-4">Apertura</th><th className="text-left py-3 px-4">Cierre</th><th className="text-left py-3 px-4">Estado</th><th className="text-right py-3 px-4">Inicial</th><th className="text-right py-3 px-4">Real</th><th className="text-right py-3 px-4">Diferencia</th></tr></thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4">{formatDate(h.openDate)}</td>
                  <td className="py-3 px-4">{h.closeDate ? formatDate(h.closeDate) : '-'}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${h.status === 'abierta' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{h.status}</span></td>
                  <td className="py-3 px-4 text-right">{formatCurrency(h.initialAmount)}</td>
                  <td className="py-3 px-4 text-right">{h.realAmount != null ? formatCurrency(h.realAmount) : '-'}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${(h.realAmount != null && h.expectedAmount != null && h.realAmount - h.expectedAmount !== 0) ? 'text-red-300' : 'text-emerald-300'}`}>{h.realAmount != null && h.expectedAmount != null ? formatCurrency(h.realAmount - h.expectedAmount) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={movementModal} onOpenChange={setMovementModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Movimiento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => setMovType('entrada')} variant={movType === 'entrada' ? 'default' : 'outline'} className={movType === 'entrada' ? 'bg-emerald-400/25 text-emerald-100 border-emerald-400/40' : ''}>Entrada</Button>
              <Button onClick={() => setMovType('salida')} variant={movType === 'salida' ? 'default' : 'outline'} className={movType === 'salida' ? 'bg-red-400/25 text-red-100 border-red-400/40' : ''}>Salida</Button>
            </div>
            <div><label className="text-sm font-medium">Monto</label><Input type="number" value={movAmount} onChange={e => setMovAmount(e.target.value)} min="0" /></div>
            <div><label className="text-sm font-medium">Motivo</label><Input value={movReason} onChange={e => setMovReason(e.target.value)} placeholder="Ej: Pago proveedor..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementModal(false)}>Cancelar</Button>
            <Button onClick={handleMovement} className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
