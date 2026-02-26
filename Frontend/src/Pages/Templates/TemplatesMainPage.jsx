import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, FileText, Receipt, Tag } from 'lucide-react';

const cards = [
    {
        title: 'القوالب العامة',
        desc: 'تصميم قوالب عامة للفواتير والتقارير',
        icon: FileText,
        to: '/dashboard/templates/general',
        color: 'text-blue-600 bg-blue-50',
    },
    {
        title: 'قوالب الفواتير',
        desc: 'تصميم قوالب خاصة بالفواتير الضريبية',
        icon: Receipt,
        to: '/dashboard/templates/invoices',
        color: 'text-emerald-600 bg-emerald-50',
    },
    {
        title: 'ملصقات المنتجات',
        desc: 'تصميم ملصقات الباركود والأسعار',
        icon: Tag,
        to: '/dashboard/templates/product-labels',
        color: 'text-purple-600 bg-purple-50',
    },
];

const TemplatesMainPage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    return (
        <div className="min-h-screen bg-[#dce3ed] p-6" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Breadcrumb */}
            <div className="flex items-center justify-end gap-1 mb-6">
                <Link to="/dashboard" className="flex items-center justify-center w-9 h-9 rounded bg-white border border-gray-200 hover:bg-gray-50 shadow-sm">
                    <Home size={16} className="text-gray-500" />
                </Link>
                <span className="px-3 h-9 flex items-center rounded bg-white border border-gray-200 text-sm font-semibold text-gray-800 shadow-sm">
                    تصاميم القوالب
                </span>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.to}
                            to={card.to}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group"
                        >
                            <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-4`}>
                                <Icon size={24} />
                            </div>
                            <h3 className="text-base font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">
                                {card.title}
                            </h3>
                            <p className="text-sm text-gray-500">{card.desc}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default TemplatesMainPage;
