import api from './api';

const asProductFormData = (payload) => {
  const formData = new FormData();
  const imageFile = payload.imageFile?.[0];

  ['name', 'description', 'image', 'category', 'price', 'isAvailable'].forEach((key) => {
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
      formData.append(key, payload[key]);
    }
  });

  if (imageFile) {
    formData.append('imageFile', imageFile);
  }

  return formData;
};

export const productService = {
  list: (params = {}) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (payload) => api.post('/products', asProductFormData(payload)),
  update: (id, payload) => api.put(`/products/${id}`, asProductFormData(payload)),
  remove: (id) => api.delete(`/products/${id}`),
};
