import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, ChevronRight, FileSpreadsheet, FileText, Printer } from 'lucide-react';

const IncomeStatementReport = () => {
    const { t } = useTranslation();

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: '1-2-2026',
        toDate: '28-2-2026',
        branch: 'all',
        displayedAccounts: 'all',
    });

    const [expandedSections, setExpandedSections] = useState({
        'revenue': true,
        'revenue-sales': true,
        'revenue-other': true,
        'expenses': true,
        'expenses-purchases': true,
        'expenses-cogs': true,
        'expenses-admin': true,
        'expenses-other': true,
    });

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const periodOptions = [
        { value: 'current_month', label: t('reports.filters.current_month') },
        { value: 'last_month', label: t('reports.filters.last_month') },
        { value: 'current_quarter', label: t('reports.filters.current_quarter') },
        { value: 'current_year', label: t('reports.filters.current_year') },
    ];

    // Placeholder data to match Image 3 structure
    const reportData = {
        revenue: {
            total: 0.00,
            sales: {
                title: 'Sales Revenue #41',
                items: [
                    { name: 'Sales', code: '411', amount: 0.00 },
                    { name: 'Sales Returns', code: '412', amount: 0.00 },
                ]
            },
            other: {
                title: 'Other Revenue #42',
                items: [
                    { name: 'Other Revenue', code: '421', amount: 0.00 },
                    { name: 'Capital Gains', code: '422', amount: 0.00 },
                    { name: 'Purchase Discounts', code: '423', amount: 0.00 },
                ]
            }
        },
        expenses: {
            total: 0.00,
            purchases: {
                title: 'Purchase Expenses #51',
                items: [
                    { name: 'Purchases', code: '511', amount: 0.00 },
                    { name: 'Purchase Returns', code: '512', amount: 0.00 },
                ]
            },
            cogs: {
                title: 'Cost of Goods Sold #52',
                items: [
                    { name: 'Cost of Goods Sold', code: '521', amount: 0.00 },
                    { name: 'Allowed Discount', code: '522', amount: 0.00 },
                    { name: 'Sales Discount', code: '523', amount: 0.00 },
                ]
            },
            admin: {
                title: 'Administrative Expenses #53',
                items: [
                    { name: 'Rent', code: '5301', amount: 0.00 },
                    { name: 'Electricity', code: '5302', amount: 0.00 },
                    { name: 'Phone & Internet', code: '5303', amount: 0.00 },
                    { name: 'Maintenance', code: '5304', amount: 0.00 },
                    { name: 'Water', code: '5305', amount: 0.00 },
                    { name: 'Gov Expenses', code: '5306', amount: 0.00 },
                    { name: 'Depreciation', code: '5307', amount: 0.00 },
                ]
            },
            other: {
                title: 'Other Expenses #54',
                items: [
                    { name: 'Bad Debts', code: '541', amount: 0.00 },
                    { name: 'Inventory Shortage', code: '542', amount: 0.00 },
                    { name: 'Other Expenses', code: '543', amount: 0.00 },
                ]
            }
        }
    };

    const renderRow = (label, amount, isHeader = false, isSubHeader = false, indent = 0, onClick = null, isOpen = false) => (
        <div
            className={`flex items-center justify-between py-2 px-4 border-b border-gray-100 ${isHeader ? 'bg-gray-100 font-bold text-gray-900' : ''} ${isSubHeader ? 'bg-gray-50 font-semibold text-gray-800' : 'text-gray-700'} hover:bg-gray-50 cursor-pointer`}
            onClick={onClick}
            style={{ paddingLeft: `${indent * 1.5 + 1}rem` }}
        >
            <div className="flex items-center gap-2">
                {onClick && (
                    isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                {!onClick && (isHeader || isSubHeader) && <span className="w-4"></span>}

                {/* Icon placeholder for leaf nodes */}
                {!isHeader && !isSubHeader && <div className="w-2 h-2 rounded-full bg-teal-600 mr-2"></div>}

                <span>{label}</span>
            </div>
            <span className={isHeader ? 'font-bold' : ''}>{amount.toFixed(2)}</span>
        </div>
    );

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
                                <option value="all">{t('reports.filters.all_branches')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Displayed Accounts */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.displayed_accounts')}</label>
                        <div className="relative">
                            <select value={filters.displayedAccounts} onChange={(e) => handleFilterChange('displayedAccounts', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="all">{t('reports.filters.all_accounts')}</option>
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
                        {t('reports.accounting.income_statement_title')}
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
                <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
                    {/* Revenue */}
                    {renderRow(t('reports.accounting.revenue'), reportData.revenue.total, true, false, 0, () => toggleSection('revenue'), expandedSections['revenue'])}
                    {expandedSections['revenue'] && (
                        <>
                            {/* Revenue Categories */}
                            {renderRow(reportData.revenue.sales.title, 0.00, false, true, 1, () => toggleSection('revenue-sales'), expandedSections['revenue-sales'])}
                            {expandedSections['revenue-sales'] && reportData.revenue.sales.items.map(item => renderRow(`${item.name} #${item.code}`, item.amount, false, false, 2))}

                            {renderRow(reportData.revenue.other.title, 0.00, false, true, 1, () => toggleSection('revenue-other'), expandedSections['revenue-other'])}
                            {expandedSections['revenue-other'] && reportData.revenue.other.items.map(item => renderRow(`${item.name} #${item.code}`, item.amount, false, false, 2))}
                        </>
                    )}
                    <div className="bg-gray-200 px-4 py-2 flex justify-between font-bold text-gray-900 border-t border-gray-300">
                        <span>{t('reports.accounting.total_revenue')}</span>
                        <span>{reportData.revenue.total.toFixed(2)}</span>
                    </div>

                    <div className="h-4 bg-gray-50 border-t border-b border-gray-200"></div>

                    {/* Expenses */}
                    {renderRow(t('reports.accounting.expenses'), reportData.expenses.total, true, false, 0, () => toggleSection('expenses'), expandedSections['expenses'])}
                    {expandedSections['expenses'] && (
                        <>
                            {/* Expenses Categories */}
                            {renderRow(reportData.expenses.purchases.title, 0.00, false, true, 1, () => toggleSection('expenses-purchases'), expandedSections['expenses-purchases'])}
                            {expandedSections['expenses-purchases'] && reportData.expenses.purchases.items.map(item => renderRow(`${item.name} #${item.code}`, item.amount, false, false, 2))}

                            {renderRow(reportData.expenses.cogs.title, 0.00, false, true, 1, () => toggleSection('expenses-cogs'), expandedSections['expenses-cogs'])}
                            {expandedSections['expenses-cogs'] && reportData.expenses.cogs.items.map(item => renderRow(`${item.name} #${item.code}`, item.amount, false, false, 2))}

                            {renderRow(reportData.expenses.admin.title, 0.00, false, true, 1, () => toggleSection('expenses-admin'), expandedSections['expenses-admin'])}
                            {expandedSections['expenses-admin'] && reportData.expenses.admin.items.map(item => renderRow(`${item.name} #${item.code}`, item.amount, false, false, 2))}

                            {renderRow(reportData.expenses.other.title, 0.00, false, true, 1, () => toggleSection('expenses-other'), expandedSections['expenses-other'])}
                            {expandedSections['expenses-other'] && reportData.expenses.other.items.map(item => renderRow(`${item.name} #${item.code}`, item.amount, false, false, 2))}
                        </>
                    )}
                    <div className="bg-gray-200 px-4 py-2 flex justify-between font-bold text-gray-900 border-t border-gray-300">
                        <span>{t('reports.accounting.total_expenses')}</span>
                        <span>{reportData.expenses.total.toFixed(2)}</span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default IncomeStatementReport;
