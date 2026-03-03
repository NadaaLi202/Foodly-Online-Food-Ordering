import axios from "axios";
import { API_BASE_URL } from "../config/api";

export const BASE_URL = API_BASE_URL;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

/** Get current user role from localStorage (used for SuperAdmin companyId pass-through) */
const getStoredUserRole = () => {
    try {
        const user = localStorage.getItem("user");
        if (!user) return null;
        const parsed = JSON.parse(user);
        return parsed?.role ?? null;
    } catch {
        return null;
    }
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const isSuperAdmin = getStoredUserRole() === "superAdmin";

    // SuperAdmin: allow companyId in query params and body for filtering / creating records for specific companies
    if (isSuperAdmin) {
        return config;
    }

    // User endpoints: allow companyId for superAdmin listing users by company (handled above)
    const isUserEndpoint = config.url?.startsWith('/users') || config.url === '/users';
    const isUserCreateOrUpdate = (config.method === 'post' || config.method === 'put') && isUserEndpoint;
    const isUserListWithCompany = config.method === 'get' && isUserEndpoint && config.params?.companyId;
    if (isUserCreateOrUpdate || isUserListWithCompany) {
        return config;
    }

    // Company users: strip companyId to prevent override (backend applies companyId from token)
    if (config.data) {
        if (config.data instanceof FormData) {
            config.data.delete('companyId');
        } else if (typeof config.data === 'object') {
            delete config.data.companyId;
        }
    }
    if (config.params && typeof config.params === 'object') {
        delete config.params.companyId;
    }

    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        const status = error.response?.status;
        const backendMessage = error.response?.data?.message;
        if (import.meta.env?.DEV && (status === 400 || status >= 500)) {
            console.warn("[API Error]", error.config?.method?.toUpperCase(), error.config?.url, status, backendMessage || error.message);
        }
        if (status === 401) {
            localStorage.clear();
            sessionStorage.removeItem("superAdminToken");
            sessionStorage.removeItem("superAdminUser");
            const from = window.location.pathname;
            const loginPath = from.startsWith("/super-admin") ? "/login" : "/login";
            window.location.href = `${loginPath}?redirect=${encodeURIComponent(from)}`;
        } else if (status === 403) {
            if (!error.config?._handled403) {
                error.config = error.config || {};
                error.config._handled403 = true;
                import('react-hot-toast').then(({ default: toast }) => {
                    toast.error('ليس لديك صلاحية للوصول لهذه الصفحة', {
                        id: 'forbidden-toast',
                        duration: 4000,
                    });
                });
            }
        }
        return Promise.reject(error);
    }
);

export default api;
