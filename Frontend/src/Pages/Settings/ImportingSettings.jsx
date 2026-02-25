import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Package, Users, UserPlus, Home, RefreshCw } from 'lucide-react';

const ImportingSettings = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRTL = i18n.language === 'ar';

    const cards = [
        {
            id: 'products',
            title: t('import_settings.import_products'),
            icon: <Package size={32} className="text-blue-500" />,
            bgColor: 'bg-blue-50',
            path: '/settings/import/products'
        },
        {
            id: 'clients',
            title: t('import_settings.import_clients'),
            icon: <Users size={32} className="text-emerald-500" />,
            bgColor: 'bg-emerald-50',
            path: '/settings/import/customers'
        },
        {
            id: 'suppliers',
            title: t('import_settings.import_suppliers'),
            icon: <UserPlus size={32} className="text-purple-500" />,
            bgColor: 'bg-purple-50',
            path: '/settings/import/suppliers'
        }
    ];

    return (
        <div className="p-6 bg-[#F8F9FA] min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-gray-200 rounded overflow-hidden h-10 shadow-sm px-2 gap-2">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="text-gray-400 hover:text-gray-600 px-1 border-l border-gray-100 last:border-l-0"
                        >
                            <Home size={18} />
                        </button>
                        <div className="flex items-center text-[#4B5563] font-medium text-sm gap-1">
                            <span className="text-gray-400">{t('sidebar.settings')}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-700 font-bold">{t('import_settings.title')}</span>
                        </div>
                        <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 px-1 border-r border-gray-100 first:border-r-0"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Cards Container */}
            <div className="max-w-4xl mx-auto space-y-4">
                {cards.map((card) => (
                    <button
                        key={card.id}
                        onClick={() => navigate(card.path)}
                        className="w-full bg-white border border-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                    >
                        <div className={`${card.bgColor} p-4 rounded-xl transition-transform group-hover:scale-110`}>
                            {card.icon}
                        </div>
                        <span className="text-lg font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">
                            {card.title}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ImportingSettings;
