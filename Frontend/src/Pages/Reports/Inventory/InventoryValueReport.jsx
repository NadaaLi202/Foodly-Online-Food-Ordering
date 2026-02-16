import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, FileSpreadsheet, FileText, Printer, Filter } from 'lucide-react';
import { exportInventoryValueToExcel, buildInventoryValuePdf } from '../../../utils/customerSupplierInventoryExport';
import reportsService from '../../../services/reportsService';
import api from '../../../services/api';

const InventoryValueReport = () => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);

    const [filters, setFilters] = useState({
        storehouse: 'all',
        method: 'average_cost',
        displayedProducts: 'all_products',
        sortBy: 'highest_value',
        product: '',
        productCategory: '',
    });

    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                const [whRes, catRes, prodRes] = await Promise.all([
                    api.get('/warehouses'),
                    api.get('/category'),
                    api.get('/products')
                ]);
                setWarehouses(whRes.data.warehouses || whRes.data.data || whRes.data || []);
                setCategories(catRes.data.categories || catRes.data.data || catRes.data || []);
                setProducts(prodRes.data.products || prodRes.data.data || prodRes.data || []);
            } catch (error) {
                console.error('Error fetching filter data:', error);
            }
        };
        fetchFilterData();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportsService.getInventorySummary({
                warehouse: filters.storehouse,
                category: filters.productCategory,
                productsWithQuantityOnly: filters.displayedProducts === 'products_with_quantity',
                method: filters.method
            });

            let processedData = res.data || [];

            // Client-side filtering by product if selected
            if (filters.product) {
                processedData = processedData.filter(item => item.productId === filters.product);
            }

            // Apply client-side sorting
            if (filters.sortBy === 'highest_value') {
                processedData.sort((a, b) => (b.inventoryValue || 0) - (a.inventoryValue || 0));
            } else if (filters.sortBy === 'lowest_value') {
                processedData.sort((a, b) => (a.inventoryValue || 0) - (b.inventoryValue || 0));
            }

            setReportData(processedData);
        } catch (error) {
            console.error('Error fetching inventory report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const methodOptions = [
        { value: 'average_cost', label: t('reports.filters.average_cost') || 'Average Cost' },
        { value: 'purchase_price', label: t('reports.filters.purchase_price') || 'Purchase Price' },
    ];

    const displayedProductsOptions = [
        { value: 'all_products', label: t('reports.filters.all_products') || 'All Products' },
        { value: 'products_with_quantity', label: t('reports.filters.products_with_quantity') || 'Products with Quantity' },
    ];

    const sortByOptions = [
        { value: 'highest_value', label: t('reports.filters.highest_value') || 'Highest Value' },
        { value: 'lowest_value', label: t('reports.filters.lowest_value') || 'Lowest Value' },
    ];

    const handlePrint = () => {
        window.print();
    };

    const totalValue = reportData.reduce((sum, item) => sum + (item.inventoryValue || 0), 0);
    const totalSaleValue = reportData.reduce((sum, item) => sum + (item.potentialSalesValue || 0), 0);
    const totalProfit = reportData.reduce((sum, item) => sum + (item.potentialProfit || 0), 0);

    const isAr = i18n.language === 'ar';
    const textStart = isAr ? 'text-right' : 'text-left';

    return (
        <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 no-print">
                    <div className={textStart}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.storehouse')}</label>
                        <div className="relative">
                            <select value={filters.storehouse} onChange={(e) => handleFilterChange('storehouse', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="all">{t('reports.filters.all_warehouses')}</option>
                                {warehouses.map(wh => (
                                    <option key={wh._id} value={wh._id}>{wh.name}</option>
                                ))}
                            </select>
                            <ChevronDown className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    <div className={textStart}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.method')}</label>
                        <div className="relative">
                            <select value={filters.method} onChange={(e) => handleFilterChange('method', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {methodOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    <div className={textStart}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.displayed_products')}</label>
                        <div className="relative">
                            <select value={filters.displayedProducts} onChange={(e) => handleFilterChange('displayedProducts', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {displayedProductsOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    <div className={textStart}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.sort_by')}</label>
                        <div className="relative">
                            <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {sortByOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    <div className={textStart}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.product')}</label>
                        <div className="relative">
                            <select value={filters.product} onChange={(e) => handleFilterChange('product', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified')}</option>
                                {products.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                            <ChevronDown className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    <div className={textStart}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.product_category')}</label>
                        <div className="relative">
                            <select value={filters.productCategory} onChange={(e) => handleFilterChange('productCategory', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">{t('reports.filters.unspecified')}</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                            <ChevronDown className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>
                </div>

                <div className={`mb-6 no-print ${textStart}`}>
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? t('reports.loading') : t('reports.view_report')}
                    </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100 no-print">
                    <div className="text-sm text-gray-700 font-medium">
                        {t('reports.inventory.inventory_value_report.report_title_dynamic', { date: new Date().toLocaleDateString() })}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => {
                            if (reportData.length > 0) {
                                exportInventoryValueToExcel(reportData, filters, t);
                            }
                        }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors border border-green-200">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            {t('reports.export.excel')}
                        </button>
                        <button onClick={() => {
                            if (reportData.length > 0) {
                                const blob = buildInventoryValuePdf(reportData, filters, t);
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `Inventory_Value_${new Date().toISOString().split('T')[0]}.pdf`;
                                link.click();
                                URL.revokeObjectURL(url);
                            }
                        }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded text-xs font-medium hover:bg-purple-100 transition-colors border border-purple-200">
                            <FileText className="w-3.5 h-3.5" />
                            {t('reports.export.pdf')}
                        </button>
                        <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                            <Printer className="w-3.5 h-3.5" />
                            {t('reports.export.print')}
                        </button>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_report.name')}</th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_report.code')}</th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_report.quantity')}</th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>
                                    {filters.method === 'average_cost'
                                        ? t('reports.inventory.inventory_value_report.average_cost')
                                        : t('reports.inventory.inventory_value_report.purchase_price')}
                                </th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_report.value')}</th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_report.sale_price_without_taxes')}</th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_report.sale_value')}</th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_report.sale_profit')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-sm text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                            {t('reports.loading')}
                                        </div>
                                    </td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-sm text-gray-500">
                                        {t('reports.no_data')}
                                    </td>
                                </tr>
                            ) : (
                                reportData.map((item, idx) => (
                                    <tr key={item.productId || idx} className="bg-white hover:bg-gray-50">
                                        <td className={`px-4 py-3 text-sm text-gray-900 ${textStart}`}>{item.productName}</td>
                                        <td className={`px-4 py-3 text-sm text-gray-500 ${textStart}`}>{item.code}</td>
                                        <td className={`px-4 py-3 text-sm text-gray-900 ${textStart}`}>{item.quantity || 0}</td>
                                        <td className={`px-4 py-3 text-sm text-gray-900 ${textStart}`}>{item.unitCost?.toFixed(2) || '0.00'}</td>
                                        <td className={`px-4 py-3 text-sm text-gray-900 ${textStart} font-medium`}>{item.inventoryValue?.toFixed(2) || '0.00'}</td>
                                        <td className={`px-4 py-3 text-sm text-gray-900 ${textStart}`}>{item.sellingPrice?.toFixed(2) || '0.00'}</td>
                                        <td className={`px-4 py-3 text-sm text-gray-900 ${textStart} font-medium`}>{item.potentialSalesValue?.toFixed(2) || '0.00'}</td>
                                        <td className={`px-4 py-3 text-sm ${item.potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'} ${textStart} font-medium`}>{item.potentialProfit?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {reportData.length > 0 && (
                            <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                                <tr>
                                    <td colSpan="4" className={`px-4 py-3 text-sm text-gray-900 ${isAr ? 'text-left' : 'text-right'}`}>{t('reports.total')}</td>
                                    <td className={`px-4 py-3 text-sm text-indigo-600 ${textStart}`}>{totalValue.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm"></td>
                                    <td className={`px-4 py-3 text-sm text-indigo-600 ${textStart}`}>{totalSaleValue.toFixed(2)}</td>
                                    <td className={`px-4 py-3 text-sm ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'} ${textStart}`}>{totalProfit.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryValueReport;
