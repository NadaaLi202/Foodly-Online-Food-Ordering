import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    BookOpen,
    Network,
    PieChart,
    ChevronRight
} from 'lucide-react';

const AccountingMainPage = () => {
    const { t } = useTranslation();

    const sections = [
        {
            id: 'journal-entries',
            title: t('sidebar.journal_entries'),
            description: t('accounting.journal_entries.tile_desc'),
            icon: BookOpen,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            link: '/dashboard/accounting/journal-entries',
        },
        {
            id: 'chart-of-accounts',
            title: t('sidebar.chart_of_accounts'),
            description: t('accounting.chart_of_accounts.tile_desc'),
            icon: Network,
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-600',
            link: '/dashboard/accounting/chart-of-accounts',
        },
        {
            id: 'cost-centers',
            title: t('sidebar.cost_centers'),
            description: t('accounting.cost_centers.info', 'Track expenses and revenue by cost center'),
            icon: PieChart,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            link: '/dashboard/accounting/cost-centers',
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

export default AccountingMainPage;
