import axios from "axios";

export const BASE_URL = "http://localhost:4000/api/v1";

const api = axios.create({
    baseURL: BASE_URL,
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
        if (status === 401) {
            localStorage.clear();
            sessionStorage.removeItem("superAdminToken");
            sessionStorage.removeItem("superAdminUser");
            const from = window.location.pathname;
            const loginPath = from.startsWith("/super-admin") ? "/login" : "/login";
            window.location.href = `${loginPath}?redirect=${encodeURIComponent(from)}`;
        } else if (status === 403) {
            // Authorization failure - show message, avoid hard redirect
            const msg = error.response?.data?.message || "You are not authorized to perform this action.";
            if (typeof window !== "undefined" && !error.config?._handled403) {
                error.config = error.config || {};
                error.config._handled403 = true;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
