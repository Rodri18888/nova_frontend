import { useState } from 'react'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import api from '@/lib/api'

interface UserSession {
  id: string; username: string; nombre: string; rol: string
}

interface LoginProps {
  onLogin: (user: UserSession) => void
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await api.auth.login({ username, password }) as UserSession
      localStorage.setItem('nova_user', JSON.stringify(user))
      onLogin(user)
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#2B2B2B] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-300/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-amber-300/20 blur-3xl rounded-full" />
            <img src="/nova-logo.png" alt="NOVA" className="relative w-20 h-20 rounded-2xl object-cover mx-auto shadow-2xl ring-1 ring-amber-300/40" />
          </div>
          <h1 className="text-4xl font-light text-foreground tracking-[0.3em]">NOVA</h1>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent mx-auto mt-3 mb-3" />
          <p className="text-xs text-amber-300/80 tracking-[0.2em] uppercase">Sistema de Ventas Profesional</p>
        </div>

        <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-border">
          <h2 className="text-xl font-light text-foreground mb-1 tracking-wide">Bienvenido</h2>
          <p className="text-muted-foreground text-sm mb-8">Ingresa tus credenciales para continuar</p>

          {error && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-destructive rounded-full flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 tracking-wider uppercase">Usuario</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  placeholder="Tu usuario"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 tracking-wider uppercase">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-12 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  placeholder="Tu contraseña"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-xl transition-all duration-300 disabled:opacity-50 hover:bg-primary/90 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>
          
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-8 tracking-wider">&copy; 2026 NOVA</p>
      </div>
    </div>
  )
}
