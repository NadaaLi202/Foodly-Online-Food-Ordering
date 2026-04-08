import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileText, PieChart, Scale, BookOpen, Percent } from 'lucide-react';

const AccountingReportsPage = () => {
    const { t } = useTranslation();

    const reportSections = [
        {
            id: 'balance-sheet',
            title: t('reports.accounting.balance_sheet') || 'Balance Sheet',
            icon: FileText,
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-500',
            link: '/dashboard/reports/accounting/balance-sheet',
        },
        {
            id: 'income-statement',
            title: t('reports.accounting.income_statement') || 'Income Statement (Profit & Loss)',
            icon: FileText,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-500',
            link: '/dashboard/reports/accounting/income-statement',
        },
        {
            id: 'trial-balance',
            title: t('reports.accounting.trial_balance') || 'Trial Balance',
            icon: Scale,
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-500',
            link: '/dashboard/reports/accounting/trial-balance',
        },
        {
            id: 'general-ledger',
            title: t('reports.accounting.general_ledger') || 'General Ledger',
            icon: BookOpen,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-500',
            link: '/dashboard/reports/accounting/general-ledger',
        },
        {
            id: 'cost-centers',
            title: t('reports.accounting.cost_centers') || 'Cost Centers',
            icon: PieChart,
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-500',
            link: '/dashboard/reports/accounting/journal-analytic-account',
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
                            </div>
                        </div>
                    </Link>
                ))}

                {/* Tax Reports Section - Visually distinct in Image 1 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-orange-50">
                                <Percent className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{t('reports.accounting.tax_reports') || 'Tax Reports'}</h3>
                            </div>
                        </div>
                        <div className="flex gap-2 ml-16">
                            <Link to="/dashboard/reports/accounting/tax-summary" className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2">
                                <PieChart className="w-4 h-4" />
                                {t('reports.summary') || 'Summary'}
                            </Link>
                            <Link to="/dashboard/reports/accounting/tax-detailed" className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {t('reports.detailed') || 'Detailed'}
                            </Link>
                            <Link to="/dashboard/reports/accounting/tax-return" className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {t('reports.tax_return') || 'Tax Return'}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountingReportsPage;
