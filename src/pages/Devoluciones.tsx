import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, RotateCcw } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { UserSession } from '@/App'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Sale { id: string; invoice: string; total: number; subtotal: number; tax: number; paymentMethod: string; status: string; customer?: any; items: any[]; createdAt: string }
interface Devolution { id: string; invoice: string; sale: any; total: number; motivo: string; user?: any; items: any[]; createdAt: string }

export function Devoluciones({ user }: { user: UserSession }) {
  const { addToast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [devolutions, setDevolutions] = useState<Devolution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInvoice, setSearchInvoice] = useState('')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [motivo, setMotivo] = useState('')
  const [processing, setProcessing] = useState(false)
  const [confirmReturn, setConfirmReturn] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [s, d] = await Promise.all([api.sales.list(), api.devolutions.list()])
      setSales((s as Sale[]).filter((x: any) => x.status === 'activa'))
      setDevolutions(d as Devolution[])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const searchSale = () => {
    const found = sales.find(s => s.invoice.toLowerCase() === searchInvoice.trim().toLowerCase())
    if (found) { setSelectedSale(found); setSelectedItems({}) }
    else addToast({ title: 'Venta no encontrada', description: 'Verifica el número de factura', variant: 'warning' })
  }

  const updateReturnQty = (itemId: string, qty: number, maxQty: number) => {
    setSelectedItems({ ...selectedItems, [itemId]: Math.max(0, Math.min(qty, maxQty)) })
  }

  const handleReturn = async () => {
    setConfirmReturn(false)
    if (!selectedSale || !motivo.trim()) return
    const items = Object.entries(selectedItems).filter(([_, qty]) => qty > 0).map(([itemId, quantity]) => {
      const item = selectedSale.items.find((i: any) => i.id === itemId)
      return { productId: item.productId, quantity, price: item.price, motivo }
    })
    if (items.length === 0) { addToast({ title: 'Selecciona al menos un producto', variant: 'warning' }); return }

    setProcessing(true)
    try {
      const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      await api.devolutions.create({ saleId: selectedSale.id, userId: user.id, motivo, items, total })
      setSelectedSale(null); setSelectedItems({}); setMotivo(''); setSearchInvoice('')
      loadData()
      addToast({ title: 'Devolución procesada', description: `Se devolvieron ${items.length} producto(s)`, variant: 'success' })
    } catch (err: any) { addToast({ title: 'Error al procesar devolución', description: err.message, variant: 'error' }) } finally { setProcessing(false) }
  }

  const filteredDevolutions = devolutions.filter(d => {
    const matchDateFrom = !dateFrom || new Date(d.createdAt) >= new Date(dateFrom)
    const matchDateTo = !dateTo || new Date(d.createdAt) <= new Date(dateTo + 'T23:59:59')
    return matchDateFrom && matchDateTo
  })

  const selectedCount = Object.values(selectedItems).filter(q => q > 0).length
  const returnTotal = Object.entries(selectedItems)
    .filter(([, qty]) => qty > 0)
    .reduce((sum, [itemId, qty]) => {
      const item = selectedSale?.items.find((i: any) => i.id === itemId)
      return sum + (item ? item.price * qty : 0)
    }, 0)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader title="Devoluciones" description="Gestiona devoluciones de productos" />

      <Card>
        <CardHeader><CardTitle className="text-lg">Buscar Venta</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input placeholder="Número de factura (ej: F-000001)" value={searchInvoice} onChange={e => setSearchInvoice(e.target.value)} className="flex-1" />
            <Button onClick={searchSale} className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"><Search className="w-4 h-4 mr-2" /> Buscar</Button>
          </div>
        </CardContent>
      </Card>

      {selectedSale && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Venta {selectedSale.invoice} - {selectedSale.customer?.name || 'General'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-3">Producto</th>
                  <th className="text-right py-2 px-3">Comprado</th>
                  <th className="text-right py-2 px-3">Precio</th>
                  <th className="text-center py-2 px-3">Devolver</th>
                  <th className="text-right py-2 px-3">Subtotal</th>
                </tr></thead>
                <tbody>
                  {selectedSale.items.map((item: any) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3 px-3">{item.product?.name}</td>
                      <td className="text-right py-3 px-3">{item.quantity}</td>
                      <td className="text-right py-3 px-3">{formatCurrency(item.price)}</td>
                      <td className="text-center py-3 px-3">
                        <input type="number" min="0" max={item.quantity} value={selectedItems[item.id] || 0}
                          onChange={e => updateReturnQty(item.id, e.target.value === '' ? 0 : parseInt(e.target.value) || 0, item.quantity)}
                          className="w-16 h-8 text-center border rounded" />
                      </td>
                      <td className="text-right py-3 px-3 font-medium">{formatCurrency((selectedItems[item.id] || 0) * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1"><label className="text-sm font-medium text-foreground">Motivo</label>
                <select value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1">
                  <option value="">Seleccionar motivo...</option>
                  <option value="devolución">Devolución</option>
                  <option value="cambio_talla">Cambio de talla</option>
                  <option value="cambio_color">Cambio de color</option>
                  <option value="defectuoso">Producto defectuoso</option>
                </select>
              </div>
              <Button onClick={() => setConfirmReturn(true)} disabled={processing || !motivo.trim()} className="bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30">
                <RotateCcw className="w-4 h-4 mr-2" /> {processing ? 'Procesando...' : 'Procesar Devolución'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-3">
          Historial de Devoluciones
          <div className="flex gap-2 ml-auto">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40 h-8 text-xs" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40 h-8 text-xs" />
          </div>
        </CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4">Devolución</th>
              <th className="text-left py-3 px-4">Venta</th>
              <th className="text-left py-3 px-4">Fecha</th>
              <th className="text-left py-3 px-4">Motivo</th>
              <th className="text-right py-3 px-4">Total</th>
            </tr></thead>
            <tbody>
              {filteredDevolutions.map(d => (
                <tr key={d.id} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4 font-mono font-medium">{d.invoice}</td>
                  <td className="py-3 px-4">{d.sale?.invoice || 'N/A'}</td>
                  <td className="py-3 px-4">{formatDate(d.createdAt)}</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 bg-amber-300/15 text-amber-200 rounded-full text-xs border border-amber-300/30">{d.motivo}</span></td>
                  <td className="py-3 px-4 text-right font-semibold text-red-300">-{formatCurrency(d.total)}</td>
                </tr>
              ))}
              {filteredDevolutions.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No hay devoluciones</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmReturn}
        onOpenChange={setConfirmReturn}
        title="Procesar devolución"
        description={
          selectedCount > 0
            ? `Se devolverán ${selectedCount} producto(s) por un total de ${formatCurrency(returnTotal)}. Motivo: ${motivo}.`
            : 'Selecciona al menos un producto con cantidad mayor a 0.'
        }
        confirmText="Sí, procesar"
        confirmDisabled={selectedCount === 0}
        loading={processing}
        onConfirm={handleReturn}
      />
    </div>
  )
}
