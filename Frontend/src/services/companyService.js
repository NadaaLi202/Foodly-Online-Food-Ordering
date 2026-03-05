import api from './api';

const getAllCompanies = async () => {
    const response = await api.get('/companies');
    return response.data;
};

const getCompany = async (id) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
};

const getCompanyBySlug = async (slug) => {
    const response = await api.get(`/companies/slug/${slug}`);
    return response.data;
};

const checkSlug = async (slug) => {
    const response = await api.get(`/companies/check-slug/${slug}`);
    return response.data;
};

const signupCompany = async (data) => {
    const response = await api.post('/companies/signup', data);
    return response.data;
};

const createCompany = async (data) => {
    const config = data instanceof FormData ? {} : {};
    const response = await api.post('/companies', data, config);
    return response.data;
};

const updateCompany = async (id, data) => {
    const config = data instanceof FormData ? {} : {};
    const response = await api.put(`/companies/${id}`, data, config);
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

const impersonateCompany = async (companyId) => {
    const response = await api.post('/companies/impersonate', { companyId });
    return response.data;
};

const companySignIn = async (email, password) => {
    const response = await api.post('/auth/company/signIn', { email, password });
    return response.data;
};

const approveCompany = async (id) => {
    const response = await api.post(`/companies/${id}/approve`);
    return response.data;
};

const rejectCompany = async (id, reason) => {
    const response = await api.post(`/companies/${id}/reject`, { reason });
    return response.data;
};

const sendCredentials = async (companyId) => {
    const response = await api.post(`/companies/${companyId}/send-credentials`);
    return response.data;
};

export default {
    getAllCompanies,
    getCompany,
    getCompanyBySlug,
    checkSlug,
    signupCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    loginAsCompany,
    impersonateCompany,
    companySignIn,
    approveCompany,
    rejectCompany,
    sendCredentials,
};
