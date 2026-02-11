import api from './api';

const getAllJournalEntries = async () => {
    const response = await api.get('/daily-restrictions');
    return response.data;
};

const getJournalEntryById = async (id) => {
    const response = await api.get(`/daily-restrictions/${id}`);
    return response.data;
};

const createJournalEntry = async (data) => {
    const response = await api.post('/daily-restrictions', data);
    return response.data;
};

const updateJournalEntry = async (id, data) => {
    const response = await api.put(`/daily-restrictions/${id}`, data);
    return response.data;
};

const deleteJournalEntry = async (id) => {
    const response = await api.delete(`/daily-restrictions/${id}`);
    return response.data;
};

export default {
    getAllJournalEntries,
    getJournalEntryById,
    createJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
};
