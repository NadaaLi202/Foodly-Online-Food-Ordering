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
    ShieldCheck,
    Settings,
    LayoutTemplate
} from 'lucide-react';
import { useAuth } from '../context/authcontext';

import logo from '../assets/sidebarlogo.jpg';


const Sidebar = ({ isMobile, isOpen }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [openMenu, setOpenMenu] = useState(null);
    const [openChildMenu, setOpenChildMenu] = useState(null);
    const isSuperAdmin = user?.role === 'superAdmin';
    const canAccessBackups = isSuperAdmin || user?.role === 'company' || user?.systemRole === 'companyOwner';
    const adminRoles = ['superAdmin', 'admin', 'company', 'manager'];
    const isAdmin = adminRoles.includes(user?.role);

    const syncMenusFromPath = (path) => {
        if (path.startsWith('/dashboard/accounting')) setOpenMenu((m) => (m === 'accounting' ? m : 'accounting'));
        else if (path.startsWith('/dashboard/reports')) setOpenMenu((m) => (m === 'reports' ? m : 'reports'));
        else if (path.startsWith('/super-admin')) setOpenMenu((m) => (m === 'superAdmin' ? m : 'superAdmin'));
        else if (path.startsWith('/settings')) setOpenMenu((m) => (m === 'settings' ? m : 'settings'));
        else if (path.startsWith('/dashboard/finance')) setOpenMenu((m) => (m === 'finance' ? m : 'finance'));

    };

    useEffect(() => {
        // Keep accordion sections in sync with direct URL navigation.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        syncMenusFromPath(location.pathname);
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
                    { key: 'requisitions', path: '/dashboard/finance/requisitions' },
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
                { key: 'cost_centers', path: '/dashboard/accounting/cost-centers' },
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
                { key: 'accounting_reports', path: '/dashboard/reports/accounting' },
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
            adminOnly: true,
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
            adminOnly: true,
            children: [
                { key: 'branches_list', path: '/dashboard/branches/list' },
                { key: 'partners_lists', path: '/dashboard/branches/partner-lists' },
                { key: 'activities', path: '/dashboard/branches/businesses' },
            ]
        },
        {
            key: 'settings',
            icon: Settings,
            path: '/settings/general',
            hasSub: true,
            adminOnly: true,
            children: [
                { key: 'settings_general', path: '/settings/general' },
                { key: 'settings_sales', path: '/settings/sales' },
                { key: 'settings_purchases', path: '/settings/purchases' },
                { key: 'settings_customers', path: '/settings/customers' },
                { key: 'settings_suppliers', path: '/settings/suppliers' },
                { key: 'settings_accounting', path: '/settings/accounting' },
                { key: 'settings_taxes', path: '/settings/taxes' },
                { key: 'settings_einvoice', path: '/settings/einvoice' },
                { key: 'settings_import', path: '/settings/import' },
                { key: 'settings_export', path: '/settings/export' },
                { key: 'settings_coding', path: '/settings/coding' },
                { key: 'settings_api', path: '/settings/api' },
                ...(canAccessBackups ? [{ key: 'settings_backups', path: '/settings/backups' }] : []),
            ]
        },
        {
            key: 'templates',
            icon: LayoutTemplate,
            path: '/dashboard/templates',
            hasSub: true,
            adminOnly: true,
            children: [
                { key: 'general_templates', path: '/dashboard/templates/general' },
                { key: 'invoice_templates', path: '/dashboard/templates/invoices' },
                { key: 'product_labels', path: '/dashboard/templates/product-labels' },
            ]
        },
    ];

    const sidebarClasses = isMobile
        ? `fixed top-0 bottom-0 z-50 w-64 bg-[#0097A7] text-white transition-transform duration-300 ease-in-out ltr:left-0 rtl:right-0 print:hidden ${isOpen ? 'translate-x-0 shadow-2xl' : 'ltr:-translate-x-full rtl:translate-x-full'
        }`
        : 'w-64 bg-[#0097A7] text-white min-h-screen flex flex-col transition-all duration-300 print:hidden';

    const isPathActive = (path) => location.pathname === path;
    const isChildGroupActive = (children = []) => children.some((child) => isPathActive(child.path));

    return (
        <aside className={sidebarClasses}>
            <div className="p-4 flex items-center justify-center border-b border-white/15">
                <img src={logo} alt={t('app_name')} className="h-24 w-auto object-contain rounded-lg" />
            </div>

            <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto pt-2 font-sans">
                {navItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
                    return (
                        <div key={item.key}>
                            {/* لو ليه children → زرار بس */}
                            {item.hasSub ? (
                                <div className="flex flex-col">
                                    <div className={`flex items-center rounded-md transition-colors ${location.pathname === item.path ? 'bg-[#1d9fe0] text-white' : 'text-cyan-50 hover:bg-[#7dd3fc] hover:text-slate-900 hover:bg-opacity-90'}`}>
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
                                            ? 'bg-[#1d9fe0] text-white'
                                            : 'text-cyan-50 hover:bg-[#7dd3fc] hover:text-slate-900 hover:bg-opacity-90'
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
                                        child.hasSub ? (
                                            <div key={child.key} className="flex flex-col">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenChildMenu(openChildMenu === `${item.key}-${child.key}` ? null : `${item.key}-${child.key}`)}
                                                    className={`flex items-center w-full text-xs font-medium rounded px-2 py-1 transition-colors ${isChildGroupActive(child.children)
                                                        ? 'text-white bg-[#1d9fe0]'
                                                        : 'text-cyan-50 hover:bg-[#7dd3fc] hover:text-slate-900'
                                                        }`}
                                                >
                                                    <span className="flex-1 text-start">{child.label || t(`sidebar.${child.key}`)}</span>
                                                    <Play
                                                        className={`rtl:rotate-180 h-3.5 w-3.5 flex-shrink-0 transition-transform duration-150 ease-in-out ${openChildMenu === `${item.key}-${child.key}` ? 'rotate-90' : ''}`}
                                                        size={14}
                                                        fill="currentColor"
                                                    />
                                                </button>

                                                {openChildMenu === `${item.key}-${child.key}` && (
                                                    <div className="ms-4 mt-1 flex flex-col space-y-0.5">
                                                        {child.children.map((subChild) => (
                                                            <NavLink
                                                                key={subChild.key}
                                                                to={subChild.path}
                                                                className={({ isActive }) =>
                                                                    `text-xs font-medium rounded px-2 py-1 transition-colors ${isActive
                                                                        ? 'text-white bg-[#1d9fe0]'
                                                                        : 'text-cyan-50 hover:bg-[#7dd3fc] hover:text-slate-900'
                                                                        }`
                                                                }
                                                            >
                                                                {subChild.label || t(`sidebar.${subChild.key}`)}
                                                            </NavLink>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <NavLink
                                                key={child.key}
                                                to={child.path}
                                                className={({ isActive }) =>
                                                    `text-xs font-medium rounded px-2 py-1 transition-colors ${isActive
                                                        ? 'text-white bg-[#1d9fe0]'
                                                        : 'text-cyan-50 hover:bg-[#7dd3fc] hover:text-slate-900'
                                                        }`
                                                }
                                            >
                                                {child.label || t(`sidebar.${child.key}`)}
                                            </NavLink>
                                        )
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
            <div className="h-20 bg-gradient-to-t from-[#007c8a] to-transparent opacity-40 pointer-events-none" />
        </aside>
    );
};

export default Sidebar;
