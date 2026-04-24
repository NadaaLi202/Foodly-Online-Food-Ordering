import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import reportsService from '../../../services/reportsservice';
import { downloadTablePdf } from '../../../utils/reportpdfbuilder';
import * as XLSX from 'xlsx';
import PrintHeader from '../../../components/common/printheader';

const SummarySupplierPaymentsReport = () => {
    const { t, i18n } = useTranslation();
    const printRef = useRef(null);
    const [summaryData, setSummaryData] = useState({ totalSpent: 0, totalReceived: 0, totalDue: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isRTL = i18n.language === 'ar';

    // Get current month dates
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${y}-${m}-${d}`; // Use standardized YYYY-MM-DD
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
        supplier: '',
        treasury: '',
        user: '',
        responsibleUser: '',
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await reportsService.getPurchasesPaymentsSummary(filters.fromDate, filters.toDate);
            setSummaryData({
                totalSpent: data?.totalSpent ?? 0,
                totalReceived: data?.totalReceived ?? 0,
                totalDue: data?.totalDue ?? 0,
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('reports.error_load'));
        } finally {
            setLoading(false);
        }
    }, [filters.fromDate, filters.toDate, t]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

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
        { value: 'treasury', label: t('reports.payments.treasury') || t('reports.filters.treasury') },
    ];

    // Column selection options
    const availableColumns = [
        { key: 'suppliers', label: t('reports.payments.suppliers') },
        { key: 'invoices', label: t('reports.payments.invoices') },
        { key: 'pending_transactions', label: t('reports.payments.pending_transactions') },
        { key: 'partially_processed_transactions', label: t('reports.payments.partially_processed_transactions') },
        { key: 'processed_transactions', label: t('reports.payments.processed_transactions') },
        { key: 'pending_amount', label: t('reports.payments.pending_amount') },
        { key: 'processed_amount', label: t('reports.payments.processed_amount') },
    ];

    // Default selected columns based on Image 1 (All seem to be present in table header)
    const [selectedColumns, setSelectedColumns] = useState([
        'suppliers',
        'invoices',
        'pending_transactions',
        'partially_processed_transactions',
        'processed_transactions',
        'pending_amount',
        'processed_amount'
    ]);
    const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

    const toggleColumn = (columnKey) => {
        setSelectedColumns(prev =>
            prev.includes(columnKey)
                ? prev.filter(key => key !== columnKey)
                : [...prev, columnKey]
        );
    };

    const tableColumns = [
        { key: 'month', label: t('reports.table.month') }, // Month is always first for Group By Month
        ...availableColumns.filter(col => selectedColumns.includes(col.key))
    ];

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet([{
            'Month': filters.fromDate + ' to ' + filters.toDate,
            [t('reports.supplier_payments.total_spent')]: summaryData.totalSpent,
            [t('reports.supplier_payments.total_due')]: summaryData.totalDue
        }]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Summary Purchases");
        XLSX.writeFile(workbook, `Summary_Purchases_Report_${filters.fromDate}_to_${filters.toDate}.xlsx`);
    };

    const handleExportPdf = async () => {
        await downloadTablePdf({
            title: t('reports.supplier_payments.summary_title') || 'Summary Supplier Payments Report',
            subtitle: `${t('reports.filters.from_date')}: ${filters.fromDate}  ${t('reports.filters.to_date')}: ${filters.toDate}`,
            headers: [
                t('reports.label') || 'Label',
                t('reports.value') || 'Value',
            ],
            rows: [
                [t('reports.supplier_payments.total_spent'), Number(summaryData.totalSpent).toLocaleString(undefined, { minimumFractionDigits: 2 })],
                [t('reports.supplier_payments.total_due'), Number(summaryData.totalDue).toLocaleString(undefined, { minimumFractionDigits: 2 })],
            ],
            filename: `Summary_Purchases_Report_${filters.fromDate}_to_${filters.toDate}.pdf`,
            landscape: false,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="hidden print:block mb-6">
                        <PrintHeader title={t('reports.view_report')} isRTL={isRTL} showLogo={false} />
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
                            <input type="date" value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.to_date')}</label>
                        <div className="relative">
                            <input type="date" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
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

                    {/* Supplier */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.supplier')}</label>
                        <div className="relative">
                            <input type="text" value={filters.supplier} onChange={(e) => handleFilterChange('supplier', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder={t('reports.filters.unspecified')} />
                        </div>
                    </div>

                    {/* Treasury */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.treasury')}</label>
                        <div className="relative">
                            <select value={filters.treasury} onChange={(e) => handleFilterChange('treasury', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* User */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.user')}</label>
                        <div className="relative">
                            <select value={filters.user} onChange={(e) => handleFilterChange('user', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Responsible User */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.responsible_user')}</label>
                        <div className="relative">
                            <select value={filters.responsibleUser} onChange={(e) => handleFilterChange('responsibleUser', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* View Report Button */}
                <div className="mb-8">
                    <button onClick={fetchReport} disabled={loading} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">{t('reports.view_report')}</button>
                </div>

                {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm border-b-4 border-b-indigo-500">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('reports.purchases.total_spent')}</div>
                        <div className="text-xl font-black text-gray-900">{Number(summaryData.totalSpent).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm border-b-4 border-b-emerald-500">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('reports.payments.total_received')}</div>
                        <div className="text-xl font-black text-gray-900">{Number(summaryData.totalReceived).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm border-b-4 border-b-amber-500">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('reports.purchases.total_due')}</div>
                        <div className="text-xl font-black text-gray-900">{Number(summaryData.totalDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="mb-4 flex justify-end">
                    <div className="relative w-48">
                        <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option>{t('reports.chart.processed_amount')}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
                <div className="mb-8">
                    <div className="h-72 border border-gray-200 rounded-lg bg-gray-50 flex items-end justify-center p-4 relative">
                        {/* Simple Bar Chart Placeholder */}
                        <div className="w-full flex items-end justify-around h-full z-10">
                            <div className="flex flex-col justify-between h-full text-xs text-gray-500 pr-2">
                                {[...Array(11)].map((_, i) => (<span key={i}>{(10 - i) / 10}</span>))}
                            </div>
                            <div className="flex-1 h-full border-l border-b border-gray-300 relative">
                                {[...Array(10)].map((_, i) => (<div key={i} className="absolute w-full border-t border-gray-200" style={{ bottom: `${(i + 1) * 10}%` }} />))}
                                <div className="absolute bottom-0 w-20 bg-indigo-500" style={{ height: '40%', left: '40%' }}></div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="absolute bottom-2 flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-3 h-3 bg-indigo-500"></div>
                            <span>{t('reports.chart.processed_amount')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                        <span className="font-bold text-indigo-700">{t('reports.supplier_payments.summary_title')}</span>
                        <div className="text-xs text-gray-500 mt-1">
                            {t('reports.filters.from_date')} {filters.fromDate} {t('reports.filters.to_date')} {filters.toDate}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportExcel} className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200">
                            <FileSpreadsheet className="w-4 h-4" />
                            {t('reports.export.excel')}
                        </button>
                        <button onClick={handleExportPdf} className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200">
                            <FileText className="w-4 h-4" />
                            {t('reports.export.pdf')}
                        </button>
                        <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                            <Printer className="w-4 h-4" />
                            {t('reports.print')}
                        </button>
                        <div className="relative">
                            <button onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center gap-2">{t('reports.select_columns')}
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </button>
                            {isColumnDropdownOpen && (
                                <div className="absolute right-0 bottom-12 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                                    {availableColumns.map(col => {
                                        const isSelected = selectedColumns.includes(col.key);
                                        return (
                                            <button key={col.key} onClick={() => toggleColumn(col.key)} className="w-full px-4 py-2.5 text-start text-sm hover:bg-gray-50 flex items-center justify-between">
                                                <span className={isSelected ? 'font-bold text-gray-900' : 'text-gray-600'}>{col.label}</span>
                                                {isSelected && (
                                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden" ref={printRef}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {tableColumns.map(col => (<th key={col.key} className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-gray-700`}>{col.label}</th>))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={tableColumns.length} className="px-4 py-8 text-center text-gray-500">{t('reports.no_data')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummarySupplierPaymentsReport;


