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
  Plus, Edit2, Trash2, Package, Download
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchBar } from '@/components/ui/search-bar'

interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  description?: string
  price: number
  cost: number
  stock: number
  size: string | null
  color: string | null
  categoryId: string
  category: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
}

export function Products({ user }: { user?: any } = {}) {
  const { addToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    categoryId: '',
    size: '',
    color: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [productsData, categoriesData] = await Promise.all([
        api.products.list(),
        api.categories.list(),
      ])
      setProducts(productsData as Product[])
      setCategories(categoriesData as Category[])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let categoryId = formData.categoryId

      if (showNewCategory && newCategoryName.trim()) {
        const newCat = await api.categories.create({ name: newCategoryName.trim() }) as Category
        categoryId = newCat.id
        setCategories([...categories, newCat])
      }

      const productData: any = {
        name: formData.name,
        sku: formData.sku,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock: parseInt(formData.stock) || 0,
        categoryId: categoryId || null,
        size: formData.size || undefined,
        color: formData.color || undefined,
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
      setFormData({ name: '', sku: '', barcode: '', description: '', price: '', cost: '', stock: '', categoryId: '', size: '', color: '' })
      setNewCategoryName('')
      setShowNewCategory(false)
    } catch (err: any) {
      addToast({ title: 'Error al guardar', description: err.message || 'Verifica que el SKU no esté duplicado', variant: 'error' })
    }
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
      categoryId: product.categoryId || '',
      size: product.size || '',
      color: product.color || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      await api.products.delete(id)
      setProducts(products.filter(p => p.id !== id))
      addToast({ title: 'Producto eliminado', description: name, variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error al eliminar', description: err.message, variant: 'error' })
    }
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
        <Button variant="outline" onClick={() => setShowCategoryDialog(true)}>
          <Package className="w-4 h-4 mr-2" /> Categorías
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    <label className="text-sm font-medium text-foreground">Categoría</label>
                    {showNewCategory ? (
                      <div className="flex gap-2">
                        <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nueva categoría" required />
                        <Button type="button" variant="outline" onClick={() => setShowNewCategory(false)}>Cancelar</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="">Seleccionar...</option>
                          {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                        </select>
                        <Button type="button" variant="outline" onClick={() => setShowNewCategory(true)}><Plus className="w-4 h-4" /></Button>
                      </div>
                    )}
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
                    <label className="text-sm font-medium text-foreground">Talla</label>
                    <Input value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} placeholder="Ej: M" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Color</label>
                    <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} placeholder="Ej: Azul" />
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

      <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar productos por nombre, SKU, código de barras o categoría..." />

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
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Categoría</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Talla/Color</th>
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
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {product.category?.name || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{product.size || '-'} / {product.color || '-'}</td>
                    <td className="py-4 px-4 text-right font-semibold text-foreground">{formatCurrency(product.price)}</td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-medium ${product.stock < 10 ? 'text-destructive' : 'text-success'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="text-muted-foreground hover:text-primary">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id, product.name)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No se encontraron productos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Category Management Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gestionar Categorías</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                {editingCategory?.id === cat.id ? (
                  <div className="flex gap-2 flex-1">
                    <Input value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                    <Button size="sm" onClick={async () => {
                      try {
                        await api.categories.update(cat.id, { name: editingCategory.name })
                        setCategories(categories.map(c => c.id === cat.id ? editingCategory : c))
                        setEditingCategory(null)
                        addToast({ title: 'Categoría actualizada', variant: 'success' })
                      } catch (err: any) { addToast({ title: 'Error', description: err.message, variant: 'error' }) }
                    }}>Guardar</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>Cancelar</Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{cat.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingCategory(cat)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => {
                        try {
                          await api.categories.delete(cat.id)
                          setCategories(categories.filter(c => c.id !== cat.id))
                          addToast({ title: 'Categoría eliminada', variant: 'success' })
                        } catch (err: any) { addToast({ title: 'Error', description: err.message, variant: 'error' }) }
                      }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
