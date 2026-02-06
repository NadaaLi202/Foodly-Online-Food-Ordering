import React, { createContext, useContext, useState, useCallback } from 'react';

const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
    const [refreshHandler, setRefreshHandler] = useState(null);

    const registerRefresh = useCallback((handler) => {
        setRefreshHandler(() => handler);
    }, []);

    const unregisterRefresh = useCallback(() => {
        setRefreshHandler(null);
    }, []);

    const triggerRefresh = useCallback(() => {
        if (refreshHandler) {
            refreshHandler();
        }
    }, [refreshHandler]);

    return (
        <RefreshContext.Provider value={{ registerRefresh, unregisterRefresh, triggerRefresh, hasRefreshHandler: !!refreshHandler }}>
            {children}
        </RefreshContext.Provider>
    );
};

export const useRefresh = () => {
    const context = useContext(RefreshContext);
    if (!context) {
        throw new Error('useRefresh must be used within a RefreshProvider');
    }
    return context;
};
