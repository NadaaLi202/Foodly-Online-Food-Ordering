import api from './api';

const codingService = {
    getSettings: async (entity = 'invoices') => {
        const response = await api.get('/settings/coding', { params: { entity } });
        return response.data;
    },
    updateSettings: async (data) => {
        const response = await api.put('/settings/coding', data);
        return response.data;
    },
    updateBranchSequence: async (data) => {
        const response = await api.put('/settings/coding/sequence', data);
        return response.data;
    }
};

export default codingService;
