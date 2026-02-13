import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import reportsService from '../../../services/reportsService';

const DetailedPurchasesReport = () => {
    const { t } = useTranslation();
    const [detailedData, setDetailedData] = useState([]);
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

    const formatDisplayDate = (date) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        return date.toLocaleDateString('en-US', options);
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

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const fetchReport = React.useCallback(async (filterOverrides) => {
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

    const handleViewReport = async () => {
        setDetailedData([]);
        await fetchReport();
    };

    const formatCellDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

    const getTypeLabel = (documentType) => {
        if (documentType === 'return') return t('reports.purchases.type_return') || 'Return';
        if (documentType === 'purchaseOrder') return t('reports.purchases.type_order') || 'Order';
        return t('reports.detailed_columns.type_invoice') || 'Invoice';
    };

    const getDocumentUrl = (id, documentType) => {
        if (!id) return null;
        if (documentType === 'return') return `/dashboard/purchases/returns?openId=${id}`;
        if (documentType === 'purchaseOrder') return `/dashboard/purchases/purchase-orders?openId=${id}`;
        return `/dashboard/purchases/invoices?openId=${id}`;
    };

    React.useEffect(() => {
        fetchReport({});
    }, []);

    React.useEffect(() => {
        const onPurchaseDocumentCreated = () => {
            reportsService.getPurchasesInvoicesDetailed({}).then((res) => {
                const list = res?.data ?? (Array.isArray(res) ? res : []);
                setDetailedData(Array.isArray(list) ? list : []);
            }).catch(() => {});
        };
        window.addEventListener('purchase-document-created', onPurchaseDocumentCreated);
        return () => window.removeEventListener('purchase-document-created', onPurchaseDocumentCreated);
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
        { key: 'code', label: t('reports.detailed_columns.code') },
        { key: 'type', label: t('reports.detailed_columns.type') },
        { key: 'issue_date', label: t('reports.detailed_columns.issue_date') },
        { key: 'supplier', label: t('reports.detailed_columns.client') || 'Supplier' },
        { key: 'discounts', label: t('reports.detailed_columns.discounts') },
        { key: 'total_without_taxes', label: t('reports.detailed_columns.total_without_taxes') },
        { key: 'total', label: t('reports.detailed_columns.total') },
    ];

    const [selectedColumns, setSelectedColumns] = useState(availableColumns.map(c => c.key));
    const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

    const toggleColumn = (columnKey) => {
        setSelectedColumns(prev => prev.includes(columnKey) ? prev.filter(k => k !== columnKey) : [...prev, columnKey]);
    };

    const tableColumns = availableColumns.filter(col => selectedColumns.includes(col.key));

    const byMonth = {};
    detailedData.forEach((row) => {
        const m = row.month ?? '—';
        if (!byMonth[m]) byMonth[m] = [];
        byMonth[m].push(row);
    });
    const months = Object.keys(byMonth).sort();
    const totalDiscounts = detailedData.reduce((acc, r) => acc + Number(r.discounts ?? 0), 0);
    const totalWithoutTax = detailedData.reduce((acc, r) => acc + Number(r.totalWithoutTax ?? 0), 0);
    const totalAmount = detailedData.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);

    return (
        <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.invoice_type') || 'Invoice Type'}</label>
                        <div className="relative">
                            <select value={filters.invoiceType} onChange={(e) => handleFilterChange('invoiceType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified') || 'Unspecified'}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Supplier */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.supplier') || 'Supplier'}</label>
                        <div className="relative">
                            <input type="text" value={filters.supplier} onChange={(e) => handleFilterChange('supplier', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder={t('reports.filters.unspecified') || 'Unspecified'} />
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.product') || 'Product'}</label>
                        <div className="relative">
                            <input type="text" value={filters.product} onChange={(e) => handleFilterChange('product', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder={t('reports.filters.unspecified') || 'Unspecified'} />
                        </div>
                    </div>

                    {/* Product Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.product_category') || 'Product Category'}</label>
                        <div className="relative">
                            <select value={filters.productCategory} onChange={(e) => handleFilterChange('productCategory', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified') || 'Unspecified'}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Storehouse */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.storehouse') || 'Storehouse'}</label>
                        <div className="relative">
                            <select value={filters.storehouse} onChange={(e) => handleFilterChange('storehouse', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified') || 'Unspecified'}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.payment_status') || 'Payment Status'}</label>
                        <div className="relative">
                            <select value={filters.paymentStatus} onChange={(e) => handleFilterChange('paymentStatus', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified') || 'Unspecified'}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* User */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.user') || 'User'}</label>
                        <div className="relative">
                            <select value={filters.user} onChange={(e) => handleFilterChange('user', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified') || 'Unspecified'}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Purchases Employee */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.purchases_employee') || 'Purchases Employee'}</label>
                        <div className="relative">
                            <select value={filters.purchasesEmployee} onChange={(e) => handleFilterChange('purchasesEmployee', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified') || 'Unspecified'}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* View Report Button */}
                <div className="mb-6">
                    <button type="button" onClick={handleViewReport} disabled={loading} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                        {loading ? '...' : t('reports.view_report')}
                    </button>
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>

                {/* Report Info and Export Section */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                        <span className="font-medium">{t('detailed_purchases_report_title') || 'Detailed Purchases Report'}</span>
                        {' '}{t('reports.filters.group_by')} {t('reports.filters.month')} {t('reports.filters.from_date')} {formatDisplayDate(firstDay)} {t('reports.filters.to_date')} {formatDisplayDate(lastDay)}
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200">
                            <FileSpreadsheet className="w-4 h-4" />
                            {t('reports.export.excel')}
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200">
                            <FileText className="w-4 h-4" />
                            {t('reports.export.pdf')}
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                            <Printer className="w-4 h-4" />
                            {t('reports.export.print')}
                        </button>
                        <div className="relative">
                            <button onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center gap-2">{t('reports.select_columns')}
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </button>
                            {isColumnDropdownOpen && (
                                <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
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
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {tableColumns.map(col => (<th key={col.key} className="px-4 py-3 text-start text-sm font-medium text-gray-700">{col.label}</th>))}
                                </tr>
                            </thead>
                            <tbody>
                                {detailedData.length > 0 ? (
                                    <>
                                        {months.map((month) => {
                                            const rows = byMonth[month];
                                            const monthDiscounts = rows.reduce((acc, r) => acc + Number(r.discounts ?? 0), 0);
                                            const monthWithoutTax = rows.reduce((acc, r) => acc + Number(r.totalWithoutTax ?? 0), 0);
                                            const monthAmount = rows.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
                                            return (
                                                <React.Fragment key={month}>
                                                    {rows.map((row, idx) => (
                                                        <tr key={`${month}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                                                            {tableColumns.map((col) => {
                                                                let val = '—';
                                                                if (col.key === 'code') val = row.invoiceNumber ?? '—';
                                                                else if (col.key === 'month') val = row.month ?? '—';
                                                                else if (col.key === 'type') val = getTypeLabel(row.documentType || row.type);
                                                                else if (col.key === 'issue_date') val = formatCellDate(row.date);
                                                                else if (col.key === 'supplier') val = row.supplier ?? row.client ?? '—';
                                                                else if (col.key === 'discounts') val = Number(row.discounts ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                                else if (col.key === 'total_without_taxes') val = Number(row.totalWithoutTax ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                                else if (col.key === 'total') val = Number(row.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                                if (col.key === 'code' && (row._id || row.id)) {
                                                                    const url = getDocumentUrl(row._id || row.id, row.documentType || row.type);
                                                                    if (url) return <td key={col.key} className="px-4 py-3 text-sm"><Link to={url} className="text-indigo-600 hover:underline">{val}</Link></td>;
                                                                }
                                                                return <td key={col.key} className="px-4 py-3 text-sm">{val}</td>;
                                                            })}
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-gray-50 border-t border-gray-200 font-semibold">
                                                        {tableColumns.map((col) => {
                                                            if (col.key === 'code') return <td key={col.key} className="px-4 py-3 text-sm">{t('reports.filters.month')}: {month}</td>;
                                                            if (col.key === 'discounts') return <td key={col.key} className="px-4 py-3 text-sm">{monthDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>;
                                                            if (col.key === 'total_without_taxes') return <td key={col.key} className="px-4 py-3 text-sm">{monthWithoutTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>;
                                                            if (col.key === 'total') return <td key={col.key} className="px-4 py-3 text-sm">{monthAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>;
                                                            return <td key={col.key} className="px-4 py-3 text-sm"> </td>;
                                                        })}
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}
                                        <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                                            {tableColumns.map((col) => {
                                                if (col.key === 'code') return <td key={col.key} className="px-4 py-3 text-sm">{t('reports.detailed_columns.total')}</td>;
                                                if (col.key === 'discounts') return <td key={col.key} className="px-4 py-3 text-sm">{totalDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>;
                                                if (col.key === 'total_without_taxes') return <td key={col.key} className="px-4 py-3 text-sm">{totalWithoutTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>;
                                                if (col.key === 'total') return <td key={col.key} className="px-4 py-3 text-sm">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>;
                                                return <td key={col.key} className="px-4 py-3 text-sm"> </td>;
                                            })}
                                        </tr>
                                    </>
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

export default DetailedPurchasesReport;
