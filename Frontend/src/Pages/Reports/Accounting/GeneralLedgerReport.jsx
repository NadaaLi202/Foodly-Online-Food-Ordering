import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, FileSpreadsheet, FileText, Printer, Filter } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { buildAccountingReportPdf, exportGeneralLedgerToExcel } from '../../../utils/accountingReportsExport';
import api from '../../../services/api';
import chartOfAccountsService from '../../../services/chartOfAccountsService';
import PrintHeader from '../../../components/common/PrintHeader';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency as utilFormatCurrency } from '../../../utils/currencyFormatter';

const getMonthRange = (date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const toISO = (d) => d.toISOString().slice(0, 10);
    return { startDate: toISO(start), endDate: toISO(end) };
};

const GeneralLedgerReport = () => {
    const { t, i18n } = useTranslation();
    const { companySettings } = useAuth();
    const currency = companySettings?.currency || 'EGP';
    const isRTL = i18n.language === 'ar';
    const location = useLocation();
    const { startDate: defaultFrom, endDate: defaultTo } = getMonthRange();
    const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const defaultAccountId = params.get('journal_account_id') || 'all';
    const defaultAccountCode = params.get('accountCode') || '';

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: defaultFrom,
        toDate: defaultTo,
        branch: 'all',
        journalAccount: defaultAccountId,
        accountCode: defaultAccountCode,
        displayedAccounts: 'with_transactions',
    });

    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [reportData, setReportData] = useState({
        account: null,
        entries: [],
        totalEntries: 0,
    });
    const hasFetched = useRef(false);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const periodOptions = [
        { value: 'current_month', label: t('reports.filters.current_month') },
        { value: 'last_month', label: t('reports.filters.last_month') },
        { value: 'current_quarter', label: t('reports.filters.current_quarter') },
        { value: 'current_year', label: t('reports.filters.current_year') },
    ];

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

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await chartOfAccountsService.getAllAccounts();
            const list = res?.accounts || res?.data || res || [];
            setAccounts(Array.isArray(list) ? list : []);
        } catch (error) {
            setAccounts([]);
        }
    }, []);

    const fetchBranches = useCallback(async () => {
        try {
            const response = await api.get('/branches');
            setBranches(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            setBranches([]);
        }
    }, []);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/accounting/general-ledger', {
                params: {
                    startDate: filters.fromDate,
                    endDate: filters.toDate,
                    branch: filters.branch !== 'all' ? filters.branch : undefined,
                    accountId: filters.journalAccount !== 'all' ? filters.journalAccount : undefined,
                    accountCode: filters.accountCode || undefined,
                }
            });
            setReportData({
                account: response.data?.account || null,
                entries: response.data?.entries || [],
                totalEntries: response.data?.totalEntries || 0,
            });
        } catch (error) {
            setReportData({
                account: null,
                entries: [],
                totalEntries: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [filters.branch, filters.fromDate, filters.journalAccount, filters.toDate]);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchBranches();
        fetchAccounts();
        fetchReport();
    }, []); // Run only once on initial mount to prevent duplicate calls

    // Placeholder column headers for General Ledger
    const tableColumns = [
        { key: 'date', label: t('reports.columns.date') },
        { key: 'description', label: t('reports.columns.description') || 'البيان' },
        { key: 'account', label: t('reports.columns.account') || 'الحساب' },
        { key: 'debit', label: t('reports.columns.debit') },
        { key: 'credit', label: t('reports.columns.credit') },
        { key: 'balance', label: t('reports.columns.balance') },
    ];

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '';
    const formatCurrency = (amount, entryCurrency) => utilFormatCurrency(amount, entryCurrency || currency);

    const handleExportExcel = () => {
        exportGeneralLedgerToExcel(reportData.entries, reportData.account, t);
    };

    const handleExportPdf = async () => {
        const contentRows = [];
        contentRows.push([t('reports.accounting.general_ledger') || 'General Ledger']);
        contentRows.push([t('reports.filters.from_date') || 'From Date', filters.fromDate]);
        contentRows.push([t('reports.filters.to_date') || 'To Date', filters.toDate]);
        if (reportData.account) {
            contentRows.push([t('reports.columns.account') || 'Account', `${reportData.account.name || ''} #${reportData.account.code || ''}`]);
        }
        contentRows.push([]);
        contentRows.push([
            t('reports.columns.date') || 'Date',
            t('reports.columns.description') || 'Description',
            t('reports.columns.debit') || 'Debit',
            t('reports.columns.credit') || 'Credit',
            t('reports.columns.balance') || 'Balance',
        ]);
        reportData.entries.forEach(entry => {
            contentRows.push([
                fmtDate(entry.date),
                entry.description || '',
                formatCurrency(entry.debit || 0, entry.currency),
                formatCurrency(entry.credit || 0, entry.currency),
                formatCurrency(entry.balance || 0, entry.currency),
            ]);
        });
        const blob = await buildAccountingReportPdf(t('reports.accounting.general_ledger') || 'General Ledger', contentRows, t);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `General_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="hidden print:block mb-6">
                <PrintHeader title={t('reports.accounting.general_ledger_title') || 'General Ledger'} isRTL={isRTL} showLogo={false} />
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{t('reports.accounting.general_ledger_title') || 'General Ledger'}</h3>
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

                    {/* Journal Account */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.journal_account') || 'Journal Account'}</label>
                        <div className="relative">
                            <select
                                value={filters.journalAccount}
                                onChange={(e) => setFilters(prev => ({ ...prev, journalAccount: e.target.value, accountCode: '' }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">{t('reports.filters.all_journal_accounts') || 'All Journal Accounts'}</option>
                                {accounts.map((account) => (
                                    <option key={account._id} value={account._id}>{account.name} {account.code ? `#${account.code}` : ''}</option>
                                ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={fetchReport}
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {tableColumns.map(col => (
                                        <th key={col.key} className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-gray-700`}>{col.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.entries.length === 0 ? (
                                    <tr>
                                        <td colSpan={tableColumns.length} className="px-4 py-8 text-center text-gray-500">{t('reports.no_data')}</td>
                                    </tr>
                                ) : (
                                    reportData.entries.map((entry, index) => (
                                        <tr
                                            key={index}
                                            className={`hover:bg-gray-50 border-b border-gray-100 ${entry.isOpening ? 'bg-gray-50 font-bold' : ''}`}
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-900">{entry.date ? fmtDate(entry.date) : ''}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{entry.description || ''}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {entry.accountName || entry.accountCode || ''}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right text-emerald-600">
                                                {entry.debit > 0 ? formatCurrency(entry.debit, entry.currency) : ''}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right text-red-600">
                                                {entry.credit > 0 ? formatCurrency(entry.credit, entry.currency) : ''}
                                            </td>
                                            <td className={`px-4 py-3 text-sm text-right font-medium ${entry.balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                                {formatCurrency(entry.balance || 0, entry.currency)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneralLedgerReport;



