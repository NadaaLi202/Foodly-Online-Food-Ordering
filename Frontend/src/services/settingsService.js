import api from './api';

const getSettingsByCategory = async (category) => {
    const response = await api.get('/settings', { params: { category } });
    return response.data;
};

const updateSettingsByCategory = async (category, settings) => {
    const response = await api.patch(`/settings/${category}`, { settings });
    return response.data;
};

const getAccountingSettings = async () => {
    const response = await getSettingsByCategory('accounting');
    return response?.data?.settings || {};
};

export default {
    getSettingsByCategory,
    updateSettingsByCategory,
    getAccountingSettings
};
