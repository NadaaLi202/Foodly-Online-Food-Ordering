import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, ChevronRight, ChevronUp, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { exportBalanceSheetToExcel, buildAccountingReportPdf } from '../../../utils/accountingReportsExport';

const BalanceSheetReport = () => {
    const { t } = useTranslation();

    const [filters, setFilters] = useState({
        toDate: '2026-02-09',
        displayedAccounts: 'all',
        branch: 'all',
    });

    const [expandedSections, setExpandedSections] = useState({
        'assets': true,
        'assets-current': true,
        'assets-fixed': true,
        'liabilities': true,
        'equity': true,
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

    // Placeholder data to match Image 2 structure
    const reportData = {
        assets: {
            total: 100.00,
            fixed: {
                total: 0.00,
                items: [
                    { name: 'Buildings', code: '111', amount: 0.00 },
                    { name: 'Lands', code: '112', amount: 0.00 },
                    { name: 'Furniture', code: '113', amount: 0.00 },
                    { name: 'Devices & Equipment', code: '114', amount: 0.00 },
                    { name: 'Vehicles', code: '115', amount: 0.00 },
                ]
            },
            current: {
                total: 100.00,
                items: [
                    { name: 'Safes', code: '121', amount: 0.00 },
                    { name: 'Bank Accounts', code: '122', amount: 0.00 },
                    { name: 'POS Safes', code: '123', amount: 0.00 },
                    { name: 'Employee Custody', code: '124', amount: 0.00 },
                    { name: 'Inventories', code: '125', amount: 100.00 },
                    { name: 'Debtors', code: '126', amount: 0.00 },
                    { name: 'Cash Shortage', code: '127', amount: 0.00 },
                    { name: 'Work in Progress', code: '128', amount: 0.00 },
                    { name: 'Purchases Under Receipt', code: '129', amount: 0.00 },
                ]
            }
        },
        liabilities: {
            total: 100.00,
            current: {
                total: 100.00, // Inferred
                items: [
                    { name: 'Creditors', code: '211', amount: 114.00 },
                    { name: 'Depreciation', code: '212', amount: 0.00 },
                    { name: 'Opening Balance', code: '213', amount: 0.00 },
                    { name: 'VAT', code: '214', amount: -14.00 },
                ]
            },
            longTerm: {
                total: 0.00,
                items: []
            }
        },
        equity: {
            total: 100.00,
            items: [
                { name: 'Capital', code: '31', amount: 0.00 },
                { name: 'Retained Earnings', code: '32', amount: 0.00 },
            ],
            unallocatedProfitLoss: 0.00,
            totalEquity: 0.00,
            totalLiabilitiesAndEquity: 100.00
        }
    };

    const handleExportExcel = () => {
        exportBalanceSheetToExcel(reportData, t);
    };

    const handleExportPdf = () => {
        const contentRows = [];
        contentRows.push([t('reports.accounting.balance_sheet')]);
        contentRows.push([t('reports.filters.to_date'), filters.toDate]);
        contentRows.push([]);
        contentRows.push([t('reports.accounting.assets'), fmtNum(reportData.assets?.total || 0)]);
        if (reportData.assets?.fixed?.length > 0) {
            reportData.assets.fixed.forEach(item => {
                contentRows.push(['', item.name || '', fmtNum(item.amount || 0)]);
            });
        }
        if (reportData.assets?.current?.length > 0) {
            reportData.assets.current.forEach(item => {
                contentRows.push(['', item.name || '', fmtNum(item.amount || 0)]);
            });
        }
        contentRows.push([]);
        contentRows.push([t('reports.accounting.liabilities'), fmtNum(reportData.liabilities?.total || 0)]);
        if (reportData.liabilities?.current?.length > 0) {
            reportData.liabilities.current.forEach(item => {
                contentRows.push(['', item.name || '', fmtNum(item.amount || 0)]);
            });
        }
        contentRows.push([]);
        contentRows.push([t('reports.accounting.equity'), fmtNum(reportData.equity?.total || 0)]);
        const blob = buildAccountingReportPdf(t('reports.accounting.balance_sheet'), contentRows, t);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Balance_Sheet_${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    const fmtNum = (n) => (n == null || n === '' || n === undefined) ? '' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const renderRow = (label, amount, isHeader = false, isSubHeader = false, indent = 0, onClick = null, isOpen = false) => (
        <div
            className={`flex items-center justify-between py-2 px-4 border-b border-gray-100 ${isHeader ? 'bg-gray-100 font-bold text-gray-900' : ''} ${isSubHeader ? 'bg-gray-50 font-semibold text-gray-800' : 'text-gray-700'} hover:bg-gray-50 cursor-pointer`}
            onClick={onClick}
            style={{ paddingLeft: `${indent * 1.5 + 1}rem` }}
        >
            <div className="flex items-center gap-2">
                {onClick && (
                    isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : (isHeader || isSubHeader ? <ChevronRight className="w-4 h-4 text-gray-500" /> : null)
                )}
                {!onClick && (isHeader || isSubHeader) && <span className="w-4"></span>}

                {/* Icon placeholder for leaf nodes */}
                {!isHeader && !isSubHeader && <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>}

                <span>{label}</span>
            </div>
            <span className={isHeader ? 'font-bold' : ''}>{amount.toFixed(2)}</span>
        </div>
    );

    return (
        <>
            <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    {/* Filters Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 no-print">
                        {/* To Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.to_date')}</label>
                            <div className="relative">
                                <input type="text" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Displayed Accounts */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.displayed_accounts')}</label>
                            <div className="relative">
                                <select value={filters.displayedAccounts} onChange={(e) => handleFilterChange('displayedAccounts', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="all">{t('reports.filters.all_accounts')}</option>
                                    <option value="with_transactions">{t('reports.filters.with_transactions')}</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                    </div>

                    {/* View Report Button */}
                    <div className="mb-6 no-print">
                        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">{t('reports.view_report')}</button>
                    </div>

                    {/* Report Header & Export */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100 no-print">
                        <div className="text-sm text-gray-700 font-medium">
                            {t('reports.accounting.balance_sheet_title')}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleExportExcel} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors border border-green-200">
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                {t('reports.export.excel')}
                            </button>
                            <button onClick={handleExportPdf} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded text-xs font-medium hover:bg-purple-100 transition-colors border border-purple-200">
                                <FileText className="w-3.5 h-3.5" />
                                {t('reports.export.pdf')}
                            </button>
                            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                                <Printer className="w-3.5 h-3.5" />
                                {t('reports.export.print')}
                            </button>
                        </div>
                    </div>

                    {/* Report Content */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
                        {/* Assets */}
                        {renderRow(t('reports.accounting.assets'), reportData.assets.total, true, false, 0, () => toggleSection('assets'), expandedSections['assets'])}

                        {expandedSections['assets'] && (
                            <>
                                {/* Fixed Assets */}
                                {renderRow(t('reports.accounting.fixed_assets'), reportData.assets.fixed.total, false, true, 1, () => toggleSection('assets-fixed'), expandedSections['assets-fixed'])}
                                {expandedSections['assets-fixed'] && reportData.assets.fixed.items.map(item =>
                                    renderRow(`${item.name} #${item.code}`, item.amount, false, false, 2)
                                )}

                                {/* Current Assets */}
                                {renderRow(t('reports.accounting.current_assets'), reportData.assets.current.total, false, true, 1, () => toggleSection('assets-current'), expandedSections['assets-current'])}
                                {expandedSections['assets-current'] && reportData.assets.current.items.map(item =>
                                    renderRow(`${item.name} #${item.code}`, item.amount, false, false, 2)
                                )}
                            </>
                        )}
                        <div className="bg-gray-200 px-4 py-2 flex justify-between font-bold text-gray-900 border-t border-gray-300">
                            <span>{t('reports.accounting.total_assets')}</span>
                            <span>{reportData.assets.total.toFixed(2)}</span>
                        </div>

                        <div className="h-4 bg-gray-50 border-t border-b border-gray-200"></div>

                        {/* Liabilities */}
                        {renderRow(t('reports.accounting.liabilities'), reportData.liabilities.total, true, false, 0, () => toggleSection('liabilities'), expandedSections['liabilities'])}
                        {expandedSections['liabilities'] && (
                            <>
                                {/* Current Liabilities */}
                                {renderRow(t('reports.accounting.current_liabilities'), reportData.liabilities.current.total, false, true, 1, () => toggleSection('liabilities-current'), expandedSections['liabilities-current'])}
                                {expandedSections['liabilities-current'] && reportData.liabilities.current.items.map(item =>
                                    renderRow(`${item.name} #${item.code}`, item.amount, false, false, 2)
                                )}

                                {/* Long Term Liabilities */}
                                {renderRow(t('reports.accounting.long_term_liabilities'), reportData.liabilities.longTerm.total, false, true, 1, () => toggleSection('liabilities-longterm'), expandedSections['liabilities-longterm'])}
                            </>
                        )}
                        <div className="bg-gray-200 px-4 py-2 flex justify-between font-bold text-gray-900 border-t border-gray-300">
                            <span>{t('reports.accounting.total_liabilities')}</span>
                            <span>{reportData.liabilities.total.toFixed(2)}</span>
                        </div>

                        <div className="h-4 bg-gray-50 border-t border-b border-gray-200"></div>

                        {/* Equity */}
                        {renderRow(t('reports.accounting.equity'), reportData.equity.total, true, false, 0, () => toggleSection('equity'), expandedSections['equity'])}
                        {expandedSections['equity'] && reportData.equity.items.map(item =>
                            renderRow(`${item.name} #${item.code}`, item.amount, false, false, 1)
                        )}

                        <div className="bg-gray-100 px-4 py-2 flex justify-between font-semibold text-gray-800 border-b border-gray-200">
                            <span>{t('reports.accounting.unallocated_profit_loss')}</span>
                            <span>{reportData.equity.unallocatedProfitLoss.toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-100 px-4 py-2 flex justify-between font-semibold text-gray-800 border-b border-gray-200">
                            <span>{t('reports.accounting.total_equity')}</span>
                            <span>{reportData.equity.totalEquity.toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-200 px-4 py-2 flex justify-between font-bold text-gray-900 border-t border-gray-300">
                            <span>{t('reports.accounting.total_liabilities_and_equity')}</span>
                            <span>{reportData.equity.totalLiabilitiesAndEquity.toFixed(2)}</span>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};

export default BalanceSheetReport;
