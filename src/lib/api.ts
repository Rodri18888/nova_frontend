const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const TOKEN_KEY = 'nova_token'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

async function apiFetch(path: string, options?: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers,
      signal: controller.signal,
      ...options,
    })
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('nova_user')
        window.location.reload()
        throw new Error('Sesión expirada')
      }
      const err = await res.json().catch(() => ({ error: 'Error del servidor' }))
      throw new Error(err.error || `API error: ${res.status}`)
    }
    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

async function downloadCsv(url: string, filename: string) {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al descargar' }))
    throw new Error(err.error || `Error: ${res.status}`)
  }
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

const api = {
  auth: {
    login: async (data: { username: string; password: string }) => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error del servidor' }))
        throw new Error(err.error || 'Credenciales inválidas')
      }
      const result = await res.json()
      localStorage.setItem(TOKEN_KEY, result.token)
      return result.user
    },
  },
  users: {
    list: () => apiFetch('/api/users'),
    create: (data: { username: string; password: string; nombre: string; rol: string }) =>
      apiFetch('/api/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: { id: string } & Record<string, unknown>) =>
      apiFetch(`/api/users/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/users/${id}`, { method: 'DELETE' }),
  },
  products: {
    list: () => apiFetch('/api/products'),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: { id: string } & Record<string, unknown>) =>
      apiFetch(`/api/products/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/products/${id}`, { method: 'DELETE' }),
    updateStock: (id: string, quantity: number) =>
      apiFetch(`/api/products/${id}/stock`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  },
  categories: {
    list: () => apiFetch('/api/categories'),
    create: (data: { name: string }) =>
      apiFetch('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name: string }) =>
      apiFetch(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/categories/${id}`, { method: 'DELETE' }),
  },
  customers: {
    list: () => apiFetch('/api/customers'),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: { id: string } & Record<string, unknown>) =>
      apiFetch(`/api/customers/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/customers/${id}`, { method: 'DELETE' }),
  },
  sales: {
    list: () => apiFetch('/api/sales'),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/sales', { method: 'POST', body: JSON.stringify(data) }),
    getById: (id: string) => apiFetch(`/api/sales/${id}`),
    anular: (id: string, motivo: string) =>
      apiFetch(`/api/sales/${id}/anular`, { method: 'PUT', body: JSON.stringify({ motivo }) }),
  },
  devolutions: {
    list: () => apiFetch('/api/devolutions'),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/devolutions', { method: 'POST', body: JSON.stringify(data) }),
  },
  suppliers: {
    list: () => apiFetch('/api/suppliers'),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: { id: string } & Record<string, unknown>) =>
      apiFetch(`/api/suppliers/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/suppliers/${id}`, { method: 'DELETE' }),
  },
  purchases: {
    list: () => apiFetch('/api/purchases'),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/purchases', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      apiFetch(`/api/purchases/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  },
  cashRegister: {
    getCurrent: () => apiFetch('/api/cashregister/current'),
    getHistory: () => apiFetch('/api/cashregister/history'),
    open: (data: { initialAmount: number }) =>
      apiFetch('/api/cashregister/open', { method: 'POST', body: JSON.stringify(data) }),
    close: (data: { realAmount: number }) =>
      apiFetch('/api/cashregister/close', { method: 'POST', body: JSON.stringify(data) }),
    movement: (data: { type: string; amount: number; reason: string }) =>
      apiFetch('/api/cashregister/movement', { method: 'POST', body: JSON.stringify(data) }),
  },
  inventory: {
    movements: () => apiFetch('/api/inventory/movements'),
    createMovement: (data: { productId: string; type: string; quantity: number; reason: string }) =>
      apiFetch('/api/inventory/movements', { method: 'POST', body: JSON.stringify(data) }),
  },
  dashboard: {
    stats: () => apiFetch('/api/dashboard/stats'),
  },
  store: {
    getConfig: () => apiFetch('/api/store/config'),
    updateConfig: (data: Record<string, unknown>) =>
      apiFetch('/api/store/config', { method: 'PUT', body: JSON.stringify(data) }),
  },
  backup: {
    create: () => apiFetch('/api/backup', { method: 'POST' }),
    list: () => apiFetch('/api/backup/list'),
  },
  export: {
    sales: async () => downloadCsv(`${BASE}/api/export/sales`, 'ventas.csv'),
    products: async () => downloadCsv(`${BASE}/api/export/products`, 'productos.csv'),
  },
}

export default api
