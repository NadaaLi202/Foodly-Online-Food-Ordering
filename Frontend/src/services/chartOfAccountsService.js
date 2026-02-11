import api from './api';

const getAllAccounts = async (params = {}) => {
    const response = await api.get('/chart-of-accounts', { params });
    return response.data;
};

const getAccountById = async (id) => {
    const response = await api.get(`/chart-of-accounts/${id}`);
    return response.data;
};

const createAccount = async (data) => {
    const response = await api.post('/chart-of-accounts', data);
    return response.data;
};

const updateAccount = async (id, data) => {
    const response = await api.put(`/chart-of-accounts/${id}`, data);
    return response.data;
};

const deleteAccount = async (id) => {
    const response = await api.delete(`/chart-of-accounts/${id}`);
    return response.data;
};

export default {
    getAllAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    deleteAccount,
};
