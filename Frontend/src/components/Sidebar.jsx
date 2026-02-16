import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import {
    Home,
    ShoppingCart,
    Package,
    Truck,
    Banknote,
    Scale,
    BarChart3,
    Users,
    Building2,
    Play,
    LogOut,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import logo from '../assets/SidebarLogo.jpg';


const Sidebar = ({ isMobile, isOpen, onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [openMenu, setOpenMenu] = useState(null);
    const isSuperAdmin = user?.role === 'superAdmin';

    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith('/dashboard/accounting')) setOpenMenu((m) => (m === 'accounting' ? m : 'accounting'));
        else if (path.startsWith('/dashboard/reports')) setOpenMenu((m) => (m === 'reports' ? m : 'reports'));
        else if (path.startsWith('/super-admin')) setOpenMenu((m) => (m === 'superAdmin' ? m : 'superAdmin'));
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Build navItems dynamically based on user role
    const superAdminItems = isSuperAdmin ? [
        {
            key: 'superAdmin',
            label: t('superAdmin.dashboard'),
            icon: ShieldCheck,
            hasSub: true,
            children: [
                { key: 'superAdminDashboard', label: t('superAdmin.dashboard'), path: '/super-admin' },
                { key: 'companies', label: t('superAdmin.companies'), path: '/super-admin/companies' },
            ]
        },
    ] : [];

    const navItems = [
        ...superAdminItems,
        { key: 'dashboard', icon: Home, path: '/dashboard' },
        {
            key: 'sales',
            icon: ShoppingCart,
            path: '/dashboard/sales',
            hasSub: true,
            children: [
                { key: 'invoices', path: '/dashboard/sales/invoices' },
                { key: 'returns', path: '/dashboard/sales/returns' },
                { key: 'quotations', path: '/dashboard/sales/quotations' },
                { key: 'customers', path: '/dashboard/sales/customers' },
                { key: 'payments', path: '/dashboard/sales/payments' },
            ]
        },
        {
            key: 'inventory', icon: Package, path: '/dashboard/inventory', hasSub: true, children: [
                { key: 'products', path: '/dashboard/inventory/products' },
                { key: 'categories', path: '/dashboard/inventory/categories' },
                { key: 'operations', path: '/dashboard/inventory/operations' },
                { key: 'permissions', path: '/dashboard/inventory/permissions' },
                { key: 'warehouses', path: '/dashboard/inventory/warehouses' },
                { key: 'inventories', path: '/dashboard/inventory/inventories' },
            ]
        },
        {
            key: 'purchases',
            icon: Truck,
            path: '/dashboard/purchases',
            hasSub: true,
            children: [
                { key: 'invoices', path: '/dashboard/purchases/invoices' },
                { key: 'purchase_returns', path: '/dashboard/purchases/returns' },
                { key: 'purchase_requests', path: '/dashboard/purchases/requests' },
                { key: 'suppliers', path: '/dashboard/purchases/suppliers' },
                { key: 'payments', path: '/dashboard/purchases/payments' },
            ]
        },
        {
            key: 'finance',
            icon: Banknote,
            path: '/dashboard/finance',
            hasSub: true,
            children: [
                { key: 'expenses', path: '/dashboard/finance/expenses' },
                { key: 'transactions', path: '/dashboard/finance/transactions' },
                { key: 'requisitions', path: '/dashboard/finance/permissions' },
                { key: 'safes', path: '/dashboard/finance/safes' },
                { key: 'bank_accounts', path: '/dashboard/finance/bank-accounts' },
            ]
        },
        {
            key: 'accounting',
            icon: Scale,
            path: '/dashboard/accounting',
            hasSub: true,
            children: [
                { key: 'journal_entries', path: '/dashboard/accounting/journal-entries' },
                { key: 'chart_of_accounts', path: '/dashboard/accounting/chart-of-accounts' },
            ]
        },
        {
            key: 'reports',
            icon: BarChart3,
            path: '/dashboard/reports',
            hasSub: true,
            children: [
                { key: 'sales_reports', path: '/dashboard/reports/sales' },
                { key: 'purchases_reports', path: '/dashboard/reports/purchases' },
                { key: 'clients_reports', path: '/dashboard/reports/clients' },
                { key: 'suppliers_reports', path: '/dashboard/reports/suppliers' },
                { key: 'inventory_reports', path: '/dashboard/reports/inventory' },
            ]
        },
        {
            key: 'users',
            icon: Users,
            path: '/dashboard/users',
            hasSub: true,
            children: [
                { key: 'users', path: '/dashboard/users/list' },
                { key: 'roles', path: '/dashboard/users/roles' }
            ]
        },
        {
            key: 'branches',
            icon: Building2,
            path: '/dashboard/branches',
            hasSub: true,
            children: [
                { key: 'branches_list', path: '/dashboard/branches/list' },
                { key: 'partners_lists', path: '/dashboard/branches/partner-lists' },
                { key: 'activities', path: '/dashboard/branches/businesses' },
            ]
        },
    ];

    const sidebarClasses = isMobile
        ? `fixed top-0 bottom-0 z-50 w-64 bg-indigo-700 text-white transition-transform duration-300 ease-in-out ltr:left-0 rtl:right-0 ${isOpen ? 'translate-x-0 shadow-2xl' : 'ltr:-translate-x-full rtl:translate-x-full'
        }`
        : 'w-64 bg-indigo-700 text-white min-h-screen flex flex-col transition-all duration-300';

    return (
        <aside className={sidebarClasses}>
            <div className="p-4 flex items-center justify-center border-b border-indigo-600/30">
                <img src={logo} alt={t('app_name')} className="h-24 w-auto object-contain rounded-lg" />
            </div>

            <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto pt-2 font-sans">
                {navItems.map((item) => {
                    return (
                        <div key={item.key}>
                            {/* لو ليه children → زرار بس */}
                            {item.hasSub ? (
                                <div className="flex flex-col">
                                    <div className={`flex items-center rounded-md transition-colors ${location.pathname === item.path ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-600 hover:bg-opacity-75'}`}>
                                        <NavLink
                                            to={item.path}
                                            className="flex-1 flex items-center ps-2 py-1.5 text-start text-sm font-semibold"
                                        >
                                            <item.icon className="me-3 flex-shrink-0 h-5 w-5" strokeWidth={1.5} />
                                            <span className="flex-1">{item.label || t(`sidebar.${item.key}`)}</span>
                                        </NavLink>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setOpenMenu(openMenu === item.key ? null : item.key);
                                            }}
                                            className="px-2 py-1.5"
                                        >
                                            <Play
                                                className={`rtl:rotate-180 h-4 w-4 flex-shrink-0 transition-transform duration-150 ease-in-out text-current ${openMenu === item.key ? 'rotate-90' : ''}`}
                                                size={16}
                                                fill="currentColor"
                                            />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* لو مفيش children → NavLink زي ما هو */
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `group w-full flex items-center ps-2 pe-1 py-1.5 text-start text-sm font-semibold rounded-md transition-colors ${isActive
                                            ? 'bg-indigo-800 text-white'
                                            : 'text-indigo-100 hover:bg-indigo-600 hover:bg-opacity-75'
                                        }`
                                    }
                                >
                                    <item.icon className="me-3 flex-shrink-0 h-5 w-5" strokeWidth={1.5} />
                                    <span className="flex-1">{t(`sidebar.${item.key}`)}</span>
                                </NavLink>
                            )}

                            {/* children */}
                            {item.children && openMenu === item.key && (
                                <div className="ms-9 mt-1 flex flex-col space-y-0.5">
                                    {item.children.map((child) => (
                                        <NavLink
                                            key={child.key}
                                            to={child.path}
                                            className={({ isActive }) =>
                                                `text-xs font-medium rounded px-2 py-1 ${isActive ? 'text-white bg-indigo-800' : 'text-indigo-200'
                                                } hover:text-white hover:bg-indigo-600 transition-colors`
                                            }
                                        >
                                            {child.label || t(`sidebar.${child.key}`)}
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    );

                })}

                <div className="pt-2 mt-auto pb-2">
                    <button
                        onClick={handleLogout}
                        className="group w-full flex items-center px-2 py-1.5 text-sm font-semibold rounded-md text-red-100 bg-red-600 hover:bg-opacity-80 transition-colors"
                    >
                        <LogOut className="me-3 flex-shrink-0 h-4 w-4" />
                        <span>{t('sidebar.sign_out') || 'Sign Out'}</span>
                    </button>
                </div>
            </nav>

            {/* Decorative gradient at bottom */}
            <div className="h-20 bg-gradient-to-t from-indigo-800 to-transparent opacity-50 pointer-events-none" />
        </aside>
    );
};

export default Sidebar;
