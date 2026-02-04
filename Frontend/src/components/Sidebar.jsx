import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, NavLink } from 'react-router-dom';
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
    FileText,
    Settings,
    Headphones,
    Play,
    LogOut
} from 'lucide-react';

import logo from '../assets/SidebarLogo.jpg';

const Sidebar = ({ isMobile, isOpen, onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { key: 'dashboard', icon: Home, path: '/dashboard' },
        {
            key: 'sales',
            icon: ShoppingCart,
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
            key: 'inventory', icon: Package, hasSub: true, children: [
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
            hasSub: true,
            children: [
                { key: 'invoices', path: '/dashboard/purchases/invoices' },
                { key: 'credit_notes', path: '/dashboard/purchases/credit-notes' },
                { key: 'purchase_requests', path: '/dashboard/purchases/requests' },
                { key: 'suppliers', path: '/dashboard/purchases/suppliers' },
                { key: 'payments', path: '/dashboard/purchases/payments' },
            ]
        },
        {
            key: 'finance',
            icon: Banknote,
            hasSub: true,
            children: [
                { key: 'expenses', path: '/dashboard/finance/expenses' },
                { key: 'transactions', path: '/dashboard/finance/transactions' },
                { key: 'requisitions', path: '/dashboard/finance/requisitions' },
                { key: 'safes', path: '/dashboard/finance/safes' },
                { key: 'bank_accounts', path: '/dashboard/finance/bank-accounts' },
            ]
        },
      { key: 'accounting', icon: Scale, path: '/accounting', hasSub: true },
      { key: 'reports', icon: BarChart3, path: '/reports', hasSub: true },
      {
         key: 'users', icon: Users, hasSub: true, children: [
             { key: 'users', path: '/users' },
             { key: 'roles', path: '/users/roles' }
          ]
      },
    {
        key: 'branches', icon: Building2, hasSub: true, children: [
            { key: 'branches_list', path: '/branches' },
            { key: 'partners_lists', path: '/branches/partner-lists' },
            { key: 'activities', path: '/branches/businesses' },
        ]
    },
      { key: 'templates', icon: FileText, path: '/templates', hasSub: true },
      { key: 'settings', icon: Settings, path: '/settings', hasSub: true },
      { key: 'support', icon: Headphones, path: '/support' },
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
                    if (item.key === 'support') {
                        return (
                            <div key={item.key} className="pt-2 mt-auto pb-2">
                                <a
                                    href="https://api.whatsapp.com/send/?phone=966114977231&type=phone_number&app_absent=0"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group w-full flex items-center px-2 py-1.5 text-sm font-semibold rounded-md text-indigo-100 bg-indigo-600 hover:bg-opacity-50 transition-colors"
                                >
                                    <item.icon className="me-3 flex-shrink-0 h-4 w-4 animate-flash" />
                                    <span>{t(`sidebar.${item.key}`)}</span>
                                </a>
                            </div>
                        );
                    }

                    return (
                        <div key={item.key}>
                            {/* لو ليه children → زرار بس */}
                            {item.hasSub ? (
                                <button
                                    onClick={() => setOpenMenu(openMenu === item.key ? null : item.key)}
                                    className="group w-full flex items-center ps-2 pe-1 py-1.5 text-start text-sm font-semibold rounded-md text-indigo-100 hover:bg-indigo-600 hover:bg-opacity-75 transition-colors"
                                >
                                    <item.icon className="me-3 flex-shrink-0 h-5 w-5" strokeWidth={1.5} />
                                    <span className="flex-1">{t(`sidebar.${item.key}`)}</span>

                                    <Play
                                        className={`rtl:rotate-180 ms-3 h-4 w-4 flex-shrink-0 transition-transform duration-150 ease-in-out text-current ${openMenu === item.key ? 'rotate-90' : ''
                                            }`}
                                        size={16}
                                        fill="currentColor"
                                    />
                                </button>
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
                                            {t(`sidebar.${child.key}`)}
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
