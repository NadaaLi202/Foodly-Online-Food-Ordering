import api from './api';

const importService = {
    importProducts: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/import/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    importCustomers: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/import/customers', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    importSuppliers: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/import/suppliers', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export default importService;
