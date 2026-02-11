import api from './api';

const getAllPartnerLists = async () => {
    const response = await api.get('/partner-lists');
    return response.data;
};

const getPartnerListById = async (id) => {
    const response = await api.get(`/partner-lists/${id}`);
    return response.data;
};

const createPartnerList = async (data) => {
    const response = await api.post('/partner-lists', data);
    return response.data;
};

const updatePartnerList = async (id, data) => {
    const response = await api.put(`/partner-lists/${id}`, data);
    return response.data;
};

const deletePartnerList = async (id) => {
    const response = await api.delete(`/partner-lists/${id}`);
    return response.data;
};

export default {
    getAllPartnerLists,
    getPartnerListById,
    createPartnerList,
    updatePartnerList,
    deletePartnerList,
};
