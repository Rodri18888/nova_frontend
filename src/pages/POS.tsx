import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Banknote, Receipt, User, Package, Loader2, CheckCircle, Percent } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { Factura } from '@/components/Factura'
import { useToast } from '@/hooks/use-toast'
import type { UserSession } from '@/App'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

interface Product { id: string; name: string; sku: string; barcode?: string; price: number; stock: number; size: string | null; color: string | null }
interface Customer { id: string; name: string; phone: string | null }
interface CartItem { product: Product; quantity: number; discount: number }

function StripeCardField({ onReady }: { onReady: (el: any) => void }) {
  const elements = useElements()
  useEffect(() => {
    if (elements) onReady(elements.getElement(CardElement))
  }, [elements, onReady])
  return (
    <CardElement
      options={{ style: { base: { fontSize: '16px' } } }}
    />
  )
}

export function POS({ user: _user }: { user: UserSession }) {
  const { addToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo')
  const [processing, setProcessing] = useState(false)
  const [cardElement, setCardElement] = useState<any>(null)
  const [saleSuccess, setSaleSuccess] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [showFactura, setShowFactura] = useState(false)
  const [confirmCheckout, setConfirmCheckout] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!saleSuccess && !showFactura && searchRef.current) {
      searchRef.current.focus()
    }
  }, [saleSuccess, showFactura])

  async function loadData() {
    try {
      const [p, c] = await Promise.all([api.products.list(), api.customers.list()])
      setProducts((p as Product[]).filter((p: any) => p.stock > 0))
      setCustomers(c as Customer[])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))

  const addToCart = (product: Product) => {
    const existing = cart.find(i => i.product.id === product.id)
    if (existing) {
      if (existing.quantity < product.stock) setCart(cart.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
      else addToast({ title: 'Stock insuficiente', description: `${product.name} solo tiene ${product.stock} unidades`, variant: 'warning' })
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }])
    }
    setSearchTerm('')
    searchRef.current?.focus()
  }

  const updateQuantity = (productId: string, change: number) => {
    setCart(cart.map(i => {
      if (i.product.id === productId) {
        const newQ = i.quantity + change
        if (newQ <= 0) return null
        if (newQ > i.product.stock) return i
        return { ...i, quantity: newQ }
      }
      return i
    }).filter(Boolean) as CartItem[])
  }

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(cart.map(i => i.product.id === productId ? { ...i, discount: Math.max(0, Math.min(discount, i.product.price)) } : i))
  }

  const removeFromCart = (productId: string) => setCart(cart.filter(i => i.product.id !== productId))

  const subtotal = cart.reduce((sum, i) => sum + ((i.product.price - i.discount) * i.quantity), 0)
  const discountTotal = cart.reduce((sum, i) => sum + (i.discount * i.quantity), 0) + globalDiscount
  const taxable = subtotal - globalDiscount
  const tax = taxable * 0.19
  const total = taxable + tax

  const requestCheckout = () => {
    if (cart.length === 0 || processing) return
    setConfirmCheckout(true)
  }

  const handleCheckout = async () => {
    setConfirmCheckout(false);
    if (cart.length === 0 || processing) return;
    setProcessing(true);
    try {
      let paymentIntentId: string | undefined;
      if (paymentMethod === "Tarjeta") {
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe no cargó");
        if (!cardElement) throw new Error("Ingresa los datos de la tarjeta");
        const { clientSecret } = await api.payments.createIntent(total);
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: { card: cardElement },
          },
        );
        if (error) throw new Error(error.message);
        paymentIntentId = paymentIntent.id;
      }

      const sale = await api.sales.create({
        customerId: selectedCustomer?.id || null,
        paymentMethod,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
          discount: i.discount,
        })),
        subtotal,
        tax,
        total,
        discount: discountTotal,
        paymentIntentId,
      });
      setLastSale(sale);
      setSaleSuccess(true);
      setTimeout(() => {
        setCart([]);
        setSelectedCustomer(null);
        setCustomerSearch("");
        setGlobalDiscount(0);
        setSaleSuccess(false);
        setShowFactura(true);
        loadData();
      }, 1500);
    } catch (err: any) {
      addToast({
        title: "Error al procesar la venta",
        description: err.message,
        variant: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm) {
      const product = filteredProducts[0]
      if (product) addToCart(product)
    }
    if (e.key === 'F2') {
      e.preventDefault()
      requestCheckout()
    }
    if (e.key === 'Escape') {
      setSearchTerm('')
      searchRef.current?.focus()
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /><span className="ml-2 text-muted-foreground">Cargando productos...</span></div>

  if (showFactura && lastSale) {
    return <Factura sale={lastSale} onClose={() => { setShowFactura(false); setLastSale(null) }} />
  }

  if (saleSuccess) return (
    <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
      <div className="text-center"><CheckCircle className="w-20 h-20 text-success mx-auto mb-4" /><h2 className="text-2xl font-bold text-foreground mb-2">¡Venta Registrada!</h2><p className="text-muted-foreground">Procesando...</p></div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6" onKeyDown={handleKeyDown}>
      <div className="flex-1 flex flex-col">
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Buscar productos por nombre, SKU o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-violet-400/10 border border-violet-400/20 rounded-xl mb-3 flex items-center justify-center">
                    <Package className="w-12 h-12 text-violet-300/80" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {product.size || "-"} / {product.color || "-"}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Precio</p>
                      <span className="text-lg font-bold text-violet-300">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <span
                        className={`font-semibold text-sm ${product.stock < 10 ? "text-destructive" : "text-foreground"}`}
                      >
                        {product.stock}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="w-96 bg-card rounded-2xl shadow-xl flex flex-col border border-border">
        <div className="p-6 border-b bg-primary/15 border-primary/25 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Carrito</h2>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {cart.length} artículos
          </p>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Carrito vacío</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3 bg-muted/50 rounded-xl space-y-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-400/20 border border-violet-400/30 rounded-lg flex items-center justify-center text-violet-200 font-bold text-sm">
                    {item.product.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.product.price)} c/u
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-7 h-7 bg-muted rounded-full flex items-center justify-center hover:bg-accent"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-medium text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-7 h-7 bg-primary/20 text-primary rounded-full flex items-center justify-center hover:bg-primary/30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Percent className="w-3 h-3 text-muted-foreground" />
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) =>
                        updateItemDiscount(
                          item.product.id,
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-16 h-7 text-xs text-right border rounded px-1"
                      min="0"
                      step="10"
                    />
                  </div>
                  <span className="font-semibold text-sm">
                    {formatCurrency(
                      (item.product.price - item.discount) * item.quantity,
                    )}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t space-y-3">
          {paymentMethod === "Tarjeta" && (
            <div>
              <Elements stripe={stripePromise}>
                <StripeCardField onReady={setCardElement} />
              </Elements>
              <p className="text-[11px] text-muted-foreground mt-2">
                Prueba: 4242 4242 4242 4242 · cualquier fecha futura · CVC 123
              </p>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Cliente
            </label>
            <Input
              placeholder="Buscar cliente..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setSelectedCustomer(null);
              }}
              className="h-9 text-sm"
            />
            {customerSearch &&
              !selectedCustomer &&
              filteredCustomers.length > 0 && (
                <div className="mt-1 bg-card border border-border rounded-lg shadow-lg max-h-32 overflow-auto">
                  {filteredCustomers.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch(c.name);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-accent/50 text-sm"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Descuento</span>
                <span>-{formatCurrency(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>IVA (19%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["Efectivo", "Tarjeta", "Transferencia"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${paymentMethod === m ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {m === "Efectivo" ? (
                  <Banknote className="w-4 h-4 mx-auto mb-1" />
                ) : m === "Tarjeta" ? (
                  <CreditCard className="w-4 h-4 mx-auto mb-1" />
                ) : (
                  <Receipt className="w-4 h-4 mx-auto mb-1" />
                )}
                {m}
              </button>
            ))}
          </div>

          <Button
            onClick={requestCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full h-12 bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-300 border border-emerald-400/30"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Receipt className="w-5 h-5 mr-2" />
            )}
            {processing ? "Procesando..." : "Cobrar (F2)"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCheckout}
        onOpenChange={setConfirmCheckout}
        title="Cobrar venta"
        description={`${cart.length} artículo(s) por un total de ${formatCurrency(total)}. Método de pago: ${paymentMethod}.`}
        confirmText="Cobrar"
        onConfirm={handleCheckout}
      />
    </div>
  );
}
