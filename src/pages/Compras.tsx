import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2, Check } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { UserSession } from '@/App'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchBar } from '@/components/ui/search-bar'

interface Supplier { id: string; name: string }
interface Product { id: string; name: string; sku: string; price: number }
interface PurchaseItem { productId: string; quantity: number; price: number }
interface Purchase { id: string; invoice: string; supplier?: any; total: number; status: string; items: any[]; createdAt: string }

export function Compras({ user: _user }: { user: UserSession }) {
  const { addToast } = useToast()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [p, s, pr] = await Promise.all([api.purchases.list(), api.suppliers.list(), api.products.list()])
      setPurchases(p as Purchase[]); setSuppliers(s as Supplier[]); setProducts(pr as Product[])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const addItem = () => setItems([...items, { productId: products[0]?.id || '', quantity: 1, price: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: string, value: any) => setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item))

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const handleSubmit = async () => {
    if (items.length === 0) return
    try {
      await api.purchases.create({ supplierId: supplierId || null, items, total })
      setDialogOpen(false); setItems([]); setSupplierId(''); loadData()
      addToast({ title: 'Compra registrada', variant: 'success' })
    } catch (err: any) { addToast({ title: 'Error al registrar compra', description: err.message, variant: 'error' }) }
  }

  const handleReceive = async (id: string) => {
    try { await api.purchases.updateStatus(id, 'pagado'); loadData(); addToast({ title: 'Compra recibida', variant: 'success' }) } catch (err: any) { addToast({ title: 'Error', description: err.message, variant: 'error' }) }
  }

  const filteredPurchases = purchases.filter(p => {
    const matchSearch = p.invoice.toLowerCase().includes(search.toLowerCase()) || p.supplier?.name?.toLowerCase().includes(search.toLowerCase())
    const matchDateFrom = !dateFrom || new Date(p.createdAt) >= new Date(dateFrom)
    const matchDateTo = !dateTo || new Date(p.createdAt) <= new Date(dateTo + 'T23:59:59')
    return matchSearch && matchDateFrom && matchDateTo
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader title="Compras" description="Registro de compras a proveedores">
        <Button onClick={() => { setDialogOpen(true); setItems([]); setSupplierId('') }} className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"><Plus className="w-4 h-4 mr-2" /> Nueva Compra</Button>
      </PageHeader>

      <div className="flex gap-3">
        <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Buscar por factura o proveedor..." /></div>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-44" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-44" />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4">Factura</th><th className="text-left py-3 px-4">Proveedor</th><th className="text-left py-3 px-4">Fecha</th><th className="text-left py-3 px-4">Estado</th><th className="text-right py-3 px-4">Total</th><th className="text-center py-3 px-4">Acciones</th>
            </tr></thead>
            <tbody>
              {filteredPurchases.map(p => (
                <tr key={p.id} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4 font-mono font-medium">{p.invoice}</td>
                  <td className="py-3 px-4">{p.supplier?.name || 'N/A'}</td>
                  <td className="py-3 px-4">{formatDate(p.createdAt)}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'pagado' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-300/15 text-amber-200'}`}>{p.status}</span></td>
                  <td className="py-3 px-4 text-right font-semibold">{formatCurrency(p.total)}</td>
                  <td className="py-3 px-4 text-center">
                    {p.status === 'pendiente' && <Button size="sm" onClick={() => handleReceive(p.id)} className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-400/30 text-xs"><Check className="w-3 h-3 mr-1" /> Recibir</Button>}
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No hay compras registradas</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nueva Compra</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Proveedor</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1">
                <option value="">Sin proveedor</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} className="flex-1 h-9 rounded border text-sm px-2">
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                  <Input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)} className="w-20 h-9" min="1" placeholder="Cant" />
                  <Input type="number" value={item.price} onChange={e => updateItem(idx, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} className="w-28 h-9" min="0" placeholder="Precio" />
                  <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
              <Button variant="outline" onClick={addItem} className="w-full"><Plus className="w-4 h-4 mr-2" /> Agregar Producto</Button>
            </div>
            <div className="text-right text-lg font-bold border-t pt-3">Total: {formatCurrency(total)}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">Registrar Compra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
