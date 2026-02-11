import api from './api';

const getAllBranches = async () => {
    const response = await api.get('/branches');
    return response.data;
};

const getBranchById = async (id) => {
    const response = await api.get(`/branches/${id}`);
    return response.data;
};

const createBranch = async (data) => {
    const response = await api.post('/branches', data);
    return response.data;
};

const updateBranch = async (id, data) => {
    const response = await api.put(`/branches/${id}`, data);
    return response.data;
};

const deleteBranch = async (id) => {
    const response = await api.delete(`/branches/${id}`);
    return response.data;
};

const getPartnerLists = async () => {
    const response = await api.get('/partner-lists');
    return response.data;
};

const getActivities = async () => {
    const response = await api.get('/activities');
    return response.data;
};

export default {
    getAllBranches,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch,
    getPartnerLists,
    getActivities,
};
