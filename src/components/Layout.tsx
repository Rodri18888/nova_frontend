import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, Receipt, Users,
  UserCog, RotateCcw, Wallet, Truck, TruckIcon, Tag, LogOut, Sun, Moon,
} from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

const allNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'vendedor'] },
  { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart, roles: ['admin', 'vendedor'] },
  { name: 'Productos', href: '/products', icon: Package, roles: ['admin', 'vendedor'] },
  { name: 'Inventario', href: '/inventory', icon: Warehouse, roles: ['admin', 'vendedor'] },
  { name: 'Ventas', href: '/sales', icon: Receipt, roles: ['admin', 'vendedor'] },
  { name: 'Clientes', href: '/customers', icon: Users, roles: ['admin', 'vendedor'] },
  { name: 'Devoluciones', href: '/devoluciones', icon: RotateCcw, roles: ['admin', 'vendedor'] },
  { name: 'Caja', href: '/caja', icon: Wallet, roles: ['admin'] },
  { name: 'Compras', href: '/compras', icon: TruckIcon, roles: ['admin'] },
  { name: 'Proveedores', href: '/proveedores', icon: Truck, roles: ['admin'] },
  { name: 'Etiquetas', href: '/etiquetas', icon: Tag, roles: ['admin', 'vendedor'] },
  { name: 'Usuarios', href: '/users', icon: UserCog, roles: ['admin'] },
]

const rolLabels: Record<string, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
}

interface LayoutProps {
  children: React.ReactNode
  user: { id: string; username: string; nombre: string; rol: string }
  onLogout: () => void
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  const location = useLocation()
  const { theme, toggle } = useTheme()
  const navigation = allNavigation.filter(item => item.roles.includes(user.rol))

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - siempre abierta, integrada al fondo */}
      <aside className="w-64 flex-shrink-0 bg-background flex flex-col">
        {/* Logo */}
        <div className="p-5">
          <div className="flex items-center gap-3">
            <img src="/nova-logo.png" alt="NOVA" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-foreground tracking-tight">NOVA</h1>
              <p className="text-[11px] text-muted-foreground font-medium">Sistema de Ventas</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm group border ${
                  isActive
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'border-transparent text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                <span className="font-medium text-sm truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4">
          <div className="h-px bg-border mx-4 mb-3" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-sm font-bold text-primary">{user.nombre.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.nombre}</p>
              <p className="text-xs text-muted-foreground">{rolLabels[user.rol] || user.rol}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-accent/50 hover:bg-accent/80 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all border border-border"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex-shrink-0 bg-background flex items-center justify-end px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Cambiar tema"
              className="w-9 h-9 mr-1 flex items-center justify-center rounded-xl border border-border bg-accent/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="w-8 h-8 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{user.nombre.charAt(0)}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground leading-tight">{user.nombre}</p>
              <p className="text-xs text-muted-foreground">{rolLabels[user.rol] || user.rol}</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
