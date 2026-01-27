import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, RefreshCw, X, Circle } from 'lucide-react';

const DashboardPage = () => {
    const { t } = useTranslation();

    const SummaryCard = ({ title, amount }) => (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between h-32">
            <h3 className="text-gray-600 font-medium text-sm">{title}</h3>
            <div className="text-2xl font-bold text-indigo-700 dir-ltr text-right rtl:text-left">
                {amount}
            </div>
        </div>
    );

    const ActivityCard = ({ title, emptyText }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-64">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
                <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Circle size={6} fill="currentColor" /> {t('dashboard.live')}
                </span>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 text-center">
                <p className="text-gray-400 text-sm">{emptyText}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{t('sidebar.dashboard')}</h1>
                {/* Simple TopBar replacement for context */}
                <div className="flex gap-4">
                    {/* Language toggle Placeholder if needed, but relying on browser/default for now */}
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 relative">
                <button className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-blue-400 hover:text-blue-600">
                    <X size={16} />
                </button>
                <div className="flex gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg h-fit text-blue-600">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-800 mb-1">{t('dashboard.invoice_templates')}</h3>
                        <p className="text-sm text-blue-600 leading-relaxed max-w-3xl">
                            {t('dashboard.invoice_templates_desc')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Time Filter & Update Info */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                    <span>{t('dashboard.last_30_days')}</span>
                    <span className="text-gray-300">|</span>
                    <span>{t('dashboard.last_update')} {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    title={t('dashboard.sales')}
                    amount="0.00 EGP" // Simplified for static view, can be dynamic
                />
                <SummaryCard
                    title={t('dashboard.client_payments')}
                    amount="0.00 EGP"
                />
                <SummaryCard
                    title={t('dashboard.profit')}
                    amount="0.00 EGP"
                />
            </div>

            {/* Recent Activity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ActivityCard
                    title={t('dashboard.latest_invoices')}
                    emptyText={t('dashboard.no_invoices')}
                />
                <ActivityCard
                    title={t('dashboard.latest_clients')}
                    emptyText={t('dashboard.no_clients')}
                />
                <ActivityCard
                    title={t('dashboard.latest_client_payments')}
                    emptyText={t('dashboard.no_client_payments')}
                />
            </div>

            {/* Low Stock Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-50">
                    <h3 className="font-bold text-gray-800 text-sm">{t('dashboard.low_inventory')}</h3>
                </div>
                <div className="p-8 text-center bg-gray-50/50">
                    <p className="text-gray-500 text-sm">{t('dashboard.no_low_inventory')}</p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
