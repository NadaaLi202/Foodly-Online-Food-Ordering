import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, FileSpreadsheet, FileText, Printer, Filter, Calendar } from 'lucide-react';
import { exportTrialBalanceToExcel, buildTrialBalancePdf } from '../../../utils/accountingReportsExport';
import api from '../../../services/api';
import PrintHeader from '../../../components/common/PrintHeader';

const getMonthRange = (date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const toISO = (d) => d.toISOString().slice(0, 10);
    return { startDate: toISO(start), endDate: toISO(end) };
};

const TrialBalanceReport = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const { startDate: defaultFrom, endDate: defaultTo } = getMonthRange();

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: defaultFrom,
        toDate: defaultTo,
        branch: 'all',
        displayedAccounts: 'all',
    });

    const [expandedSections, setExpandedSections] = useState({
        'assets': true,
        'assets-current': true,
        'liabilities': true,
        'liabilities-current': true,
    });

    const [branches, setBranches] = useState([]);

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

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [totals, setTotals] = useState({
        initialDebit: 0,
        initialCredit: 0,
        transactionDebit: 0,
        transactionCredit: 0,
        endDebit: 0,
        endCredit: 0
    });
    const hasFetched = useRef(false);

    const applyPeriod = (value) => {
        const now = new Date();
        if (value === 'current_month') {
            return getMonthRange(now);
        }
        if (value === 'last_month') {
            const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return getMonthRange(prev);
        }
        if (value === 'current_quarter') {
            const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
            const start = new Date(now.getFullYear(), quarterStartMonth, 1);
            const end = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
            return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
        }
        if (value === 'current_year') {
            const start = new Date(now.getFullYear(), 0, 1);
            const end = new Date(now.getFullYear(), 11, 31);
            return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
        }
        return { startDate: filters.fromDate, endDate: filters.toDate };
    };

    const handleViewReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/accounting/trial-balance', {
                params: {
                    startDate: filters.fromDate,
                    endDate: filters.toDate,
                    branch: filters.branch !== 'all' ? filters.branch : undefined,
                }
            });
            setReportData(response.data?.data || []);
            setTotals(response.data?.totals || {
                initialDebit: 0,
                initialCredit: 0,
                transactionDebit: 0,
                transactionCredit: 0,
                endDebit: 0,
                endCredit: 0
            });
        } catch (error) {
            setReportData([]);
            setTotals({
                initialDebit: 0,
                initialCredit: 0,
                transactionDebit: 0,
                transactionCredit: 0,
                endDebit: 0,
                endCredit: 0
            });
        } finally {
            setLoading(false);
        }
    }, [filters.branch, filters.fromDate, filters.toDate]);

    const fetchBranches = useCallback(async () => {
        try {
            const response = await api.get('/branches');
            setBranches(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching branches:', error);
            setBranches([]);
        }
    }, []);

    useEffect(() => {
        fetchBranches();
        if (hasFetched.current) return;
        hasFetched.current = true;
        handleViewReport();
    }, []);

    // Transform data for export (convert to API format structure)
    const exportTotals = useMemo(() => ({
        initialDebit: totals.initialDebit || 0,
        initialCredit: totals.initialCredit || 0,
        transactionDebit: totals.transactionDebit || 0,
        transactionCredit: totals.transactionCredit || 0,
        endDebit: totals.endDebit || 0,
        endCredit: totals.endCredit || 0
    }), [totals]);

    const handleExportExcel = () => {
        exportTrialBalanceToExcel(reportData, exportTotals, t);
    };

    const handleExportPdf = async () => {
        const dateRange = `${t('reports.filters.from_date')} ${filters.fromDate} ${t('reports.filters.to_date')} ${filters.toDate}`;
        const blob = await buildTrialBalancePdf(reportData, exportTotals, t, t('reports.accounting.trial_balance') || 'Trial Balance', dateRange);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Trial_Balance_${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    const renderRow = (item, indent = 0) => {
        const isOpen = expandedSections[item.id];
        const hasChildren = item.children && item.children.length > 0;
        const initialDebit = item.initialDebit || 0;
        const initialCredit = item.initialCredit || 0;
        const transactionDebit = item.transactionDebit || 0;
        const transactionCredit = item.transactionCredit || 0;
        const endDebit = item.endDebit || 0;
        const endCredit = item.endCredit || 0;

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
                            <span>{item.name || item.label}</span>
                        </div>
                    </td>
                    {/* Initial Balance */}
                    <td className="px-4 py-3 text-sm text-center border-r border-gray-100 w-24">{initialDebit > 0 ? initialDebit.toFixed(2) : ''}</td>
                    <td className="px-4 py-3 text-sm text-center border-r border-gray-100 w-24">{initialCredit > 0 ? initialCredit.toFixed(2) : ''}</td>
                    {/* Transaction Totals */}
                    <td className="px-4 py-3 text-sm text-center border-r border-gray-100 w-24 font-medium">{transactionDebit > 0 ? transactionDebit.toFixed(2) : ''}</td>
                    <td className="px-4 py-3 text-sm text-center border-r border-gray-100 w-24 font-medium">{transactionCredit > 0 ? transactionCredit.toFixed(2) : ''}</td>
                    {/* End Balance */}
                    <td className="px-4 py-3 text-sm text-center border-r border-gray-100 w-24 font-semibold">{endDebit > 0 ? endDebit.toFixed(2) : ''}</td>
                    <td className="px-4 py-3 text-sm text-center w-24 font-semibold">{endCredit > 0 ? endCredit.toFixed(2) : (endCredit < 0 ? Math.abs(endCredit).toFixed(2) : '')}</td>
                </tr>
                {hasChildren && isOpen && item.children.map(child => renderRow(child, indent + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="hidden print:block mb-6">
                <PrintHeader title={t('reports.accounting.trial_balance_title') || 'Trial Balance'} isRTL={isRTL} showLogo={false} />
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{t('reports.accounting.trial_balance_title') || 'Trial Balance'}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Period */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.period')}</label>
                        <div className="relative">
                            <select 
                                value={filters.period} 
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const range = applyPeriod(value);
                                    setFilters(prev => ({ ...prev, period: value, fromDate: range.startDate, toDate: range.endDate }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {periodOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    {/* From Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.from_date')}</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={filters.fromDate} 
                                onChange={(e) => handleFilterChange('fromDate', e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                            />
                            <Calendar className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.to_date')}</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={filters.toDate} 
                                onChange={(e) => handleFilterChange('toDate', e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                            />
                            <Calendar className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    {/* Branch Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.branch')}</label>
                        <div className="relative">
                            <select 
                                value={filters.branch} 
                                onChange={(e) => handleFilterChange('branch', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">{t('reports.filters.all_branches') || 'All Branches'}</option>
                                {branches.map(branch => (
                                    <option key={branch._id} value={branch._id}>{branch.name}</option>
                                ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    {/* Displayed Accounts */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.displayed_accounts')}</label>
                        <div className="relative">
                            <select 
                                value={filters.displayedAccounts} 
                                onChange={(e) => handleFilterChange('displayedAccounts', e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">{t('reports.filters.all_accounts') || 'All Accounts'}</option>
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={handleViewReport}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        {t('reports.show_reports') || 'Show Reports'}
                    </button>
                    <button 
                        onClick={handleExportExcel}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        {t('reports.export.excel')}
                    </button>
                    <button 
                        onClick={handleExportPdf}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors border border-purple-200"
                    >
                        <FileText className="w-4 h-4" />
                        {t('reports.export.pdf')}
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                        <Printer className="w-4 h-4" />
                        {t('reports.export.print')}
                    </button>
                </div>
            </div>

            {/* Report Display */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50 text-gray-700 text-sm border-b border-gray-200">
                                <th rowSpan="2" className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} font-semibold border-${isRTL ? 'l' : 'r'} border-gray-200`}>{t('reports.columns.account') || 'Account'}</th>
                                <th colSpan="2" className={`px-4 py-2 text-center font-semibold border-${isRTL ? 'l' : 'r'} border-gray-200 border-b`}>{t('reports.columns.initial_balance') || 'Initial Balance'}</th>
                                <th colSpan="2" className={`px-4 py-2 text-center font-semibold border-${isRTL ? 'l' : 'r'} border-gray-200 border-b`}>{t('reports.columns.transaction_totals') || 'Transaction Totals'}</th>
                                <th colSpan="2" className="px-4 py-2 text-center font-semibold border-b">{t('reports.columns.end_balance') || 'End Balance'}</th>
                            </tr>
                            <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
                                <th className={`px-4 py-2 text-center font-medium border-${isRTL ? 'l' : 'r'} border-gray-200`}>{t('reports.columns.debit') || 'Debit'}</th>
                                <th className={`px-4 py-2 text-center font-medium border-${isRTL ? 'l' : 'r'} border-gray-200`}>{t('reports.columns.credit') || 'Credit'}</th>
                                <th className={`px-4 py-2 text-center font-medium border-${isRTL ? 'l' : 'r'} border-gray-200`}>{t('reports.columns.debit') || 'Debit'}</th>
                                <th className={`px-4 py-2 text-center font-medium border-${isRTL ? 'l' : 'r'} border-gray-200`}>{t('reports.columns.credit') || 'Credit'}</th>
                                <th className={`px-4 py-2 text-center font-medium border-${isRTL ? 'l' : 'r'} border-gray-200`}>{t('reports.columns.debit') || 'Debit'}</th>
                                <th className="px-4 py-2 text-center font-medium">{t('reports.columns.credit') || 'Credit'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map(item => renderRow(item))}
                            {/* Total Row */}
                            <tr className="bg-gray-100 font-bold border-t border-gray-200">
                                <td className={`px-4 py-3 text-sm text-gray-900 border-${isRTL ? 'l' : 'r'} border-gray-200`}>{t('reports.total') || 'Total'}</td>
                                <td className={`px-4 py-3 text-sm text-center border-${isRTL ? 'l' : 'r'} border-gray-200`}>{Number(totals.initialDebit || 0).toFixed(2)}</td>
                                <td className={`px-4 py-3 text-sm text-center border-${isRTL ? 'l' : 'r'} border-gray-200`}>{Number(totals.initialCredit || 0).toFixed(2)}</td>
                                <td className={`px-4 py-3 text-sm text-center border-${isRTL ? 'l' : 'r'} border-gray-200`}>{Number(totals.transactionDebit || 0).toFixed(2)}</td>
                                <td className={`px-4 py-3 text-sm text-center border-${isRTL ? 'l' : 'r'} border-gray-200`}>{Number(totals.transactionCredit || 0).toFixed(2)}</td>
                                <td className={`px-4 py-3 text-sm text-center border-${isRTL ? 'l' : 'r'} border-gray-200`}>{Number(totals.endDebit || 0).toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-center">{Number(totals.endCredit || 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TrialBalanceReport;



