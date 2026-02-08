import api from './api';

const getAllCompanies = async () => {
    const response = await api.get('/companies');
    return response.data;
};

const getCompany = async (id) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
};

const createCompany = async (data) => {
    // data is FormData
    const response = await api.post('/companies', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const updateCompany = async (id, data) => {
    // data is FormData
    const response = await api.put(`/companies/${id}`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const deleteCompany = async (id) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
};

const loginAsCompany = async (id) => {
    const response = await api.post(`/companies/${id}/login`);
    return response.data;
};

export default {
    getAllCompanies,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    loginAsCompany,
};
