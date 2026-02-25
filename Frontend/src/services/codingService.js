import api from './api';

const codingService = {
    getRules: async (entity) => {
        const response = await api.get(`/coding/${entity}`);
        return response.data;
    },
    updateRules: async (entity, data) => {
        const response = await api.put(`/coding/${entity}`, data);
        return response.data;
    },
    updateBranchSequence: async (entity, data) => {
        const response = await api.patch(`/coding/${entity}/sequence`, data);
        return response.data;
    }
};

export default codingService;
