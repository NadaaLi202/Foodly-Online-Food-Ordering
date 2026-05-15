import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer, ShieldCheck } from 'lucide-react';
import { exportTaxReportToExcel, buildAccountingReportPdf } from '../../../utils/accountingReportsExport';
import api from '../../../services/api';
import PrintHeader from '../../../components/common/PrintHeader';
import { useAuth } from '../../../context/AuthContext';

const getMonthRange = (date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const toISO = (d) => d.toISOString().slice(0, 10);
    return { startDate: toISO(start), endDate: toISO(end) };
};

const TaxReturnReport = () => {
    const { t } = useTranslation();
    const { companySettings } = useAuth();
    const currencySymbol = companySettings?.currency || 'ر.س';
    const { startDate: defaultFrom, endDate: defaultTo } = getMonthRange();

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: defaultFrom,
        toDate: defaultTo,
        branch: 'all',
    });

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState({
        totalSalesTax: 0,
        totalPurchaseTax: 0,
        totalSalesAmount: 0,
        totalPurchaseAmount: 0,
        netTaxPayable: 0,
        breakdown: {
            salesInvoices: { taxableAmount: 0, taxAmount: 0 },
            salesReturns: { taxableAmount: 0, taxAmount: 0 },
            purchaseInvoices: { taxableAmount: 0, taxAmount: 0 },
            purchaseReturns: { taxableAmount: 0, taxAmount: 0 },
            journalEntries: { taxableAmount: 0, taxAmount: 0 },
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
        if (value === 'current_month') return getMonthRange(now);
        if (value === 'last_month') return getMonthRange(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        if (value === 'current_quarter') {
            const qm = Math.floor(now.getMonth() / 3) * 3;
            return { startDate: new Date(now.getFullYear(), qm, 1).toISOString().slice(0, 10), endDate: new Date(now.getFullYear(), qm + 3, 0).toISOString().slice(0, 10) };
        }
        if (value === 'current_year') return { startDate: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10), endDate: new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10) };
        return { startDate: filters.fromDate, endDate: filters.toDate };
    };

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/accounting/tax-summary', {
                params: {
                    startDate: filters.fromDate,
                    endDate: filters.toDate,
                    branch: filters.branch !== 'all' ? filters.branch : undefined,
                }
            });
            setReportData(response.data?.data || reportData);
        } catch (error) {
            console.error('Error fetching tax return:', error);
        } finally {
            setLoading(false);
        }
    }, [filters.fromDate, filters.toDate, filters.branch]);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchReport();
    }, []);

    const fmtNum = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleExportExcel = () => exportTaxReportToExcel(reportData, t, false);
    const handlePrint = () => window.print();

    const TaxRow = ({ label, taxable, tax, isTotal }) => (
        <tr className={`border-b border-gray-200 ${isTotal ? 'bg-gray-50 font-bold' : 'hover:bg-gray-50'}`}>
            <td className="px-6 py-4 text-sm text-gray-900">{label}</td>
            <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono" dir="ltr">{fmtNum(taxable)}</td>
            <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono" dir="ltr">{fmtNum(tax)}</td>
        </tr>
    );

    return (
        <div className="p-6">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: A4 portrait; margin: 1cm; }
                    nav, aside, header, .sidebar, .topbar, [role="navigation"], [role="complementary"],
                    .print\\:hidden { display: none !important; }
                    body { margin: 0 !important; padding: 0 !important; }
                    .report-card { border: none !important; shadow: none !important; }
                }
            `}} />
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 report-card">
                <div className="hidden print:block mb-10">
                    <PrintHeader title={t('reports.accounting.tax.return_report_title') || 'VAT Return Report'} isRTL={true} showLogo={false} />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:hidden">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.period')}</label>
                        <div className="relative">
                            <select value={filters.period} onChange={(e) => {
                                const value = e.target.value;
                                const range = applyPeriod(value);
                                setFilters(prev => ({ ...prev, period: value, fromDate: range.startDate, toDate: range.endDate }));
                            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-indigo-500">
                                {periodOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.from_date')}</label>
                        <div className="relative">
                            <input type="date" value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.to_date')}</label>
                        <div className="relative">
                            <input type="date" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button onClick={fetchReport} className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                            {loading ? t('reports.loading') : t('reports.view_report')}
                        </button>
                    </div>
                </div>

                {/* Header & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{t('reports.accounting.tax.return_report_title') || 'VAT Return Report'}</h2>
                            <p className="text-sm text-gray-500">{filters.fromDate} - {filters.toDate}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportExcel} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors border border-green-200">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Excel
                        </button>
                        <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                            <Printer className="w-3.5 h-3.5" />
                            {t('reports.print')}
                        </button>
                    </div>
                </div>

                {/* VAT Return Content */}
                <div className="space-y-12">
                    {/* 1. VAT on Sales */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
                            <h3 className="text-base font-bold text-white tracking-wide">
                                1. {t('reports.accounting.tax.vat_on_sales') || 'VAT on Sales (Output Tax)'}
                            </h3>
                            <div className="px-2 py-0.5 bg-gray-700 text-gray-300 text-[10px] font-bold rounded uppercase">
                                {t('reports.summary') || 'Summary'}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-start text-xs font-bold text-gray-600 uppercase tracking-wider">{t('reports.accounting.tax.item')}</th>
                                        <th className="px-6 py-4 text-end text-xs font-bold text-gray-600 uppercase tracking-wider w-48">{t('reports.accounting.tax.taxable_amount')}</th>
                                        <th className="px-6 py-4 text-end text-xs font-bold text-gray-600 uppercase tracking-wider w-48">{t('reports.accounting.tax.tax_amount')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    <TaxRow 
                                        label={t('reports.accounting.tax.standard_rated_sales') || 'Standard Rated Sales'} 
                                        taxable={reportData.breakdown.salesInvoices.taxableAmount} 
                                        tax={reportData.breakdown.salesInvoices.taxAmount} 
                                    />
                                    <TaxRow 
                                        label={t('reports.accounting.tax.sales_returns_adjustments') || 'Sales Returns & Adjustments'} 
                                        taxable={reportData.breakdown.salesReturns.taxableAmount} 
                                        tax={reportData.breakdown.salesReturns.taxAmount} 
                                    />
                                    <TaxRow 
                                        label={t('reports.accounting.tax.journal_adjustments') || 'Journal Adjustments'} 
                                        taxable={reportData.breakdown.journalEntries.taxableAmount} 
                                        tax={reportData.breakdown.journalEntries.taxAmount} 
                                    />
                                    <tr className="bg-gray-50/80 font-bold border-t-2 border-gray-200">
                                        <td className="px-6 py-5 text-sm text-gray-900">{t('reports.accounting.tax.total_sales_output_tax') || 'Total Sales & Output Tax'}</td>
                                        <td className="px-6 py-5 text-sm text-gray-900 text-end font-mono" dir="ltr">{fmtNum(reportData.totalSalesAmount)}</td>
                                        <td className="px-6 py-5 text-sm text-indigo-700 text-end font-mono" dir="ltr">{fmtNum(reportData.totalSalesTax)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 2. VAT on Purchases */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
                            <h3 className="text-base font-bold text-white tracking-wide">
                                2. {t('reports.accounting.tax.vat_on_purchases') || 'VAT on Purchases (Input Tax)'}
                            </h3>
                            <div className="px-2 py-0.5 bg-gray-700 text-gray-300 text-[10px] font-bold rounded uppercase">
                                {t('reports.summary') || 'Summary'}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-start text-xs font-bold text-gray-600 uppercase tracking-wider">{t('reports.accounting.tax.item')}</th>
                                        <th className="px-6 py-4 text-end text-xs font-bold text-gray-600 uppercase tracking-wider w-48">{t('reports.accounting.tax.taxable_amount')}</th>
                                        <th className="px-6 py-4 text-end text-xs font-bold text-gray-600 uppercase tracking-wider w-48">{t('reports.accounting.tax.tax_amount')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    <TaxRow 
                                        label={t('reports.accounting.tax.standard_rated_purchases') || 'Standard Rated Purchases'} 
                                        taxable={reportData.breakdown.purchaseInvoices.taxableAmount} 
                                        tax={reportData.breakdown.purchaseInvoices.taxAmount} 
                                    />
                                    <TaxRow 
                                        label={t('reports.accounting.tax.purchase_returns_adjustments') || 'Purchase Returns & Adjustments'} 
                                        taxable={reportData.breakdown.purchaseReturns.taxableAmount} 
                                        tax={reportData.breakdown.purchaseReturns.taxAmount} 
                                    />
                                    <tr className="bg-gray-50/80 font-bold border-t-2 border-gray-200">
                                        <td className="px-6 py-5 text-sm text-gray-900">{t('reports.accounting.tax.total_purchases_input_tax') || 'Total Purchases & Input Tax'}</td>
                                        <td className="px-6 py-5 text-sm text-gray-900 text-end font-mono" dir="ltr">{fmtNum(reportData.totalPurchaseAmount)}</td>
                                        <td className="px-6 py-5 text-sm text-indigo-700 text-end font-mono" dir="ltr">{fmtNum(reportData.totalPurchaseTax)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Net VAT */}
                    <div className="pt-4">
                        <div className="bg-gray-900 rounded-2xl p-8 shadow-xl relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            
                            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                                        <FileText className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">
                                            {t('reports.accounting.tax.net_tax_payable') || 'Net VAT Payable / (Refundable)'}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            <p className="text-gray-400 text-sm font-medium">
                                                {t('reports.accounting.tax.calculated_for_period') || 'Calculated for the specified period'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-3 bg-white/5 px-8 py-4 rounded-2xl border border-white/10">
                                    <span className="text-4xl font-black text-white font-mono tracking-tighter" dir="ltr">
                                        {fmtNum(reportData.netTaxPayable)}
                                    </span>
                                    <span className="text-indigo-400 font-bold text-lg">
                                        {currencySymbol}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center text-xs text-gray-400 print:mt-20">
                    <p>{t('reports.accounting.tax.official_return_disclaimer') || 'This is an internal calculation report for tax return preparation. Please verify against official records.'}</p>
                    <p className="mt-1 font-mono">{new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

export default TaxReturnReport;
