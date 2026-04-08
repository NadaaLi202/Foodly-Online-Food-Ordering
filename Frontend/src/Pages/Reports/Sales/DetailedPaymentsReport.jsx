import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import reportsService from '../../../services/reportsService';
import { downloadTablePdf } from '../../../utils/reportPdfBuilder';
import * as XLSX from 'xlsx';
import PrintHeader from '../../../components/common/PrintHeader';

const DetailedPaymentsReport = () => {
    const { t, i18n } = useTranslation();
    const printRef = useRef(null);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [filters, setFilters] = useState({
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
        period: 'current_month'
    });

    const isRTL = i18n.language === 'ar';

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await reportsService.getPaymentsDetailed(filters.startDate, filters.endDate);
            const list = res?.data ?? res;
            setReportData(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('reports.error_load'));
            setReportData([]);
        } finally {
            setLoading(false);
        }
    }, [filters, t]);

    useEffect(() => {
        fetchReport();
        const onRefresh = () => fetchReport();
        window.addEventListener("payment-created", onRefresh);
        return () => window.removeEventListener("payment-created", onRefresh);
    }, [fetchReport]);

    const handlePeriodChange = (period) => {
        let from = new Date();
        let to = new Date();

        if (period === 'current_month') {
            from = new Date(now.getFullYear(), now.getMonth(), 1);
            to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (period === 'last_month') {
            from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            to = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (period === 'current_year') {
            from = new Date(now.getFullYear(), 0, 1);
            to = new Date(now.getFullYear(), 11, 31);
        }

        setFilters(prev => ({
            ...prev,
            period,
            startDate: from.toISOString().split('T')[0],
            endDate: to.toISOString().split('T')[0]
        }));
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData.map(row => ({
            [t('reports.detailed_columns.code')]: row.invoiceNumber ?? '—',
            [t('reports.payments.client_supplier') || t('reports.detailed_columns.client')]: row.client ?? '—',
            [t('reports.payments.type')]: row.type === 'receive' ? t('reports.payments.receive') : t('reports.payments.spend'),
            [t('reports.payments.payment_method')]: row.paymentMethod ?? '—',
            [t('reports.payments.amount')]: row.amount ?? 0,
            [t('reports.detailed_columns.issue_date')]: row.date ? new Date(row.date).toLocaleDateString() : '—'
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Detailed Payments");
        XLSX.writeFile(workbook, `Detailed_Payments_Report_${filters.startDate}_to_${filters.endDate}.xlsx`);
    };

    const handleExportPdf = async () => {
        await downloadTablePdf({
            title: t('reports.payments.detailed_title') || 'Detailed Payments Report',
            subtitle: `${t('reports.filters.from_date')}: ${filters.startDate}  ${t('reports.filters.to_date')}: ${filters.endDate}`,
            headers: [
                t('reports.detailed_columns.code'),
                t('reports.payments.client_supplier') || t('reports.detailed_columns.client'),
                t('reports.payments.type'),
                t('reports.payments.payment_method'),
                t('reports.payments.amount'),
                t('reports.detailed_columns.issue_date'),
            ],
            rows: reportData.map((row) => ([
                row.invoiceNumber ?? '—',
                row.client ?? '—',
                row.type === 'receive' ? t('reports.payments.receive') : t('reports.payments.spend'),
                row.paymentMethod ?? '—',
                Number(row.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                row.date ? new Date(row.date).toLocaleDateString() : '—',
            ])),
            filename: `Detailed_Payments_Report_${filters.startDate}_to_${filters.endDate}.pdf`,
            landscape: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
            style: 'currency',
            currency: 'EGP'
        }).format(val ?? 0);
    };

    return (
        <div className={`p-8 bg-gray-50/50 min-h-screen ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                            {t('reports.payments.detailed_title')}
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">
                            {t('reports.payments.detailed_desc')}
                        </p>
                    </div>
                    <div className="hidden print:block mb-6">
                        <PrintHeader title={''} isRTL={isRTL} />
                    </div>


                    <div className="flex items-center gap-2">
                        <button onClick={handleExportExcel} className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-100 rounded-2xl text-gray-600 font-bold text-sm hover:border-indigo-100 hover:text-indigo-600 transition-all shadow-sm">
                            <FileSpreadsheet size={18} />
                            Excel
                        </button>
                        <button onClick={handleExportPdf} className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-100 rounded-2xl text-gray-600 font-bold text-sm hover:border-indigo-100 hover:text-indigo-600 transition-all shadow-sm">
                            <FileText size={18} />
                            PDF
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-100 rounded-2xl text-gray-600 font-bold text-sm hover:border-indigo-100 hover:text-indigo-600 transition-all shadow-sm">
                            <Printer size={18} />
                            {t('reports.print')}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} className="text-indigo-500" />
                                {t('reports.filters.period')}
                            </label>
                            <div className="relative">
                                <select
                                    value={filters.period}
                                    onChange={(e) => handlePeriodChange(e.target.value)}
                                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold text-gray-700 appearance-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                                >
                                    <option value="current_month">{t('reports.filters.current_month')}</option>
                                    <option value="last_month">{t('reports.filters.last_month')}</option>
                                    <option value="current_year">{t('reports.filters.current_year')}</option>
                                    <option value="custom">{t('reports.filters.custom_period')}</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                {t('reports.filters.from_date')}
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value, period: 'custom' }))}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold text-gray-700 focus:bg-white focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                {t('reports.filters.to_date')}
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value, period: 'custom' }))}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold text-gray-700 focus:bg-white focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => fetchReport()}
                                disabled={loading}
                                className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {t('reports.view_report')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Report Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden" ref={printRef}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className={`px-6 py-6 text-${isRTL ? 'right' : 'left'} text-xs font-black text-gray-400 uppercase tracking-widest`}>
                                        {t('reports.detailed_columns.code')}
                                    </th>
                                    <th className={`px-6 py-6 text-${isRTL ? 'right' : 'left'} text-xs font-black text-gray-400 uppercase tracking-widest`}>
                                        {t('reports.payments.client_supplier') || t('reports.detailed_columns.client')}
                                    </th>
                                    <th className={`px-6 py-6 text-${isRTL ? 'right' : 'left'} text-xs font-black text-gray-400 uppercase tracking-widest`}>
                                        {t('reports.payments.type')}
                                    </th>
                                    <th className={`px-6 py-6 text-${isRTL ? 'right' : 'left'} text-xs font-black text-gray-400 uppercase tracking-widest`}>
                                        {t('reports.payments.payment_method')}
                                    </th>
                                    <th className={`px-6 py-6 text-${isRTL ? 'right' : 'left'} text-xs font-black text-gray-400 uppercase tracking-widest`}>
                                        {t('reports.payments.amount')}
                                    </th>
                                    <th className={`px-6 py-6 text-${isRTL ? 'right' : 'left'} text-xs font-black text-gray-400 uppercase tracking-widest`}>
                                        {t('reports.detailed_columns.issue_date')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                                <p className="text-sm font-bold text-gray-400">{t('reports.loading')}...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <p className="text-xl font-black text-gray-300">{t('reports.no_data')}</p>
                                                <p className="text-sm font-bold text-gray-400">{t('reports.try_adjust_filters')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {reportData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-6">
                                                    <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl">
                                                        {row.invoiceNumber ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-bold text-gray-700">{row.client ?? '—'}</td>
                                                <td className="px-6 py-6 font-bold">
                                                    <span className={`px-3 py-1.5 rounded-xl text-xs ${row.type === 'receive'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                        }`}>
                                                        {row.type === 'receive' ? t('reports.payments.receive') : t('reports.payments.spend')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-bold text-gray-500">{row.paymentMethod ?? '—'}</td>
                                                <td className="px-6 py-6">
                                                    <span className={`text-sm font-black px-3 py-1.5 rounded-xl ${row.type === 'receive'
                                                        ? 'text-emerald-700 bg-emerald-50'
                                                        : 'text-amber-700 bg-amber-50'
                                                        }`}>
                                                        {formatCurrency(row.amount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-bold text-gray-400">
                                                    {row.date ? new Date(row.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailedPaymentsReport;
