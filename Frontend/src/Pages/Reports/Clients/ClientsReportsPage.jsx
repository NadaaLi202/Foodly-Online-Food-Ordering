import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, FileText, PieChart } from 'lucide-react';

const ClientsReportsPage = () => {
    const { t } = useTranslation();

    const reportSections = [
        {
            id: 'client-general-ledger',
            title: t('reports.clients.client_general_ledger') || 'كشف حساب العميل',
            description: t('reports.clients.client_general_ledger_desc') || 'عرض كشف حساب العميل التفصيلي وحركات القيود.',
            icon: Users,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            link: '/dashboard/reports/clients/general-ledger',
        },
    ];

    return (
        <div className="p-6">
            <div className="space-y-4">
                {reportSections.map((report) => (
                    <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${report.iconBg}`}>
                                    <report.icon className={`w-6 h-6 ${report.iconColor}`} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 ml-16">
                                <Link to="/dashboard/reports/clients/general-ledger" className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    {t('reports.clients.client_general_ledger') || 'كشف حساب العميل'}
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientsReportsPage;
