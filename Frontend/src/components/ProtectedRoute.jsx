import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authcontext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <span className="ml-3 font-bold text-lg">Loading...</span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {

        // Avoid infinite redirect loops if already on the target path
        if (user?.role === 'superAdmin' && !location.pathname.startsWith('/super-admin')) {
            return <Navigate to="/super-admin" replace />;
        } else if (user?.role !== 'superAdmin' && !location.pathname.startsWith('/dashboard')) {
            return <Navigate to="/dashboard" replace />;
        }

        // If we are already on the right "prefix" but still not authorized (e.g. employee trying to access admin subroute)
        // For now, allow through or redirect to a sub-home
        if (!children && !allowedRoles.includes(user?.role)) {
            // If we get here, it means we are in a nested route that is forbidden
            return <Navigate to={user?.role === 'superAdmin' ? "/super-admin" : "/dashboard"} replace />;
        }
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
