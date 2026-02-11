import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, FileSpreadsheet, FileText, Printer, Filter } from 'lucide-react';

const InventoryValueReport = () => {
    const { t } = useTranslation();

    const [filters, setFilters] = useState({
        storehouse: 'all',
        method: 'average_cost',
        displayedProducts: 'products_with_quantity',
        sortBy: 'highest_value',
        product: '',
        productCategory: '',
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const storehouseOptions = [
        { value: 'all', label: t('reports.filters.all_storehouses') || 'All' },
    ];

    const methodOptions = [
        { value: 'average_cost', label: t('reports.filters.average_cost') || 'Average Cost' },
        { value: 'purchase_price', label: t('reports.filters.purchase_price') || 'Purchase Price' },
    ];

    const displayedProductsOptions = [
        { value: 'products_with_quantity', label: t('reports.filters.products_with_quantity') || 'Products with Quantity' },
        { value: 'all_products', label: t('reports.filters.all_products') || 'All Products' },
    ];

    const sortByOptions = [
        { value: 'highest_value', label: t('reports.filters.highest_value') || 'Highest Value' },
        { value: 'lowest_value', label: t('reports.filters.lowest_value') || 'Lowest Value' },
    ];

    return (
        <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

                    {/* Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.method') || 'Method'}</label>
                        <div className="relative">
                            <select value={filters.method} onChange={(e) => handleFilterChange('method', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {methodOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Displayed Products */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.displayed_products') || 'Displayed Products'}</label>
                        <div className="relative">
                            <select value={filters.displayedProducts} onChange={(e) => handleFilterChange('displayedProducts', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {displayedProductsOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Sort By */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.sort_by') || 'Sort By'}</label>
                        <div className="relative">
                            <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {sortByOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
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
                        {t('reports.inventory.inventory_value_report.report_title_dynamic', { date: '2026 February 9, Monday' }) || 'Inventory Value Report For Date: 2026 February 9, Monday'}
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
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_report.name') || 'Name'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_report.code') || 'Code'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_report.quantity') || 'Quantity'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_report.average_cost') || 'Average Cost'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_report.value') || 'Value'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_report.sale_price_without_taxes') || 'Sale Price (Without Taxes)'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_report.sale_value') || 'Sale Value'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-gray-700">{t('reports.inventory.inventory_value_report.sale_profit') || 'Sale Profit'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {/* Static Data Row from Image */}
                            <tr className="bg-white">
                                <td className="px-4 py-3 text-sm text-gray-900">1</td>
                                <td className="px-4 py-3 text-sm text-gray-500">#1-000001</td>
                                <td className="px-4 py-3 text-sm text-gray-500">1</td>
                                <td className="px-4 py-3 text-sm text-gray-500">100.00</td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">100.00</td>
                                <td className="px-4 py-3 text-sm text-gray-500">200.00</td>
                                <td className="px-4 py-3 text-sm text-gray-500">200.00</td>
                                <td className="px-4 py-3 text-sm text-gray-500">100.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryValueReport;
