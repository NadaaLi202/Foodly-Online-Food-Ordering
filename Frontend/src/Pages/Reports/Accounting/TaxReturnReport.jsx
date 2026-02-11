import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react';

const TaxReturnReport = () => {
    const { t } = useTranslation();

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: '1-2-2026',
        toDate: '28-2-2026',
        branch: 'all',
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const periodOptions = [
        { value: 'current_month', label: t('reports.filters.current_month') },
        { value: 'last_month', label: t('reports.filters.last_month') },
        { value: 'current_quarter', label: t('reports.filters.current_quarter') },
        { value: 'current_year', label: t('reports.filters.current_year') },
    ];

    const reportData = {
        sales: {
            taxable: '0.00',
            tax: '0.00',
            adjustment: '0.00',
            total: '0.00'
        },
        purchases: {
            taxable: '- 100.00',
            tax: '- 14.00',
            adjustment: '0.00',
            total: '- 14.00'
        },
        netTax: '- 14.00'
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Period */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.period')}</label>
                        <div className="relative">
                            <select value={filters.period} onChange={(e) => handleFilterChange('period', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {periodOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* From Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.from_date')}</label>
                        <div className="relative">
                            <input type="text" value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.to_date')}</label>
                        <div className="relative">
                            <input type="text" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Branches */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.branches')}</label>
                        <div className="relative">
                            <select value={filters.branch} onChange={(e) => handleFilterChange('branch', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="all">{t('reports.filters.all_branches') || 'All Branches'}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* View Report Button */}
                <div className="mb-6">
                    <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">{t('reports.view_report')}</button>
                </div>

                {/* Report Header & Export */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm text-gray-700 font-medium">
                        {t('reports.accounting.tax.return_report_title') || 'Tax Return Report From Date 2026 February 1, Sunday To Date 2026 February 28, Saturday'}
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors border border-green-200">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            {t('reports.export.excel')}
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded text-xs font-medium hover:bg-purple-100 transition-colors border border-purple-200">
                            <FileText className="w-3.5 h-3.5" />
                            {t('reports.export.pdf')}
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                            <Printer className="w-3.5 h-3.5" />
                            {t('reports.export.print')}
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="space-y-6">
                    {/* Sales Section */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-semibold text-gray-800">
                            {t('reports.accounting.tax.sales_section') || 'Sales / Outputs'}
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t('reports.accounting.tax.taxable_amount')}</div>
                                <div className="text-lg font-medium text-gray-900">{reportData.sales.taxable}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t('reports.accounting.tax.tax_amount')}</div>
                                <div className="text-lg font-medium text-gray-900">{reportData.sales.tax}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t('reports.accounting.tax.adjustment')}</div>
                                <div className="text-lg font-medium text-gray-900">{reportData.sales.adjustment}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t('reports.accounting.tax.total_tax')}</div>
                                <div className="text-lg font-bold text-indigo-600">{reportData.sales.total}</div>
                            </div>
                        </div>
                    </div>

                    {/* Purchases Section */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-semibold text-gray-800">
                            {t('reports.accounting.tax.purchases_section') || 'Purchases / Inputs'}
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t('reports.accounting.tax.taxable_amount')}</div>
                                <div className="text-lg font-medium text-gray-900">{reportData.purchases.taxable}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t('reports.accounting.tax.tax_amount')}</div>
                                <div className="text-lg font-medium text-gray-900">{reportData.purchases.tax}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t('reports.accounting.tax.adjustment')}</div>
                                <div className="text-lg font-medium text-gray-900">{reportData.purchases.adjustment}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t('reports.accounting.tax.total_tax')}</div>
                                <div className="text-lg font-bold text-indigo-600">{reportData.purchases.total}</div>
                            </div>
                        </div>
                    </div>

                    {/* Net Tax Section */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 flex items-center justify-between">
                        <div className="text-lg font-bold text-indigo-900">{t('reports.accounting.tax.net_vat') || 'Net VAT'}</div>
                        <div className="text-2xl font-bold text-indigo-700" dir="ltr">{reportData.netTax}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxReturnReport;
