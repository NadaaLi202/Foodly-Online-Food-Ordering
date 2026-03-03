import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logError from "../utils/logError";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        const storedRole = localStorage.getItem("role");

        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setUser(JSON.parse(storedUser));
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
        sessionStorage.removeItem("superAdminToken");
        sessionStorage.removeItem("superAdminUser");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        navigate("/login");
    };

    const value = {
        user,
        token,
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
