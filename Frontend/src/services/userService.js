import api from './api';

const getAllUsers = async () => {
    const response = await api.get('/users/all');
    return response.data;
};

const getUser = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

const createUser = async (data) => {
    const response = await api.post('/users', data);
    return response.data;
};

const updateUser = async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
};

const deleteUser = async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};

export default {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
};
