import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logError from "../utils/logerror";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [companySettings, setCompanySettings] = useState({
        currency: localStorage.getItem('companyCurrency') || 'EGP',
        language: localStorage.getItem('i18nextLng') || 'ar',
        company_name: '',
        logo_path: '',
        tax_number: '',
        commercial_register: '',
        country: '',
        region: '',
        address: '',
        city: '',
        location: ''
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchCompanySettings = async () => {
        try {
            const response = await api.get('/settings?category=general');
            if (response.data.status === 'success' && response.data.data.settings) {
                const settings = response.data.data.settings;
                const newSettings = {
                    currency: settings.currency || 'EGP',
                    language: settings.language || 'ar',
                    company_name: settings.company_name || '',
                    logo_path: settings.logo_path || '',
                    tax_number: settings.tax_number || settings.taxNumber || '',
                    commercial_register: settings.commercial_register || settings.commercialRegister || '',
                    country: settings.country || '',
                    region: settings.region || '',
                    address: settings.address || settings.address_line_1 || '',
                    city: settings.city || '',
                    location: settings.location || ''
                };
                setCompanySettings(newSettings);
                localStorage.setItem('companyCurrency', newSettings.currency);
            }
        } catch (error) {
            logError("Failed to fetch company settings", error);
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setUser(JSON.parse(storedUser));
                fetchCompanySettings();
            } catch (e) {
                logError("Failed to parse user from local storage", e);
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                localStorage.removeItem("role");
            }
        }
        setLoading(false);
    }, []);

    const login = (userData, authToken) => {
        setToken(authToken);
        setUser(userData);
        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("role", userData?.role);
        fetchCompanySettings();
    };

    const loginAsCompany = (companyData, companyToken) => {
        const currentToken = localStorage.getItem("token");
        const currentUser = localStorage.getItem("user");
        if (currentToken && currentUser) {
            sessionStorage.setItem("superAdminToken", currentToken);
            sessionStorage.setItem("superAdminUser", currentUser);
        }
        login(companyData, companyToken);
    };

    const restoreSuperAdmin = () => {
        const savedToken = sessionStorage.getItem("superAdminToken");
        const savedUser = sessionStorage.getItem("superAdminUser");
        if (savedToken && savedUser) {
            try {
                login(JSON.parse(savedUser), savedToken);
                sessionStorage.removeItem("superAdminToken");
                sessionStorage.removeItem("superAdminUser");
                navigate("/super-admin/companies");
            } catch (e) {
                logError("Failed to restore SuperAdmin session", e);
            }
        }
    };

    const isImpersonating = () => Boolean(sessionStorage.getItem("superAdminToken"));

    const logout = () => {
        setToken(null);
        setUser(null);
        setCompanySettings({
            currency: 'EGP',
            language: 'ar',
            company_name: '',
            logo_path: '',
            tax_number: '',
            commercial_register: '',
            country: '',
            region: '',
            address: '',
            city: '',
            location: ''
        });
        sessionStorage.removeItem("superAdminToken");
        sessionStorage.removeItem("superAdminUser");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("companyCurrency");
        navigate("/login");
    };

    const updateCompanySettings = (newSettings) => {
        setCompanySettings(prev => ({ ...prev, ...newSettings }));
        if (newSettings.currency) {
            localStorage.setItem('companyCurrency', newSettings.currency);
        }
    };

    const value = {
        user,
        token,
        companySettings,
        updateCompanySettings,
        fetchCompanySettings,
        login,
        loginAsCompany,
        restoreSuperAdmin,
        isImpersonating,
        logout,
        isAuthenticated: !!token,
        role: user?.role,
        companyId: user?.companyId || user?._id,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
