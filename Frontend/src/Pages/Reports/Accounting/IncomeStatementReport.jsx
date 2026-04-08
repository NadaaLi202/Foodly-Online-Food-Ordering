import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, FileSpreadsheet, FileText, Printer, Filter, Calendar } from 'lucide-react';
import { exportIncomeStatementToExcel, buildAccountingReportPdf } from '../../../utils/accountingReportsExport';
import api from '../../../services/api';
import PrintHeader from '../../../components/common/PrintHeader';

const getMonthRange = (date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const toISO = (d) => d.toISOString().slice(0, 10);
    return { startDate: toISO(start), endDate: toISO(end) };
};

const IncomeStatementReport = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const { startDate: defaultFrom, endDate: defaultTo } = getMonthRange();

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: defaultFrom,
        toDate: defaultTo,
        branch: 'all',
        displayedAccounts: 'all',
    });

    const [branches, setBranches] = useState([]);
    const [expanded, setExpanded] = useState({
        'revenue': true,
        'revenue-sales': true,
        'revenue-other': true,
        'expenses': true,
        'expenses-purchases': true,
        'expenses-cogs': true,
        'expenses-admin': true,
        'expenses-other': true,
    });

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState({
        revenue: [],
        expenses: [],
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
    });
    const hasFetched = useRef(false);

    const fetchBranches = useCallback(async () => {
        try {
            const response = await api.get('/branches');
            setBranches(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching branches:', error);
            setBranches([]);
        }
    }, []);

    const handlePeriodChange = (period) => {
        setFilters(prev => ({
            ...prev,
            period,
            ...applyPeriod(period)
        }));
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
            const response = await api.get('/reports/accounting/income-statement', {
                params: {
                    startDate: filters.fromDate,
                    endDate: filters.toDate,
                    branch: filters.branch !== 'all' ? filters.branch : undefined,
                }
            });
            setReportData({
                revenue: response.data?.revenue || [],
                expenses: response.data?.expenses || [],
                totalRevenue: response.data?.totalRevenue || 0,
                totalExpenses: response.data?.totalExpenses || 0,
                netIncome: response.data?.netIncome || 0,
            });
        } catch (error) {
            setReportData({
                revenue: [],
                expenses: [],
                totalRevenue: 0,
                totalExpenses: 0,
                netIncome: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [filters.branch, filters.fromDate, filters.toDate]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchReport();
    }, []);

    const grouped = useMemo(() => {
        const revenue = reportData.revenue || [];
        const expenses = reportData.expenses || [];
        const groupByPrefix = (items, prefix) => items.filter((item) => String(item.code || '').startsWith(prefix));
        const revenueSales = groupByPrefix(revenue, '41');
        const revenueOther = groupByPrefix(revenue, '42');
        const expensePurchases = groupByPrefix(expenses, '51');
        const expenseCogs = groupByPrefix(expenses, '52');
        const expenseAdmin = groupByPrefix(expenses, '53');
        const expenseOther = groupByPrefix(expenses, '54');
        return {
            revenue: {
                total: reportData.totalRevenue || 0,
                sales: { title: t('reports.accounting.sales_revenue') || 'Sales Revenue #41', items: revenueSales },
                other: { title: t('reports.accounting.other_revenue') || 'Other Revenue #42', items: revenueOther },
            },
            expenses: {
                total: reportData.totalExpenses || 0,
                purchases: { title: t('reports.accounting.purchase_expenses') || 'Purchase Expenses #51', items: expensePurchases },
                cogs: { title: t('reports.accounting.cogs_expenses') || 'Cost of Goods Sold #52', items: expenseCogs },
                admin: { title: t('reports.accounting.admin_expenses') || 'Administrative Expenses #53', items: expenseAdmin },
                other: { title: t('reports.accounting.other_expenses') || 'Other Expenses #54', items: expenseOther },
            },
            netIncome: reportData.netIncome || 0,
        };
    }, [reportData, t]);

    const sumItems = (items) => (items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const toggleSection = (section) => {
        setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleExportExcel = () => {
        exportIncomeStatementToExcel(reportData, t);
    };

    const handleExportPdf = async () => {
        const contentRows = [];
        contentRows.push([t('reports.accounting.income_statement') || 'Income Statement']);
        contentRows.push([t('reports.filters.from_date') || 'From Date', filters.fromDate]);
        contentRows.push([t('reports.filters.to_date') || 'To Date', filters.toDate]);
        contentRows.push([]);
        contentRows.push([t('reports.accounting.revenue') || 'Revenue', fmtNum(grouped.revenue.total)]);
        grouped.revenue.sales.items.forEach(item => contentRows.push(['', `${item.name || ''} #${item.code || ''}`, fmtNum(item.amount || 0)]));
        grouped.revenue.other.items.forEach(item => contentRows.push(['', `${item.name || ''} #${item.code || ''}`, fmtNum(item.amount || 0)]));
        contentRows.push([]);
        contentRows.push([t('reports.accounting.expenses') || 'Expenses', fmtNum(grouped.expenses.total)]);
        grouped.expenses.purchases.items.forEach(item => contentRows.push(['', `${item.name || ''} #${item.code || ''}`, fmtNum(item.amount || 0)]));
        grouped.expenses.cogs.items.forEach(item => contentRows.push(['', `${item.name || ''} #${item.code || ''}`, fmtNum(item.amount || 0)]));
        grouped.expenses.admin.items.forEach(item => contentRows.push(['', `${item.name || ''} #${item.code || ''}`, fmtNum(item.amount || 0)]));
        grouped.expenses.other.items.forEach(item => contentRows.push(['', `${item.name || ''} #${item.code || ''}`, fmtNum(item.amount || 0)]));
        contentRows.push([]);
        contentRows.push([t('reports.accounting.net_income') || 'Net Income', fmtNum(grouped.netIncome)]);
        const blob = await buildAccountingReportPdf(t('reports.accounting.income_statement') || 'Income Statement', contentRows, t, { locale: i18n.language });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Income_Statement_${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    const fmtNum = (n) => (n == null || n === '' || n === undefined) ? '' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const renderRow = (label, amount, isHeader = false, isSubHeader = false, indent = 0, onClick = null, isOpen = false) => (
        <div
            className={`flex items-center justify-between py-2 px-4 border-b border-gray-100 ${isHeader ? 'bg-gray-100 font-bold text-gray-900' : ''} ${isSubHeader ? 'bg-gray-50 font-semibold text-gray-800' : 'text-gray-700'} hover:bg-gray-50 cursor-pointer`}
            onClick={onClick}
            style={{ paddingLeft: `${indent * 1.5 + 1}rem` }}
        >
            <div className="flex items-center gap-2">
                {onClick && (
                    isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                {!onClick && (isHeader || isSubHeader) && <span className="w-4"></span>}

                {/* Icon placeholder for leaf nodes */}
                {!isHeader && !isSubHeader && <div className="w-2 h-2 rounded-full bg-teal-600 mr-2"></div>}

                <span>{label}</span>
            </div>
            <span className={isHeader ? 'font-bold' : ''}>{fmtNum(amount)}</span>
        </div>
    );

    return (
        <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="hidden print:block mb-6">
                <PrintHeader title={t('reports.accounting.income_statement_title') || 'Income Statement'} isRTL={isRTL} showLogo={false} />
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{t('reports.accounting.income_statement_title') || 'Income Statement'}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Period */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.period')}</label>
                        <div className="relative">
                            <select 
                                value={filters.period} 
                                onChange={(e) => handlePeriodChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {periodOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    {/* From Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.from_date')}</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={filters.fromDate} 
                                onChange={(e) => handleFilterChange('fromDate', e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                            />
                            <Calendar className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.to_date')}</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={filters.toDate} 
                                onChange={(e) => handleFilterChange('toDate', e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                            />
                            <Calendar className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    {/* Branch Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.branch')}</label>
                        <div className="relative">
                            <select 
                                value={filters.branch} 
                                onChange={(e) => handleFilterChange('branch', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">{t('reports.filters.all_branches') || 'All Branches'}</option>
                                {branches.map(branch => (
                                    <option key={branch._id} value={branch._id}>{branch.name}</option>
                                ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    {/* Displayed Accounts */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.filters.displayed_accounts')}</label>
                        <div className="relative">
                            <select 
                                value={filters.displayedAccounts} 
                                onChange={(e) => handleFilterChange('displayedAccounts', e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">{t('reports.filters.all_accounts') || 'All Accounts'}</option>
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={fetchReport}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        {t('reports.show_reports') || 'Show Reports'}
                    </button>
                    <button 
                        onClick={handleExportExcel}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        {t('reports.export.excel')}
                    </button>
                    <button 
                        onClick={handleExportPdf}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors border border-purple-200"
                    >
                        <FileText className="w-4 h-4" />
                        {t('reports.export.pdf')}
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                        <Printer className="w-4 h-4" />
                        {t('reports.export.print')}
                    </button>
                </div>
            </div>

            {/* Report Display */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Revenue */}
                    {renderRow(t('reports.accounting.revenue') || 'Revenue #4', grouped.revenue.total, true, false, 0, () => toggleSection('revenue'), expanded['revenue'])}
                    {expanded['revenue'] && (
                        <>
                            {/* Revenue Categories */}
                            {renderRow(grouped.revenue.sales.title, sumItems(grouped.revenue.sales.items), false, true, 1, () => toggleSection('revenue-sales'), expanded['revenue-sales'])}
                            {expanded['revenue-sales'] && grouped.revenue.sales.items.map(item => renderRow(`${item.name} #${item.code}`, item.amount || 0, false, false, 2))}

                            {renderRow(grouped.revenue.other.title, sumItems(grouped.revenue.other.items), false, true, 1, () => toggleSection('revenue-other'), expanded['revenue-other'])}
                            {expanded['revenue-other'] && grouped.revenue.other.items.map(item => renderRow(`${item.name} #${item.code}`, item.amount || 0, false, false, 2))}
                        </>
                    )}
                    <div className="bg-gray-200 px-4 py-2 flex justify-between font-bold text-gray-900 border-t border-gray-300">
                        <span>{t('reports.accounting.total_revenue') || 'Revenue Total'}</span>
                        <span>{fmtNum(grouped.revenue.total)}</span>
                    </div>

                    <div className="h-4 bg-gray-50 border-t border-b border-gray-200"></div>

                    {/* Expenses */}
                    {renderRow(t('reports.accounting.expenses') || 'Expenses #5', grouped.expenses.total, true, false, 0, () => toggleSection('expenses'), expanded['expenses'])}
                    {expanded['expenses'] && (
                        <>
                            {/* Expenses Categories */}
                            {renderRow(grouped.expenses.purchases.title, sumItems(grouped.expenses.purchases.items), false, true, 1, () => toggleSection('expenses-purchases'), expanded['expenses-purchases'])}
                            {expanded['expenses-purchases'] && grouped.expenses.purchases.items.map(item => renderRow(`${item.name} #${item.code}`, item.amount || 0, false, false, 2))}

                            {renderRow(grouped.expenses.cogs.title, sumItems(grouped.expenses.cogs.items), false, true, 1, () => toggleSection('expenses-cogs'), expanded['expenses-cogs'])}
                            {expanded['expenses-cogs'] && grouped.expenses.cogs.items.map(item => renderRow(`${item.name} #${item.code}`, item.amount || 0, false, false, 2))}

                            {renderRow(grouped.expenses.admin.title, sumItems(grouped.expenses.admin.items), false, true, 1, () => toggleSection('expenses-admin'), expanded['expenses-admin'])}
                            {expanded['expenses-admin'] && grouped.expenses.admin.items.map(item => renderRow(`${item.name} #${item.code}`, item.amount || 0, false, false, 2))}

                            {renderRow(grouped.expenses.other.title, sumItems(grouped.expenses.other.items), false, true, 1, () => toggleSection('expenses-other'), expanded['expenses-other'])}
                            {expanded['expenses-other'] && grouped.expenses.other.items.map(item => renderRow(`${item.name} #${item.code}`, item.amount || 0, false, false, 2))}
                        </>
                    )}
                    <div className="bg-gray-200 px-4 py-2 flex justify-between font-bold text-gray-900 border-t border-gray-300">
                        <span>{t('reports.accounting.total_expenses') || 'Expenses Total'}</span>
                        <span>{fmtNum(grouped.expenses.total)}</span>
                    </div>

                    {/* Net Income */}
                    <div className="bg-indigo-100 px-4 py-3 flex justify-between font-bold text-indigo-900 border-t border-indigo-300 text-lg">
                        <span>{t('reports.accounting.net_income') || 'Net Income'}</span>
                        <span>{fmtNum(grouped.netIncome)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomeStatementReport;


