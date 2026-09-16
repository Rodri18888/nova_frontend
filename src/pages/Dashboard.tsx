import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign, ShoppingCart, Package, TrendingUp, ArrowUpRight, AlertTriangle,
  BarChart3, PieChart, LineChart
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'

interface DashboardStats {
  salesToday: number; transactions: number; products: number; netProfit: number
  weeklySales: { date: string; total: number }[]
  monthlySales: { date: string; total: number }[]
  yearlySales: { date: string; total: number }[]
  recentSales: { id: string; invoice: string; customer: string; items: number; total: number; time: string }[]
  topProducts: { name: string; sold: number }[]
  lowStock: { id: string; name: string; stock: number; minStock: number }[]
}

type Period = 'semanal' | 'mensual' | 'anual'
type ChartType = 'barras' | 'pastel' | 'lineas'

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('semanal')
  const [chartType, setChartType] = useState<ChartType>('barras')

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    try {
      const data = await api.dashboard.stats() as DashboardStats
      setStats(data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  if (loading) return <LoadingSpinner message="Cargando dashboard..." />

  const periodSeries = {
    semanal: stats?.weeklySales || [],
    mensual: stats?.monthlySales || [],
    anual: stats?.yearlySales || [],
  }[period]

  const series = periodSeries
  const maxVal = Math.max(...series.map(w => Number(w.total)), 1)
  const periodTotal = series.reduce((a, b) => a + Number(b.total), 0)
  const avgValue = period === 'semanal' ? Math.round(periodTotal / 7) : period === 'mensual' ? Math.round(periodTotal / series.length) : Math.round(periodTotal / series.length)
  const periodLabel = { semanal: 'Semana', mensual: 'Mes', anual: 'Año' }[period]

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

  const colors = ['#7c3aed', '#2563eb', '#0891b2', '#dc2626', '#d97706', '#059669', '#db2777']

  const periodBtn = (active: boolean) => cn(
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
    active
      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
      : 'bg-accent text-foreground border-transparent hover:bg-secondary'
  )

  const chartBtn = (active: boolean) => cn(
    'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all border',
    active
      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
      : 'bg-accent text-muted-foreground border-transparent hover:bg-secondary'
  )

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
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-lg flex items-center gap-2.5 text-foreground">
                <div className="w-8 h-8 bg-violet-400/15 border border-violet-400/25 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-violet-300" />
                </div>
                Ventas <span className="capitalize">{periodLabel}</span>
                <span className="ml-1 flex items-center gap-1.5">
                  <button onClick={() => setPeriod('semanal')} className={periodBtn(period === 'semanal')}>Semanal</button>
                  <button onClick={() => setPeriod('mensual')} className={periodBtn(period === 'mensual')}>Mensual</button>
                  <button onClick={() => setPeriod('anual')} className={periodBtn(period === 'anual')}>Anual</button>
                </span>
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-accent rounded-lg border border-border p-0.5">
                  <button onClick={() => setChartType('barras')} className={chartBtn(chartType === 'barras')} title="Barras">
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setChartType('pastel')} className={chartBtn(chartType === 'pastel')} title="Pastel">
                    <PieChart className="w-4 h-4" />
                  </button>
                  <button onClick={() => setChartType('lineas')} className={chartBtn(chartType === 'lineas')} title="Líneas">
                    <LineChart className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
                    Total: <strong className="text-foreground">{formatCurrency(periodTotal)}</strong>
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                    Promedio: <strong className="text-foreground">{formatCurrency(avgValue)}</strong>
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-4">
            {chartType === 'barras' && (
              <div className="flex items-end gap-2.5 px-2 overflow-x-auto pb-1" style={{ height: '300px' }}>
                {series.map((day, i) => {
                  const barHeight = day.total > 0 ? Math.max(Math.round((day.total / maxVal) * 240), 28) : 6
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-[56px] max-w-[110px] group" style={{ height: '100%', justifyContent: 'flex-end' }}>
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs font-bold text-white bg-foreground/80 px-2.5 py-1.5 rounded-lg mb-1 shadow-xl whitespace-nowrap -translate-y-1 group-hover:translate-y-0 pointer-events-none">
                        {formatCurrency(day.total)}
                      </div>
                      <div className="w-full relative" style={{ height: `${barHeight}px`, minHeight: day.total > 0 ? '28px' : '6px' }}>
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-500 ease-out group-hover:brightness-125 group-hover:shadow-lg"
                          style={{
                            height: '100%',
                            background: day.total > 0
                              ? colors[i % colors.length]
                              : 'hsl(var(--muted))',
                            boxShadow: day.total > 0 ? `0 4px 16px ${colors[i % colors.length]}40` : 'none',
                            borderRadius: '8px 8px 4px 4px',
                          }}
                        />
                        {day.total > 0 && (
                          <div className="absolute top-0 left-[15%] right-[15%] h-[3px] bg-white/40 rounded-full" />
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground text-center leading-tight mt-2 font-medium">
                        {day.date}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {chartType === 'lineas' && (
              <div className="px-2">
                <svg viewBox="0 0 600 300" className="w-full" style={{ height: '300px' }}>
                  {[0.25, 0.5, 0.75, 1].map(tick => (
                    <line key={tick} x1="40" x2="580" y1={tick * 280} y2={tick * 280} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" />
                  ))}
                  <polyline
                    fill="none"
                    stroke={colors[1]}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={series.map((d, i) => {
                      const x = 40 + (i / Math.max(series.length - 1, 1)) * 540
                      const y = 280 - (Number(d.total) / maxVal) * 240
                      return `${x},${y}`
                    }).join(' ')}
                  />
                  {series.map((d, i) => {
                    const x = 40 + (i / Math.max(series.length - 1, 1)) * 540
                    const y = 280 - (Number(d.total) / maxVal) * 240
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="5" fill={colors[1]} stroke="white" strokeWidth="2" />
                        <title>{`${d.date}: ${formatCurrency(d.total)}`}</title>
                        {series.length <= 16 && (
                          <text x={x} y={300} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">{d.date}</text>
                        )}
                      </g>
                    )
                  })}
                </svg>
              </div>
            )}

            {chartType === 'pastel' && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4" style={{ minHeight: '300px' }}>
                <Donut data={series} colors={colors} total={periodTotal} />
                <div className="space-y-2 max-w-xs w-full">
                  {series.filter(d => Number(d.total) > 0).map((d, i) => {
                    const pct = periodTotal > 0 ? Math.round((Number(d.total) / periodTotal) * 100) : 0
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span className="w-3 h-3 rounded-sm" style={{ background: colors[i % colors.length] }} />
                          {d.date}
                        </span>
                        <span className="font-semibold text-foreground">{formatCurrency(d.total)} <span className="text-xs text-muted-foreground font-normal">({pct}%)</span></span>
                      </div>
                    )
                  })}
                  {series.filter(d => Number(d.total) > 0).length === 0 && (
                    <p className="text-muted-foreground text-center py-8 text-sm">Sin ventas en este periodo</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-between mt-5 pt-4 border-t border-border text-xs text-muted-foreground px-2">
              <span>Máximo: <strong className="text-foreground">{formatCurrency(maxVal)}</strong></span>
              <span>Mínimo: <strong className="text-foreground">{formatCurrency(Math.min(...series.map(w => w.total)))}</strong></span>
              <span>Total: <strong className="text-foreground">{formatCurrency(periodTotal)}</strong></span>
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

function Donut({ data, colors, total }: { data: { date: string; total: number }[]; colors: string[]; total: number }) {
  const active = data.filter(d => Number(d.total) > 0)
  const sum = active.reduce((a, b) => a + Number(b.total), 0)
  if (sum === 0) {
    return (
      <div className="w-48 h-48 rounded-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
        Sin ventas
      </div>
    )
  }
  const R = 80
  const C = 2 * Math.PI * R
  let offset = 0
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="flex-shrink-0">
      <circle cx="100" cy="100" r={R} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
      <g transform="rotate(-90 100 100)">
        {active.map((d, i) => {
          const frac = Number(d.total) / sum
          const len = frac * C
          const el = (
            <circle
              key={i}
              cx="100" cy="100" r={R}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="34"
              strokeDasharray={`${len - 1.5} ${C - len + 1.5}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          )
          offset += len
          return el
        })}
      </g>
      <text x="100" y="96" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">{active.length} entradas</text>
      <text x="100" y="118" textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor">{formatCurrency(total)}</text>
    </svg>
  )
}
