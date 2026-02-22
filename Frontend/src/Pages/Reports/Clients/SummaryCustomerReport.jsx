import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import reportsService from '../../../services/reportsService';
import { exportCustomerSummaryToExcel, buildCustomerSummaryPdf } from '../../../utils/customerSupplierInventoryExport';

const SummaryCustomerReport = () => {
    const { t } = useTranslation();
    const [summaryData, setSummaryData] = useState(null);
    const [detailedData, setDetailedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [customers, setCustomers] = useState([]);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDateForInput = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: formatDateForInput(firstDay),
        toDate: formatDateForInput(lastDay),
        customerId: 'all',
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => {
            const newFilters = { ...prev, [field]: value };

            if (field === 'period' && value !== 'custom') {
                const now = new Date();
                let start, end;

                if (value === 'current_month') {
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                } else if (value === 'last_month') {
                    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    end = new Date(now.getFullYear(), now.getMonth(), 0);
                } else if (value === 'current_quarter') {
                    const quarter = Math.floor(now.getMonth() / 3);
                    start = new Date(now.getFullYear(), quarter * 3, 1);
                    end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                } else if (value === 'current_year') {
                    start = new Date(now.getFullYear(), 0, 1);
                    end = new Date(now.getFullYear(), 11, 31);
                }

                if (start && end) {
                    newFilters.fromDate = formatDateForInput(start);
                    newFilters.toDate = formatDateForInput(end);
                }
            }
            return newFilters;
        });
        setError(null);
    };

    const fetchCustomers = async () => {
        try {
            const list = await reportsService.getCustomersList();
            setCustomers(list);
        } catch (err) {
            console.error('Error fetching customers:', err);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch Summary (Cards)
            const sumRes = await reportsService.getCustomersSummary(filters.fromDate, filters.toDate, filters.customerId);
            const sumData = sumRes?.data ?? sumRes;
            setSummaryData(sumData);

            // Fetch Detailed Breakdown (Table) if 'all'
            if (filters.customerId === 'all') {
                const detRes = await reportsService.getCustomersDetailed(filters.fromDate, filters.toDate);
                setDetailedData(detRes?.data ?? []);
            } else {
                setDetailedData([]);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('reports.error_load'));
            setSummaryData(null);
            setDetailedData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReport = () => {
        fetchReport();
    };

    // Initial fetch
    useEffect(() => {
        fetchCustomers();
        fetchReport();
    }, []);

    // Filter changes (date or period) - update on period change
    useEffect(() => {
        if (filters.period !== 'custom') {
            fetchReport();
        }
    }, [filters.fromDate, filters.toDate, filters.period]);

    // Customer change - update immediately
    useEffect(() => {
        fetchReport();
    }, [filters.customerId]);

    // Listen for customer creation/update events
    useEffect(() => {
        const onCustomerCreated = () => {
            fetchReport();
        };
        const onCustomerUpdated = () => {
            fetchReport();
        };
        const onSalesInvoiceCreated = () => {
            fetchReport();
        };
        const onPaymentCreated = () => {
            fetchReport();
        };

        window.addEventListener('customer-created', onCustomerCreated);
        window.addEventListener('customer-updated', onCustomerUpdated);
        window.addEventListener('sales-invoice-created', onSalesInvoiceCreated);
        window.addEventListener('payment-created', onPaymentCreated);

        return () => {
            window.removeEventListener('customer-created', onCustomerCreated);
            window.removeEventListener('customer-updated', onCustomerUpdated);
            window.removeEventListener('sales-invoice-created', onSalesInvoiceCreated);
            window.removeEventListener('payment-created', onPaymentCreated);
        };
    }, [filters]);

    const periodOptions = [
        { value: 'current_month', label: t('reports.filters.current_month') },
        { value: 'last_month', label: t('reports.filters.last_month') },
        { value: 'current_quarter', label: t('reports.filters.current_quarter') },
        { value: 'current_year', label: t('reports.filters.current_year') },
        { value: 'custom', label: t('reports.filters.custom') },
    ];

    const formatAmount = (n) => (n == null || Number.isNaN(Number(n))) ? '0.00' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleExportExcel = () => {
        if (!summaryData) return;
        exportCustomerSummaryToExcel(summaryData, { fromDate: filters.fromDate, toDate: filters.toDate }, t);
    };

    const handleExportPdf = () => {
        if (!summaryData) return;
        const blob = buildCustomerSummaryPdf(summaryData, { fromDate: filters.fromDate, toDate: filters.toDate }, t);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Client_General_Ledger_${filters.fromDate}_${filters.toDate}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    {/* Filters Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 no-print">
                        {/* Period */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.period')}</label>
                            <div className="relative">
                                <select
                                    value={filters.period}
                                    onChange={(e) => handleFilterChange('period', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {periodOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* From Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.from_date')}</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={filters.fromDate}
                                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* To Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.to_date')}</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={filters.toDate}
                                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Customer */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.client') || 'Customer'}</label>
                            <div className="relative">
                                <select
                                    value={filters.customerId}
                                    onChange={(e) => handleFilterChange('customerId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="all">{t('reports.filters.all_clients') || 'All Customers'}</option>
                                    {customers.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* View Report Button */}
                    <div className="mb-6 no-print">
                        <button
                            onClick={handleViewReport}
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? t('reports.loading') : t('reports.view_report')}
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Report Header & Export */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100 no-print">
                        <div className="text-sm text-gray-700 font-medium">
                            {t('reports.clients.summary_report')}
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



                    {/* Detailed Table (All Customers) */}
                    {filters.customerId === 'all' && detailedData.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto mb-6">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-gray-700">{t('reports.columns.client') || 'Customer'}</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">{t('reports.columns.total_invoices') || 'Total Invoices'}</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">{t('reports.columns.total_returns') || 'Total Returns'}</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">{t('reports.columns.total_paid') || 'Total Paid'}</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">{t('reports.columns.outstanding') || 'Outstanding'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {detailedData.map((row) => (
                                        <tr key={row.customerId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{row.customerName}</td>
                                            <td className="px-4 py-3 text-gray-700">{formatAmount(row.totalInvoices)}</td>
                                            <td className="px-4 py-3 text-gray-700">{formatAmount(row.totalReturns)}</td>
                                            <td className="px-4 py-3 text-gray-700">{formatAmount(row.totalPaid)}</td>
                                            <td className={`px-4 py-3 font-bold ${row.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatAmount(row.outstanding)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {loading && !summaryData && (
                        <div className="text-center py-8 text-gray-500">
                            {t('reports.loading')}
                        </div>
                    )}

                    {!loading && !summaryData && !error && (
                        <div className="text-center py-8 text-gray-500">
                            {t('reports.no_data')}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SummaryCustomerReport;
