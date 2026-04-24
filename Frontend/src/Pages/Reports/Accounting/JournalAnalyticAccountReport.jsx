import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer, Filter } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { buildAccountingReportPdf, exportGeneralLedgerToExcel } from '../../../utils/accountingreportsexport';
import api from '../../../services/api';
import { getCostCenters } from '../../../services/reportsservice';
import PrintHeader from '../../../components/common/printheader';
import toast from 'react-hot-toast';

const getMonthRange = (date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const toISO = (d) => d.toISOString().slice(0, 10);
    return { startDate: toISO(start), endDate: toISO(end) };
};

const JournalAnalyticAccountReport = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const location = useLocation();
    const { startDate: defaultFrom, endDate: defaultTo } = getMonthRange();

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: defaultFrom,
        toDate: defaultTo,
        branch: 'all',
        costCenter: 'all',
    });

    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [reportData, setReportData] = useState({
        costCenter: null,
        entries: [],
        totalEntries: 0,
        totalDebit: 0,
        totalCredit: 0,
        finalBalance: 0,
    });
    const [error, setError] = useState(null);
    const hasFetched = useRef(false);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const fetchBranches = useCallback(async () => {
        try {
            const response = await api.get('/branches');
            setBranches(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching branches:', error);
            setBranches([]);
        }
    }, []);

    const fetchCostCentersData = useCallback(async () => {
        try {
            const response = await api.get('/cost-centers');
            setCostCenters(response.data.costCenters || response.data || []);
        } catch (error) {
            console.error('Error fetching cost centers:', error);
            setCostCenters([]);
        }
    }, []);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                startDate: filters.fromDate,
                endDate: filters.toDate,
            };
            if (filters.branch !== 'all') params.branch = filters.branch;
            if (filters.costCenter !== 'all') params.costCenterId = filters.costCenter;

            const response = await api.get('/reports/accounting/journal-analytic-account', { params });
            setReportData({
                costCenter: response.data?.costCenter || null,
                entries: Array.isArray(response.data?.entries) ? response.data.entries : [],
                totalEntries: response.data?.totalEntries || 0,
                totalDebit: response.data?.totalDebit || 0,
                totalCredit: response.data?.totalCredit || 0,
                finalBalance: response.data?.finalBalance || 0,
            });
        } catch (error) {
            console.error('Error fetching report:', error);
            setError(error?.response?.data?.message || 'Failed to load report');
            toast.error(t('reports.error_load') || 'Error loading report');
            setReportData({
                costCenter: null,
                entries: [],
                totalEntries: 0,
                totalDebit: 0,
                totalCredit: 0,
                finalBalance: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [filters, t]);

    useEffect(() => {
        fetchBranches();
        fetchCostCentersData();
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchReport();
        }
    }, []);

    const handlePeriodChange = (period) => {
        const now = new Date();
        let fromDate, toDate;

        switch (period) {
            case 'current_month':
                ({ startDate: fromDate, endDate: toDate } = getMonthRange(now));
                break;
            case 'last_month':
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                ({ startDate: fromDate, endDate: toDate } = getMonthRange(lastMonth));
                break;
            case 'current_quarter':
                const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
                fromDate = quarterStart.toISOString().slice(0, 10);
                toDate = quarterEnd.toISOString().slice(0, 10);
                break;
            case 'current_year':
                fromDate = `${now.getFullYear()}-01-01`;
                toDate = `${now.getFullYear()}-12-31`;
                break;
            default:
                return;
        }

        setFilters(prev => ({
            ...prev,
            period,
            fromDate,
            toDate,
        }));
    };

    const formatNum = (n) => (n == null || n === '' || n === undefined) ? '' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    const exportToExcel = () => {
        try {
            const headers = [
                [t('reports.accounting.cost_centers') || 'Cost Centers Report'],
                [`${t('reports.filters.from_date')}: ${filters.fromDate} - ${t('reports.filters.to_date')}: ${filters.toDate}`],
                [],
                [
                    t('reports.restriction_number') || 'Restriction #',
                    t('reports.account') || 'Account',
                    t('reports.date') || 'Date',
                    t('reports.source') || 'Source',
                    t('reports.description') || 'Description',
                    t('reports.percentage') || 'Percentage',
                    t('reports.debit') || 'Debit',
                    t('reports.credit') || 'Credit',
                    t('reports.balance') || 'Balance',
                ]
            ];

            const rows = reportData.entries.map(entry => [
                entry.restrictionNumber || '',
                entry.accountCode || '',
                formatDate(entry.date),
                entry.source || '',
                entry.description || '',
                entry.percentage || 0,
                formatNum(entry.debit || 0),
                formatNum(entry.credit || 0),
                formatNum(entry.balance || 0),
            ]);

            const totals = [
                [],
                [t('reports.total') || 'Total', '', '', '', '', '', formatNum(reportData.totalDebit), formatNum(reportData.totalCredit), formatNum(reportData.finalBalance)]
            ];

            const data = [...headers, ...rows, ...totals];
            const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            // Add UTF-8 BOM to ensure Excel correctly recognizes UTF-8 encoding
            const bom = '\uFEFF';
            const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Cost_Centers_Report_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            toast.success(t('reports.export.success') || 'Exported successfully');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error(t('reports.export.error') || 'Export failed');
        }
    };

    const exportToPdf = async () => {
        try {
            const contentRows = [[t('reports.accounting.cost_centers') || 'Cost Centers Report']];
            contentRows.push([`${t('reports.filters.from_date')}: ${filters.fromDate}`]);
            contentRows.push([`${t('reports.filters.to_date')}: ${filters.toDate}`]);
            contentRows.push([]);
            contentRows.push([
                t('reports.restriction_number') || 'Restriction #',
                t('reports.account') || 'Account',
                t('reports.date') || 'Date',
                t('reports.source') || 'Source',
                t('reports.description') || 'Description',
                t('reports.percentage') || '%',
                t('reports.debit') || 'Debit',
                t('reports.credit') || 'Credit',
                t('reports.balance') || 'Balance',
            ]);

            reportData.entries.forEach(entry => {
                contentRows.push([
                    entry.restrictionNumber || '',
                    entry.accountCode || '',
                    formatDate(entry.date),
                    entry.source || '',
                    entry.description || '',
                    entry.percentage || '',
                    formatNum(entry.debit || 0),
                    formatNum(entry.credit || 0),
                    formatNum(entry.balance || 0),
                ]);
            });

            contentRows.push([]);
            contentRows.push([t('reports.total') || 'Total', '', '', '', '', '', formatNum(reportData.totalDebit), formatNum(reportData.totalCredit), formatNum(reportData.finalBalance)]);

            const blob = await buildAccountingReportPdf(t('reports.accounting.cost_centers') || 'Cost Centers Report', contentRows, t, { locale: i18n.language });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Cost_Centers_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success(t('reports.export.success') || 'Exported successfully');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            toast.error(t('reports.export.error') || 'Export failed');
        }
    };

    const printReport = () => {
        window.print();
    };

    const periodOptions = [
        { value: 'current_month', label: t('reports.filters.current_month') },
        { value: 'last_month', label: t('reports.filters.last_month') },
        { value: 'current_quarter', label: t('reports.filters.current_quarter') },
        { value: 'current_year', label: t('reports.filters.current_year') },
    ];

    return (
        <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="hidden print:block mb-6">
                <PrintHeader title={t('reports.accounting.cost_centers') || 'Cost Centers Report'} isRTL={isRTL} showLogo={false} />
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{t('reports.accounting.cost_centers') || 'Cost Centers Report'}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Period */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.period')}</label>
                        <div className="relative">
                            <select 
                                value={filters.period} 
                                onChange={(e) => handlePeriodChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {periodOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    {/* From Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.from_date')}</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={filters.fromDate} 
                                onChange={(e) => handleFilterChange('fromDate', e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                            />
                            <Calendar className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.to_date')}</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={filters.toDate} 
                                onChange={(e) => handleFilterChange('toDate', e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                            />
                            <Calendar className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    {/* Branch Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.branch')}</label>
                        <div className="relative">
                            <select 
                                value={filters.branch} 
                                onChange={(e) => handleFilterChange('branch', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">{t('reports.filters.all_branches') || 'All Branches'}</option>
                                {branches.map(branch => (
                                    <option key={branch._id} value={branch._id}>{branch.name}</option>
                                ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    {/* Cost Center Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.all_cost_centers')}</label>
                        <div className="relative">
                            <select 
                                value={filters.costCenter} 
                                onChange={(e) => handleFilterChange('costCenter', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">{t('reports.filters.all_cost_centers') || 'All Cost Centers'}</option>
                                {costCenters.map(center => (
                                    <option key={center._id} value={center._id}>{center.name}</option>
                                ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={fetchReport}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        {t('reports.filters.show_reports') || 'Show Reports'}
                    </button>
                    <button 
                        onClick={exportToExcel}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        {t('reports.export.excel')}
                    </button>
                    <button 
                        onClick={exportToPdf}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors border border-purple-200"
                    >
                        <FileText className="w-4 h-4" />
                        {t('reports.export.pdf')}
                    </button>
                    <button 
                        onClick={printReport}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                        <Printer className="w-4 h-4" />
                        {t('reports.export.print')}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Report Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
                    </div>
                ) : reportData.entries.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                        {t('reports.no_data')}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-gray-700`}>{t('reports.restriction_number') || 'Restriction #'}</th>
                                    <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-gray-700`}>{t('reports.account') || 'Account'}</th>
                                    <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-gray-700`}>{t('reports.date') || 'Date'}</th>
                                    <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-gray-700`}>{t('reports.source') || 'Source'}</th>
                                    <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-gray-700`}>{t('reports.description') || 'Description'}</th>
                                    <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-gray-700`}>{t('reports.percentage') || '%'}</th>
                                    <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-gray-700`}>{t('reports.debit') || 'Debit'}</th>
                                    <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-gray-700`}>{t('reports.credit') || 'Credit'}</th>
                                    <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-gray-700`}>{t('reports.balance') || 'Balance'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.entries.map((entry, index) => (
                                    <tr key={index} className="hover:bg-gray-50 border-b border-gray-100">
                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.restrictionNumber || ''}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.accountCode || ''}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(entry.date)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.source || ''}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.description || ''}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.percentage || 0}%</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{entry.debit > 0 ? formatNum(entry.debit) : ''}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{entry.credit > 0 ? formatNum(entry.credit) : ''}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatNum(entry.balance || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {reportData.entries.length > 0 && (
                                <tfoot>
                                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                                        <td colSpan="6" className="px-4 py-3 text-sm font-bold text-gray-900">{t('reports.total') || 'Total'}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{formatNum(reportData.totalDebit)}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{formatNum(reportData.totalCredit)}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{formatNum(reportData.finalBalance)}</td>
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

export default JournalAnalyticAccountReport;