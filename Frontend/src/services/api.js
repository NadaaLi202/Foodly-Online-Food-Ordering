import axios from "axios";

export const BASE_URL = "http://localhost:4000/api/v1";

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Automatically remove companyId from request payload
    if (config.data) {
        if (config.data instanceof FormData) {
            config.data.delete('companyId');
        } else if (typeof config.data === 'object') {
            delete config.data.companyId;
        }
    }

    // Automatically remove companyId from query parameters
    if (config.params && typeof config.params === 'object') {
        delete config.params.companyId;
    }

    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
