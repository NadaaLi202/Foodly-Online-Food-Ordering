import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    FileText,
    FileCheck,
    FilePlus,
    RotateCcw,
    FileQuestion,
    Truck,
    CreditCard,
    ChevronRight
} from 'lucide-react';

const PurchasesMainPage = () => {
    const { t } = useTranslation();

    const sections = [
        {
            id: 'invoices',
            title: t('sidebar.invoices'),
            description: t('purchases.invoices.tile_desc'),
            icon: FileText,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            link: '/dashboard/purchases/invoices',
        },
        {
            id: 'purchase-orders',
            title: t('sidebar.purchase_orders'),
            description: t('purchases.purchase_orders.tile_desc'),
            icon: FilePlus,
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            link: '/dashboard/purchases/purchase-orders',
        },
        {
            id: 'returns',
            title: t('sidebar.purchase_returns'),
            description: t('purchases.returns.tile_desc'),
            icon: RotateCcw,
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-600',
            link: '/dashboard/purchases/returns',
        },
        {
            id: 'requests',
            title: t('sidebar.purchase_requests'),
            description: t('purchases.requests.tile_desc', 'Create and manage purchase requests'),
            icon: FileQuestion,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            link: '/dashboard/purchases/requests',
        },
        {
            id: 'suppliers',
            title: t('sidebar.suppliers'),
            description: t('purchases.suppliers.tile_desc'),
            icon: Truck,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            link: '/dashboard/purchases/suppliers',
        },
        {
            id: 'payments',
            title: t('sidebar.payments'),
            description: t('purchases.payments.tile_desc'),
            icon: CreditCard,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            link: '/dashboard/purchases/payments',
        },
    ];

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => (
                    <Link
                        key={section.id}
                        to={section.link}
                        className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden"
                    >
                        <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-110 ${section.iconBg}`} />

                        <div className={`p-4 rounded-xl ${section.iconBg} ${section.iconColor} transition-transform group-hover:-translate-y-1`}>
                            <section.icon className="w-8 h-8" />
                        </div>

                        <div className="flex-1 w-full text-start">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                {section.title}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                {section.description}
                            </p>
                        </div>

                        <div className="w-full pt-4 mt-auto border-t border-gray-50 flex items-center justify-between text-indigo-600 font-medium">
                            <span className="text-sm">{t('topbar.view', 'View')}</span>
                            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default PurchasesMainPage;
