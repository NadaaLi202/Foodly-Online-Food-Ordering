import api from './api';

const getAllRoles = async (companyId = null) => {
    const params = companyId ? { companyId } : {};
    const response = await api.get('/roles', { params });
    return response.data;
};

const getRole = async (id) => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
};

const createRole = async (data) => {
    const response = await api.post('/roles', data);
    return response.data;
};

const updateRole = async (id, data) => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
};

const deleteRole = async (id) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
};

export default {
    getAllRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
};
