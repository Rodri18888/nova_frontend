import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, Truck } from 'lucide-react'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchBar } from '@/components/ui/search-bar'

interface Supplier { id: string; name: string; contact: string | null; phone: string | null; email: string | null; address: string | null }

export function Proveedores() {
  const { addToast } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '', address: '' })

  useEffect(() => { loadSuppliers() }, [])

  async function loadSuppliers() {
    try { setSuppliers(await api.suppliers.list() as Supplier[]) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        const updated = await api.suppliers.update({ id: editing.id, ...form }) as Supplier
        setSuppliers(suppliers.map(s => s.id === editing.id ? updated : s))
        addToast({ title: 'Proveedor actualizado', variant: 'success' })
      } else {
        const created = await api.suppliers.create(form) as Supplier
        setSuppliers([created, ...suppliers])
        addToast({ title: 'Proveedor creado', variant: 'success' })
      }
      setDialogOpen(false); setEditing(null); setForm({ name: '', contact: '', phone: '', email: '', address: '' })
    } catch (err: any) { addToast({ title: 'Error', description: err.message, variant: 'error' }) }
  }

  const handleDelete = async (id: string, name: string) => {
    try { await api.suppliers.delete(id); setSuppliers(suppliers.filter(s => s.id !== id)); addToast({ title: 'Proveedor eliminado', description: name, variant: 'warning' }) } catch (err: any) { addToast({ title: 'Error', description: err.message, variant: 'error' }) }
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  )

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader title="Proveedores" description="Gestiona tus proveedores">
        <Button onClick={() => { setEditing(null); setForm({ name: '', contact: '', phone: '', email: '', address: '' }); setDialogOpen(true) }} className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"><Plus className="w-4 h-4 mr-2" /> Nuevo Proveedor</Button>
      </PageHeader>

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar proveedores..." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <Card key={s.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-400/15 border border-sky-400/30 rounded-xl flex items-center justify-center"><Truck className="w-5 h-5 text-sky-300" /></div>
                  <div><h3 className="font-semibold text-foreground">{s.name}</h3>{s.contact && <p className="text-xs text-muted-foreground">{s.contact}</p>}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setForm({ name: s.name, contact: s.contact || '', phone: s.phone || '', email: s.email || '', address: s.address || '' }); setDialogOpen(true) }}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id, s.name)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {s.phone && <p>Tel: {s.phone}</p>}
                {s.email && <p>Email: {s.email}</p>}
                {s.address && <p>{s.address}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No se encontraron proveedores</div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><label className="text-sm font-medium">Nombre *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="text-sm font-medium">Contacto</label><Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Teléfono</label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Email</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><label className="text-sm font-medium">Dirección</label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">{editing ? 'Guardar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
