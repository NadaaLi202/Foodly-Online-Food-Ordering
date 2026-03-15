import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown } from 'lucide-react';
import reportsService from '../../../services/reportsService';
import PrintHeader from '../../../components/common/PrintHeader';

const SummaryPurchasesReport = () => {
    const { t } = useTranslation();
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    const [chartMetric, setChartMetric] = useState('net_purchases');

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleViewReport = async () => {
        setLoading(true);
        setError(null);
        setSummaryData(null);
        try {
            const res = await reportsService.getPurchasesSummary(filters.fromDate, filters.toDate);
            const data = res?.data ?? res;
            setSummaryData(Array.isArray(data) ? data : (data && typeof data === 'object' && !Array.isArray(data) ? [data] : []));
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('reports.error_load'));
            setSummaryData([]);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        reportsService.getPurchasesSummary(filters.fromDate, filters.toDate)
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
        return () => { cancelled = true; };
    }, []);

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
        { value: 'supplier', label: t('reports.filters.client') },
        { value: 'product', label: t('reports.filters.product') },
    ];

    const availableColumns = [
        { key: 'invoices', label: t('reports.columns.invoices') },
        { key: 'returns', label: t('reports.columns.returns') },
        { key: 'orders', label: t('reports.columns.orders') },
        { key: 'suppliers', label: t('reports.columns.suppliers') },
        { key: 'products', label: t('reports.columns.products') },
        { key: 'totalInvoices', label: t('reports.columns.total_invoices') },
        { key: 'totalReturns', label: t('reports.columns.total_returns') },
        { key: 'totalOrders', label: t('reports.columns.total_orders') },
        { key: 'totalPurchasesDiscounts', label: t('reports.columns.total_purchases_discounts') },
        { key: 'totalReturnsDiscounts', label: t('reports.columns.total_returns_discounts') },
        { key: 'netPurchasesDiscounts', label: t('reports.columns.net_purchases_discounts') },
        { key: 'netPurchases', label: t('reports.columns.net_purchases') },
    ];

    const [selectedColumns, setSelectedColumns] = useState(['invoices', 'returns', 'orders', 'suppliers', 'products', 'totalInvoices', 'totalReturns', 'totalOrders', 'totalPurchasesDiscounts', 'netPurchasesDiscounts', 'netPurchases']);
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

    return (
        <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="hidden print:block mb-6">
                        <PrintHeader title={''} isRTL={false} />
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
                            <select value={filters.invoiceType} onChange={(e) => handleFilterChange('invoiceType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified')}</option>
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

                    {/* Product */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.product')}</label>
                        <div className="relative">
                            <input type="text" value={filters.product} onChange={(e) => handleFilterChange('product', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder={t('reports.filters.unspecified')} />
                        </div>
                    </div>

                    {/* Product Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.product_category')}</label>
                        <div className="relative">
                            <select value={filters.productCategory} onChange={(e) => handleFilterChange('productCategory', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Storehouse */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.storehouse')}</label>
                        <div className="relative">
                            <select value={filters.storehouse} onChange={(e) => handleFilterChange('storehouse', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.payment_status')}</label>
                        <div className="relative">
                            <select value={filters.paymentStatus} onChange={(e) => handleFilterChange('paymentStatus', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
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

                    {/* Purchases Employee */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.purchases_employee')}</label>
                        <div className="relative">
                            <select value={filters.purchasesEmployee} onChange={(e) => handleFilterChange('purchasesEmployee', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* View Report Button */}
                <div className="mb-8">
                    <button type="button" onClick={handleViewReport} disabled={loading} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                        {loading ? t('reports.loading') : t('reports.view_report')}
                    </button>
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>

                {/* Chart Section (placeholder) */}
                <div className="mb-8">
                    <div className="h-72 border border-gray-200 rounded-lg bg-gray-50 flex items-end justify-center p-4">
                        <div className="w-full flex items-end justify-around h-full">
                            <div className="flex flex-col justify-between h-full text-xs text-gray-500 pr-2">
                                {[...Array(11)].map((_, i) => (<span key={i}>{(10 - i) / 10}</span>))}
                            </div>
                            <div className="flex-1 h-full border-l border-b border-gray-300 relative">
                                {[...Array(10)].map((_, i) => (<div key={i} className="absolute w-full border-t border-gray-200" style={{ bottom: `${(i + 1) * 10}%` }} />))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex justify-end p-3 border-b border-gray-200 bg-gray-50">
                        <div className="relative">
                            <button onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center gap-2">{t('reports.select_columns')}
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {tableColumns.map(col => (<th key={col.key} className="px-4 py-3 text-start text-sm font-medium text-gray-700">{col.label}</th>))}
                                </tr>
                            </thead>
                            <tbody>
                                {summaryData != null && summaryData.length > 0 ? (
                                    summaryData.map((row, idx) => (
                                        <tr key={row.month ?? idx} className="border-b border-gray-100">
                                            {tableColumns.map((col) => {
                                                let val = '—';
                                                if (col.key === 'month') val = row.month ?? '—';
                                                else if (col.key === 'invoices') val = row.invoices ?? 0;
                                                else if (col.key === 'returns') val = row.returns ?? 0;
                                                else if (col.key === 'orders') val = row.orders ?? 0;
                                                else if (col.key === 'suppliers') val = row.suppliers ?? 0;
                                                else if (col.key === 'products') val = row.products ?? 0;
                                                else if (['totalInvoices', 'totalReturns', 'totalOrders', 'totalPurchasesDiscounts', 'totalReturnsDiscounts', 'netPurchasesDiscounts', 'netPurchases'].includes(col.key)) val = formatAmount(row[col.key]);
                                                return <td key={col.key} className="px-4 py-3 text-sm font-medium">{val}</td>;
                                            })}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={tableColumns.length} className="px-4 py-8 text-center text-gray-500">{error || t('reports.no_data')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryPurchasesReport;
