import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, ChevronRight, FileSpreadsheet, FileText, Printer } from 'lucide-react';

const TrialBalanceReport = () => {
    const { t } = useTranslation();

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: '1-2-2026',
        toDate: '28-2-2026',
        branch: 'all',
        displayedAccounts: 'all',
    });

    const [expandedSections, setExpandedSections] = useState({
        'assets': true,
        'assets-current': true,
        'liabilities': true,
        'liabilities-current': true,
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

    // Data Structure for Trial Balance
    const initialData = [
        {
            id: 'assets', label: 'Assets #1', type: 'header',
            initial: { debit: 0, credit: 0 },
            transaction: { debit: 200.00, credit: 100.00 },
            end: { debit: 100.00, credit: 0 },
            children: [
                {
                    id: 'assets-current', label: 'Current Assets #12', type: 'subheader',
                    initial: { debit: 0, credit: 0 },
                    transaction: { debit: 200.00, credit: 100.00 },
                    end: { debit: 100.00, credit: 0 },
                    children: [
                        { id: 'inv', label: 'Inventories #125', type: 'item', initial: { debit: 0, credit: 0 }, transaction: { debit: 100.00, credit: 0 }, end: { debit: 100.00, credit: 0 } },
                        { id: 'pur', label: 'Purchases under receipt #129', type: 'item', initial: { debit: 0, credit: 0 }, transaction: { debit: 100.00, credit: 100.00 }, end: { debit: 0.00, credit: 0 } },
                    ]
                }
            ]
        },
        {
            id: 'liabilities', label: 'Liabilities #2', type: 'header',
            initial: { debit: 0, credit: 0 },
            transaction: { debit: 14.00, credit: 114.00 },
            end: { debit: 0, credit: 100.00 },
            children: [
                {
                    id: 'liabilities-current', label: 'Current Liabilities #21', type: 'subheader',
                    initial: { debit: 0, credit: 0 },
                    transaction: { debit: 14.00, credit: 114.00 },
                    end: { debit: 0, credit: 100.00 },
                    children: [
                        { id: 'cred', label: 'Creditors #211', type: 'item', initial: { debit: 0, credit: 0 }, transaction: { debit: 0, credit: 114.00 }, end: { debit: 0, credit: 114.00 } },
                        { id: 'vat', label: 'VAT #214', type: 'item', initial: { debit: 0, credit: 0 }, transaction: { debit: 14.00, credit: 0 }, end: { debit: 0, credit: 14.00 } }, // Adjusted logic visually to match Image 4 if needed, but keeping std math
                    ]
                }
            ]
        }
    ];

    const totals = {
        initial: { debit: 0.00, credit: 0.00 },
        transaction: { debit: 214.00, credit: 214.00 },
        end: { debit: 100.00, credit: 100.00 }
    };


    const renderRow = (item, indent = 0) => {
        const isOpen = expandedSections[item.id];
        const hasChildren = item.children && item.children.length > 0;

        return (
            <React.Fragment key={item.id}>
                <tr className={`${item.type === 'header' ? 'bg-gray-100 font-bold' : (item.type === 'subheader' ? 'bg-gray-50 font-semibold' : 'hover:bg-gray-50')} border-b border-gray-100`}>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100">
                        <div className="flex items-center cursor-pointer" onClick={() => hasChildren && toggleSection(item.id)} style={{ paddingLeft: `${indent * 1.5}rem` }}>
                            {hasChildren && (
                                isOpen ? <ChevronDown className="w-4 h-4 text-gray-500 mr-1" /> : <ChevronRight className="w-4 h-4 text-gray-500 mr-1" />
                            )}
                            {!hasChildren && <div className="w-4 h-4 mr-1"></div>}
                            {item.type === 'item' && <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>}
                            <span>{item.label}</span>
                        </div>
                    </td>
                    {/* Initial Balance */}
                    <td className="px-4 py-3 text-sm text-center border-r border-gray-100 w-24">{item.initial.debit > 0 ? item.initial.debit.toFixed(2) : ''}</td>
                    <td className="px-4 py-3 text-sm text-center border-r border-gray-100 w-24">{item.initial.credit > 0 ? item.initial.credit.toFixed(2) : ''}</td>
                    {/* Transaction Totals */}
                    <td className="px-4 py-3 text-sm text-center border-r border-gray-100 w-24 font-medium">{item.transaction.debit > 0 ? item.transaction.debit.toFixed(2) : ''}</td>
                    <td className="px-4 py-3 text-sm text-center border-r border-gray-100 w-24 font-medium">{item.transaction.credit > 0 ? item.transaction.credit.toFixed(2) : ''}</td>
                    {/* End Balance */}
                    <td className="px-4 py-3 text-sm text-center border-r border-gray-100 w-24 font-semibold">{item.end.debit > 0 ? item.end.debit.toFixed(2) : ''}</td>
                    <td className="px-4 py-3 text-sm text-center w-24 font-semibold">{item.end.credit > 0 ? item.end.credit.toFixed(2) : (item.end.credit < 0 ? Math.abs(item.end.credit).toFixed(2) : '')}</td>
                </tr>
                {hasChildren && isOpen && item.children.map(child => renderRow(child, indent + 1))}
            </React.Fragment>
        );
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

                    {/* Displayed Accounts */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.displayed_accounts')}</label>
                        <div className="relative">
                            <select value={filters.displayedAccounts} onChange={(e) => handleFilterChange('displayedAccounts', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="all">{t('reports.filters.all_accounts') || 'Accounts With Transactions Before...'}</option>
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
                        {t('reports.accounting.trial_balance_title') || 'Trial Balance From Date 2026 February 1, Sunday To Date 2026 February 28, Saturday'}
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

                {/* Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 text-gray-700 text-sm border-b border-gray-200">
                                <th rowSpan="2" className="px-4 py-3 text-start font-semibold border-r border-gray-200">{t('reports.columns.account') || 'Account'}</th>
                                <th colSpan="2" className="px-4 py-2 text-center font-semibold border-r border-gray-200 border-b">{t('reports.columns.initial_balance') || 'Initial Balance'}</th>
                                <th colSpan="2" className="px-4 py-2 text-center font-semibold border-r border-gray-200 border-b">{t('reports.columns.transaction_totals') || 'Transaction Totals'}</th>
                                <th colSpan="2" className="px-4 py-2 text-center font-semibold border-b">{t('reports.columns.end_balance') || 'End Balance'}</th>
                            </tr>
                            <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
                                <th className="px-4 py-2 text-center font-medium border-r border-gray-200">{t('reports.columns.debit') || 'Debit'}</th>
                                <th className="px-4 py-2 text-center font-medium border-r border-gray-200">{t('reports.columns.credit') || 'Credit'}</th>
                                <th className="px-4 py-2 text-center font-medium border-r border-gray-200">{t('reports.columns.debit') || 'Debit'}</th>
                                <th className="px-4 py-2 text-center font-medium border-r border-gray-200">{t('reports.columns.credit') || 'Credit'}</th>
                                <th className="px-4 py-2 text-center font-medium border-r border-gray-200">{t('reports.columns.debit') || 'Debit'}</th>
                                <th className="px-4 py-2 text-center font-medium">{t('reports.columns.credit') || 'Credit'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialData.map(item => renderRow(item))}
                            {/* Total Row */}
                            <tr className="bg-gray-100 font-bold border-t border-gray-200">
                                <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{t('reports.total') || 'Total'}</td>
                                <td className="px-4 py-3 text-sm text-center border-r border-gray-200">{totals.initial.debit.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-center border-r border-gray-200">{totals.initial.credit.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-center border-r border-gray-200">{totals.transaction.debit.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-center border-r border-gray-200">{totals.transaction.credit.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-center border-r border-gray-200">{totals.end.debit.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-center">{totals.end.credit.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default TrialBalanceReport;
