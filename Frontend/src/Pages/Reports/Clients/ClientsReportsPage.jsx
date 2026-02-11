import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, FileText, Calendar } from 'lucide-react';

const ClientsReportsPage = () => {
    const { t } = useTranslation();

    const reportSections = [
        {
            id: 'client-general-ledger',
            title: t('reports.clients.client_general_ledger') || 'Client General Ledger',
            description: t('reports.clients.client_general_ledger_desc') || 'View Client General Ledger reports.',
            icon: Users,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-600',
            link: '/dashboard/reports/clients/general-ledger',
        },
        {
            id: 'aged-receivable',
            title: t('reports.clients.aged_receivable') || 'Aged Receivable',
            description: t('reports.clients.aged_receivable_desc') || 'View Aged Receivable reports.',
            icon: Calendar,
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-600',
            link: '/dashboard/reports/clients/aged-receivable',
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
