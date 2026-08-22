import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, Sun, Moon, CheckCircle2, XCircle } from 'lucide-react'
import api from '@/lib/api'
import { useTheme } from '@/hooks/use-theme'

export function ResetPassword() {
  const { token } = useParams<{ token: string }>()
  const { theme, toggle } = useTheme()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    if (password !== confirm) return setError('Las contraseñas no coinciden')
    setLoading(true)
    try {
      await api.auth.resetPassword(token!, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'No se pudo restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <button
        onClick={toggle}
        title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label="Cambiar tema"
        className="absolute top-6 right-6 z-20 w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-accent/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.06] rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <img src="/nova-logo.png" alt="NOVA" className="relative w-20 h-20 rounded-2xl object-cover mx-auto shadow-2xl ring-1 ring-primary/40" />
          </div>
          <h1 className="text-4xl font-light text-foreground tracking-[0.3em]">NOVA</h1>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent mx-auto mt-3 mb-3" />
          <p className="text-xs text-primary/80 tracking-[0.2em] uppercase">Sistema de Ventas Profesional</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-border">
          {!token ? (
            <InvalidToken message="Enlace inválido" detail="Falta el token de recuperación en la URL." />
          ) : success ? (
            <div className="text-center space-y-5 py-4">
              <CheckCircle2 className="w-14 h-14 text-success mx-auto" />
              <h2 className="text-xl font-light text-foreground tracking-wide">¡Contraseña actualizada!</h2>
              <p className="text-sm text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <Link
                to="/"
                className="inline-block w-full h-12 leading-[3rem] bg-primary text-primary-foreground font-medium rounded-xl transition-all hover:bg-primary/90"
              >
                Ir al login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-light text-foreground mb-1 tracking-wide">Restablecer contraseña</h2>
              <p className="text-muted-foreground text-sm mb-8">Crea una nueva contraseña para tu cuenta</p>

              {error && (
                <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2 tracking-wider uppercase">Nueva contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-11 pr-12 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                      placeholder="Mínimo 6 caracteres"
                      required
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2 tracking-wider uppercase">Confirmar contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                      placeholder="Repite la contraseña"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-xl transition-all duration-300 disabled:opacity-50 hover:bg-primary/90 mt-2"
                >
                  {loading ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-8 tracking-wider">&copy; 2026 NOVA</p>
      </div>
    </div>
  )
}

function InvalidToken({ message, detail }: { message: string; detail: string }) {
  return (
    <div className="text-center space-y-5 py-4">
      <XCircle className="w-14 h-14 text-destructive mx-auto" />
      <h2 className="text-xl font-light text-foreground tracking-wide">{message}</h2>
      <p className="text-sm text-muted-foreground">{detail} Solicita un nuevo enlace desde el login.</p>
      <Link
        to="/"
        className="inline-block w-full h-12 leading-[3rem] bg-primary text-primary-foreground font-medium rounded-xl transition-all hover:bg-primary/90"
      >
        Volver al login
      </Link>
    </div>
  )
}
