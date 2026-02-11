import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown } from 'lucide-react';

const SummaryGrossProfitReport = () => {
    const { t } = useTranslation();

    // Get current month dates
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date) => {
        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: formatDate(firstDay),
        toDate: formatDate(lastDay),
        branch: '',
        groupBy: 'month',
    });

    const [chartMetric, setChartMetric] = useState('gross_profit');

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const periodOptions = [
        { value: 'current_month', label: t('reports.filters.current_month') },
        { value: 'last_month', label: t('reports.filters.last_month') },
        { value: 'current_quarter', label: t('reports.filters.current_quarter') },
        { value: 'current_year', label: t('reports.filters.current_year') },
        { value: 'custom', label: t('reports.filters.custom') },
    ];

    const groupByOptions = [
        { value: 'month', label: t('reports.filters.month') },
        { value: 'week', label: t('reports.filters.week') },
        { value: 'day', label: t('reports.filters.day') },
        { value: 'client', label: t('reports.filters.client') },
        { value: 'product', label: t('reports.filters.product') },
    ];

    // Column selection options for gross profit
    const availableColumns = [
        { key: 'invoices', label: t('reports.gross_profit_columns.invoices') },
        { key: 'partners', label: t('reports.gross_profit_columns.partners') },
        { key: 'products', label: t('reports.gross_profit_columns.products') },
        { key: 'net_sales_without_taxes', label: t('reports.gross_profit_columns.net_sales_without_taxes') },
        { key: 'net_sales_cost', label: t('reports.gross_profit_columns.net_sales_cost') },
        { key: 'gross_profit', label: t('reports.gross_profit_columns.gross_profit') },
    ];

    const [selectedColumns, setSelectedColumns] = useState(['invoices', 'partners', 'products', 'net_sales_without_taxes', 'net_sales_cost', 'gross_profit']);
    const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

    const toggleColumn = (columnKey) => {
        setSelectedColumns(prev =>
            prev.includes(columnKey)
                ? prev.filter(key => key !== columnKey)
                : [...prev, columnKey]
        );
    };

    // Build visible table columns based on selection
    const tableColumns = [
        { key: 'month', label: t('reports.table.month') },
        ...availableColumns.filter(col => selectedColumns.includes(col.key)).map(col => ({
            key: col.key,
            label: col.label
        }))
    ];

    return (
        <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Period */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('reports.filters.period')}
                        </label>
                        <div className="relative">
                            <select
                                value={filters.period}
                                onChange={(e) => handleFilterChange('period', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {periodOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* From Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('reports.filters.from_date')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={filters.fromDate}
                                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="DD-MM-YYYY"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('reports.filters.to_date')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={filters.toDate}
                                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="DD-MM-YYYY"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Branches */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('reports.filters.branches')}
                        </label>
                        <div className="relative">
                            <select
                                value={filters.branch}
                                onChange={(e) => handleFilterChange('branch', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">{t('reports.filters.all_branches')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Group By Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('reports.filters.group_by')}
                        </label>
                        <div className="relative">
                            <select
                                value={filters.groupBy}
                                onChange={(e) => handleFilterChange('groupBy', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {groupByOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* View Report Button */}
                <div className="mb-8">
                    <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                        {t('reports.view_report')}
                    </button>
                </div>

                {/* Chart Section */}
                <div className="mb-8">
                    <div className="flex justify-end mb-4">
                        <div className="relative">
                            <select
                                value={chartMetric}
                                onChange={(e) => setChartMetric(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="gross_profit">{t('reports.chart.gross_profit')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Chart Placeholder */}
                    <div className="h-72 border border-gray-200 rounded-lg bg-gray-50 flex items-end justify-center p-4">
                        <div className="w-full flex items-end justify-around h-full">
                            {/* Y-axis labels */}
                            <div className="flex flex-col justify-between h-full text-xs text-gray-500 pr-2">
                                <span>1.0</span>
                                <span>0.9</span>
                                <span>0.8</span>
                                <span>0.7</span>
                                <span>0.6</span>
                                <span>0.5</span>
                                <span>0.4</span>
                                <span>0.3</span>
                                <span>0.2</span>
                                <span>0.1</span>
                                <span>0</span>
                            </div>
                            {/* Chart grid */}
                            <div className="flex-1 h-full border-l border-b border-gray-300 relative">
                                {/* Horizontal grid lines */}
                                {[...Array(10)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-full border-t border-gray-200"
                                        style={{ bottom: `${(i + 1) * 10}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-3">
                        <div className="w-4 h-3 bg-indigo-500 rounded-sm"></div>
                        <span className="text-sm text-gray-600">{t('reports.chart.gross_profit')}</span>
                    </div>
                </div>

                {/* Table Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex justify-end p-3 border-b border-gray-200 bg-gray-50">
                        <div className="relative">
                            <button
                                onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center gap-2"
                            >
                                {t('reports.select_columns')}
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </button>
                            {isColumnDropdownOpen && (
                                <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                                    {availableColumns.map(col => {
                                        const isSelected = selectedColumns.includes(col.key);
                                        return (
                                            <button
                                                key={col.key}
                                                onClick={() => toggleColumn(col.key)}
                                                className="w-full px-4 py-2.5 text-start text-sm hover:bg-gray-50 flex items-center justify-between"
                                            >
                                                <span className={isSelected ? 'font-bold text-gray-900' : 'text-gray-600'}>
                                                    {col.label}
                                                </span>
                                                {isSelected && (
                                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {tableColumns.map(col => (
                                        <th
                                            key={col.key}
                                            className="px-4 py-3 text-start text-sm font-medium text-gray-700"
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={tableColumns.length} className="px-4 py-8 text-center text-gray-500">
                                        {t('reports.no_data')}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryGrossProfitReport;
