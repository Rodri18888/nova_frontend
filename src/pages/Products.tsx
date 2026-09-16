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
  Plus, Edit2, Trash2, Package, Download, ChevronDown, ChevronUp, Check
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchBar } from '@/components/ui/search-bar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  description?: string
  price: number
  cost: number
  stock: number
  minStock?: number
  size: string[] | null
  color: string[] | null
  material: string[] | null
  type: string | null
}

interface MultiField {
  label: string
  key: 'size' | 'color' | 'material'
  options: string[]
  placeholder: string
}

const DEFAULT_FIELDS: MultiField[] = [
  { label: 'Color', key: 'color', options: ['Azul', 'Rojo', 'Verde'], placeholder: 'Ej: Amarillo' },
  { label: 'Talla', key: 'size', options: ['S', 'M', 'L', 'XL'], placeholder: 'Ej: XXL' },
  { label: 'Material', key: 'material', options: ['Plástico', 'Madera', 'Algodón'], placeholder: 'Ej: Cuero' },
]

const DEFAULT_TYPES = ['Ropa', 'Electrónica', 'Comestible', 'Accesorio']

export function Products({ user: _user }: { user?: any } = {}) {
  const { addToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showCharacteristics, setShowCharacteristics] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    type: '',
  })
  const [selected, setSelected] = useState<Record<'size' | 'color' | 'material', string[]>>({ size: [], color: [], material: [] })
  const [newOption, setNewOption] = useState<Record<'size' | 'color' | 'material', string>>({ size: '', color: '', material: '' })
  const [options, setOptions] = useState<Record<'size' | 'color' | 'material', string[]>>({
    size: ['S', 'M', 'L', 'XL'],
    color: ['Azul', 'Rojo', 'Verde', 'Amarillo', 'Negro', 'Blanco', 'Gris', 'Rosa', 'Morado', 'Naranja', 'Celeste', 'Cafe' ],
    material: ['Plástico', 'Madera', 'Algodón', 'Cuero', 'Metal', 'Vidrio', 'Cerámica', 'Lana', 'Seda', 'Nylon', 'Poliéster'],
  })
  const [confirmSave, setConfirmSave] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      setProducts(await api.products.list() as Product[])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.material || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.color || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.size || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const requestSave = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmSave(true)
  }

  const handleConfirmSave = async () => {
    setSavingProduct(true)
    try {
      const productData: any = {
        name: formData.name,
        sku: formData.sku,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock: parseInt(formData.stock) || 0,
        size: selected.size,
        color: selected.color,
        material: selected.material,
        type: formData.type || undefined,
        barcode: formData.barcode || undefined,
        description: formData.description || undefined,
      }

      if (editingProduct) {
        const updated = await api.products.update({ id: editingProduct.id, ...productData }) as Product
        setProducts(products.map(p => p.id === editingProduct.id ? updated : p))
        addToast({ title: 'Producto actualizado', description: `${updated.name} se actualizó correctamente`, variant: 'success' })
      } else {
        const created = await api.products.create(productData) as Product
        setProducts([created, ...products])
        addToast({ title: 'Producto creado', description: `${created.name} se creó correctamente`, variant: 'success' })
      }

      setIsDialogOpen(false)
      setEditingProduct(null)
      resetForm()
    } catch (err: any) {
      addToast({ title: 'Error al guardar', description: err.message || 'Verifica que el SKU no esté duplicado', variant: 'error' })
    } finally { setSavingProduct(false); setConfirmSave(false) }
  }

  const resetForm = () => {
    setFormData({ name: '', sku: '', barcode: '', description: '', price: '', cost: '', stock: '', type: '' })
    setSelected({ size: [], color: [], material: [] })
    setNewOption({ size: '', color: '', material: '' })
    setShowCharacteristics(false)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      description: product.description || '',
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      type: product.type || '',
    })
    setSelected({
      size: product.size || [],
      color: product.color || [],
      material: product.material || [],
    })
    setShowCharacteristics(!!product.size?.length || !!product.color?.length || !!product.material?.length)
    setIsDialogOpen(true)
  }

  const toggleOption = (key: 'size' | 'color' | 'material', value: string) => {
    setSelected(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value],
    }))
  }

  const addOption = (field: MultiField) => {
    const val = newOption[field.key].trim()
    if (!val) return
    if (selected[field.key].includes(val) || options[field.key].includes(val)) {
      toggleOption(field.key, val)
      setNewOption({ ...newOption, [field.key]: '' })
      return
    }
    setOptions(prev => ({ ...prev, [field.key]: [...prev[field.key], val] }))
    setSelected(prev => ({ ...prev, [field.key]: [...prev[field.key], val] }))
    setNewOption({ ...newOption, [field.key]: '' })
  }

  const handleDelete = async () => {
    if (!deleteProduct) return
    try {
      await api.products.delete(deleteProduct.id)
      setProducts(products.filter(p => p.id !== deleteProduct.id))
      addToast({ title: 'Producto eliminado', description: deleteProduct.name, variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error al eliminar', description: err.message, variant: 'error' })
    } finally { setDeleteProduct(null) }
  }

  const handleExport = async () => {
    try {
      await api.export.products()
    } catch (e: any) {
      console.error('Error al exportar:', e.message)
    }
  }

  if (loading) return <LoadingSpinner message="Cargando productos..." />

  return (
    <div className="space-y-6">
      <PageHeader title="Productos" description="Gestiona el catálogo de tu tienda">
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingProduct(null); resetForm() } }}>
            <DialogTrigger asChild>
              <Button className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 hover:from-violet-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={requestSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-foreground">Nombre del Producto</label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Jeans Clásicos" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">SKU</label>
                    <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="Ej: JEAN-001" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Código de Barras</label>
                    <Input value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="Ej: 7701234567890" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-foreground">Descripción</label>
                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción del producto..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Precio de Venta ($)</label>
                    <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Costo ($)</label>
                    <Input type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} placeholder="0.00" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Stock</label>
                    <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Tipo</label>
                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Seleccionar tipo...</option>
                      {DEFAULT_TYPES.map(t => (<option key={t} value={t}>{t}</option>))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <Button type="button" variant="outline" onClick={() => setShowCharacteristics(!showCharacteristics)} className="w-full">
                      Características adicionales
                      {showCharacteristics ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                    </Button>
                    {showCharacteristics && (
                      <div className="mt-4 space-y-4">
                        {DEFAULT_FIELDS.map(field => (
                          <div key={field.key}>
                            <label className="text-sm font-medium text-foreground">{field.label}</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {options[field.key].map(opt => (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() => toggleOption(field.key, opt)}
                                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                    selected[field.key].includes(opt)
                                      ? 'bg-primary/20 text-primary border-primary/40'
                                      : 'bg-background text-muted-foreground border-border hover:bg-accent'
                                  }`}
                                >
                                  {opt}
                                  {selected[field.key].includes(opt) && <Check className="w-3.5 h-3.5 inline ml-1" />}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={newOption[field.key]}
                                onChange={(e) => setNewOption({ ...newOption, [field.key]: e.target.value })}
                                placeholder={`Agregar nuevo: ${field.placeholder}`}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(field) } }}
                              />
                              <Button type="button" variant="outline" onClick={() => addOption(field)}><Plus className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">{editingProduct ? 'Guardar Cambios' : 'Crear Producto'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
      </PageHeader>

      <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar productos por nombre, SKU, código de barras o características..." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Catálogo de Productos ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Producto</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">SKU</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Código Barras</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Color / Talla</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Material</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Precio</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Stock</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-accent/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-400/20 border border-violet-400/30 rounded-lg flex items-center justify-center text-violet-200 font-bold">
                          {product.name.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground font-mono text-sm">{product.sku}</td>
                    <td className="py-4 px-4 text-muted-foreground font-mono text-xs">{product.barcode || '-'}</td>
                    <td className="py-4 px-4 text-muted-foreground">{product.type || '-'}</td>
                    <td className="py-4 px-4 text-muted-foreground">{(product.color || []).join(', ') || '-'} / {(product.size || []).join(', ') || '-'}</td>
                    <td className="py-4 px-4 text-muted-foreground">{(product.material || []).join(', ') || '-'}</td>
                    <td className="py-4 px-4 text-right font-semibold text-foreground">{formatCurrency(product.price)}</td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-medium ${product.stock < (product.minStock ?? 10) ? 'text-destructive' : 'text-success'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="text-muted-foreground hover:text-primary">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteProduct(product)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No se encontraron productos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title={editingProduct ? 'Guardar cambios' : 'Crear producto'}
        description={editingProduct ? `¿Guardar los cambios en "${formData.name}"?` : `¿Crear el producto "${formData.name}"?`}
        loading={savingProduct}
        onConfirm={handleConfirmSave}
      />

      <ConfirmDialog
        open={!!deleteProduct}
        onOpenChange={() => setDeleteProduct(null)}
        title="Eliminar producto"
        description={`¿Eliminar "${deleteProduct?.name}" (${deleteProduct?.sku})? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        onConfirm={handleDelete}
      />
    </div>
  )
}
