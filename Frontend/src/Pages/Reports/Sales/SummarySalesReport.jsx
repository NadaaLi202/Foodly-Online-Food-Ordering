import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import reportsService from '../../../services/reportsService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PrintHeader from '../../../components/common/PrintHeader';

const SummarySalesReport = () => {
    const { t, i18n } = useTranslation();
    const printRef = useRef(null);
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isRTL = i18n.language === 'ar';

    // Get current month dates
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date) => {
        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const formatDisplayDate = (date) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', options);
    };

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: formatDate(firstDay),
        toDate: formatDate(lastDay),
        branch: '',
        groupBy: 'month',
        invoiceType: '',
        client: '',
        product: '',
        productCategory: '',
        storehouse: '',
        paymentStatus: '',
        user: '',
        salesperson: '',
    });

    const [chartMetric, setChartMetric] = useState('net_sales');

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleViewReport = async () => {
        setLoading(true);
        setError(null);
        setSummaryData(null);
        try {
            const res = await reportsService.getSalesSummary(filters.fromDate, filters.toDate);
            const data = res?.data ?? res;
            setSummaryData(Array.isArray(data) ? data : (data && typeof data === 'object' && !Array.isArray(data) ? [data] : []));
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('reports.error_load'));
            setSummaryData([]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch on mount and listen for updates
    React.useEffect(() => {
        let cancelled = false;
        const fetchData = () => {
            setLoading(true);
            reportsService.getSalesSummary(filters.fromDate, filters.toDate)
                .then((res) => {
                    const data = res?.data ?? res;
                    if (!cancelled) setSummaryData(Array.isArray(data) ? data : (data && typeof data === 'object' && !Array.isArray(data) ? [data] : []));
                })
                .catch((err) => {
                    if (!cancelled) {
                        setError(err.response?.data?.message || err.message || t('reports.error_load'));
                        setSummaryData([]);
                    }
                })
                .finally(() => { if (!cancelled) setLoading(false); });
        };

        fetchData();

        const onRefresh = () => fetchData();
        window.addEventListener("sales-invoice-created", onRefresh);
        window.addEventListener("payment-created", onRefresh);

        return () => {
            cancelled = true;
            window.removeEventListener("sales-invoice-created", onRefresh);
            window.removeEventListener("payment-created", onRefresh);
        };
    }, [filters.fromDate, filters.toDate]);

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
        { value: 'client', label: t('reports.filters.client') },
        { value: 'product', label: t('reports.filters.product') },
    ];

    // Column selection options
    const availableColumns = [
        { key: 'invoices', label: t('reports.columns.invoices') },
        { key: 'clients', label: t('reports.columns.clients') },
        { key: 'products', label: t('reports.columns.products') },
        { key: 'total_invoices', label: t('reports.columns.total_invoices') },
        { key: 'total_returns', label: t('reports.columns.total_returns') },
        { key: 'total_sales_discounts', label: t('reports.columns.total_sales_discounts') },
        { key: 'total_paid', label: t('sales.invoices.paid_amount') },
        { key: 'total_remaining', label: t('sales.invoices.remaining_amount') },
        { key: 'net_sales_discounts', label: t('reports.columns.net_sales_discounts') },
        { key: 'net_sales', label: t('reports.columns.net_sales') },
    ];

    // Default selected columns
    const [selectedColumns, setSelectedColumns] = useState(['invoices', 'clients', 'products', 'total_invoices', 'total_returns', 'total_sales_discounts', 'total_paid', 'total_remaining', 'net_sales_discounts', 'net_sales']);
    const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

    const toggleColumn = (columnKey) => {
        setSelectedColumns(prev =>
            prev.includes(columnKey)
                ? prev.filter(key => key !== columnKey)
                : [...prev, columnKey]
        );
    };

    const tableColumns = [
        { key: 'month', label: t('reports.table.month') },
        ...availableColumns.filter(col => selectedColumns.includes(col.key)).map(col => ({ key: col.key, label: col.label }))
    ];

    const formatAmount = (n) => (n == null || Number.isNaN(Number(n))) ? '0.00' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleExportExcel = () => {
        const exportData = summaryData.map(row => {
            const r = { [t('reports.table.month')]: row.month ?? '—' };
            tableColumns.slice(1).forEach(col => {
                r[col.label] = row[col.key];
            });
            return r;
        });
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Summary Sales");
        XLSX.writeFile(workbook, `Summary_Sales_Report_${filters.fromDate}_to_${filters.toDate}.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const title = t('reports.summary_sales_report') || "Summary Sales Report";
        doc.setFontSize(18);
        doc.text(title, doc.internal.pageSize.width / 2, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`${t('reports.filters.from_date')}: ${filters.fromDate}  ${t('reports.filters.to_date')}: ${filters.toDate}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });

        const head = [tableColumns.map(col => col.label)];
        const body = summaryData.map(row => tableColumns.map(col => {
            if (col.key === 'month') return row.month ?? '—';
            if (['invoices', 'clients', 'products'].includes(col.key)) return row[col.key] ?? 0;
            return formatAmount(row[col.key]);
        }));

        doc.autoTable({
            startY: 40,
            head,
            body,
            styles: { font: 'Amiri', halign: isRTL ? 'right' : 'left' },
            headStyles: { fillColor: [79, 70, 229] }
        });
        doc.save(`Summary_Sales_Report_${filters.fromDate}_to_${filters.toDate}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="hidden print:block mb-6">
                        <PrintHeader title={t('reports.summary_sales_report')} isRTL={isRTL} />
                    </div>
                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                            <input type="text" value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="DD-MM-YYYY" />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* To Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.to_date')}</label>
                        <div className="relative">
                            <input type="text" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="DD-MM-YYYY" />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Branches */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.branches')}</label>
                        <div className="relative">
                            <select value={filters.branch} onChange={(e) => handleFilterChange('branch', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.all_branches')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Group By */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.group_by')}</label>
                        <div className="relative">
                            <select value={filters.groupBy} onChange={(e) => handleFilterChange('groupBy', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {groupByOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Invoice Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.invoice_type')}</label>
                        <div className="relative">
                            <select value={filters.invoiceType} onChange={(e) => handleFilterChange('invoiceType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">{t('sales.common.unspecified')}</option></select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Client */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.client')}</label>
                        <div className="relative">
                            <select value={filters.client} onChange={(e) => handleFilterChange('client', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">{t('sales.common.unspecified')}</option></select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Product */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.product')}</label>
                        <div className="relative">
                            <select value={filters.product} onChange={(e) => handleFilterChange('product', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">{t('sales.common.unspecified')}</option></select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Product Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.product_category')}</label>
                        <div className="relative">
                            <select value={filters.productCategory} onChange={(e) => handleFilterChange('productCategory', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">{t('sales.common.unspecified')}</option></select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Storehouse */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.storehouse')}</label>
                        <div className="relative">
                            <select value={filters.storehouse} onChange={(e) => handleFilterChange('storehouse', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">{t('sales.common.unspecified')}</option></select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Payment Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.payment_status')}</label>
                        <div className="relative">
                            <select value={filters.paymentStatus} onChange={(e) => handleFilterChange('paymentStatus', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">{t('sales.common.unspecified')}</option></select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* User */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.user')}</label>
                        <div className="relative">
                            <select value={filters.user} onChange={(e) => handleFilterChange('user', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">{t('sales.common.unspecified')}</option></select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Salesperson */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.salesperson')}</label>
                        <div className="relative">
                            <select value={filters.salesperson} onChange={(e) => handleFilterChange('salesperson', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">{t('sales.common.unspecified')}</option></select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-xs font-bold text-indigo-600 uppercase mb-1">{t('reports.columns.total_invoices')}</p>
                        <p className="text-2xl font-black text-indigo-900">{formatAmount(summaryData?.reduce((acc, r) => acc + Number(r.totalInvoices ?? 0), 0))}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-1">{t('sales.invoices.paid_amount')}</p>
                        <p className="text-2xl font-black text-emerald-900">{formatAmount(summaryData?.reduce((acc, r) => acc + Number(r.totalPaid ?? 0), 0))}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <p className="text-xs font-bold text-amber-600 uppercase mb-1">{t('sales.invoices.remaining_amount')}</p>
                        <p className="text-2xl font-black text-amber-900">{formatAmount(summaryData?.reduce((acc, r) => acc + Number(r.totalRemaining ?? 0), 0))}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-600 uppercase mb-1">{t('reports.columns.net_sales')}</p>
                        <p className="text-2xl font-black text-blue-900">{formatAmount(summaryData?.reduce((acc, r) => acc + Number(r.netSales ?? 0), 0))}</p>
                    </div>
                </div>

                {/* View Report Button */}
                <div className="mb-8">
                    <button type="button" onClick={handleViewReport} disabled={loading} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">{loading ? '...' : t('reports.view_report')}</button>
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>

                {/* Chart Section */}
                <div className="mb-8">
                    <div className="flex justify-end mb-4">
                        <div className="relative">
                            <select value={chartMetric} onChange={(e) => setChartMetric(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="net_sales">{t('reports.chart.net_sales')}</option>
                                <option value="sales_total">{t('reports.chart.sales_total')}</option>
                                <option value="credit_notes">{t('reports.chart.credit_notes')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="h-72 border border-gray-200 rounded-lg bg-gray-50 flex items-end justify-center p-4">
                        <div className="w-full flex items-end justify-around h-full">
                            <div className="flex flex-col justify-between h-full text-xs text-gray-500 pr-2"><span>1.0</span><span>0.9</span><span>0.8</span><span>0.7</span><span>0.6</span><span>0.5</span><span>0.4</span><span>0.3</span><span>0.2</span><span>0.1</span><span>0</span></div>
                            <div className="flex-1 h-full border-l border-b border-gray-300 relative">{[...Array(10)].map((_, i) => (<div key={i} className="absolute w-full border-t border-gray-200" style={{ bottom: `${(i + 1) * 10}%` }} />))}</div>
                        </div>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-3"><div className="w-4 h-3 bg-indigo-500 rounded-sm"></div><span className="text-sm text-gray-600">{t('reports.chart.net_sales')}</span></div>
                </div>

                {/* Report Info and Export Section */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700"><span className="font-bold text-indigo-700">{t('reports.summary_sales_report')}</span><div className="text-xs text-gray-500 mt-1">{t('reports.filters.from_date')} {filters.fromDate} {t('reports.filters.to_date')} {filters.toDate}</div></div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportExcel} disabled={!summaryData?.length} className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200 disabled:opacity-50"><FileSpreadsheet className="w-4 h-4" />{t('reports.export.excel')}</button>
                        <button onClick={handleExportPdf} disabled={!summaryData?.length} className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50"><FileText className="w-4 h-4" />{t('reports.export.pdf')}</button>
                        <button onClick={handlePrint} disabled={!summaryData?.length} className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50"><Printer className="w-4 h-4" />{t('reports.print')}</button>
                        <div className="relative">
                            <button onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center gap-2">{t('reports.select_columns')}<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></button>
                            {isColumnDropdownOpen && (<div className="absolute right-0 bottom-12 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">{availableColumns.map(col => { const isSelected = selectedColumns.includes(col.key); return (<button key={col.key} onClick={() => toggleColumn(col.key)} className="w-full px-4 py-2.5 text-start text-sm hover:bg-gray-50 flex items-center justify-between"><span className={isSelected ? 'font-bold text-gray-900' : 'text-gray-600'}>{col.label}</span>{isSelected && (<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>)}</button>); })}</div>)}
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden" ref={printRef}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="bg-gray-50 border-b border-gray-200">{tableColumns.map(col => (<th key={col.key} className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-gray-700`}>{col.label}</th>))}</tr></thead>
                            <tbody>{summaryData != null && summaryData.length > 0 ? (summaryData.map((row, idx) => (<tr key={row.month ?? idx} className="border-b border-gray-100">{tableColumns.map((col) => { let val = '—'; if (col.key === 'month') val = row.month ?? '—'; else if (col.key === 'invoices') val = row.invoices ?? 0; else if (col.key === 'clients') val = row.clients ?? 0; else if (col.key === 'products') val = row.products ?? 0; else if (col.key === 'total_invoices') val = formatAmount(row.totalInvoices); else if (col.key === 'total_returns') val = formatAmount(row.totalReturns); else if (col.key === 'total_sales_discounts') val = formatAmount(row.totalSalesDiscounts); else if (col.key === 'total_paid') val = formatAmount(row.totalPaid); else if (col.key === 'total_remaining') val = formatAmount(row.totalRemaining); else if (col.key === 'net_sales_discounts') val = formatAmount(row.netSalesDiscounts); else if (col.key === 'net_sales') val = formatAmount(row.netSales); return <td key={col.key} className="px-4 py-3 text-sm font-medium">{val}</td>; })}</tr>))) : (<tr><td colSpan={tableColumns.length} className="px-4 py-8 text-center text-gray-500">{error || t('reports.no_data')}</td></tr>)}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummarySalesReport;
