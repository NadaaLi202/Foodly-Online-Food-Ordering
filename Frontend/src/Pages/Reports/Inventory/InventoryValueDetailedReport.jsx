import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer, Filter } from 'lucide-react';

const InventoryValueDetailedReport = () => {
    const { t } = useTranslation();

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: '1-2-2026',
        toDate: '28-2-2026',
        storehouse: 'all',
        product: '',
        productCategory: '',
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

    const storehouseOptions = [
        { value: 'all', label: t('reports.filters.all_storehouses') || 'All' },
    ];

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

                    {/* Storehouse */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.storehouse') || 'Storehouse'}</label>
                        <div className="relative">
                            <select value={filters.storehouse} onChange={(e) => handleFilterChange('storehouse', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {storehouseOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.product') || 'Product'}</label>
                        <div className="relative">
                            <select value={filters.product} onChange={(e) => handleFilterChange('product', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified') || 'Unspecified'}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                </div>

                {/* View Report Button */}
                <div className="mb-6">
                    <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">{t('reports.view_report')}</button>
                </div>

                {/* Report Header & Export */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm text-gray-700 font-medium">
                        {t('reports.inventory.inventory_value_detailed_report.report_title_dynamic', { fromDate: '2026 February 1, Sunday', toDate: '2026 February 28, Saturday' }) || 'Inventory Value Report From Date 2026 February 1, Sunday To Date 2026 February 28, Saturday'}
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
                    <table className="w-full min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_detailed_report.stock_transaction') || 'Stock Transaction'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_detailed_report.source') || 'Source'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_detailed_report.date') || 'Date'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_detailed_report.quantity') || 'Quantity'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_detailed_report.quantity_after') || 'Quantity After'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_detailed_report.value') || 'Value (EGP)'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_detailed_report.value_correction') || 'Value Correction (EGP)'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {/* Static Data Row from Image */}
                            <tr className="bg-gray-50/50">
                                <td colSpan="7" className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-100">1 #1-000001</td>
                            </tr>
                            <tr className="bg-white">
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">Inventory Before</td>
                                <td className="px-4 py-3 text-sm text-gray-500"></td>
                                <td className="px-4 py-3 text-sm text-gray-500"></td>
                                <td className="px-4 py-3 text-sm text-gray-500"></td>
                                <td className="px-4 py-3 text-sm text-gray-500">0</td>
                                <td className="px-4 py-3 text-sm text-gray-500"></td>
                                <td className="px-4 py-3 text-sm text-gray-500"></td>
                            </tr>
                            <tr className="bg-white">
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">Incoming Stock Movement #1</td>
                                <td className="px-4 py-3 text-sm text-gray-500">Purchase Invoice #BILL-26-1-000001</td>
                                <td className="px-4 py-3 text-sm text-gray-500">2026 February 1, Sunday</td>
                                <td className="px-4 py-3 text-sm text-gray-500">1</td>
                                <td className="px-4 py-3 text-sm text-gray-500">1</td>
                                <td className="px-4 py-3 text-sm text-gray-500">100.00</td>
                                <td className="px-4 py-3 text-sm text-gray-500"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryValueDetailedReport;
