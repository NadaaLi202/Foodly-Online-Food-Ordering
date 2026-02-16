import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, FileSpreadsheet, Printer } from 'lucide-react';
import reportsService from '../../../services/reportsService';
import * as XLSX from 'xlsx';

const DetailedSuppliersReport = () => {
    const { t, i18n } = useTranslation();
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [suppliers, setSuppliers] = useState([]);

    const isRTL = i18n.language === 'ar';

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
        supplierId: 'unspecified',
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const fetchReport = useCallback(async (filterOverrides) => {
        const state = filterOverrides !== undefined ? filterOverrides : filters;
        setLoading(true);
        setError(null);
        try {
            const res = await reportsService.getSuppliersDetailed(state.fromDate, state.toDate);
            const data = res?.data ?? [];
            setReportData(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('reports.error_load'));
            setReportData([]);
        } finally {
            setLoading(false);
        }
    }, [filters, t]);

    const fetchSuppliers = useCallback(async () => {
        try {
            const list = await reportsService.getSuppliersList();
            setSuppliers(list || []);
        } catch {
            setSuppliers([]);
        }
    }, []);

    useEffect(() => {
        fetchReport({});
        fetchSuppliers();
    }, [fetchReport, fetchSuppliers]);

    useEffect(() => {
        const onSupplierCreated = () => fetchReport({});
        window.addEventListener('supplier-created', onSupplierCreated);
        window.addEventListener('purchase-document-created', onSupplierCreated);
        window.addEventListener('payment-created', onSupplierCreated);
        return () => {
            window.removeEventListener('supplier-created', onSupplierCreated);
            window.removeEventListener('purchase-document-created', onSupplierCreated);
            window.removeEventListener('payment-created', onSupplierCreated);
        };
    }, [fetchReport]);

    const handleViewReport = () => {
        fetchReport();
    };

    const handleResetFilters = () => {
        const resetFilters = {
            period: 'current_month',
            fromDate: formatDate(firstDay),
            toDate: formatDate(lastDay),
            branch: 'all',
            journalAccount: 'all',
            displayedAccounts: 'with_transactions',
            supplierId: 'unspecified',
        };
        setFilters(resetFilters);
        fetchReport(resetFilters);
    };

    const formatAmount = (n) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData.map(row => ({
            [t('reports.detailed_columns.code')]: row.code ?? '—',
            [t('reports.detailed_columns.type')]: row.type ?? '—',
            [t('reports.detailed_columns.issue_date')]: row.date ? new Date(row.date).toLocaleDateString() : '—',
            [t('reports.columns.debit')]: row.debit ?? 0,
            [t('reports.columns.credit')]: row.credit ?? 0,
            [t('reports.columns.balance')]: row.balance ?? 0,
            [t('reports.columns.description')]: row.description ?? '—'
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Supplier Account Statement");
        XLSX.writeFile(workbook, `Supplier_Statement_${filters.fromDate}_to_${filters.toDate}.xlsx`);
    };

    return (
        <>
            <div className="p-6" id="detailed-suppliers-report-root">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    {/* Filters Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 no-print">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.period')}</label>
                            <div className="relative">
                                <select
                                    value={filters.period}
                                    onChange={(e) => handleFilterChange('period', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="current_month">{t('reports.filters.current_month')}</option>
                                    <option value="last_month">{t('reports.filters.last_month')}</option>
                                    <option value="custom">{t('reports.filters.custom')}</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.from_date')}</label>
                            <input
                                type="text"
                                value={filters.fromDate}
                                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                placeholder="DD-MM-YYYY"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.to_date')}</label>
                            <input
                                type="text"
                                value={filters.toDate}
                                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                placeholder="DD-MM-YYYY"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.supplier')}</label>
                            <div className="relative">
                                <select
                                    value={filters.supplierId}
                                    onChange={(e) => handleFilterChange('supplierId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white"
                                >
                                    <option value="unspecified">{t('sales.common.unspecified')}</option>
                                    {suppliers.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 no-print">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleViewReport}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
                            >
                                {t('reports.view_report')}
                            </button>
                            <button
                                onClick={handleResetFilters}
                                className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                {t('sales.common.reset')}
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border-2 border-blue-100 rounded-xl font-bold text-sm hover:bg-blue-100 shadow-sm transition-all"
                            >
                                <Printer size={18} />
                                {t('reports.export.print')}
                            </button>
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-100 rounded-xl font-bold text-sm hover:bg-emerald-100 shadow-sm transition-all"
                            >
                                <FileSpreadsheet size={18} />
                                {t('reports.export.excel')}
                            </button>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black text-gray-900 mb-1">
                            {t('reports.suppliers.supplier_general_ledger')}
                        </h2>
                        <p className="text-gray-500 font-medium italic">
                            {t('reports.filters.from_date')}: {filters.fromDate} | {t('reports.filters.to_date')}: {filters.toDate}
                        </p>
                    </div>

                    {/* Report Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} font-semibold text-gray-700`}>{t('reports.detailed_columns.issue_date')}</th>
                                        <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} font-semibold text-gray-700`}>{t('reports.detailed_columns.type')}</th>
                                        <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} font-semibold text-gray-700`}>{t('reports.detailed_columns.code')}</th>
                                        <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} font-semibold text-gray-700`}>{t('reports.columns.description')}</th>
                                        <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} font-semibold text-gray-700`}>{t('reports.columns.debit')}</th>
                                        <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} font-semibold text-gray-700`}>{t('reports.columns.credit')}</th>
                                        <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} font-semibold text-gray-700`}>{t('reports.columns.balance')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">{t('reports.loading')}</td></tr>
                                    ) : reportData.length === 0 ? (
                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">{error || t('reports.no_data')}</td></tr>
                                    ) : (
                                        reportData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3">{row.date ? new Date(row.date).toLocaleDateString() : '—'}</td>
                                                <td className="px-4 py-3 text-gray-500">{row.type || '—'}</td>
                                                <td className="px-4 py-3 font-medium text-indigo-600">{row.code || '—'}</td>
                                                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{row.description || '—'}</td>
                                                <td className="px-4 py-3 text-rose-600 font-medium">{formatAmount(row.debit)}</td>
                                                <td className="px-4 py-3 text-emerald-600 font-medium">{formatAmount(row.credit)}</td>
                                                <td className="px-4 py-3 font-semibold text-gray-900">{formatAmount(row.balance)}</td>
                                            </tr>
                                        ))
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

export default DetailedSuppliersReport;
