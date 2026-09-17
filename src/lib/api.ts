const BASE = import.meta.env.VITE_API_URL || "";

async function apiFetch(path: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers,
      credentials: "include",
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("nova_user");
        window.location.reload();
        throw new Error("Sesión expirada");
      }
      const err = await res
        .json()
        .catch(() => ({ error: "Error del servidor" }));
      throw new Error(err.error || `API error: ${res.status}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadCsv(url: string, filename: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error al descargar" }));
    throw new Error(err.error || `Error: ${res.status}`);
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const api = {
  
  auth: {
    login: async (data: { username: string; password: string; captchaToken?: string | null }) => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Error del servidor" }));
        throw new Error(err.error || "Credenciales inválidas");
      }
      const result = await res.json();
      return result.user;
    },
    register: async (data: { nombre: string; username?: string; email: string; password: string; storeCode?: string; storeName?: string; captchaToken?: string | null }) => {
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Error del servidor" }));
        throw new Error(err.error || "No se pudo registrar");
      }
      const result = await res.json();
      return result.user;
    },
    googleLogin: async (data: { credential: string }) => {
      const res = await fetch(`${BASE}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Error del servidor" }));
        throw new Error(err.error || "No se pudo iniciar sesión con Google");
      }
      const result = await res.json();
      return result.user;
    },
    logout: async () => {
      await fetch(`${BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    },
        forgotPassword: async (email: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(`${BASE}/api/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: "Error del servidor" }));
          throw new Error(err.error || "No se pudo enviar el correo");
        }
        return res.json();
      } catch (err: any) {
        if (err.name === "AbortError") {
          throw new Error("El servidor tardó demasiado en responder. Revisa tu conexión o intenta más tarde.");
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    },
    resetPassword: async (token: string, newPassword: string) => {
      const res = await fetch(`${BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Error del servidor" }));
        throw new Error(err.error || "No se pudo restablecer la contraseña");
      }
      return res.json();
    },
  },
  users: {
    list: () => apiFetch("/api/users"),
    create: (data: {
      username: string;
      password: string;
      nombre: string;
      email: string;
      rol: string;
    }) =>
      apiFetch("/api/users", { method: "POST", body: JSON.stringify(data) }),
    update: (data: { id: string } & Record<string, unknown>) =>
      apiFetch(`/api/users/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => apiFetch(`/api/users/${id}`, { method: "DELETE" }),
  },
  products: {
    list: () => apiFetch("/api/products"),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/products", { method: "POST", body: JSON.stringify(data) }),
    update: (data: { id: string } & Record<string, unknown>) =>
      apiFetch(`/api/products/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch(`/api/products/${id}`, { method: "DELETE" }),
    updateStock: (id: string, quantity: number) =>
      apiFetch(`/api/products/${id}/stock`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      }),
  },
  customers: {
    list: () => apiFetch("/api/customers"),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (data: { id: string } & Record<string, unknown>) =>
      apiFetch(`/api/customers/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch(`/api/customers/${id}`, { method: "DELETE" }),
  },
  sales: {
    list: (params: { page?: number; limit?: number; search?: string; from?: string; to?: string } = {}) => {
      const qs = new URLSearchParams();
      if (params.page) qs.set("page", String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      if (params.search) qs.set("search", params.search);
      if (params.from) qs.set("from", params.from);
      if (params.to) qs.set("to", params.to);
      const query = qs.toString();
      return apiFetch(`/api/sales${query ? `?${query}` : ""}`);
    },
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/sales", { method: "POST", body: JSON.stringify(data) }),
    getById: (id: string) => apiFetch(`/api/sales/${id}`),
    anular: (id: string, motivo: string) =>
      apiFetch(`/api/sales/${id}/anular`, {
        method: "PUT",
        body: JSON.stringify({ motivo }),
      }),
  },
  devolutions: {
    list: () => apiFetch("/api/devolutions"),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/devolutions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  suppliers: {
    list: () => apiFetch("/api/suppliers"),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (data: { id: string } & Record<string, unknown>) =>
      apiFetch(`/api/suppliers/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch(`/api/suppliers/${id}`, { method: "DELETE" }),
  },
  purchases: {
    list: () => apiFetch("/api/purchases"),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/purchases", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      apiFetch(`/api/purchases/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
  },
  cashRegister: {
    getCurrent: () => apiFetch("/api/cashregister/current"),
    getHistory: () => apiFetch("/api/cashregister/history"),
    open: (data: { initialAmount: number }) =>
      apiFetch("/api/cashregister/open", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    close: (data: { realAmount: number }) =>
      apiFetch("/api/cashregister/close", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    movement: (data: { type: string; amount: number; reason: string }) =>
      apiFetch("/api/cashregister/movement", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  inventory: {
    movements: () => apiFetch("/api/inventory/movements"),
    createMovement: (data: {
      productId: string;
      type: string;
      quantity: number;
      reason: string;
    }) =>
      apiFetch("/api/inventory/movements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  dashboard: {
    stats: () => apiFetch("/api/dashboard/stats"),
  },
  store: {
    getConfig: () => apiFetch("/api/store/config"),
    updateConfig: (data: Record<string, unknown>) =>
      apiFetch("/api/store/config", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
  backup: {
    create: () => apiFetch("/api/backup", { method: "POST" }),
    list: () => apiFetch("/api/backup/list"),
  },
  export: {
    sales: async () => downloadCsv(`${BASE}/api/export/sales`, "ventas.csv"),
    products: async () =>
      downloadCsv(`${BASE}/api/export/products`, "productos.csv"),
  },
};

export default api;
