import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { buildAccountingReportPdf, exportGeneralLedgerToExcel } from '../../../utils/accountingReportsExport';
import api from '../../../services/api';
import chartOfAccountsService from '../../../services/chartOfAccountsService';
import PrintHeader from '../../../components/common/PrintHeader';

const getMonthRange = (date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const toISO = (d) => d.toISOString().slice(0, 10);
    return { startDate: toISO(start), endDate: toISO(end) };
};

const GeneralLedgerReport = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { startDate: defaultFrom, endDate: defaultTo } = getMonthRange();
    const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const defaultAccountId = params.get('journal_account_id') || 'all';

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: defaultFrom,
        toDate: defaultTo,
        branch: 'all',
        journalAccount: defaultAccountId,
        displayedAccounts: 'with_transactions',
    });

    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);
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

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/accounting/general-ledger', {
                params: {
                    startDate: filters.fromDate,
                    endDate: filters.toDate,
                    branch: filters.branch !== 'all' ? filters.branch : undefined,
                    accountId: filters.journalAccount !== 'all' ? filters.journalAccount : undefined,
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
        fetchAccounts();
        fetchReport();
    }, []); // Run only once on initial mount to prevent duplicate calls

    // Placeholder column headers for General Ledger
    const tableColumns = [
        { key: 'date', label: t('reports.columns.date') || 'Date' },
        { key: 'description', label: t('reports.columns.description') || 'Description' },
        { key: 'account', label: t('reports.columns.account') || 'Account' },
        { key: 'debit', label: t('reports.columns.debit') || 'Debit' },
        { key: 'credit', label: t('reports.columns.credit') || 'Credit' },
        { key: 'balance', label: t('reports.columns.balance') || 'Balance' },
    ];

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '';
    const fmtNum = (n) => (n == null || n === '' || n === undefined) ? '' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleExportExcel = () => {
        exportGeneralLedgerToExcel(reportData.entries, reportData.account, t);
    };

    const handleExportPdf = () => {
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
                fmtNum(entry.debit || 0),
                fmtNum(entry.credit || 0),
                fmtNum(entry.balance || 0),
            ]);
        });
        const blob = buildAccountingReportPdf(t('reports.accounting.general_ledger') || 'General Ledger', contentRows, t);
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
        <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="hidden print:block mb-6">
                        <PrintHeader title={t('reports.accounting.general_ledger_title') || 'General Ledger'} isRTL={false} />
                    </div>
                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Period */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.period')}</label>
                        <div className="relative">
                            <select value={filters.period} onChange={(e) => {
                                const value = e.target.value;
                                const range = applyPeriod(value);
                                setFilters(prev => ({ ...prev, period: value, fromDate: range.startDate, toDate: range.endDate }));
                            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
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

                    {/* Journal Account */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.journal_account') || 'Journal Account'}</label>
                        <div className="relative">
                            <select value={filters.journalAccount} onChange={(e) => handleFilterChange('journalAccount', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="all">{t('reports.filters.all_journal_accounts') || 'All Journal Accounts'}</option>
                                {accounts.map((account) => (
                                    <option key={account._id} value={account._id}>{account.name} {account.code ? `#${account.code}` : ''}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Displayed Accounts */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.displayed_accounts')}</label>
                        <div className="relative">
                            <select value={filters.displayedAccounts} onChange={(e) => handleFilterChange('displayedAccounts', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="with_transactions">{t('reports.filters.with_transactions') || 'Accounts With Transactions Before...'}</option>
                                <option value="all">{t('reports.filters.all_accounts') || 'All Accounts'}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* View Report Button */}
                <div className="mb-6">
                    <button onClick={fetchReport} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                        {loading ? t('reports.loading') || 'Loading...' : t('reports.view_report')}
                    </button>
                </div>

                {/* Report Header & Export */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm text-gray-700 font-medium">
                        {t('reports.accounting.general_ledger_title') || 'General Ledger'}
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

                {/* Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {tableColumns.map(col => (
                                    <th key={col.key} className="px-4 py-3 text-start text-sm font-medium text-gray-700">{col.label}</th>
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
                                    <tr key={`${entry.restrictionNumber || ''}-${index}`} className="hover:bg-gray-50 border-b border-gray-100">
                                        <td className="px-4 py-3 text-sm text-gray-900">{fmtDate(entry.date)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.description || ''}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.accountCode || ''}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.debit > 0 ? fmtNum(entry.debit) : ''}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.credit > 0 ? fmtNum(entry.credit) : ''}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{fmtNum(entry.balance || 0)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GeneralLedgerReport;
