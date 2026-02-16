import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    TrendingUp,
    ShoppingBag,
    BookOpen,
    Users,
    Truck,
    Package,
    ChevronRight
} from 'lucide-react';

const ReportsMainPage = () => {
    const { t } = useTranslation();

    const reportCategories = [
        {
            id: 'sales',
            title: t('sidebar.sales_reports'),
            description: t('reports.sales.description', 'View sales and revenue insights'),
            icon: TrendingUp,
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-600',
            link: '/dashboard/reports/sales',
        },
        {
            id: 'purchases',
            title: t('sidebar.purchases_reports'),
            description: t('reports.purchases.description', 'Track your spending and suppliers'),
            icon: ShoppingBag,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            link: '/dashboard/reports/purchases',
        },
        {
            id: 'clients',
            title: t('sidebar.clients_reports'),
            description: t('reports.clients.client_general_ledger_desc', 'Monitor customer balances and history'),
            icon: Users,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            link: '/dashboard/reports/clients',
        },
        {
            id: 'suppliers',
            title: t('sidebar.suppliers_reports'),
            description: t('reports.suppliers.supplier_general_ledger_desc', 'Manage supplier payments and ledgers'),
            icon: Truck,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            link: '/dashboard/reports/suppliers',
        },
        {
            id: 'inventory',
            title: t('sidebar.inventory_reports'),
            description: t('reports.inventory.inventory_value_desc', 'Overview of stock levels and valuations'),
            icon: Package,
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            link: '/dashboard/reports/inventory',
        },
    ];

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportCategories.map((category) => (
                    <Link
                        key={category.id}
                        to={category.link}
                        className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden"
                    >
                        {/* Decorative background circle */}
                        <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-110 ${category.iconBg}`} />

                        <div className={`p-4 rounded-xl ${category.iconBg} ${category.iconColor} transition-transform group-hover:-translate-y-1`}>
                            <category.icon className="w-8 h-8" />
                        </div>

                        <div className="flex-1 w-full">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                {category.title}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                {category.description}
                            </p>
                        </div>

                        <div className="w-full pt-4 mt-auto border-t border-gray-50 flex items-center justify-between text-indigo-600 font-medium">
                            <span className="text-sm">{t('reports.view_report', 'View Reports')}</span>
                            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ReportsMainPage;
