import client from '../client';

export const authAPI = {
  register:       (data) => client.post('/auth/register', data),
  login:          (data) => client.post('/auth/login', data),
  refresh:        (data) => client.post('/auth/refresh', data),
  logout:         ()     => client.post('/auth/logout'),
  sendOtp:        (data) => client.post('/auth/whatsapp/send-otp', data),
  verifyOtp:      (data) => client.post('/auth/whatsapp/verify-otp', data),
  getProfile:     ()     => client.get('/auth/me'),
};

export const dashboardAPI = {
  getStats:        ()         => client.get('/dashboard/stats'),
  getRecentSales:  ()         => client.get('/dashboard/recent-sales'),
  getLowStock:     ()         => client.get('/dashboard/low-stock-alerts'),
  getRevenueChart: (days=30)  => client.get(`/dashboard/revenue-chart?days=${days}`),
  getTopProducts:  (limit=5)  => client.get(`/dashboard/top-products?limit=${limit}`),
};

export const productsAPI = {
  getAll:       (params={}) => client.get('/products', { params }),
  create:       (data)      => client.post('/products', data),
  getById:      (id)        => client.get(`/products/${id}`),
  update:       (id, data)  => client.put(`/products/${id}`, data),
  delete:       (id)        => client.delete(`/products/${id}`),
  getLowStock:  ()          => client.get('/products/low-stock'),
  getCategories:()          => client.get('/products/categories'),
};

export const suppliersAPI = {
  getAll:   ()          => client.get('/suppliers'),
  create:   (data)      => client.post('/suppliers', data),
  getById:  (id)        => client.get(`/suppliers/${id}`),
  update:   (id, data)  => client.put(`/suppliers/${id}`, data),
  delete:   (id)        => client.delete(`/suppliers/${id}`),
};

export const inventoryAPI = {
  getAll:       ()              => client.get('/inventory'),
  adjustStock:  (id, data)      => client.patch(`/inventory/${id}/adjust`, data),
  restock:      (id, data)      => client.patch(`/inventory/${id}/restock`, data),
  getLogs:      (params={})     => client.get('/inventory/logs', { params }),
  getProductLogs:(id)           => client.get(`/inventory/${id}/logs`),
};

export const salesAPI = {
  getAll:       (params={})         => client.get('/sales', { params }),
  create:       (data)              => client.post('/sales', data),
  getById:      (id)                => client.get(`/sales/${id}`),
  delete:       (id)                => client.delete(`/sales/${id}`),
  getByProduct: (productId)         => client.get(`/sales/by-product/${productId}`),
  getSummary:   (from, to)          => client.get('/sales/summary', { params: { from, to } }),
};

export const purchaseOrdersAPI = {
  getAll:         (params={})  => client.get('/purchase-orders', { params }),
  create:         (data)       => client.post('/purchase-orders', data),
  getById:        (id)         => client.get(`/purchase-orders/${id}`),
  markDelivered:  (id)         => client.patch(`/purchase-orders/${id}/deliver`),
  cancel:         (id)         => client.patch(`/purchase-orders/${id}/cancel`),
};

export const forecastsAPI = {
  generate: ()   => client.post('/forecasts/generate'),
  getAll:   ()   => client.get('/forecasts'),
  getByProduct: (productId) => client.get(`/forecasts/${productId}`),
};

export const whatsappAPI = {
  simulate:    (data) => client.post('/whatsapp/demo/simulate', data),
  send:        (data) => client.post('/whatsapp/send', data),
  getLogs:     ()     => client.get('/whatsapp/logs'),
  getStatus:   ()     => client.get('/whatsapp/chatbot/status'),
};
