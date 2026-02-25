import api from './api';

const apiClientService = {
    getAll: async () => {
        const response = await api.get('/api-clients');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/api-clients', data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/api-clients/${id}`);
        return response.data;
    },
    regenerateToken: async (id) => {
        const response = await api.patch(`/api-clients/${id}/token`);
        return response.data;
    }
};

export default apiClientService;
