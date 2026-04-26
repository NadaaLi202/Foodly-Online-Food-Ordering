import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, DollarSign, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import reportsService from '../../../services/reportsService';
import { downloadTablePdf } from '../../../utils/reportPdfBuilder';
import * as XLSX from 'xlsx';
import PrintHeader, { PrintFooter } from '../../../components/common/PrintHeader';
import { exportToExcel } from '../../../utils/excelHelpers';
import { fetchCompanyProfile } from '../../../utils/generatePDF';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency as utilFormatCurrency } from '../../../utils/currencyFormatter';

const SummaryPaymentsReport = () => {
    const { t, i18n } = useTranslation();
    const { companySettings } = useAuth();
    const currency = companySettings?.currency || 'EGP';
    const printRef = useRef(null);
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [filters, setFilters] = useState({
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0]
    });

    const isRTL = i18n.language === 'ar';

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await reportsService.getPaymentsSummary(filters.startDate, filters.endDate);
            setSummaryData(res?.data ?? res);
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('reports.error_load'));
            setSummaryData(null);
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

    const formatCurrency = (val) => utilFormatCurrency(val, currency);

    const handleExportExcel = async () => {
        const company = await fetchCompanyProfile();
        const exportData = [{
            [t('reports.filters.from_date')]: filters.startDate,
            [t('reports.filters.to_date')]: filters.endDate,
            [t('reports.payments.total_received')]: summaryData?.totalReceived || 0,
            [t('reports.payments.total_spent')]: summaryData?.totalSpent || 0,
            [t('reports.payments.total_sales_due')]: summaryData?.totalSalesDue || 0,
            [t('reports.payments.total_purchases_due')]: summaryData?.totalPurchasesDue || 0
        }];
        
        exportToExcel({
            data: exportData,
            filename: `Summary_Payments_Report_${filters.startDate}_to_${filters.endDate}.xlsx`,
            title: t('reports.payments.summary_title') || 'Summary Payments Report',
            company,
            startDate: filters.startDate,
            endDate: filters.endDate,
            t
        });
    };

    const handleExportPdf = async () => {
        await downloadTablePdf({
            title: t('reports.payments.summary_title') || 'Summary Payments Report',
            headers: [
                t('reports.label') || 'Label',
                t('reports.value') || 'Value',
            ],
            rows: [
                [t('reports.payments.total_received'), formatCurrency(summaryData?.totalReceived || 0)],
                [t('reports.payments.total_spent'), formatCurrency(summaryData?.totalSpent || 0)],
                [t('reports.payments.total_sales_due'), formatCurrency(summaryData?.totalSalesDue || 0)],
                [t('reports.payments.total_purchases_due'), formatCurrency(summaryData?.totalPurchasesDue || 0)],
            ],
            filename: `Summary_Payments_Report_${filters.startDate}_to_${filters.endDate}.pdf`,
            landscape: false,
            startDate: filters.startDate,
            endDate: filters.endDate
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const cards = [
        {
            title: t('reports.payments.total_received'),
            value: summaryData?.totalReceived || 0,
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            title: t('reports.payments.total_spent'),
            value: summaryData?.totalSpent || 0,
            icon: DollarSign,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
        {
            title: t('reports.payments.total_sales_due'),
            value: summaryData?.totalSalesDue || 0,
            icon: DollarSign,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: t('reports.payments.total_purchases_due'),
            value: summaryData?.totalPurchasesDue || 0,
            icon: DollarSign,
            color: 'text-rose-600',
            bg: 'bg-rose-50'
        }
    ];

    return (
        <div className={`p-8 bg-gray-50/50 min-h-screen ${isRTL ? 'text-right' : 'text-left'}`} id="summary-payments-report-root">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <span className="w-2 h-8 bg-purple-600 rounded-full no-print"></span>
                            {t('reports.payments.summary_title')}
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">
                            {t('reports.payments.summary_desc')}
                        </p>
                    </div>
                    <div className="hidden print:block mb-6 w-full">
                        <PrintHeader title={t('reports.payments.summary_title')} isRTL={isRTL} showLogo={false} />
                    </div>


                    <div className="flex flex-wrap items-center gap-3">
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
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} className="text-indigo-500" />
                                {t('reports.filters.from_date')}
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                className="px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold text-gray-700 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} className="text-indigo-500" />
                                {t('reports.filters.to_date')}
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                                className="px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold text-gray-700 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => fetchReport()}
                                disabled={loading}
                                className="py-3.5 px-8 bg-purple-600 text-white rounded-2xl font-black text-sm hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {t('reports.view_report')}
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-50 border-2 border-rose-100 rounded-3xl p-6 text-center">
                        <p className="text-rose-600 font-bold">{error}</p>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" ref={printRef}>
                    {cards.map((card, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                            <div className="flex items-start justify-between">
                                <div className={`p-4 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                                    <card.icon size={28} />
                                </div>
                            </div>
                            <div className="mt-6">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{card.title}</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
                                    {formatCurrency(card.value)}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="hidden print:block mt-20">
                    <PrintFooter t={t} isRTL={isRTL} />
                </div>
            </div>
        </div>
    );
};

export default SummaryPaymentsReport;


