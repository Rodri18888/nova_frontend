import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Warehouse, AlertTriangle, TrendingDown, TrendingUp, Package, History
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchBar } from '@/components/ui/search-bar'

interface InventoryItem {
  id: string
  name: string
  sku: string
  stock: number
  minStock: number
  updatedAt: string
}

interface Movement {
  id: string
  type: string
  quantity: number
  reason: string
  createdAt: string
  product: { name: string; sku: string }
}

interface Adjustment {
  productId: string
  type: 'add' | 'subtract'
  quantity: string
  reason: string
}

export function Inventory({ user }: { user?: any } = {}) {
  const { addToast } = useToast()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showMovements, setShowMovements] = useState(false)
  const [adjustment, setAdjustment] = useState<Adjustment>({
    productId: '',
    type: 'add',
    quantity: '',
    reason: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const data = await api.products.list() as InventoryItem[]
      setInventory(data.map((p: any) => ({
        id: p.id, name: p.name, sku: p.sku, stock: p.stock, minStock: p.minStock || 5, updatedAt: p.updatedAt,
      })))
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  async function loadMovements() {
    try { setMovements(await api.inventory.movements() as Movement[]) } catch (e) { console.error(e) }
  }

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: inventory.reduce((sum, item) => sum + item.stock, 0),
    low: inventory.filter(item => item.stock > 0 && item.stock < item.minStock).length,
    critical: inventory.filter(item => item.stock <= 0).length,
    ok: inventory.filter(item => item.stock >= item.minStock).length,
  }

  function getStatus(item: InventoryItem): 'critical' | 'low' | 'ok' {
    if (item.stock <= 0) return 'critical'
    if (item.stock < item.minStock) return 'low'
    return 'ok'
  }

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(adjustment.quantity)
    const item = inventory.find(i => i.id === adjustment.productId)
    if (!item) return

    try {
      const newStock = adjustment.type === 'add' ? item.stock + qty : Math.max(0, item.stock - qty)
      await api.products.updateStock(adjustment.productId, newStock)
      await api.inventory.createMovement({
        productId: adjustment.productId,
        type: adjustment.type === 'add' ? 'entrada' : 'salida',
        quantity: qty,
        reason: adjustment.reason,
      })
      setInventory(inventory.map(i => i.id === adjustment.productId ? { ...i, stock: newStock } : i))
      setIsDialogOpen(false)
      setAdjustment({ productId: '', type: 'add', quantity: '', reason: '' })
      addToast({ title: 'Inventario ajustado', description: `${item.name} ahora tiene ${newStock} unidades`, variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error al ajustar inventario', description: err.message, variant: 'error' })
    }
  }

  const handleOpenMovements = () => {
    setShowMovements(true)
    loadMovements()
  }

  if (loading) return <LoadingSpinner message="Cargando inventario..." />

  return (
    <div className="space-y-6">
      <PageHeader title="Inventario" description="Control de stock y existencias">
        <Button variant="outline" onClick={handleOpenMovements}><History className="w-4 h-4 mr-2" /> Movimientos</Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"><Package className="w-4 h-4 mr-2" /> Ajustar Inventario</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Ajustar Inventario</DialogTitle></DialogHeader>
              <form onSubmit={handleAdjustment} className="space-y-4">
                <div><label className="text-sm font-medium text-foreground">Producto</label>
                  <select value={adjustment.productId} onChange={(e) => setAdjustment({ ...adjustment, productId: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                    <option value="">Seleccionar producto</option>
                    {inventory.map(item => (<option key={item.id} value={item.id}>{item.name} (Stock: {item.stock})</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-foreground">Tipo</label>
                    <select value={adjustment.type} onChange={(e) => setAdjustment({ ...adjustment, type: e.target.value as 'add' | 'subtract' })} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="add">Agregar Stock</option>
                      <option value="subtract">Reducir Stock</option>
                    </select>
                  </div>
                  <div><label className="text-sm font-medium text-foreground">Cantidad</label>
                    <Input type="number" value={adjustment.quantity} onChange={(e) => setAdjustment({ ...adjustment, quantity: e.target.value })} placeholder="0" min="1" required />
                  </div>
                </div>
                <div><label className="text-sm font-medium text-foreground">Razón</label>
                  <Input value={adjustment.reason} onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })} placeholder="Ej: Recepción de mercancía" required />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">Aplicar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-sky-400/15 border border-sky-400/30 rounded-xl flex items-center justify-center"><Package className="w-6 h-6 text-sky-300" /></div><div><p className="text-sm text-muted-foreground">Total Unidades</p><p className="text-2xl font-bold text-foreground">{stats.total}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-emerald-400/15 border border-emerald-400/30 rounded-xl flex items-center justify-center"><TrendingUp className="w-6 h-6 text-emerald-300" /></div><div><p className="text-sm text-muted-foreground">Stock OK</p><p className="text-2xl font-bold text-success">{stats.ok}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-amber-300/15 border border-amber-300/30 rounded-xl flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-amber-200" /></div><div><p className="text-sm text-muted-foreground">Stock Bajo</p><p className="text-2xl font-bold text-warning">{stats.low}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-red-400/15 border border-red-400/30 rounded-xl flex items-center justify-center"><TrendingDown className="w-6 h-6 text-red-300" /></div><div><p className="text-sm text-muted-foreground">Crítico</p><p className="text-2xl font-bold text-destructive">{stats.critical}</p></div></div></CardContent></Card>
      </div>

      <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar en inventario..." />

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Warehouse className="w-5 h-5" /> Estado del Inventario</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Producto</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">SKU</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Stock</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Mínimo</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Actualización</th>
              </tr></thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const status = getStatus(item)
                  return (
                    <tr key={item.id} className="border-b hover:bg-accent/50 transition-colors">
                      <td className="py-4 px-4"><div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border ${
                          status === 'critical' ? 'bg-red-400/20 text-red-200 border-red-400/30' :
                          status === 'low' ? 'bg-amber-300/20 text-amber-200 border-amber-300/30' :
                          'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'
                        }`}>{item.name.charAt(0)}</div>
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div></td>
                      <td className="py-4 px-4 text-muted-foreground font-mono text-sm">{item.sku}</td>
                      <td className={`py-4 px-4 text-right text-lg font-bold ${
                        status === 'critical' ? 'text-destructive' : status === 'low' ? 'text-warning' : 'text-success'
                      }`}>{item.stock}</td>
                      <td className="py-4 px-4 text-right text-muted-foreground">{item.minStock}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                       status === 'critical' ? 'bg-destructive/10 text-destructive' :
                           status === 'low' ? 'bg-warning/10 text-warning' :
                           'bg-success/10 text-success'
                        }`}>{status === 'critical' ? 'Crítico' : status === 'low' ? 'Bajo' : 'Normal'}</span>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{formatDate(item.updatedAt)}</td>
                    </tr>
                  )
                })}
                {filteredInventory.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No se encontraron productos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Movements Dialog */}
      <Dialog open={showMovements} onOpenChange={setShowMovements}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Historial de Movimientos</DialogTitle></DialogHeader>
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-2 px-3">Fecha</th>
              <th className="text-left py-2 px-3">Producto</th>
              <th className="text-left py-2 px-3">Tipo</th>
              <th className="text-right py-2 px-3">Cantidad</th>
              <th className="text-left py-2 px-3">Razón</th>
            </tr></thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id} className="border-b">
                  <td className="py-2 px-3 text-xs">{formatDate(m.createdAt)}</td>
                  <td className="py-2 px-3">{m.product?.name || 'N/A'}</td>
                  <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.type === 'entrada' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{m.type}</span></td>
                  <td className="py-2 px-3 text-right font-medium">{m.quantity}</td>
                  <td className="py-2 px-3 text-muted-foreground">{m.reason}</td>
                </tr>
              ))}
              {movements.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Sin movimientos</td></tr>}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </div>
  )
}
