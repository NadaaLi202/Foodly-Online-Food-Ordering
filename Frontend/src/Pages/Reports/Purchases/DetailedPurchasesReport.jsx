import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer, BarChart3, List } from 'lucide-react';
import reportsService from '../../../services/reportsService';
import { downloadTablePdf } from '../../../utils/reportPdfBuilder';
import * as XLSX from 'xlsx';
import PrintHeader from '../../../components/common/PrintHeader';

const PurchasesReport = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const isRTL = i18n.language === 'ar';
    const printRef = useRef(null);

    const [activeTab] = useState('detailed');
    const [detailedData, setDetailedData] = useState([]);
    const [summaryData, setSummaryData] = useState([]);
    const [grandTotals, setGrandTotals] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get current month dates for initial filters
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const formatAmount = (n) => (n == null || Number.isNaN(Number(n))) ? '0.00' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: formatDate(firstDay),
        toDate: formatDate(lastDay),
        branch: '',
        groupBy: 'month',
        invoiceType: '',
        supplier: '',
        product: '',
        productCategory: '',
        storehouse: '',
        paymentStatus: '',
        user: '',
        purchasesEmployee: '',
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const fetchDetailedReport = useCallback(async (filterOverrides) => {
        const state = filterOverrides !== undefined ? filterOverrides : filters;
        setLoading(true);
        setError(null);
        try {
            const res = await reportsService.getPurchasesInvoicesDetailed(state);
            const list = res?.data ?? (Array.isArray(res) ? res : []);
            setDetailedData(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('reports.error_load'));
        } finally {
            setLoading(false);
        }
    }, [filters, t]);

    const fetchSummaryReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await reportsService.getPurchasesSummary(filters.fromDate, filters.toDate);
            setSummaryData(Array.isArray(res.data) ? res.data : []);
            setGrandTotals(res.grandTotals || null);
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('reports.error_load'));
            setSummaryData([]);
            setGrandTotals(null);
        } finally {
            setLoading(false);
        }
    }, [filters, t]);

    const handleViewReport = async () => {
        if (activeTab === 'detailed') {
            await fetchDetailedReport();
        } else {
            await fetchSummaryReport();
        }
    };

    // Auto-fetch on mount
    useEffect(() => {
        if (activeTab === 'detailed') {
            fetchDetailedReport({}); // all by default
        } else {
            fetchSummaryReport();
        }
    }, [activeTab]);

    // Handle real-time updates
    useEffect(() => {
        const onRefresh = () => {
            if (activeTab === 'detailed') fetchDetailedReport({});
            else fetchSummaryReport();
        };
        window.addEventListener("purchase-document-created", onRefresh);
        window.addEventListener("payment-created", onRefresh);
        return () => {
            window.removeEventListener("purchase-document-created", onRefresh);
            window.removeEventListener("payment-created", onRefresh);
        };
    }, [activeTab, fetchDetailedReport, fetchSummaryReport]);

    // Export logic
    const handleExportExcel = () => {
        if (activeTab === 'detailed') {
            if (!detailedData.length) return;
            const detailedTableCols = availableDetailedColumns.filter(col => selectedDetailedColumns.includes(col.key));
            const exportData = detailedData.map(row => {
                const r = {};
                detailedTableCols.forEach(col => {
                    let val = 'â€”';
                    if (col.key === 'code') val = row.invoiceNumber ?? 'â€”';
                    else if (col.key === 'type') val = row.documentType || row.type;
                    else if (col.key === 'issue_date') val = row.date ? new Date(row.date).toLocaleDateString() : 'â€”';
                    else if (col.key === 'supplier') val = row.supplier ?? row.client ?? 'â€”';
                    else if (['discounts', 'total_without_taxes', 'total'].includes(col.key)) {
                        const keys = { 'discounts': 'discounts', 'total_without_taxes': 'totalWithoutTax', 'total': 'amount' };
                        val = row[keys[col.key]] ?? 0;
                    }
                    r[col.label] = val;
                });
                return r;
            });
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Detailed Purchases");
            XLSX.writeFile(workbook, `Detailed_Purchases_Report_${filters.fromDate}_to_${filters.toDate}.xlsx`);
        } else {
            if (!summaryData.length) return;
            const summaryTableCols = availableSummaryColumns.filter(col => selectedSummaryColumns.includes(col.key));
            const exportData = summaryData.map(row => {
                const r = { [t('reports.table.month')]: row.month ?? 'â€”' };
                summaryTableCols.forEach(col => {
                    r[col.label] = row[col.key];
                });
                return r;
            });
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Summary Purchases");
            XLSX.writeFile(workbook, `Summary_Purchases_Report_${filters.fromDate}_to_${filters.toDate}.xlsx`);
        }
    };

    const handleExportPdf = async () => {
        const cols = activeTab === 'detailed'
            ? availableDetailedColumns.filter(c => selectedDetailedColumns.includes(c.key))
            : [{ key: 'month', label: t('reports.table.month') }, ...availableSummaryColumns.filter(c => selectedSummaryColumns.includes(c.key))];
        const headers = cols.map((col) => col.label);
        const data = activeTab === 'detailed' ? detailedData : summaryData;
        const rows = data.map(row => cols.map(col => {
            if (activeTab === 'detailed') {
                if (col.key === 'code') return row.invoiceNumber ?? '—';
                if (col.key === 'type') {
                    if (row.documentType === 'return') return t('reports.purchases.type_return');
                    if (row.documentType === 'purchaseOrder') return t('reports.purchases.type_order');
                    return t('reports.detailed_columns.type_invoice');
                }
                if (col.key === 'issue_date') return row.date ? new Date(row.date).toLocaleDateString() : '—';
                if (col.key === 'supplier') return row.supplier ?? row.client ?? '—';
                if (['discounts', 'total_without_taxes', 'total'].includes(col.key)) {
                    const keys = { discounts: 'discounts', total_without_taxes: 'totalWithoutTax', total: 'amount' };
                    return formatAmount(row[keys[col.key]]);
                }
            } else {
                if (col.key === 'month') return row.month ?? '—';
                if (['invoices', 'returns', 'orders', 'suppliers', 'products'].includes(col.key)) return row[col.key] ?? 0;
                return formatAmount(row[col.key]);
            }
            return '—';
        }));

        await downloadTablePdf({
            title: activeTab === 'detailed' ? t('reports.detailed_purchases_report') : t('reports.summary_purchases_report'),
            headers,
            rows,
            filename: `Purchases_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
            landscape: true,
        });
    };

    const handlePrint = () => { window.print(); };

    // Options
    const periodOptions = [
        { value: 'current_month', label: t('reports.filters.current_month') },
        { value: 'last_month', label: t('reports.filters.last_month') },
        { value: 'current_quarter', label: t('reports.filters.current_quarter') },
        { value: 'current_year', label: t('reports.filters.current_year') },
        { value: 'custom', label: t('reports.filters.custom') },
    ];

    const groupByOptions = [
        { value: 'month', label: t('reports.filters.month') },
        { value: 'week', label: t('reports.filters.week') },
        { value: 'day', label: t('reports.filters.day') },
        { value: 'supplier', label: t('reports.filters.supplier') },
        { value: 'product', label: t('reports.filters.product') },
    ];

    const availableDetailedColumns = [
        { key: 'code', label: t('reports.detailed_columns.code') },
        { key: 'type', label: t('reports.detailed_columns.type') },
        { key: 'issue_date', label: t('reports.detailed_columns.issue_date') },
        { key: 'supplier', label: t('reports.detailed_columns.client') },
        { key: 'discounts', label: t('reports.detailed_columns.discounts') },
        { key: 'total_without_taxes', label: t('reports.detailed_columns.total_without_taxes') },
        { key: 'total', label: t('reports.detailed_columns.total') },
    ];
    const [selectedDetailedColumns, setSelectedDetailedColumns] = useState(availableDetailedColumns.map(c => c.key));

    const availableSummaryColumns = [
        { key: 'invoices', label: t('reports.columns.invoices') },
        { key: 'returns', label: t('reports.columns.returns') },
        { key: 'orders', label: t('reports.columns.orders') },
        { key: 'suppliers', label: t('reports.columns.suppliers') },
        { key: 'products', label: t('reports.columns.products') },
        { key: 'total_invoices', label: t('reports.columns.total_invoices') },
        { key: 'total_returns', label: t('reports.columns.total_returns') },
        { key: 'total_orders', label: t('reports.columns.total_orders') },
        { key: 'total_purchases_discounts', label: t('reports.columns.total_purchases_discounts') },
        { key: 'net_purchases_discounts', label: t('reports.columns.net_purchases_discounts') },
        { key: 'net_purchases', label: t('reports.columns.net_purchases') },
    ];
    const [selectedSummaryColumns, setSelectedSummaryColumns] = useState(availableSummaryColumns.map(c => c.key));

    const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
    const toggleColumn = (key) => {
        if (activeTab === 'detailed') setSelectedDetailedColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
        else setSelectedSummaryColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const renderSummaryCards = () => {
        return null;
    };

    return (
        <>
            <div className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`} id="purchases-report-root">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
                        <h1 className="text-2xl font-black text-gray-900">{t('reports.purchase_reports') || 'Purchase Reports'}</h1>
                    </div>

                    {/* Shared Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 no-print">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.period')}</label>
                            <div className="relative">
                                <select value={filters.period} onChange={(e) => handleFilterChange('period', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-indigo-500">
                                    {periodOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.from_date')}</label>
                            <div className="relative">
                                <input type="text" value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500" placeholder="DD-MM-YYYY" />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.to_date')}</label>
                            <div className="relative">
                                <input type="text" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500" placeholder="DD-MM-YYYY" />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.branches')}</label>
                            <div className="relative">
                                <select value={filters.branch} onChange={(e) => handleFilterChange('branch', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-indigo-500">
                                    <option value="">{t('reports.filters.all_branches')}</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {renderSummaryCards()}

                    {/* Shared Action Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg no-print">
                        <div className="flex items-center gap-4">
                            <button onClick={handleViewReport} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                                {loading ? t('reports.loading') : t('reports.view_report')}
                            </button>
                            {error && <span className="text-sm text-red-600">{error}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleExportExcel} disabled={loading || (activeTab === 'detailed' ? !detailedData.length : !summaryData.length)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 border border-green-200 transition-colors">
                                <FileSpreadsheet className="w-4 h-4" /> {t('reports.export.excel')}
                            </button>
                            <button onClick={handleExportPdf} disabled={loading || (activeTab === 'detailed' ? !detailedData.length : !summaryData.length)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 border border-red-200 transition-colors">
                                <FileText className="w-4 h-4" /> {t('reports.export.pdf')}
                            </button>
                            <button onClick={handlePrint} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 border border-blue-200 transition-colors">
                                <Printer className="w-4 h-4" /> {t('reports.print')}
                            </button>
                            <div className="relative">
                                <button onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)} className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white pr-10 focus:ring-2 focus:ring-indigo-500 flex items-center gap-2">
                                    {t('reports.select_columns')}
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </button>
                                {isColumnDropdownOpen && (
                                    <div className="absolute right-0 bottom-full mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
                                        {(activeTab === 'detailed' ? availableDetailedColumns : availableSummaryColumns).map(col => {
                                            const isSelected = (activeTab === 'detailed' ? selectedDetailedColumns : selectedSummaryColumns).includes(col.key);
                                            return (
                                                <button key={col.key} onClick={() => toggleColumn(col.key)} className="w-full px-4 py-2 text-start text-sm hover:bg-gray-50 flex items-center justify-between">
                                                    <span className={isSelected ? 'font-bold text-gray-900' : 'text-gray-600'}>{col.label}</span>
                                                    {isSelected && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                                        <div className="hidden print:block mb-6">
                        <PrintHeader title={t('reports.purchase_reports') || 'Purchase Reports'} isRTL={isRTL} showLogo={false} />
                    </div>
                    {/* Table Section */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white" ref={printRef}>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        {activeTab === 'summary' && <th className="px-4 py-3 text-start text-sm font-bold text-gray-700">{t('reports.table.month')}</th>}
                                        {(activeTab === 'detailed' ? availableDetailedColumns.filter(c => selectedDetailedColumns.includes(c.key)) : availableSummaryColumns.filter(c => selectedSummaryColumns.includes(c.key))).map(col => (
                                            <th key={col.key} className="px-4 py-3 text-start text-sm font-bold text-gray-700">{col.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {activeTab === 'detailed' ? (
                                        detailedData.length > 0 ? (
                                            detailedData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    {availableDetailedColumns.filter(c => selectedDetailedColumns.includes(c.key)).map(col => {
                                                        let val = 'â€”';
                                                        if (col.key === 'code') val = row.invoiceNumber ?? 'â€”';
                                                        else if (col.key === 'type') {
                                                            if (row.documentType === 'return') val = t('reports.purchases.type_return');
                                                            else if (row.documentType === 'purchaseOrder') val = t('reports.purchases.type_order');
                                                            else val = t('reports.detailed_columns.type_invoice');
                                                        }
                                                        else if (col.key === 'issue_date') val = row.date ? new Date(row.date).toLocaleDateString() : 'â€”';
                                                        else if (col.key === 'supplier') val = row.supplier ?? row.client ?? 'â€”';
                                                        else if (['discounts', 'total_without_taxes', 'total'].includes(col.key)) {
                                                            const keys = { 'discounts': 'discounts', 'total_without_taxes': 'totalWithoutTax', 'total': 'amount' };
                                                            val = formatAmount(row[keys[col.key]]);
                                                        }
                                                        if (col.key === 'code') {
                                                            let url = `/dashboard/purchases/invoices?openId=${row._id}`;
                                                            if (row.documentType === 'return') url = `/dashboard/purchases/returns?openId=${row._id}`;
                                                            if (row.documentType === 'purchaseOrder') url = `/dashboard/purchases/purchase-orders?openId=${row._id}`;
                                                            return <td key={col.key} className="px-4 py-3 text-sm font-medium"><Link to={url} className="text-indigo-600 hover:underline">{val}</Link></td>;
                                                        }
                                                        return <td key={col.key} className="px-4 py-3 text-sm text-gray-600">{val}</td>;
                                                    })}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm italic">{loading ? '...' : t('reports.no_data')}</td></tr>
                                        )
                                    ) : (
                                        summaryData.length > 0 ? (
                                            summaryData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{row.month}</td>
                                                    {availableSummaryColumns.filter(c => selectedSummaryColumns.includes(c.key)).map(col => {
                                                        let val = 'â€”';
                                                        if (['invoices', 'returns', 'orders', 'suppliers', 'products'].includes(col.key)) val = row[col.key] ?? 0;
                                                        else {
                                                            const keys = { 'total_invoices': 'totalInvoices', 'total_returns': 'totalReturns', 'total_orders': 'totalOrders', 'total_purchases_discounts': 'totalPurchasesDiscounts', 'net_purchases_discounts': 'netPurchasesDiscounts', 'net_purchases': 'netPurchases' };
                                                            val = formatAmount(row[keys[col.key]]);
                                                        }
                                                        return <td key={col.key} className="px-4 py-3 text-sm text-gray-600">{val}</td>;
                                                    })}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={12} className="px-4 py-12 text-center text-gray-400 text-sm italic">{loading ? '...' : t('reports.no_data')}</td></tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PurchasesReport;

