import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const DetailedTaxReport = () => {
    const { t } = useTranslation();
    const { startDate: defaultFrom, endDate: defaultTo } = getMonthRange();

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: defaultFrom,
        toDate: defaultTo,
        branch: 'all',
        groupBy: 'invoice',
        tax: 'all',
    });

    const [loading, setLoading] = useState(false);
    const [rawItems, setRawItems] = useState([]);
    const [sections, setSections] = useState({
        sales_invoice: { taxableAmount: 0, taxAmount: 0 },
        sales_return: { taxableAmount: 0, taxAmount: 0 },
        purchase_invoice: { taxableAmount: 0, taxAmount: 0 },
        purchase_return: { taxableAmount: 0, taxAmount: 0 },
        journal_entries: { taxableAmount: 0, taxAmount: 0 },
    });
    const [totals, setTotals] = useState({
        invoicesTax: 0,
        journalEntriesTax: 0,
        totalTax: 0,
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

    const groupByOptions = [
        { value: 'invoice', label: t('reports.filters.group_no') || 'Invoice' },
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
            const response = await api.get('/reports/accounting/tax-detailed', {
                params: {
                    startDate: filters.fromDate,
                    endDate: filters.toDate,
                    branch: filters.branch !== 'all' ? filters.branch : undefined,
                    taxId: filters.tax !== 'all' ? filters.tax : undefined,
                    groupBy: filters.groupBy,
                }
            });
            setRawItems(response.data?.data?.items || []);
            setSections(response.data?.data?.sections || {
                sales_invoice: { taxableAmount: 0, taxAmount: 0 },
                sales_return: { taxableAmount: 0, taxAmount: 0 },
                purchase_invoice: { taxableAmount: 0, taxAmount: 0 },
                purchase_return: { taxableAmount: 0, taxAmount: 0 },
                journal_entries: { taxableAmount: 0, taxAmount: 0 },
            });
            setTotals(response.data?.data?.totals || {
                invoicesTax: 0,
                journalEntriesTax: 0,
                totalTax: 0,
            });
        } catch (error) {
            setRawItems([]);
            setSections({
                sales_invoice: { taxableAmount: 0, taxAmount: 0 },
                sales_return: { taxableAmount: 0, taxAmount: 0 },
                purchase_invoice: { taxableAmount: 0, taxAmount: 0 },
                purchase_return: { taxableAmount: 0, taxAmount: 0 },
                journal_entries: { taxableAmount: 0, taxAmount: 0 },
            });
            setTotals({
                invoicesTax: 0,
                journalEntriesTax: 0,
                totalTax: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [filters.branch, filters.fromDate, filters.groupBy, filters.tax, filters.toDate]);

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
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '';

    const reportSections = useMemo(() => {
        const grouped = rawItems.reduce((acc, item) => {
            const key = item.type || 'sales_invoice';
            if (!acc[key]) acc[key] = [];
            acc[key].push({
                invoice: item.documentNumber || '',
                client: item.contactName || '',
                taxNumber: item.taxNumber || '',
                date: fmtDate(item.date),
                taxable: fmtNum(item.taxable || 0),
                tax: fmtNum(item.tax || 0),
            });
            return acc;
        }, {});

        return [
            {
                key: 'sales_invoice',
                title: t('reports.accounting.tax.sale_invoices') || 'Sale Invoices',
                items: grouped.sales_invoice || [],
                total: { taxable: fmtNum(sections.sales_invoice?.taxableAmount || 0), tax: fmtNum(sections.sales_invoice?.taxAmount || 0) }
            },
            {
                key: 'sales_return',
                title: t('reports.accounting.tax.sale_credit_notes') || 'Sale Credit Notes',
                items: grouped.sales_return || [],
                total: { taxable: fmtNum(sections.sales_return?.taxableAmount || 0), tax: fmtNum(sections.sales_return?.taxAmount || 0) }
            },
            {
                key: 'purchase_invoice',
                title: t('reports.accounting.tax.purchase_invoices') || 'Purchase Invoices',
                items: grouped.purchase_invoice || [],
                total: { taxable: fmtNum(sections.purchase_invoice?.taxableAmount || 0), tax: fmtNum(sections.purchase_invoice?.taxAmount || 0) }
            },
            {
                key: 'purchase_return',
                title: t('reports.accounting.tax.purchase_credit_notes') || 'Purchase Credit Notes',
                items: grouped.purchase_return || [],
                total: { taxable: fmtNum(sections.purchase_return?.taxableAmount || 0), tax: fmtNum(sections.purchase_return?.taxAmount || 0) }
            },
            {
                key: 'journal_entries',
                title: t('reports.accounting.tax.journal_entries') || 'Journal Entries',
                items: grouped.journal_entries || [],
                total: { taxable: fmtNum(sections.journal_entries?.taxableAmount || 0), tax: fmtNum(sections.journal_entries?.taxAmount || 0) }
            }
        ];
    }, [rawItems, sections, t, fmtDate, fmtNum]);

    const grandTotals = useMemo(() => ({
        invoices: { tax: fmtNum(totals.invoicesTax || 0) },
        journalEntries: { tax: fmtNum(totals.journalEntriesTax || 0) },
        total: { tax: fmtNum(totals.totalTax || 0) }
    }), [totals, fmtNum]);

    const handleExportExcel = () => {
        exportTaxReportToExcel(rawItems, t, true);
    };

    const handleExportPdf = async () => {
        const contentRows = [];
        contentRows.push(['التقرير الضريبي التفصيلي']);
        contentRows.push([t('reports.filters.from_date') || 'From Date', filters.fromDate]);
        contentRows.push([t('reports.filters.to_date') || 'To Date', filters.toDate]);
        contentRows.push([]);
        rawItems.forEach(item => {
            contentRows.push([
                fmtDate(item.date),
                item.documentNumber || '',
                item.type || '',
                item.contactName || '',
                fmtNum(item.amount || 0),
                fmtNum(item.tax || 0),
            ]);
        });
        const blob = await buildAccountingReportPdf('التقرير الضريبي التفصيلي', contentRows, t);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tax_Detailed_${new Date().toISOString().slice(0, 10)}.pdf`;
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
                        <PrintHeader title={t('reports.accounting.tax.detailed_report_title') || 'Detailed Tax Report'} isRTL={true} showLogo={false} />
                    </div>
                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

                    {/* Group By */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.accounting.tax.group_by') || 'Group By'}</label>
                        <div className="relative">
                            <select value={filters.groupBy} onChange={(e) => handleFilterChange('groupBy', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {groupByOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
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
                        {t('reports.accounting.tax.detailed_report_title') || 'Detailed Tax Report'} {t('reports.filters.from_date') || 'From Date'} {filters.fromDate} {t('reports.filters.to_date') || 'To Date'} {filters.toDate}
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
                <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.invoice') || 'Invoice'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.client_supplier') || 'Client/Supplier'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.tax_number') || 'Tax Number'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.date') || 'Date'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.taxable_amount') || 'Taxable Amount'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.tax_amount') || 'Tax Amount'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reportSections.map((section, sIndex) => (
                                <React.Fragment key={sIndex}>
                                    {/* Section Header */}
                                    <tr className="bg-gray-50">
                                        <td colSpan="6" className="px-4 py-2 text-sm font-bold text-gray-900">{section.title}</td>
                                    </tr>

                                    {/* Items */}
                                    {section.items.map((item, iIndex) => (
                                        <tr key={iIndex} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-indigo-600">{item.invoice}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{item.client}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{item.taxNumber}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{item.date}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900" dir="ltr">{item.taxable}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900" dir="ltr">{item.tax}</td>
                                        </tr>
                                    ))}

                                    {/* Section Total */}
                                    <tr className="bg-white font-bold border-t border-gray-100">
                                        <td colSpan="4" className="px-4 py-3 text-sm text-gray-900">{t('reports.accounting.tax.total') || 'Total'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900" dir="ltr">{section.total.taxable}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900" dir="ltr">{section.total.tax}</td>
                                    </tr>

                                    {/* Spacer Row */}
                                    {sIndex < reportSections.length - 1 && (
                                        <tr><td colSpan="6" className="h-4 bg-white"></td></tr>
                                    )}
                                </React.Fragment>
                            ))}

                            {/* Grand Totals */}
                            <tr className="bg-gray-50 border-t-2 border-gray-200">
                                <td colSpan="6" className="px-4 py-2"></td>
                            </tr>

                            <tr className="bg-white font-bold">
                                <td colSpan="5" className="px-4 py-3 text-sm text-gray-900">{t('reports.accounting.tax.invoices_total') || 'Invoices Total'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900" dir="ltr">{grandTotals.invoices.tax}</td>
                            </tr>
                            <tr className="bg-white font-bold">
                                <td colSpan="5" className="px-4 py-3 text-sm text-gray-900">{t('reports.accounting.tax.journal_entry_totals') || 'Journal Entry Totals'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900" dir="ltr">{grandTotals.journalEntries.tax}</td>
                            </tr>
                            <tr className="bg-gray-50 font-bold border-t border-gray-200">
                                <td colSpan="5" className="px-4 py-3 text-sm text-gray-900">{t('reports.accounting.tax.total') || 'Total'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900" dir="ltr">{grandTotals.total.tax}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DetailedTaxReport;



