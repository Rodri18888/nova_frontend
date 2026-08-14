import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  Users, Plus, Edit2, Mail, Phone, ShoppingCart, DollarSign, Eye
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchBar } from '@/components/ui/search-bar'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  points: number
  purchases: number
  totalSpent: number
  lastPurchase: string
  createdAt?: string
}

export function Customers() {
  const { addToast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  useEffect(() => { loadCustomers() }, [])

  async function loadCustomers() {
    try {
      const data = await api.customers.list() as Customer[]
      setCustomers(data)
    } catch (err) {
      console.error('Error loading customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        await api.customers.update({ id: editingCustomer.id, ...formData })
        addToast({ title: 'Cliente actualizado', variant: 'success' })
      } else {
        await api.customers.create(formData)
        addToast({ title: 'Cliente creado', variant: 'success' })
      }
      setIsDialogOpen(false)
      setEditingCustomer(null)
      setFormData({ name: '', email: '', phone: '', address: '' })
      loadCustomers()
    } catch (err: any) {
      addToast({ title: 'Error al guardar', description: err.message, variant: 'error' })
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    })
    setIsDialogOpen(true)
  }

  const stats = {
    totalCustomers: customers.length,
    totalSpent: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    avgSpent: customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0,
    topCustomer: customers.length > 0 ? customers.reduce((max, c) => c.totalSpent > max.totalSpent ? c : max, customers[0]) : null,
  }

  if (loading) return <LoadingSpinner message="Cargando clientes..." />

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Gestiona la base de datos de clientes">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nombre Completo</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: María García" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Correo Electrónico</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Ej: maria@email.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Teléfono</label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Ej: 809-555-0101" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Dirección</label>
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Ej: Calle Principal #123" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">{editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sky-400/15 border border-sky-400/30 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-sky-300" /></div>
            <div><p className="text-sm text-muted-foreground">Total Clientes</p><p className="text-2xl font-bold text-foreground">{stats.totalCustomers}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-400/15 border border-emerald-400/30 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-emerald-300" /></div>
            <div><p className="text-sm text-muted-foreground">Total Ventas</p><p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalSpent)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-400/15 border border-violet-400/30 rounded-xl flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-violet-300" /></div>
            <div><p className="text-sm text-muted-foreground">Promedio por Cliente</p><p className="text-2xl font-bold text-foreground">{formatCurrency(stats.avgSpent)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-300/15 border border-amber-300/30 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-amber-200" /></div>
            <div><p className="text-sm text-muted-foreground">Mejor Cliente</p><p className="text-lg font-bold text-foreground">{stats.topCustomer?.name || '-'}</p></div>
          </div>
        </CardContent></Card>
      </div>

      <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar clientes por nombre, email o teléfono..." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-violet-400/20 border border-violet-400/30 rounded-full flex items-center justify-center text-violet-200 text-xl font-bold">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">Cliente desde {new Date(customer.lastPurchase).toLocaleDateString('es-DO', { month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setViewingCustomer(customer)} className="text-muted-foreground hover:text-primary"><Eye className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)} className="text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{customer.email || 'Sin email'}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{customer.phone || 'Sin teléfono'}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><span className="w-4 h-4 text-amber-300">&#9733;</span><span className="text-sm">{customer.points} puntos</span></div>
              </div>

              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Compras</p><p className="text-lg font-semibold text-foreground">{customer.purchases}</p></div>
                <div><p className="text-xs text-muted-foreground">Total Gastado</p><p className="text-lg font-semibold text-primary">{formatCurrency(customer.totalSpent)}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">No se encontraron clientes</div>
        )}
      </div>

      <Dialog open={!!viewingCustomer} onOpenChange={() => setViewingCustomer(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalle del Cliente</DialogTitle></DialogHeader>
          {viewingCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-violet-400/20 border border-violet-400/30 rounded-full flex items-center justify-center text-violet-200 text-2xl font-bold">{viewingCustomer.name.charAt(0)}</div>
                <div><h3 className="text-xl font-bold text-foreground">{viewingCustomer.name}</h3><p className="text-muted-foreground">Cliente desde {new Date(viewingCustomer.createdAt || viewingCustomer.lastPurchase).toLocaleDateString('es-DO')}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{viewingCustomer.email || 'No registrado'}</p></div>
                <div><p className="text-sm text-muted-foreground">Teléfono</p><p className="font-medium">{viewingCustomer.phone || 'No registrado'}</p></div>
                <div><p className="text-sm text-muted-foreground">Dirección</p><p className="font-medium">{viewingCustomer.address || 'No registrada'}</p></div>
                <div><p className="text-sm text-muted-foreground">Puntos</p><p className="font-medium text-amber-300">{viewingCustomer.points} pts</p></div>
                <div><p className="text-sm text-muted-foreground">Total Compras</p><p className="font-medium text-lg">{viewingCustomer.purchases}</p></div>
                <div><p className="text-sm text-muted-foreground">Total Gastado</p><p className="font-medium text-lg text-primary">{formatCurrency(viewingCustomer.totalSpent)}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
