import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, FileText, Calendar } from 'lucide-react';

const ClientsReportsPage = () => {
    const { t } = useTranslation();

    const reportSections = [
        {
            id: 'client-summary',
            title: t('reports.clients.summary_report') || 'Customer Summary Report',
            description: t('reports.clients.summary_report_desc') || 'View summary of customer totals.',
            icon: Users,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            link: '/dashboard/reports/clients/summary',
        },
        {
            id: 'client-general-ledger',
            title: t('reports.clients.client_general_ledger') || 'Client General Ledger',
            description: t('reports.clients.client_general_ledger_desc') || 'View Client General Ledger reports.',
            icon: FileText,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-600',
            link: '/dashboard/reports/clients/general-ledger',
        },
    ];

    return (
        <div className="p-6">
            <div className="space-y-4">
                {reportSections.map((report) => (
                    <Link
                        key={report.id}
                        to={report.link}
                        className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${report.iconBg}`}>
                                <report.icon className={`w-6 h-6 ${report.iconColor}`} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ClientsReportsPage;
