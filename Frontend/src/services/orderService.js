import api from './api';

export const orderService = {
  create: (payload) => api.post('/orders', payload),
  myOrders: () => api.get('/orders/my-orders'),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};
