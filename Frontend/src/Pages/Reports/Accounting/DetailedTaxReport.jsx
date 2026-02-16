import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react';

const DetailedTaxReport = () => {
    const { t } = useTranslation();

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: '1-2-2026',
        toDate: '28-2-2026',
        branch: 'all',
        groupBy: 'invoice',
        tax: 'all',
    });

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
        { value: 'invoice', label: t('reports.filters.group_no') },
    ];

    const reportSections = [
        {
            title: t('reports.accounting.tax.sale_invoices'),
            items: [],
            total: { taxable: '0.00', tax: '0.00' }
        },
        {
            title: t('reports.accounting.tax.sale_credit_notes'),
            items: [],
            total: { taxable: '0.00', tax: '0.00' }
        },
        {
            title: t('reports.accounting.tax.purchase_invoices'),
            items: [
                {
                    invoice: 'BILL-26-1-000001',
                    client: 'Bilal',
                    taxNumber: '',
                    date: '2026 February 1, Sunday',
                    taxable: '- 100.00',
                    tax: '- 14.00'
                }
            ],
            total: { taxable: '- 100.00', tax: '- 14.00' }
        },
        {
            title: t('reports.accounting.tax.purchase_credit_notes'),
            items: [],
            total: { taxable: '0.00', tax: '0.00' }
        },
        {
            title: t('reports.accounting.tax.journal_entries'),
            items: [],
            total: { taxable: '', tax: '0.00' }
        },
    ];

    const grandTotals = {
        invoices: { tax: '- 14.00' },
        journalEntries: { tax: '0.00' },
        total: { tax: '- 14.00' }
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                                <option value="all">{t('reports.filters.all_branches')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Group By */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.accounting.tax.group_by')}</label>
                        <div className="relative">
                            <select value={filters.groupBy} onChange={(e) => handleFilterChange('groupBy', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {groupByOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Taxes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.taxes')}</label>
                        <div className="relative">
                            <select value={filters.tax} onChange={(e) => handleFilterChange('tax', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="all">{t('reports.filters.all_taxes')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* View Report Button */}
                <div className="mb-6">
                    <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">{t('reports.view_report')}</button>
                </div>

                {/* Report Header & Export */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm text-gray-700 font-medium">
                        {t('reports.accounting.tax.detailed_report_title')}
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors border border-green-200">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            {t('reports.export.excel')}
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded text-xs font-medium hover:bg-purple-100 transition-colors border border-purple-200">
                            <FileText className="w-3.5 h-3.5" />
                            {t('reports.export.pdf')}
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200">
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
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.invoice')}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.client_supplier')}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.tax_number')}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.date')}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.taxable_amount')}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.accounting.tax.tax_amount')}</th>
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
                                        <td colSpan="4" className="px-4 py-3 text-sm text-gray-900">{t('reports.accounting.tax.total')}</td>
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
                                <td colSpan="5" className="px-4 py-3 text-sm text-gray-900">{t('reports.accounting.tax.invoices_total')}</td>
                                <td className="px-4 py-3 text-sm text-gray-900" dir="ltr">{grandTotals.invoices.tax}</td>
                            </tr>
                            <tr className="bg-white font-bold">
                                <td colSpan="5" className="px-4 py-3 text-sm text-gray-900">{t('reports.accounting.tax.journal_entry_totals')}</td>
                                <td className="px-4 py-3 text-sm text-gray-900" dir="ltr">{grandTotals.journalEntries.tax}</td>
                            </tr>
                            <tr className="bg-gray-50 font-bold border-t border-gray-200">
                                <td colSpan="5" className="px-4 py-3 text-sm text-gray-900">{t('reports.accounting.tax.total')}</td>
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
