import api from './api';

const getAllActivities = async () => {
    const response = await api.get('/activities');
    return response.data;
};

const getActivityById = async (id) => {
    const response = await api.get(`/activities/${id}`);
    return response.data;
};

const createActivity = async (data) => {
    const response = await api.post('/activities', data);
    return response.data;
};

const updateActivity = async (id, data) => {
    const response = await api.put(`/activities/${id}`, data);
    return response.data;
};

const deleteActivity = async (id) => {
    const response = await api.delete(`/activities/${id}`);
    return response.data;
};

export default {
    getAllActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
};
