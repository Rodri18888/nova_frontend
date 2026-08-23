import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Inventory } from './pages/Inventory'
import { POS } from './pages/POS'
import { Sales } from './pages/Sales'
import { Customers } from './pages/Customers'
import { Users } from './pages/Users'
import { Devoluciones } from './pages/Devoluciones'
import { Caja } from './pages/Caja'
import { Compras } from './pages/Compras'
import { Proveedores } from './pages/Proveedores'

import { Toaster } from './components/ui/toaster'
import { ToastProvider } from './hooks/use-toast'

export interface UserSession {
  id: string
  username: string
  nombre: string
  rol: string
}

function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center animate-in">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <img src="/nova-logo.png" alt="NOVA" className="relative w-24 h-24 rounded-2xl object-cover mx-auto shadow-2xl ring-1 ring-primary/40" />
        </div>
        <h1 className="text-4xl font-light text-foreground tracking-[0.3em] mb-3">NOVA</h1>
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent mx-auto mb-4" />
        <p className="text-xs text-primary/80 tracking-[0.2em] uppercase">Sistema de Ventas</p>
        <div className="flex items-center justify-center gap-1.5 mt-8">
          <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('nova_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch { localStorage.removeItem('nova_user') }
    }
    setTimeout(() => setLoading(false), 600)
  }, [])

  const handleLogin = (u: UserSession) => setUser(u)
  const handleLogout = () => {
    localStorage.removeItem('nova_user')
    localStorage.removeItem('nova_token')
    setUser(null)
  }

  if (loading) return <SplashScreen />

  if (!user) return <Login onLogin={handleLogin} />

  return (
    <ToastProvider>
      <Router>
        <Layout user={user} onLogout={handleLogout}>
          <div className="animate-in">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products user={user} />} />
              <Route path="/inventory" element={<Inventory user={user} />} />
              <Route path="/pos" element={<POS user={user} />} />
              <Route path="/sales" element={<Sales user={user} />} />
              <Route path="/customers" element={<Customers />} />
              {user.rol === 'admin' && <Route path="/users" element={<Users />} />}
              <Route path="/devoluciones" element={<Devoluciones user={user} />} />
              <Route path="/caja" element={<Caja user={user} />} />
              <Route path="/compras" element={<Compras user={user} />} />
              <Route path="/proveedores" element={<Proveedores />} />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Layout>
      </Router>
      <Toaster />
    </ToastProvider>
  )
}

export default App
