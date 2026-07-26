import client from './client';

// Auth
export const authApi = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
};

// Dashboard
export const dashboardApi = {
  getStats: () => client.get('/dashboard/stats'),
};

// Products
export const productsApi = {
  list: (params) => client.get('/products', { params }),
  get: (id) => client.get(`/products/${id}`),
  create: (data) => client.post('/products', data),
  update: (id, data) => client.put(`/products/${id}`, data),
  delete: (id) => client.delete(`/products/${id}`),
  getCategories: () => client.get('/products/categories'),
};

// Suppliers
export const suppliersApi = {
  list: () => client.get('/suppliers'),
  get: (id) => client.get(`/suppliers/${id}`),
  create: (data) => client.post('/suppliers', data),
  update: (id, data) => client.put(`/suppliers/${id}`, data),
  delete: (id) => client.delete(`/suppliers/${id}`),
};

// Inventory
export const inventoryApi = {
  list: () => client.get('/inventory'),
  updateStock: (productId, data) => client.patch(`/inventory/${productId}`, data),
  getHistory: (productId) => client.get(`/inventory/${productId}/history`),
};

// Sales
export const salesApi = {
  record: (data) => client.post('/sales', data),
  list: (params) => client.get('/sales', { params }),
  getToday: () => client.get('/sales/today'),
  getChart: (productId, days) => client.get(`/sales/chart/${productId}`, { params: { days } }),
};

// Forecasts
export const forecastsApi = {
  generate: (productId, sendAlerts) =>
    client.post('/forecasts/generate', null, {
      params: { ...(productId && { product_id: productId }), send_alerts: sendAlerts },
    }),
  list: () => client.get('/forecasts'),
  get: (productId) => client.get(`/forecasts/${productId}`),
};

// Purchase Orders
export const ordersApi = {
  list: (params) => client.get('/purchase-orders', { params }),
  get: (id) => client.get(`/purchase-orders/${id}`),
  create: (data) => client.post('/purchase-orders', data),
  confirm: (id) => client.patch(`/purchase-orders/${id}/confirm`),
  deliver: (id) => client.patch(`/purchase-orders/${id}/deliver`),
  reject: (id) => client.patch(`/purchase-orders/${id}/reject`),
  delete: (id) => client.delete(`/purchase-orders/${id}`),
};

// WhatsApp Demo
export const whatsappApi = {
  sendAlert: (productId) =>
    client.post('/whatsapp/demo/send-alert', null, { params: { product_id: productId } }),
  reply: (poNumber, reply) =>
    client.post('/whatsapp/demo/reply', null, { params: { po_number: poNumber, reply } }),
};
