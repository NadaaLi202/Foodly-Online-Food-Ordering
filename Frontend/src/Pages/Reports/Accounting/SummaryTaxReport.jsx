import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { exportTaxReportToExcel, buildAccountingReportPdf } from '../../../utils/accountingReportsExport';
import api from '../../../services/api';
import PrintHeader from '../../../components/common/PrintHeader';

const getMonthRange = (date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const toISO = (d) => d.toISOString().slice(0, 10);
    return { startDate: toISO(start), endDate: toISO(end) };
};

const SummaryTaxReport = () => {
    const { t } = useTranslation();
    const { startDate: defaultFrom, endDate: defaultTo } = getMonthRange();

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: defaultFrom,
        toDate: defaultTo,
        branch: 'all',
        tax: 'all',
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
    const [taxes, setTaxes] = useState([]);
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

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/accounting/tax-summary', {
                params: {
                    startDate: filters.fromDate,
                    endDate: filters.toDate,
                    branch: filters.branch !== 'all' ? filters.branch : undefined,
                    taxId: filters.tax !== 'all' ? filters.tax : undefined,
                }
            });
            const data = response.data?.data || {};
            setReportData({
                totalSalesTax: data.totalSalesTax || 0,
                totalPurchaseTax: data.totalPurchaseTax || 0,
                totalSalesAmount: data.totalSalesAmount || 0,
                totalPurchaseAmount: data.totalPurchaseAmount || 0,
                netTaxPayable: data.netTaxPayable || 0,
                breakdown: data.breakdown || {
                    salesInvoices: { taxableAmount: 0, taxAmount: 0 },
                    salesReturns: { taxableAmount: 0, taxAmount: 0 },
                    purchaseInvoices: { taxableAmount: 0, taxAmount: 0 },
                    purchaseReturns: { taxableAmount: 0, taxAmount: 0 },
                    journalEntries: { taxableAmount: 0, taxAmount: 0 },
                }
            });
        } catch (error) {
            setReportData({
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
        } finally {
            setLoading(false);
        }
    }, [filters.branch, filters.fromDate, filters.tax, filters.toDate]);

    const fetchTaxes = useCallback(async () => {
        try {
            const response = await api.get('/taxes');
            const list = response.data?.taxes || [];
            setTaxes(Array.isArray(list) ? list : []);
        } catch (error) {
            setTaxes([]);
        }
    }, []);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchReport();
        fetchTaxes();
    }, []); // Run only once on initial mount to prevent duplicate calls

    const fmtNum = (n) => (n == null || n === '' || n === undefined) ? '' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const tableRows = [
        { item: t('reports.accounting.tax.sale_invoices') || 'Sale Invoices', taxable: fmtNum(reportData.breakdown?.salesInvoices?.taxableAmount || 0), tax: fmtNum(reportData.breakdown?.salesInvoices?.taxAmount || 0) },
        { item: t('reports.accounting.tax.sale_credit_notes') || 'Sale Credit Notes', taxable: fmtNum(reportData.breakdown?.salesReturns?.taxableAmount || 0), tax: fmtNum(reportData.breakdown?.salesReturns?.taxAmount || 0) },
        { item: t('reports.accounting.tax.purchase_invoices') || 'Purchase Invoices', taxable: fmtNum(reportData.breakdown?.purchaseInvoices?.taxableAmount || 0), tax: fmtNum(reportData.breakdown?.purchaseInvoices?.taxAmount || 0) },
        { item: t('reports.accounting.tax.purchase_credit_notes') || 'Purchase Credit Notes', taxable: fmtNum(reportData.breakdown?.purchaseReturns?.taxableAmount || 0), tax: fmtNum(reportData.breakdown?.purchaseReturns?.taxAmount || 0) },
        { item: t('reports.accounting.tax.journal_entries') || 'Journal Entries', taxable: fmtNum(reportData.breakdown?.journalEntries?.taxableAmount || 0), tax: fmtNum(reportData.breakdown?.journalEntries?.taxAmount || 0) },
        { item: t('reports.accounting.tax.total') || 'Total', taxable: '', tax: fmtNum(reportData.netTaxPayable), isTotal: true },
    ];

    const handleExportExcel = () => {
        exportTaxReportToExcel(reportData, t, false);
    };

    const handleExportPdf = async () => {
        const contentRows = [];
        contentRows.push([t('reports.tax_summary') || 'Tax Summary Report']);
        contentRows.push([t('reports.filters.from_date') || 'From Date', filters.fromDate]);
        contentRows.push([t('reports.filters.to_date') || 'To Date', filters.toDate]);
        contentRows.push([]);
        tableRows.forEach(row => {
            contentRows.push([row.item, row.taxable, row.tax]);
        });
        const blob = await buildAccountingReportPdf(t('reports.tax_summary') || 'Tax Summary Report', contentRows, t);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tax_Summary_${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="hidden print:block mb-6">
                        <PrintHeader title={t('reports.accounting.tax.summary_report_title') || 'Summary Tax Report'} isRTL={true} showLogo={false} />
                    </div>
                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    {/* Period */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.period')}</label>
                        <div className="relative">
                            <select value={filters.period} onChange={(e) => {
                                const value = e.target.value;
                                const range = applyPeriod(value);
                                setFilters(prev => ({ ...prev, period: value, fromDate: range.startDate, toDate: range.endDate }));
                            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {periodOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* From Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.from_date')}</label>
                        <div className="relative">
                            <input type="text" value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.to_date')}</label>
                        <div className="relative">
                            <input type="text" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Branches */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.branches')}</label>
                        <div className="relative">
                            <select value={filters.branch} onChange={(e) => handleFilterChange('branch', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="all">{t('reports.filters.all_branches') || 'All Branches'}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Taxes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.taxes') || 'Taxes'}</label>
                        <div className="relative">
                            <select value={filters.tax} onChange={(e) => handleFilterChange('tax', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="all">{t('reports.filters.all_taxes') || 'All Taxes'}</option>
                                {taxes.map((tax) => (
                                    <option key={tax._id} value={tax._id}>{tax.name} {tax.percentage != null ? `(${tax.percentage}%)` : ''}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* View Report Button */}
                <div className="mb-6">
                    <button onClick={fetchReport} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                        {loading ? t('reports.loading') || 'Loading...' : t('reports.view_report')}
                    </button>
                </div>

                {/* Report Header & Export */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm text-gray-700 font-medium">
                        {t('reports.accounting.tax.summary_report_title') || 'Summary Tax Report'} {t('reports.filters.from_date') || 'From Date'} {filters.fromDate} {t('reports.filters.to_date') || 'To Date'} {filters.toDate}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportExcel} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors border border-green-200">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            {t('reports.export.excel')}
                        </button>
                        <button onClick={handleExportPdf} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded text-xs font-medium hover:bg-purple-100 transition-colors border border-purple-200">
                            <FileText className="w-3.5 h-3.5" />
                            {t('reports.export.pdf')}
                        </button>
                        <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                            <Printer className="w-3.5 h-3.5" />
                            {t('reports.export.print')}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.item') || 'Item'}</th>
                                <th className="px-6 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.taxable_amount') || 'Taxable Amount'}</th>
                                <th className="px-6 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.tax_amount') || 'Tax Amount'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {tableRows.map((row, index) => (
                                <tr key={index} className={row.isTotal ? 'bg-gray-50 font-bold' : 'hover:bg-gray-50'}>
                                    <td className="px-6 py-4 text-sm text-gray-900">{row.item}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{row.taxable}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{row.tax}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SummaryTaxReport;



