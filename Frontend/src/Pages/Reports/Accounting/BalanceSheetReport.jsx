import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, ChevronRight, FileSpreadsheet, FileText, Printer, Filter } from 'lucide-react';
import { exportBalanceSheetToExcel, buildAccountingReportPdf } from '../../../utils/accountingReportsExport';
import api from '../../../services/api';
import PrintHeader from '../../../components/common/PrintHeader';

const BalanceSheetReport = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const [filters, setFilters] = useState({
        toDate: new Date().toISOString().slice(0, 10),
        displayedAccounts: 'all',
        branch: 'all',
    });

    const [branches, setBranches] = useState([]);
    const [expandedSections, setExpandedSections] = useState({
        'assets': true,
        'assets-current': true,
        'assets-fixed': true,
        'liabilities': true,
        'equity': true,
    });

    const [loading, setLoading] = useState(false);
    const hasFetched = useRef(false);
    const [reportData, setReportData] = useState({
        assets: { fixed: [], current: [], total: 0 },
        liabilities: { current: [], longTerm: [], total: 0 },
        equity: { items: [], total: 0 },
        totalLiabilitiesAndEquity: 0
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

    const fetchBranches = useCallback(async () => {
        try {
            const response = await api.get('/branches');
            setBranches(response.data.branches || []);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    }, []);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/accounting/balance-sheet', {
                params: {
                    asOfDate: filters.toDate,
                    branch: filters.branch !== 'all' ? filters.branch : undefined,
                }
            });
            setReportData({
                assets: response.data?.assets || { fixed: [], current: [], total: 0 },
                liabilities: response.data?.liabilities || { current: [], longTerm: [], total: 0 },
                equity: response.data?.equity || { items: [], total: 0 },
                totalLiabilitiesAndEquity: response.data?.totalLiabilitiesAndEquity || 0
            });
        } catch (error) {
            console.error('Error fetching balance sheet:', error);
            setReportData({
                assets: { fixed: [], current: [], total: 0 },
                liabilities: { current: [], longTerm: [], total: 0 },
                equity: { items: [], total: 0 },
                totalLiabilitiesAndEquity: 0
            });
        } finally {
            setLoading(false);
        }
    }, [filters.branch, filters.toDate]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchReport();
    }, []);

    const fixedTotal = useMemo(
        () => (reportData.assets?.fixed || []).reduce((sum, item) => sum + (item.amount || 0), 0),
        [reportData.assets?.fixed]
    );
    const currentTotal = useMemo(
        () => (reportData.assets?.current || []).reduce((sum, item) => sum + (item.amount || 0), 0),
        [reportData.assets?.current]
    );
    const liabilitiesCurrentTotal = useMemo(
        () => (reportData.liabilities?.current || []).reduce((sum, item) => sum + (item.amount || 0), 0),
        [reportData.liabilities?.current]
    );

    const handleExportExcel = () => {
        exportBalanceSheetToExcel(reportData, t);
    };

    const handleExportPdf = async () => {
        const contentRows = [];
        contentRows.push([t('reports.accounting.balance_sheet') || 'Balance Sheet']);
        contentRows.push([t('reports.filters.to_date') || 'To Date', filters.toDate]);
        contentRows.push([]);
        contentRows.push([t('reports.accounting.assets') || 'Assets', fmtNum(reportData.assets?.total || 0)]);
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
        contentRows.push([t('reports.accounting.liabilities') || 'Liabilities', fmtNum(reportData.liabilities?.total || 0)]);
        if (reportData.liabilities?.current?.length > 0) {
            reportData.liabilities.current.forEach(item => {
                contentRows.push(['', item.name || '', fmtNum(item.amount || 0)]);
            });
        }
        contentRows.push([]);
        contentRows.push([t('reports.accounting.equity') || 'Equity', fmtNum(reportData.equity?.total || 0)]);
        const blob = await buildAccountingReportPdf(t('reports.accounting.balance_sheet') || 'Balance Sheet', contentRows, t);
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

                {!isHeader && !isSubHeader && <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>}

                <span>{label}</span>
            </div>
            <span className={isHeader ? 'font-bold' : ''}>{Number(amount || 0).toFixed(2)}</span>
        </div>
    );

    return (
        <>
            <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
                <PrintHeader />

                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <h3 className="text-lg font-semibold text-gray-900">{t('reports.accounting.balance_sheet_title') || 'Balance Sheet'}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* To Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('reports.filters.to_date') || 'To Date'}
                            </label>
                            <input
                                type="date"
                                value={filters.toDate}
                                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Branches */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('reports.filters.branches') || 'Branches'}
                            </label>
                            <select
                                value={filters.branch}
                                onChange={(e) => handleFilterChange('branch', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">{t('reports.filters.all_branches') || 'All Branches'}</option>
                                {branches.map((branch) => (
                                    <option key={branch._id} value={branch._id}>{branch.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Displayed Accounts */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('reports.filters.displayed_accounts') || 'Displayed Accounts'}
                            </label>
                            <select
                                value={filters.displayedAccounts}
                                onChange={(e) => handleFilterChange('displayedAccounts', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">{t('reports.filters.all_accounts') || 'All Accounts'}</option>
                                <option value="with_transactions">{t('reports.filters.with_transactions') || 'Accounts with Transactions'}</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={fetchReport}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                        >
                            {loading ? t('reports.loading') : t('reports.view_report')}
                        </button>

                        <button
                            onClick={handleExportExcel}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            {t('reports.export.excel')}
                        </button>

                        <button
                            onClick={handleExportPdf}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-sm font-medium hover:bg-purple-100 transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            {t('reports.export.pdf')}
                        </button>

                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            {t('reports.export.print')}
                        </button>
                    </div>
                </div>

                {/* Report Tables */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {/* Report Content */}
                        <div className="border border-gray-200 overflow-hidden text-sm">
                        {/* Assets */}
                        {renderRow(t('reports.accounting.assets') || 'Assets #1', reportData.assets.total || 0, true, false, 0, () => toggleSection('assets'), expandedSections['assets'])}

                        {expandedSections['assets'] && (
                            <>
                                {/* Fixed Assets */}
                                {renderRow(t('reports.accounting.fixed_assets') || 'Fixed Assets #11', fixedTotal, false, true, 1, () => toggleSection('assets-fixed'), expandedSections['assets-fixed'])}
                                {expandedSections['assets-fixed'] && (reportData.assets.fixed || []).map(item =>
                                    renderRow(`${item.name} #${item.code}`, item.amount || 0, false, false, 2)
                                )}

                                {/* Current Assets */}
                                {renderRow(t('reports.accounting.current_assets') || 'Current Assets #12', currentTotal, false, true, 1, () => toggleSection('assets-current'), expandedSections['assets-current'])}
                                {expandedSections['assets-current'] && (reportData.assets.current || []).map(item =>
                                    renderRow(`${item.name} #${item.code}`, item.amount || 0, false, false, 2)
                                )}
                            </>
                        )}
                        <div className="bg-gray-200 px-4 py-2 flex justify-between font-bold text-gray-900 border-t border-gray-300">
                            <span>{t('reports.accounting.total_assets') || 'Total Assets'}</span>
                            <span>{Number(reportData.assets.total || 0).toFixed(2)}</span>
                        </div>

                        <div className="h-4 bg-gray-50 border-t border-b border-gray-200"></div>

                        {/* Liabilities */}
                        {renderRow(t('reports.accounting.liabilities') || 'Liabilities #2', reportData.liabilities.total || 0, true, false, 0, () => toggleSection('liabilities'), expandedSections['liabilities'])}
                        {expandedSections['liabilities'] && (
                            <>
                                {/* Current Liabilities */}
                                {renderRow(t('reports.accounting.current_liabilities') || 'Current Liabilities #21', liabilitiesCurrentTotal, false, true, 1, () => toggleSection('liabilities-current'), expandedSections['liabilities-current'])}
                                {expandedSections['liabilities-current'] && (reportData.liabilities.current || []).map(item =>
                                    renderRow(`${item.name} #${item.code}`, item.amount || 0, false, false, 2)
                                )}

                                {/* Long Term Liabilities */}
                                {renderRow(t('reports.accounting.long_term_liabilities') || 'Long Term Liabilities #22', 0, false, true, 1, () => toggleSection('liabilities-longterm'), expandedSections['liabilities-longterm'])}
                            </>
                        )}
                        <div className="bg-gray-200 px-4 py-2 flex justify-between font-bold text-gray-900 border-t border-gray-300">
                            <span>{t('reports.accounting.total_liabilities') || 'Total Liabilities'}</span>
                            <span>{Number(reportData.liabilities.total || 0).toFixed(2)}</span>
                        </div>

                        <div className="h-4 bg-gray-50 border-t border-b border-gray-200"></div>

                        {/* Equity */}
                        {renderRow(t('reports.accounting.equity') || 'Equity #3', reportData.equity.total || 0, true, false, 0, () => toggleSection('equity'), expandedSections['equity'])}
                        {expandedSections['equity'] && (reportData.equity.items || []).map(item =>
                            renderRow(`${item.name} #${item.code}`, item.amount || 0, false, false, 1)
                        )}

                        <div className="bg-gray-100 px-4 py-2 flex justify-between font-semibold text-gray-800 border-b border-gray-200">
                            <span>{t('reports.accounting.unallocated_profit_loss') || 'Unallocated Profit/Loss'}</span>
                            <span>{Number(reportData.equity.unallocatedProfitLoss || 0).toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-100 px-4 py-2 flex justify-between font-semibold text-gray-800 border-b border-gray-200">
                            <span>{t('reports.accounting.total_equity') || 'Total Equity'}</span>
                            <span>{Number(reportData.equity.total || 0).toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-200 px-4 py-2 flex justify-between font-bold text-gray-900 border-t border-gray-300">
                            <span>{t('reports.accounting.total_liabilities_and_equity') || 'Total Liabilities and Equity'}</span>
                            <span>{Number(reportData.totalLiabilitiesAndEquity || 0).toFixed(2)}</span>
                        </div>

                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default BalanceSheetReport;



