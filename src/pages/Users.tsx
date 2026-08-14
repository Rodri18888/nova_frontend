import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, UserCog } from 'lucide-react'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface User {
  id: string; username: string; nombre: string; rol: string; activo: boolean
}

export function Users() {
  const { addToast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ username: '', password: '', nombre: '', rol: 'vendedor' })

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    try { setUsers(await api.users.list() as User[]) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        const data: any = { id: editing.id, nombre: form.nombre, rol: form.rol }
        if (form.password) data.password = form.password
        const updated = await api.users.update(data) as User
        setUsers(users.map(u => u.id === editing.id ? updated : u))
        addToast({ title: 'Usuario actualizado', variant: 'success' })
      } else {
        const created = await api.users.create(form) as User
        setUsers([created, ...users])
        addToast({ title: 'Usuario creado', variant: 'success' })
      }
      setDialogOpen(false); setEditing(null)
      setForm({ username: '', password: '', nombre: '', rol: 'vendedor' })
    } catch (err: any) { addToast({ title: 'Error', description: err.message, variant: 'error' }) }
  }

  const handleDelete = async (id: string, username: string) => {
    try { await api.users.delete(id); setUsers(users.filter(u => u.id !== id)); addToast({ title: 'Usuario eliminado', description: username, variant: 'warning' }) } catch (err: any) { addToast({ title: 'Error', description: err.message, variant: 'error' }) }
  }

  const rolBadge = (rol: string) => {
    const colors: Record<string, string> = { admin: 'bg-primary/10 text-primary', vendedor: 'bg-primary/10 text-primary' }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[rol] || 'bg-muted'}`}>{rol}</span>
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader title="Usuarios" description="Gestiona los usuarios del sistema">
        <Button onClick={() => { setEditing(null); setForm({ username: '', password: '', nombre: '', rol: 'vendedor' }); setDialogOpen(true) }} className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Usuario</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Nombre</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Rol</th>
              <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-sm">Acciones</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4 font-medium">{u.username}</td>
                  <td className="py-3 px-4 text-muted-foreground">{u.nombre}</td>
                  <td className="py-3 px-4">{rolBadge(u.rol)}</td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(u); setForm({ username: u.username, password: '', nombre: u.nombre, rol: u.rol }); setDialogOpen(true) }}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id, u.username)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing && <div><label className="text-sm font-medium text-foreground">Usuario</label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></div>}
            <div><label className="text-sm font-medium text-foreground">Nombre</label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required /></div>
            <div><label className="text-sm font-medium text-foreground">{editing ? 'Nueva Contraseña (vacío = no cambiar)' : 'Contraseña'}</label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} /></div>
            <div><label className="text-sm font-medium text-foreground">Rol</label>
              <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="admin">Administrador</option>
                <option value="vendedor">Vendedor</option>
              </select>
            </div>
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
