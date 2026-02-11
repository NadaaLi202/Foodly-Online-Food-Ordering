import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, CreditCard, TrendingUp, BarChart3, List } from 'lucide-react';

const PurchasesReportsPage = () => {
    const { t } = useTranslation();

    const reportSections = [
        {
            id: 'purchases',
            title: t('sidebar.purchases_reports') || t('purchases'),
            description: t('reports.purchases.description') || t('purchases'),
            icon: FileText,
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-500',
            summaryLink: '/dashboard/reports/purchases/summary',
            detailedLink: '/dashboard/reports/purchases/detailed',
        },
        {
            id: 'payments',
            title: t('reports.payments.title'),
            description: t('reports.payments.description'),
            icon: CreditCard,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            summaryLink: '/dashboard/reports/purchases/payments-summary',
            detailedLink: '/dashboard/reports/purchases/payments-detailed',
        },
    ];

    return (
        <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {reportSections.map((section, index) => (
                    <div
                        key={section.id}
                        className={`flex items-center justify-between p-6 ${index !== reportSections.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${section.iconBg}`}>
                                <section.icon className={`w-6 h-6 ${section.iconColor}`} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{section.title}</h3>
                                <p className="text-sm text-gray-500">{section.description}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                to={section.summaryLink}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                            >
                                <BarChart3 className="w-4 h-4" />
                                {t('reports.summary')}
                            </Link>
                            <Link
                                to={section.detailedLink}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                            >
                                <List className="w-4 h-4" />
                                {t('reports.detailed')}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PurchasesReportsPage;
