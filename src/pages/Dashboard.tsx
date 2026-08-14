import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign, ShoppingCart, Package, TrendingUp, ArrowUpRight, AlertTriangle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface DashboardStats {
  salesToday: number; transactions: number; products: number; netProfit: number
  weeklySales: { date: string; total: number }[]
  recentSales: { id: string; invoice: string; customer: string; items: number; total: number; time: string }[]
  topProducts: { name: string; sold: number }[]
  lowStock: { id: string; name: string; stock: number; minStock: number }[]
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    try {
      const data = await api.dashboard.stats() as DashboardStats
      setStats(data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  if (loading) return <LoadingSpinner message="Cargando dashboard..." />

  const weekly = stats?.weeklySales || []
  const maxVal = Math.max(...weekly.map(w => w.total), 1)
  const totalWeek = weekly.reduce((a, b) => a + b.total, 0)
  const avgDay = Math.round(totalWeek / 7)

  const cards = [
    { title: 'Ventas Hoy', value: formatCurrency(stats?.salesToday || 0), icon: DollarSign,
      chip: 'bg-emerald-400/15 text-emerald-300', badge: 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20' },
    { title: 'Transacciones', value: String(stats?.transactions || 0), icon: ShoppingCart,
      chip: 'bg-sky-400/15 text-sky-300', badge: 'bg-sky-400/10 text-sky-300 border border-sky-400/20' },
    { title: 'Productos', value: String(stats?.products || 0), icon: Package,
      chip: 'bg-violet-400/15 text-violet-300', badge: 'bg-violet-400/10 text-violet-300 border border-violet-400/20' },
    { title: 'Ganancia Neta', value: formatCurrency(stats?.netProfit || 0), icon: TrendingUp,
      chip: 'bg-amber-300/15 text-amber-200', badge: 'bg-amber-300/10 text-amber-200 border border-amber-300/20' },
  ]

  const colors = ['#c9b8f5', '#a5c8f7', '#b9a3f2', '#d3c2f8', '#9fb4f0', '#c9b8f5', '#a5c8f7']

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Dashboard" description="Resumen general de tu tienda">
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-xl shadow-sm border">
          <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
          Actualizado
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <div key={card.title} className="animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 group overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-1.5">{card.value}</p>
                      <div className="mt-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${card.badge}`}>
                          <ArrowUpRight className="w-3 h-3" />
                          Hoy
                        </span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 ${card.chip} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full w-3/4 ${card.chip} rounded-full opacity-40`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="animate-in" style={{ animationDelay: '0.2s' }}>
        <Card className="border-0 shadow-soft overflow-hidden">
          <CardHeader className="border-b bg-accent/30 border-border">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg flex items-center gap-2.5 text-foreground">
                <div className="w-8 h-8 bg-violet-400/15 border border-violet-400/25 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-violet-300" />
                </div>
                Ventas Semanales
              </CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-violet-400/70" />
                  Total: <strong className="text-foreground">{formatCurrency(totalWeek)}</strong>
                </span>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-violet-300/60" />
                  Promedio: <strong className="text-foreground">{formatCurrency(avgDay)}</strong>
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-end justify-around gap-2.5 px-2" style={{ height: '300px' }}>
              {weekly.map((day, i) => {
                const barHeight = day.total > 0 ? Math.max(Math.round((day.total / maxVal) * 240), 28) : 6
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 max-w-[110px] group" style={{ height: '100%', justifyContent: 'flex-end' }}>
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs font-bold text-white bg-foreground/80 px-2.5 py-1.5 rounded-lg mb-1 shadow-xl whitespace-nowrap -translate-y-1 group-hover:translate-y-0 pointer-events-none">
                      {formatCurrency(day.total)}
                    </div>
                    <div className="w-full relative" style={{ height: `${barHeight}px`, minHeight: day.total > 0 ? '28px' : '6px' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-500 ease-out group-hover:brightness-110 group-hover:shadow-lg"
                        style={{
                          height: '100%',
                          background: day.total > 0
                            ? `linear-gradient(180deg, ${colors[i]} 0%, ${colors[i]}dd 50%, ${colors[i]}88 100%)`
                            : 'hsl(var(--muted))',
                          boxShadow: day.total > 0 ? `0 4px 16px ${colors[i]}30` : 'none',
                          borderRadius: '8px 8px 4px 4px',
                        }}
                      />
                      {day.total > 0 && (
                        <div className="absolute top-0 left-[15%] right-[15%] h-[3px] bg-white/30 rounded-full" />
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground text-center leading-tight mt-2 font-medium">
                      {day.date.split(',').slice(0, 2).join(' ').trimEnd()}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-5 pt-4 border-t border-border text-xs text-muted-foreground px-2">
              <span>Máximo: <strong className="text-foreground">{formatCurrency(maxVal)}</strong></span>
              <span>Mínimo: <strong className="text-foreground">{formatCurrency(Math.min(...weekly.map(w => w.total)))}</strong></span>
              <span>Total: <strong className="text-foreground">{formatCurrency(totalWeek)}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in" style={{ animationDelay: '0.3s' }}>
        <Card className="border-0 shadow-soft">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base flex items-center gap-2.5 text-foreground">
              <div className="w-7 h-7 bg-sky-400/15 border border-sky-400/25 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-3.5 h-3.5 text-sky-300" />
              </div>
              Ventas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-1.5">
              {stats?.recentSales?.length ? stats.recentSales.map((sale, i) => {
                const medals = ['bg-amber-400/20 text-amber-200 border-amber-400/30', 'bg-slate-400/15 text-slate-200 border-slate-400/30', 'bg-orange-400/20 text-orange-200 border-orange-400/30']
                return (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-all group cursor-default border border-transparent hover:border-border/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm border ${medals[i] || 'bg-violet-400/20 text-violet-200 border-violet-400/30'}`}>
                        {sale.customer.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{sale.customer}</p>
                        <p className="text-xs text-muted-foreground">{sale.invoice} &middot; {sale.items} artículos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-foreground">{formatCurrency(sale.total)}</p>
                      <p className="text-xs text-muted-foreground">{sale.time}</p>
                    </div>
                  </div>
                )
              }) : <p className="text-muted-foreground text-center py-8 text-sm">No hay ventas hoy</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base flex items-center gap-2.5 text-foreground">
              <div className="w-7 h-7 bg-emerald-400/15 border border-emerald-400/25 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              Top Productos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {stats?.topProducts?.length ? stats.topProducts.map((p, i) => {
                const barMax = Math.max(...stats.topProducts.map(x => x.sold), 1)
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 border ${
                      i === 0 ? 'bg-amber-400/20 text-amber-200 border-amber-400/30' :
                      i === 1 ? 'bg-slate-400/15 text-slate-200 border-slate-400/30' :
                      'bg-violet-400/20 text-violet-200 border-violet-400/30'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                        <span className="text-xs font-medium text-muted-foreground ml-2">{p.sold} uds</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${(p.sold / barMax) * 100}%`,
                            background: `linear-gradient(90deg, ${colors[i]}, ${colors[i]}aa)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              }) : <p className="text-muted-foreground text-center py-8 text-sm">Sin datos de ventas</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats?.lowStock?.length ? (
        <div className="animate-in" style={{ animationDelay: '0.4s' }}>
          <Card className="border-0 shadow-soft overflow-hidden">
            <CardHeader className="border-b border-border bg-accent/30">
              <CardTitle className="text-base flex items-center gap-2.5 text-foreground">
                <div className="w-7 h-7 bg-amber-300/15 border border-amber-300/25 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                </div>
                Stock Bajo
                <span className="ml-auto text-xs font-medium text-muted-foreground bg-card/80 px-3 py-1 rounded-full shadow-sm border">
                  {stats.lowStock.length} producto{stats.lowStock.length !== 1 ? 's' : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-3.5 px-5 font-medium text-muted-foreground">Producto</th>
                      <th className="text-right py-3.5 px-5 font-medium text-muted-foreground">Stock</th>
                      <th className="text-right py-3.5 px-5 font-medium text-muted-foreground">Mínimo</th>
                      <th className="text-center py-3.5 px-5 font-medium text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lowStock.map((p, i) => (
                      <tr key={p.id} className={`border-b border-border hover:bg-accent/30 transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                        <td className="py-3.5 px-5 font-medium text-foreground">{p.name}</td>
                        <td className="py-3.5 px-5 text-right font-bold" style={{ color: p.stock === 0 ? '#f0a6a1' : p.stock <= 3 ? '#f2b48c' : '#eecb8f' }}>{p.stock}</td>
                        <td className="py-3.5 px-5 text-right text-muted-foreground">{p.minStock}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                            p.stock === 0 ? 'bg-red-400/15 text-red-200 border-red-400/30' :
                            p.stock <= 3 ? 'bg-orange-400/15 text-orange-200 border-orange-400/30' :
                            'bg-amber-300/15 text-amber-200 border-amber-300/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              p.stock === 0 ? 'bg-red-300' :
                              p.stock <= 3 ? 'bg-orange-300' :
                              'bg-amber-300'
                            }`} />
                            {p.stock === 0 ? 'Sin stock' : p.stock <= 3 ? 'Crítico' : 'Bajo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
