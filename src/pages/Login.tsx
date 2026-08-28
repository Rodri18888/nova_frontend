import { useState } from 'react'
import { Eye, EyeOff, Lock, User, Sun, Moon, MailOpen, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import ReCAPTCHA from 'react-google-recaptcha'
import { useTheme } from '@/hooks/use-theme'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

interface UserSession {
  id: string; username: string; nombre: string; rol: string; storeId: string; storeName: string
}

interface LoginProps {
  onLogin: (user: UserSession) => void
}

export function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [subMode, setSubMode] = useState<'join' | 'create'>('join')
  const { theme, toggle } = useTheme()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [storeCode, setStoreCode] = useState('')
  const [storeName, setStoreName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = mode === 'login'
        ? await api.auth.login({ username, password, captchaToken })
        : await api.auth.register({
            nombre, email, password, captchaToken,
            ...(subMode === 'create'
              ? { storeName, storeCode }
              : { username, storeCode }),
          }) as UserSession
      localStorage.setItem('nova_user', JSON.stringify(user))
      onLogin(user)
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)
    try {
      await api.auth.forgotPassword(forgotEmail)
      setForgotSent(true)
    } catch (err: any) {
      setForgotError(err.message || 'No se pudo enviar el correo')
    } finally {
      setForgotLoading(false)
    }
  }

  const closeForgot = () => {
    setShowForgot(false)
    setTimeout(() => { setForgotSent(false); setForgotEmail(''); setForgotError('') }, 300)
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
          <h2 className="text-xl font-light text-foreground mb-1 tracking-wide">Bienvenido</h2>
          <p className="text-muted-foreground text-sm mb-8">Ingresa tus credenciales para continuar</p>

          {error && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-destructive rounded-full flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setCaptchaToken(null) }}
              className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${mode === 'login' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setCaptchaToken(null) }}
              className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${mode === 'register' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setSubMode('join'); setError('') }}
                    className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${subMode === 'join' ? 'bg-accent/70 text-accent-foreground border border-border' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                  >
                    Unirme a una tienda
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSubMode('create'); setError('') }}
                    className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${subMode === 'create' ? 'bg-accent/70 text-accent-foreground border border-border' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                  >
                    Crear mi tienda
                  </button>
                </div>

                {subMode === 'create' && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2 tracking-wider uppercase">Nombre de la tienda</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full h-12 px-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                      placeholder="Mi Tienda"
                      required
                    />
                  </div>
                )}
              </>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 tracking-wider uppercase">Código de tienda</label>
                <input
                  type="text"
                  value={storeCode}
                  onChange={(e) => setStoreCode(e.target.value)}
                  className="w-full h-12 px-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  placeholder={subMode === 'create' ? 'Código único de tu tienda' : 'Código de la tienda'}
                  required
                />
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 tracking-wider uppercase">{subMode === 'create' ? 'Nombre del dueño' : 'Nombre completo'}</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full h-12 px-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 tracking-wider uppercase">Usuario</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  placeholder={subMode === 'create' ? 'Tu usuario (opcional)' : 'Tu usuario'}
                  required={subMode !== 'create'}
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 tracking-wider uppercase">{subMode === 'create' ? 'Correo del dueño' : 'Correo electrónico'}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  placeholder="Tu correo electrónico"
                  required
                />
              </div>
            )}

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

            <div className="flex justify-center pt-1">
              <ReCAPTCHA sitekey={SITE_KEY} onChange={setCaptchaToken} />
            </div>

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-xl transition-all duration-300 disabled:opacity-50 hover:bg-primary/90 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {mode === 'login' ? 'Ingresando...' : 'Registrando...'}
                </span>
              ) : mode === 'login' ? 'Ingresar' : 'Registrarse'}
            </button>
          </form>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="block mx-auto mt-5 text-xs text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-8 tracking-wider">&copy; 2026 NOVA</p>
      </div>

      <Dialog open={showForgot} onOpenChange={(open) => !open && closeForgot()}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-light tracking-wide">
              {forgotSent ? 'Revisa tu correo' : 'Recuperar contraseña'}
            </DialogTitle>
          </DialogHeader>

          {forgotSent ? (
            <div className="space-y-5 pt-1">
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <CheckCircle2 className="w-12 h-12 text-success" />
                <p className="text-sm text-muted-foreground">
                  Si <span className="text-foreground font-medium">{forgotEmail}</span> está registrado,
                  te enviamos un enlace para restablecer tu contraseña.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForgot}
                className="w-full h-11 bg-success/20 text-emerald-700 dark:text-emerald-300 border border-success/40 hover:bg-success/30 font-medium rounded-xl transition-all"
              >
                Volver al login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-5 pt-1">
              <p className="text-sm text-muted-foreground">
                Escribe el correo asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              {forgotError && (
                <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full flex-shrink-0" />
                  {forgotError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 tracking-wider uppercase">Correo electrónico</label>
                <div className="relative group">
                  <MailOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                    placeholder="tu correo electrónico"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeForgot}
                  className="flex-1 h-11 bg-destructive/15 text-red-700 dark:text-red-300 border border-destructive/40 hover:bg-destructive/25 font-medium rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 h-11 bg-success/20 text-emerald-700 dark:text-emerald-300 border border-success/40 hover:bg-success/30 font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}