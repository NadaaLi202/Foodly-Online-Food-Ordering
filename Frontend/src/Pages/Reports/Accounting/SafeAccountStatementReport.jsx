import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../../../services/api';
import PrintHeader from '../../../components/common/PrintHeader';

const getMonthRange = (date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const toISO = (d) => d.toISOString().slice(0, 10);
    return { startDate: toISO(start), endDate: toISO(end) };
};

const SafeAccountStatementReport = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const { startDate: defaultFrom, endDate: defaultTo } = getMonthRange();
    const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const safeId = params.get('safeId');

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: defaultFrom,
        toDate: defaultTo,
    });

    const [loading, setLoading] = useState(false);
    const [safe, setSafe] = useState(null);
    const [reportData, setReportData] = useState({
        safeId: null,
        entries: [],
        summary: {
            totalDebit: 0,
            totalCredit: 0,
            finalBalance: 0
        }
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

    const fetchSafe = useCallback(async () => {
        if (!safeId) return;
        try {
            const response = await api.get(`/safes/${safeId}`);
            setSafe(response.data.safe);
        } catch (error) {
            console.error('Error fetching safe:', error);
        }
    }, [safeId]);

    const fetchReport = useCallback(async () => {
        if (!safeId) return;

        setLoading(true);
        try {
            const response = await api.get('/reports/accounting/safe-account-statement', {
                params: {
                    startDate: filters.fromDate,
                    endDate: filters.toDate,
                    safeId: safeId,
                }
            });
            setReportData(response.data || {
                safeId: null,
                entries: [],
                summary: { totalDebit: 0, totalCredit: 0, finalBalance: 0 }
            });
        } catch (error) {
            console.error('Error fetching safe account statement:', error);
            setReportData({
                safeId: null,
                entries: [],
                summary: { totalDebit: 0, totalCredit: 0, finalBalance: 0 }
            });
        } finally {
            setLoading(false);
        }
    }, [filters.fromDate, filters.toDate, safeId]);

    useEffect(() => {
        if (!hasFetched.current) {
            fetchSafe();
            hasFetched.current = true;
        }
    }, [fetchSafe]);

    useEffect(() => {
        if (safeId) {
            fetchReport();
        }
    }, [fetchReport, safeId]);

    const handlePeriodChange = (value) => {
        handleFilterChange('period', value);
        const { startDate, endDate } = applyPeriod(value);
        handleFilterChange('fromDate', startDate);
        handleFilterChange('toDate', endDate);
    };

    const handleExportExcel = () => {
        // Implement Excel export for safe account statement
        console.log('Export to Excel not implemented yet');
    };

    const handleExportPdf = () => {
        // Implement PDF export for safe account statement
        console.log('Export to PDF not implemented yet');
    };

    const handlePrint = () => {
        window.print();
    };

    const isRtl = i18n.language === 'ar';

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
            <PrintHeader
                title={`${t('safes_page.account_statement')} - ${safe?.name || ''}`}
                subtitle={`${filters.fromDate} - ${filters.toDate}`}
            />

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-6 mb-6 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('reports.filters.period')}
                        </label>
                        <select
                            value={filters.period}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {periodOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('reports.filters.from_date')}
                        </label>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('reports.filters.to_date')}
                        </label>
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) => handleFilterChange('toDate', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={fetchReport}
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? t('common.loading') : t('reports.filters.apply_filters')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Export Actions */}
            <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="text-2xl font-bold text-gray-900">
                    {t('safes_page.account_statement')}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                    </button>
                    <button
                        onClick={handleExportPdf}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        {t('common.print')}
                    </button>
                </div>
            </div>

            {/* Report Content */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('reports.account_statement.date')}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('reports.account_statement.reference')}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('reports.account_statement.description')}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('reports.account_statement.debit')}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('reports.account_statement.credit')}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('reports.account_statement.balance')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.entries.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                            {t('reports.no_data')}
                                        </td>
                                    </tr>
                                ) : (
                                    reportData.entries.map((entry, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(entry.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {entry.reference || entry.number || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {entry.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {entry.debit ? entry.debit.toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {entry.credit ? entry.credit.toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {entry.balance?.toLocaleString() || '0'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {reportData.entries.length > 0 && (
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                            {t('reports.account_statement.total')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {reportData.summary.totalDebit.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {reportData.summary.totalCredit.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {reportData.summary.finalBalance.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SafeAccountStatementReport;