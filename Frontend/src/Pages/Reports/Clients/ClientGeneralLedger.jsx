import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer, Filter } from 'lucide-react';
import reportsService from '../../../services/reportsService';
import { exportClientStatementToExcel } from '../../../utils/customerSupplierInventoryExport';
import { downloadTablePdf } from '../../../utils/reportPdfBuilder';
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

    const handleExportPdf = async () => {
        await downloadTablePdf({
            title: t('reports.clients.client_general_ledger') || 'Customer Statement',
            subtitle: `${t('reports.filters.from_date')}: ${filters.fromDate}  ${t('reports.filters.to_date')}: ${filters.toDate}`,
            headers: [
                t('reports.columns.date') || 'Date',
                t('reports.columns.type') || 'Type',
                t('reports.columns.document_number') || 'Document Number',
                t('reports.columns.description') || 'Description',
                t('reports.columns.debit') || 'Debit',
                t('reports.columns.credit') || 'Credit',
                t('reports.columns.balance') || 'Balance',
            ],
            rows: reportData.map((entry) => ([
                entry.date || '—',
                entry.type || '—',
                entry.documentNumber || '—',
                entry.description || '—',
                Number(entry.debit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                Number(entry.credit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                Number(entry.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
            ])),
            filename: `Customer_Statement_${filters.fromDate || 'report'}.pdf`,
            landscape: true,
        });
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
                        <PrintHeader title={''} isRTL={true} showLogo={false} />
                    </div>
                {/* Filters Section */}
                <div className="flex flex-wrap items-end gap-3 mb-6 no-print bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {/* Period */}
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('reports.filters.period')}</label>
                        <div className="relative">
                            <select value={filters.period} onChange={(e) => handleFilterChange('period', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow">
                                {periodOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* From Date */}
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('reports.filters.from_date')}</label>
                        <div className="relative">
                            <input type="text" value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* To Date */}
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('reports.filters.to_date')}</label>
                        <div className="relative">
                            <input type="text" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Branches */}
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('reports.filters.branches')}</label>
                        <div className="relative">
                            <select value={filters.branch} onChange={(e) => handleFilterChange('branch', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow">
                                <option value="all">{t('reports.filters.all_branches')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Journal Account */}
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('reports.filters.journal_account')}</label>
                        <div className="relative">
                            <select value={filters.journalAccount} onChange={(e) => handleFilterChange('journalAccount', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow">
                                <option value="all">{t('reports.filters.all_journal_accounts')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Displayed Accounts */}
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('reports.filters.displayed_accounts')}</label>
                        <div className="relative">
                            <select value={filters.displayedAccounts} onChange={(e) => handleFilterChange('displayedAccounts', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow">
                                <option value="with_transactions">{t('reports.filters.with_transactions')}</option>
                                <option value="all">{t('reports.filters.all_accounts')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* View Report Button */}
                    <div className="flex-none w-full lg:w-auto">
                        <button
                            onClick={handleViewReport}
                            disabled={loading}
                            className="w-full lg:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 h-[42px] flex items-center justify-center min-w-[120px]"
                        >
                            {loading ? t('reports.loading') : t('reports.view_report')}
                        </button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Report Header & Export */}
                {reportData.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 no-print">
                        <h2 className="text-lg font-bold text-gray-900">
                            {t('reports.clients.client_general_ledger')}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 rtl:space-x-reverse">
                            <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200">
                                <Printer className="w-4 h-4" />
                                {t('reports.export.print') || 'طباعة'}
                            </button>
                            <button onClick={handleExportPdf} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-100 transition-colors border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-200">
                                <FileText className="w-4 h-4" />
                                {t('reports.export.pdf') || 'PDF'}
                            </button>
                            <button onClick={handleExportExcel} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                                <FileSpreadsheet className="w-4 h-4" />
                                {t('reports.export.excel') || 'إكسل'}
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
                                    <th className="px-4 py-3.5 text-start text-sm font-bold text-gray-700">{t('reports.columns.date')}</th>
                                    <th className="px-4 py-3.5 text-start text-sm font-bold text-gray-700">{t('reports.columns.type')}</th>
                                    <th className="px-4 py-3.5 text-start text-sm font-bold text-gray-700">{t('reports.columns.document_number')}</th>
                                    <th className="px-4 py-3.5 text-start text-sm font-bold text-gray-700">{t('reports.columns.description')}</th>
                                    <th className="px-4 py-3.5 text-start text-sm font-bold text-gray-700">{t('reports.columns.debit')}</th>
                                    <th className="px-4 py-3.5 text-start text-sm font-bold text-gray-700">{t('reports.columns.credit')}</th>
                                    <th className="px-4 py-3.5 text-start text-sm font-bold text-gray-700">{t('reports.columns.balance')}</th>
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



