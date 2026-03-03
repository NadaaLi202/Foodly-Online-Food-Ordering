import api from './api';

const getAllCostCenters = async (params = {}) => {
    const response = await api.get('/cost-centers', { params });
    return response.data;
};

const getParentCostCenters = async () => {
    const response = await api.get('/cost-centers/parents');
    return response.data;
};

const createCostCenter = async (data) => {
    const response = await api.post('/cost-centers', data);
    return response.data;
};

const updateCostCenter = async (id, data) => {
    const response = await api.put(`/cost-centers/${id}`, data);
    return response.data;
};

const deleteCostCenter = async (id) => {
    const response = await api.delete(`/cost-centers/${id}`);
    return response.data;
};

export default {
    getAllCostCenters,
    getParentCostCenters,
    createCostCenter,
    updateCostCenter,
    deleteCostCenter
};
