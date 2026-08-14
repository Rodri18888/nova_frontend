import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tag, Printer, CheckSquare, Square } from 'lucide-react'
import api from '@/lib/api'
import JsBarcode from 'jsbarcode'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchBar } from '@/components/ui/search-bar'

interface Product { id: string; name: string; sku: string; price: number; category?: { name: string } }

export function Etiquetas() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [copies, setCopies] = useState(1)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [p, c] = await Promise.all([api.products.list(), api.categories.list()])
      setProducts(p as Product[]); setCategories(c as { id: string; name: string }[])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || p.category?.name === categoryFilter
    return matchSearch && matchCategory
  })

  const toggleSelect = (id: string) => setSelected({ ...selected, [id]: !selected[id] })
  const toggleAll = () => {
    const allSelected = filtered.every(p => selected[p.id])
    const newSel: Record<string, boolean> = {}
    filtered.forEach(p => { newSel[p.id] = !allSelected })
    setSelected({ ...selected, ...newSel })
  }

  const selectedProducts = products.filter(p => selected[p.id])

  const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

  const printLabels = () => {
    if (selectedProducts.length === 0) return

    const html = `
<!DOCTYPE html>
<html><head><title>Etiquetas - NOVA</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  .labels { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .label { border: 1px solid #ccc; padding: 10px; text-align: center; page-break-inside: avoid; }
  .label .store { color: #7c3aed; font-weight: bold; font-size: 10px; letter-spacing: 1px; }
  .label .name { font-size: 11px; font-weight: 600; margin: 4px 0; }
  .label .price { color: #16a34a; font-size: 14px; font-weight: bold; }
  .label .sku { font-size: 9px; color: #888; }
  @media print { body { margin: 0; } .no-print { display: none; } }
</style></head><body>
<div class="no-print" style="margin-bottom: 20px; text-align: center;">
  <button onclick="window.print()" style="padding: 10px 24px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;">Imprimir Etiquetas</button>
  <button onclick="window.close()" style="padding: 10px 24px; background: #eee; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; margin-left: 8px;">Cerrar</button>
</div>
<div class="labels">
${selectedProducts.flatMap(p => Array(copies).fill(null).map(() => `
  <div class="label">
    <div class="store">MODAPOS</div>
    <svg class="barcode" data-code="${esc(p.sku)}"></svg>
    <div class="name">${esc(p.name)}</div>
    <div class="price">$ ${p.price.toFixed(2)}</div>
    <div class="sku">${esc(p.sku)}</div>
  </div>`)).join('')}
</div>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script>JsBarcode('.barcode', '.barcode', { format: 'CODE128', width: 1.5, height: 30, displayValue: true, fontSize: 10, margin: 2 });</script>
</body></html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (win) { win.document.write(html); win.document.close() }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader title="Etiquetas" description="Genera etiquetas con código de barras para tus productos">
        <Button onClick={printLabels} disabled={selectedProducts.length === 0} className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"><Printer className="w-4 h-4 mr-2" /> Imprimir ({selectedProducts.length})</Button>
      </PageHeader>

      <div className="flex gap-3 items-center">
        <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Buscar productos..." /></div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <div className="flex items-center gap-2"><label className="text-sm text-muted-foreground">Copias:</label><Input type="number" value={copies} onChange={e => setCopies(e.target.value === '' ? 1 : Math.max(1, parseInt(e.target.value) || 1))} className="w-16 h-10" min="1" max="10" /></div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="py-3 px-4 w-10"><button onClick={toggleAll}>{filtered.every(p => selected[p.id]) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}</button></th>
              <th className="text-left py-3 px-4">SKU</th>
              <th className="text-left py-3 px-4">Producto</th>
              <th className="text-left py-3 px-4">Categoría</th>
              <th className="text-right py-3 px-4">Precio</th>
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-accent/50 cursor-pointer" onClick={() => toggleSelect(p.id)}>
                  <td className="py-3 px-4">{selected[p.id] ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}</td>
                  <td className="py-3 px-4 font-mono text-xs">{p.sku}</td>
                  <td className="py-3 px-4 font-medium">{p.name}</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 bg-violet-400/15 text-violet-300 rounded-full text-xs border border-violet-400/30">{p.category?.name || 'N/A'}</span></td>
                  <td className="py-3 px-4 text-right font-semibold">$ {p.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
