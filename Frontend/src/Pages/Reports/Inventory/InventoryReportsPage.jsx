import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DollarSign, FileText } from 'lucide-react';

const InventoryReportsPage = () => {
    const { t } = useTranslation();

    const reportSections = [
        {
            id: 'inventory-value',
            title: t('reports.inventory.inventory_value') || 'Inventory Value Report',
            description: t('reports.inventory.inventory_value_desc') || 'View inventory value report depending on average cost or purchase price.',
            icon: DollarSign,
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-600',
            link: '/dashboard/reports/inventory/value',
        },
        {
            id: 'inventory-value-detailed',
            title: t('reports.inventory.inventory_value_detailed') || 'Inventory Value Detailed Report',
            description: t('reports.inventory.inventory_value_detailed_desc') || 'View detailed inventory value changes over a specified period for each product.',
            icon: FileText,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            link: '/dashboard/reports/inventory/value-detailed',
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

export default InventoryReportsPage;
