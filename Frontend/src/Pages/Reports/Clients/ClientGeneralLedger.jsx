import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer, Filter } from 'lucide-react';
import reportsService from '../../../services/reportsService';
import { exportClientStatementToExcel, buildClientStatementPdf } from '../../../utils/customerSupplierInventoryExport';
import PrintHeader from '../../../components/common/PrintHeader';

const ClientGeneralLedger = () => {
    const { t } = useTranslation();
    const printRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [totals, setTotals] = useState(null);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date) => {
        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: formatDate(firstDay),
        toDate: formatDate(lastDay),
        branch: 'all',
        journalAccount: 'all',
        displayedAccounts: 'with_transactions',
        clientId: 'unspecified',
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await reportsService.getClientGeneralLedger({
                fromDate: filters.fromDate,
                toDate: filters.toDate,
                clientId: filters.clientId,
                branch: filters.branch,
                journalAccount: filters.journalAccount,
            });
            const data = res?.data ?? [];
            setReportData(Array.isArray(data) ? data : []);
            setTotals(res?.totals || null);
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('reports.error_load'));
            setReportData([]);
            setTotals(null);
        } finally {
            setLoading(false);
        }
    }, [filters, t]);

    const handleViewReport = () => {
        fetchReport();
    };

    // Auto-fetch on mount
    useEffect(() => {
        fetchReport();
    }, []);

    // Listen for invoice creation/update events
    useEffect(() => {
        const onInvoiceCreated = () => {
            fetchReport();
        };
        window.addEventListener('sales-invoice-created', onInvoiceCreated);
        window.addEventListener('payment-created', onInvoiceCreated);
        return () => {
            window.removeEventListener('sales-invoice-created', onInvoiceCreated);
            window.removeEventListener('payment-created', onInvoiceCreated);
        };
    }, [fetchReport]);

    const formatCellDate = (d) => {
        if (!d) return '—';
        const date = new Date(d);
        return date.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
    };

    const getDocumentLink = (entry) => {
        if (!entry?.documentId) return null;
        if (entry.type === 'invoice') return `/dashboard/sales/invoices?openId=${entry.documentId}`;
        if (entry.type === 'return') return `/dashboard/sales/returns?openId=${entry.documentId}`;
        if (entry.type === 'payment') return `/dashboard/sales/payments?openId=${entry.documentId}`;
        return null;
    };

    const handleExportExcel = () => {
        exportClientStatementToExcel(reportData, totals, { fromDate: filters.fromDate, toDate: filters.toDate }, t);
    };

    const handleExportPdf = () => {
        const blob = buildClientStatementPdf(reportData, totals, { fromDate: filters.fromDate, toDate: filters.toDate }, t);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Customer_Statement_${filters.fromDate || 'report'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    const typeLabel = (type) => {
        if (type === 'invoice') return t('reports.invoice') || 'Invoice';
        if (type === 'return') return t('reports.return') || 'Return';
        return t('reports.payment') || 'Payment';
    };

    const periodOptions = [
        { value: 'current_month', label: t('reports.filters.current_month') },
        { value: 'last_month', label: t('reports.filters.last_month') },
        { value: 'current_quarter', label: t('reports.filters.current_quarter') },
        { value: 'current_year', label: t('reports.filters.current_year') },
    ];

    return (
        <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="hidden print:block mb-6">
                        <PrintHeader title={''} isRTL={false} />
                    </div>
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

                    {/* Journal Account */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.journal_account')}</label>
                        <div className="relative">
                            <select value={filters.journalAccount} onChange={(e) => handleFilterChange('journalAccount', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="all">{t('reports.filters.all_journal_accounts')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Displayed Accounts */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.displayed_accounts')}</label>
                        <div className="relative">
                            <select value={filters.displayedAccounts} onChange={(e) => handleFilterChange('displayedAccounts', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="with_transactions">{t('reports.filters.with_transactions')}</option>
                                <option value="all">{t('reports.filters.all_accounts')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* View Report Button */}
                <div className="mb-6">
                    <button
                        onClick={handleViewReport}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? t('reports.loading') : t('reports.view_report')}
                    </button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Report Header & Export */}
                {reportData.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="text-sm text-gray-700 font-medium">
                            {t('reports.clients.client_general_ledger')}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors border border-green-200"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                {t('reports.export.excel')}
                            </button>
                            <button
                                onClick={handleExportPdf}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded text-xs font-medium hover:bg-purple-100 transition-colors border border-purple-200"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                {t('reports.export.pdf')}
                            </button>
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                {t('reports.export.print')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                {reportData.length > 0 ? (
                    <div ref={printRef} className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.columns.date')}</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.columns.type')}</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.columns.document_number')}</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.columns.description')}</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.columns.debit')}</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.columns.credit')}</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.columns.balance')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {reportData.map((entry, idx) => {
                                    const docLink = getDocumentLink(entry);
                                    return (
                                        <tr key={idx} className="bg-white hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700">{formatCellDate(entry.date)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {docLink ? (
                                                    <Link to={docLink} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                                        {typeLabel(entry.type)}
                                                    </Link>
                                                ) : (
                                                    typeLabel(entry.type)
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {docLink ? (
                                                    <Link to={docLink} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                                        {entry.documentNumber || '—'}
                                                    </Link>
                                                ) : (
                                                    entry.documentNumber || '—'
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{entry.description || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(entry.debit)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(entry.credit)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">{formatCurrency(entry.balance)}</td>
                                        </tr>
                                    );
                                })}
                                {/* Totals Row */}
                                {totals && (
                                    <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
                                        <td className="px-4 py-3 text-sm text-gray-700" colSpan="3">{t('reports.totals')}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700"></td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(totals.totalDebit)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(totals.totalCredit)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(totals.finalBalance)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : !loading && (
                    <div className="border border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500">
                        <Filter className="w-12 h-12 mb-4 text-gray-300" />
                        <p>{t('reports.no_data')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientGeneralLedger;
