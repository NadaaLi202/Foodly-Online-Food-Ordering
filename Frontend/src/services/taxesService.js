import api from './api';

const getAllTaxes = async () => {
    const response = await api.get('/taxes');
    return response.data;
};

const createTax = async (data) => {
    const response = await api.post('/taxes', data);
    return response.data;
};

const updateTax = async (id, data) => {
    const response = await api.put(`/taxes/${id}`, data);
    return response.data;
};

const deleteTax = async (id) => {
    const response = await api.delete(`/taxes/${id}`);
    return response.data;
};

export default {
    getAllTaxes,
    createTax,
    updateTax,
    deleteTax,
};
