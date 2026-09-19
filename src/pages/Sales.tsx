import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Eye, Ban, DollarSign, ShoppingCart, Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { Factura } from '@/components/Factura'
import { useToast } from '@/hooks/use-toast'
import type { UserSession } from '@/App'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchBar } from '@/components/ui/search-bar'

interface Sale { id: string; invoice: string; total: number; subtotal: number; tax: number; discount: number; paymentMethod: string; status: string; motivoAnulacion?: string; customer?: any; user?: any; items: any[]; createdAt: string }

export function Sales({ user }: { user: UserSession }) {
  const { addToast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detailSale, setDetailSale] = useState<Sale | null>(null)
  const [anularSale, setAnularSale] = useState<Sale | null>(null)
  const [motivo, setMotivo] = useState('')
  const [showFactura, setShowFactura] = useState<Sale | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [totalMonto, setTotalMonto] = useState(0)
  const [totalActivas, setTotalActivas] = useState(0)
  const [totalAnuladas, setTotalAnuladas] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => loadSales(1, true), 300)
    return () => clearTimeout(t)
  }, [search, dateFrom, dateTo])

  async function loadSales(p: number, replace: boolean) {
    if (replace) setLoading(true)
    try {
      const res = await api.sales.list({ page: p, limit: 25, search, from: dateFrom, to: dateTo })
      const merged = replace ? res.sales : [...sales, ...res.sales]
      setSales(merged)
      setPage(p)
      setTotalCount(res.total)
      setTotalMonto(Number(res.totalMonto))
      setTotalActivas(res.totalActivas)
      setTotalAnuladas(res.totalAnuladas)
      setHasMore(merged.length < res.total)
    } catch (e) { console.error(e) } finally { setLoading(false); setLoadingMore(false) }
  }

  const loadMore = () => {
    setLoadingMore(true)
    loadSales(page + 1, false)
  }

  const handleAnular = async () => {
    if (!anularSale || !motivo.trim()) return
    try {
      await api.sales.anular(anularSale.id, motivo)
      setAnularSale(null); setMotivo('')
      addToast({ title: 'Venta anulada', description: `La venta ${anularSale.invoice} fue anulada`, variant: 'success' })
      loadSales(page, true)
    } catch (err: any) { addToast({ title: 'Error al anular', description: err.message, variant: 'error' }) }
  }


  const handleExport = async () => {
    try {
      await api.export.sales()
    } catch (e: any) {
      console.error('Error al exportar:', e.message)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader title="Historial de Ventas" description="Consulta y gestiona las ventas">
        <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-2" /> Exportar CSV</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Ventas</p><p className="text-2xl font-bold">{formatCurrency(totalMonto)}</p></div><div className="w-10 h-10 bg-success/15 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-success" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Transacciones</p><p className="text-2xl font-bold">{totalActivas}</p></div><div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-primary" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Anuladas</p><p className="text-2xl font-bold text-destructive">{totalAnuladas}</p></div><div className="w-10 h-10 bg-destructive/15 rounded-lg flex items-center justify-center"><Ban className="w-5 h-5 text-destructive" /></div></div></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]"><SearchBar value={search} onChange={setSearch} placeholder="Buscar por factura o cliente..." /></div>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full sm:w-44" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full sm:w-44" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Factura</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Fecha</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Cliente</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Estado</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Pago</th>
              <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-sm">Total</th>
              <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-sm">Acciones</th>
            </tr></thead>
            <tbody>
              {sales.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No hay ventas que coincidan con los filtros</td></tr>
              )}
              {sales.map(sale => (
                <tr key={sale.id} className={`border-b hover:bg-accent/50 ${sale.status === 'anulada' ? 'bg-destructive/15 opacity-70' : ''}`}>
                  <td className="py-3 px-4 font-mono text-sm font-medium">{sale.invoice}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(sale.createdAt)}</td>
                  <td className="py-3 px-4 text-sm">{sale.customer?.name || 'Cliente general'}</td>
                  <td className="py-3 px-4">{sale.status === 'activa' ? <span className="px-2 py-1 bg-success/15 text-success border border-success/30 rounded-full text-xs font-medium">Activa</span> : <span className="px-2 py-1 bg-destructive/15 text-destructive border border-destructive/30 rounded-full text-xs font-medium">Anulada</span>}</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">{sale.paymentMethod}</span></td>
                  <td className="py-3 px-4 text-right font-semibold">{formatCurrency(sale.total)}</td>
                  <td className="py-3 px-4 text-center space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => setDetailSale(sale)}><Eye className="w-4 h-4" /></Button>
                    {sale.status === 'activa' && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => setShowFactura(sale)} className="text-primary"><ReceiptIcon className="w-4 h-4" /></Button>
                        {user.rol === 'admin' && <Button variant="ghost" size="icon" onClick={() => setAnularSale(sale)}><Ban className="w-4 h-4 text-destructive" /></Button>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Cargando...' : `Cargar más (${totalCount - sales.length} restantes)`}
          </Button>
        </div>
      )}

      <Dialog open={!!detailSale} onOpenChange={() => setDetailSale(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalle - {detailSale?.invoice}</DialogTitle></DialogHeader>
          {detailSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Cliente</p><p className="font-medium">{detailSale.customer?.name || 'General'}</p></div>
                <div><p className="text-muted-foreground">Vendedor</p><p className="font-medium">{detailSale.user?.nombre || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">Fecha</p><p className="font-medium">{formatDate(detailSale.createdAt)}</p></div>
                <div><p className="text-muted-foreground">Pago</p><p className="font-medium">{detailSale.paymentMethod}</p></div>
              </div>
              {detailSale.status === 'anulada' && <div className="bg-destructive/15 border border-destructive/40 rounded-lg p-3 text-sm text-destructive"><strong>Motivo de anulación:</strong> {detailSale.motivoAnulacion}</div>}
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2">Producto</th><th className="text-right py-2">Cant.</th><th className="text-right py-2">Precio</th><th className="text-right py-2">Subtotal</th></tr></thead>
                <tbody>{detailSale.items.map((item: any) => (<tr key={item.id} className="border-b"><td className="py-2">{item.product?.name}</td><td className="text-right py-2">{item.quantity}</td><td className="text-right py-2">{formatCurrency(item.price)}</td><td className="text-right py-2 font-medium">{formatCurrency(item.subtotal)}</td></tr>))}</tbody>
              </table>
              </div>
              <div className="text-right space-y-1 text-sm border-t pt-3">
                <p>Subtotal: {formatCurrency(detailSale.subtotal)}</p>
                {detailSale.discount > 0 && <p className="text-destructive">Descuento: -{formatCurrency(detailSale.discount)}</p>}
                <p>IVA: {formatCurrency(detailSale.tax)}</p>
                <p className="text-lg font-bold">Total: {formatCurrency(detailSale.total)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!anularSale} onOpenChange={() => setAnularSale(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Anular Venta {anularSale?.invoice}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-warning/15 border border-warning/40 rounded-lg p-3 text-sm text-warning">Se restaurará el stock de todos los productos de esta venta.</div>
            <div><label className="text-sm font-medium text-foreground">Motivo de anulación (obligatorio)</label><Input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: Error en la venta..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnularSale(null)}>Cancelar</Button>
            <Button onClick={handleAnular} disabled={!motivo.trim()} className="bg-destructive/30 text-destructive border border-destructive/50 hover:bg-destructive/40">Anular Venta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {showFactura && <Factura sale={showFactura} user={user} onClose={() => setShowFactura(null)} />}
    </div>
  )
}


function ReceiptIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M10 8h.01"/><path d="M16 12h.01"/><path d="M10 12h.01"/><path d="M13 12h.01"/><path d="M16 16h.01"/><path d="M10 16h.01"/><path d="M13 16h.01"/><path d="M14 12v4h2v-4h-2z"/></svg>
}
