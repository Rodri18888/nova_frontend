import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'

interface FacturaProps {
  sale: any
  onClose: () => void
}

interface StoreConfig {
  name: string
  rnc: string
  phone: string
  address: string
  taxRate: number
  slogan: string
}

export function Factura({ sale, onClose }: FacturaProps) {
  const [config, setConfig] = useState<StoreConfig>({
    name: 'MODAPOS', rnc: '123-456789', phone: '809-555-0000',
    address: 'Calle Principal #123, Santo Domingo', taxRate: 19, slogan: 'Sistema de Ventas para Tienda de Ropa',
  })

  useEffect(() => {
    api.store.getConfig().then(setConfig).catch(() => {})
  }, [])

  const handlePrint = () => window.print()

  return createPortal(
    <div id="factura-root" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="factura-overlay absolute inset-0" onClick={onClose} />
      <div className="factura-card relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="factura-header sticky top-0 z-10 bg-white border-b px-6 py-3 flex justify-between items-center rounded-t-2xl">
          <h3 className="font-semibold" style={{ color: '#111' }}>Factura</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">Imprimir</button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cerrar</button>
          </div>
        </div>

        <div className="p-8" id="factura-content" style={{ color: '#000' }}>
          <div className="text-center mb-6 pb-4" style={{ borderBottom: '2px solid #000' }}>
            <h1 className="text-2xl font-extrabold tracking-widest" style={{ color: '#000' }}>{config.name}</h1>
            <p className="text-sm mt-1" style={{ color: '#000' }}>{config.slogan}</p>
            <p className="text-xs mt-1" style={{ color: '#000' }}>RNC: {config.rnc} | Tel: {config.phone}</p>
            <p className="text-xs" style={{ color: '#000' }}>{config.address}</p>
          </div>

          <div className="flex justify-between mb-6 text-sm" style={{ color: '#000' }}>
            <div>
              <p><strong>Factura:</strong> {sale.invoice}</p>
              <p><strong>Fecha:</strong> {new Date(sale.createdAt).toLocaleDateString('es-DO')}</p>
              <p><strong>Hora:</strong> {new Date(sale.createdAt).toLocaleTimeString('es-DO')}</p>
            </div>
            <div className="text-right">
              <p><strong>Cliente:</strong> {sale.customer?.name || 'Cliente general'}</p>
              <p><strong>Vendedor:</strong> {sale.user?.nombre || 'N/A'}</p>
              <p><strong>Pago:</strong> {sale.paymentMethod}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-6" style={{ color: '#000' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th className="text-left py-2 font-bold" style={{ color: '#000' }}>Cant.</th>
                <th className="text-left py-2 font-bold" style={{ color: '#000' }}>Descripción</th>
                <th className="text-right py-2 font-bold" style={{ color: '#000' }}>P. Unit.</th>
                <th className="text-right py-2 font-bold" style={{ color: '#000' }}>Dto.</th>
                <th className="text-right py-2 font-bold" style={{ color: '#000' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px dashed #999', color: '#000' }}>
                  <td className="py-2" style={{ color: '#000' }}>{item.quantity}</td>
                  <td className="py-2" style={{ color: '#000' }}>{item.product?.name || 'N/A'}{item.product?.size ? ` (${item.product.size})` : ''}</td>
                  <td className="py-2 text-right" style={{ color: '#000' }}>{formatCurrency(item.price)}</td>
                  <td className="py-2 text-right" style={{ color: '#000' }}>{item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}</td>
                  <td className="py-2 text-right font-bold" style={{ color: '#000' }}>{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-72 space-y-1 text-sm" style={{ color: '#000' }}>
              <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(sale.subtotal)}</span></div>
              {sale.discount > 0 && <div className="flex justify-between" style={{ color: '#cc0000' }}><span>Descuento:</span><span>-{formatCurrency(sale.discount)}</span></div>}
              <div className="flex justify-between"><span>IVA ({config.taxRate}%):</span><span>{formatCurrency(sale.tax)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 mt-2" style={{ color: '#000', borderTop: '2px solid #000' }}><span>TOTAL:</span><span>{formatCurrency(sale.total)}</span></div>
            </div>
          </div>

          <div className="text-center mt-8 pt-4" style={{ borderTop: '1px dashed #999', color: '#000' }}>
            <p className="text-sm font-semibold" style={{ color: '#000' }}>¡Gracias por su compra!</p>
            <p className="text-xs mt-1" style={{ color: '#000' }}>Este documento es su comprobante de compra</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
