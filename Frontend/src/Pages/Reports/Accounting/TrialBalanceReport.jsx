import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronLeft, FileSpreadsheet, FileText, Printer, Calendar } from 'lucide-react';
import { exportTrialBalanceToExcel, buildTrialBalancePdf } from '../../../utils/accountingreportsexport';
import api from '../../../services/api';
import PrintHeader from '../../../components/common/printheader';
import { useAuth } from '../../../context/authcontext';

const getMonthRange = (date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const toISO = (d) => d.toISOString().slice(0, 10);
    return { startDate: toISO(start), endDate: toISO(end) };
};

const fmt = (n) => {
    const v = Number(n || 0);
    if (v === 0) return '0.00';
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const collectParentIds = (nodes) => {
    const ids = {};
    const walk = (items) => {
        for (const item of items) {
            if (item.children && item.children.length > 0) {
                ids[item.id] = true;
                walk(item.children);
            }
        }
    };
    walk(nodes);
    return ids;
};

const TrialBalanceReport = () => {
    const { t, i18n } = useTranslation();
    const { companySettings } = useAuth();
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
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [totals, setTotals] = useState({
        initialDebit: 0, initialCredit: 0,
        transactionDebit: 0, transactionCredit: 0,
        endDebit: 0, endCredit: 0,
    });
    const [expanded, setExpanded] = useState({});
    const hasFetched = useRef(false);

    const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));

    const periodOptions = [
        { value: 'current_month', label: t('reports.filters.current_month') || 'الشهر الحالي' },
        { value: 'last_month', label: t('reports.filters.last_month') || 'الشهر الماضي' },
        { value: 'current_quarter', label: t('reports.filters.current_quarter') || 'الربع الحالي' },
        { value: 'current_year', label: t('reports.filters.current_year') || 'السنة الحالية' },
    ];

    const applyPeriod = (value) => {
        const now = new Date();
        if (value === 'current_month') return getMonthRange(now);
        if (value === 'last_month') { const p = new Date(now.getFullYear(), now.getMonth() - 1, 1); return getMonthRange(p); }
        if (value === 'current_quarter') {
            const qm = Math.floor(now.getMonth() / 3) * 3;
            return { startDate: new Date(now.getFullYear(), qm, 1).toISOString().slice(0, 10), endDate: new Date(now.getFullYear(), qm + 3, 0).toISOString().slice(0, 10) };
        }
        if (value === 'current_year') {
            return { startDate: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10), endDate: new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10) };
        }
        return { startDate: filters.fromDate, endDate: filters.toDate };
    };

    const handleViewReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/accounting/trial-balance', {
                params: {
                    startDate: filters.fromDate,
                    endDate: filters.toDate,
                    branch: filters.branch !== 'all' ? filters.branch : undefined,
                }
            });
            const data = response.data?.data || [];
            const apiTotals = response.data?.totals || {};
            setReportData(data);
            setTotals({
                initialDebit: apiTotals.initialDebit || 0,
                initialCredit: apiTotals.initialCredit || 0,
                transactionDebit: apiTotals.transactionDebit || 0,
                transactionCredit: apiTotals.transactionCredit || 0,
                endDebit: apiTotals.endDebit || 0,
                endCredit: apiTotals.endCredit || 0,
            });
            const parentIds = collectParentIds(data);
            setExpanded(parentIds);
        } catch {
            setReportData([]);
            setTotals({ initialDebit: 0, initialCredit: 0, transactionDebit: 0, transactionCredit: 0, endDebit: 0, endCredit: 0 });
        } finally {
            setLoading(false);
        }
    }, [filters.branch, filters.fromDate, filters.toDate]);

    const fetchBranches = useCallback(async () => {
        try {
            const res = await api.get('/branches');
            setBranches(Array.isArray(res.data) ? res.data : []);
        } catch { setBranches([]); }
    }, []);

    useEffect(() => {
        fetchBranches();
        if (hasFetched.current) return;
        hasFetched.current = true;
        handleViewReport();
    }, []);

    const toggleRow = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    /* Export helpers */
    const exportTotals = useMemo(() => ({ ...totals }), [totals]);
    const handleExportExcel = () => exportTrialBalanceToExcel(reportData, exportTotals, t);
    const handleExportPdf = async () => {
        const dateRange = `${t('reports.filters.from_date')} ${filters.fromDate} ${t('reports.filters.to_date')} ${filters.toDate}`;
        const blob = await buildTrialBalancePdf(reportData, exportTotals, t, t('reports.accounting.trial_balance') || 'Trial Balance', dateRange);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Trial_Balance_${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    };
    const handlePrint = () => window.print();

    /* ── Row renderer (Alostaz layout) ── */
    /*
     * Column order in the HTML table (RTL context, so first <td> = rightmost visual column):
     *   1. الحساب (Account)                       — RIGHT
     *   2. الرصيد الافتتاحي مدين (Opening Debit)
     *   3. الرصيد الافتتاحي دائن (Opening Credit)
     *   4. مجموع الحركات مدين   (Movement Debit)
     *   5. مجموع الحركات دائن   (Movement Credit)
     *   6. الرصيد الختامي مدين   (Closing Debit)
     *   7. الرصيد الختامي دائن   (Closing Credit) — LEFT
     */
    const renderRows = (nodes, depth = 0) => {
        const rows = [];
        for (const item of nodes) {
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = !!expanded[item.id];
            const isParentRow = hasChildren;
            const bgClass = isParentRow ? 'bg-gray-50' : '';
            const weightClass = depth === 0 ? 'font-bold' : isParentRow ? 'font-semibold' : '';

            rows.push(
                <tr key={item.id} className={`${bgClass} ${weightClass} border-b border-gray-300 hover:bg-blue-50 transition-colors`}>
                    {/* 1. Account name */}
                    <td className="px-3 py-2 text-sm text-gray-900 border border-gray-300 whitespace-nowrap">
                        <div className="flex items-center gap-1" style={{ paddingRight: `${depth * 20}px` }}>
                            {hasChildren ? (
                                <button onClick={() => toggleRow(item.id)}
                                    className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-500">
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? '' : '-rotate-90'}`} />
                                </button>
                            ) : (
                                <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                </span>
                            )}
                            <span>
                                {item.name}
                                {item.code && <span className="text-gray-400 text-xs mr-1"> #{item.code}</span>}
                            </span>
                        </div>
                    </td>
                    {/* 2-3. Opening Balance: مدين then دائن */}
                    <td className="px-2 py-2 text-sm text-center border border-gray-300 tabular-nums" dir="ltr">{fmt(item.initialDebit)}</td>
                    <td className="px-2 py-2 text-sm text-center border border-gray-300 tabular-nums" dir="ltr">{fmt(item.initialCredit)}</td>
                    {/* 4-5. Movement Totals: مدين then دائن */}
                    <td className="px-2 py-2 text-sm text-center border border-gray-300 tabular-nums" dir="ltr">{fmt(item.transactionDebit)}</td>
                    <td className="px-2 py-2 text-sm text-center border border-gray-300 tabular-nums" dir="ltr">{fmt(item.transactionCredit)}</td>
                    {/* 6-7. Closing Balance: مدين then دائن */}
                    <td className="px-2 py-2 text-sm text-center border border-gray-300 tabular-nums font-semibold" dir="ltr">{fmt(item.endDebit)}</td>
                    <td className="px-2 py-2 text-sm text-center border border-gray-300 tabular-nums font-semibold" dir="ltr">{fmt(item.endCredit)}</td>
                </tr>
            );

            if (hasChildren && isOpen) {
                rows.push(...renderRows(item.children, depth + 1));
            }
        }
        return rows;
    };

    const dateRangeLabel = `ميزان المراجعة من تاريخ ${filters.fromDate} إلى تاريخ ${filters.toDate}`;

    const thCell = "px-2 py-2 text-center text-xs font-bold border border-gray-300 bg-white text-gray-700";
    const thGroup = "px-2 py-2 text-center text-sm font-bold border border-gray-300 bg-white text-gray-800";

    return (
        <div className="p-4 tb-report-container" dir="rtl">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0.5cm;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact;
                    }
                    .tb-report-container {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                    }
                    table {
                        width: 100% !important;
                        min-width: 0 !important;
                        table-layout: fixed !important;
                        border-collapse: collapse !important;
                        font-size: 7.5pt !important;
                    }
                    th, td {
                        padding: 2px 1px !important;
                        word-wrap: break-word !important;
                        border: 1px solid #ccc !important;
                        line-height: 1.2 !important;
                    }
                    /* Fixed widths for 7 columns in print A4: 28% (account) + 6*12% (numeric) = 100% */
                    th:first-child, td:first-child { width: 28% !important; text-align: right !important; }
                    th:not(:first-child), td:not(:first-child) { width: 12% !important; text-align: center !important; }
                    thead {
                        display: table-header-group !important;
                    }
                    tfoot {
                        display: table-footer-group !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        page-break-after: auto !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .overflow-x-auto {
                        overflow: visible !important;
                    }
                    /* Ensure headers are bold and visible */
                    th {
                        background-color: #f3f4f6 !important;
                        color: black !important;
                    }
                }
            `}} />
            {/* Print Header */}
            <div className="hidden print:block mb-6">
                <PrintHeader title="ميزان المراجعة" isRTL={true} showLogo={false} />
            </div>

            {/* ── Filters ── */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 print:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                    {/* Period */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">الفترة الزمنية</label>
                        <select
                            value={filters.period}
                            onChange={(e) => {
                                const v = e.target.value;
                                const range = applyPeriod(v);
                                setFilters(prev => ({ ...prev, period: v, fromDate: range.startDate, toDate: range.endDate }));
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                        >
                            {periodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    {/* From Date */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">من تاريخ</label>
                        <input type="date" value={filters.fromDate} onChange={e => handleFilterChange('fromDate', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" />
                    </div>
                    {/* To Date */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">إلى تاريخ</label>
                        <input type="date" value={filters.toDate} onChange={e => handleFilterChange('toDate', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" />
                    </div>
                    {/* Branch */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">الفرع</label>
                        <select value={filters.branch} onChange={e => handleFilterChange('branch', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white">
                            <option value="all">جميع الفروع</option>
                            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                    </div>
                    {/* Displayed Accounts */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">إظهار الحسابات</label>
                        <select value={filters.displayedAccounts} onChange={e => handleFilterChange('displayedAccounts', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white">
                            <option value="all">الحسابات التي لها قيود فقط أو دائماً الفترة</option>
                        </select>
                    </div>
                </div>

                <button onClick={handleViewReport}
                    className="px-5 py-1.5 bg-teal-600 text-white rounded text-sm font-medium hover:bg-teal-700 transition-colors">
                    {loading ? '...' : 'عرض التقرير'}
                </button>
            </div>

            {/* ── Report ── */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-600 border-t-transparent" />
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-gray-200 print:hidden">
                        <div className="flex items-center gap-2">
                            <button onClick={handlePrint}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200">
                                <Printer className="w-3.5 h-3.5" /> طباعة
                            </button>
                            <button onClick={handleExportPdf}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100">
                                <FileText className="w-3.5 h-3.5" /> PDF
                            </button>
                            <button onClick={handleExportExcel}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100">
                                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                            </button>
                        </div>
                    </div>

                    {/* Date range title */}
                    <div className="px-4 py-2 text-sm text-gray-800 font-semibold text-right border-b border-gray-200">
                        {dateRangeLabel}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                {/* Group header row */}
                                <tr>
                                    <th rowSpan={2} className={`${thGroup} min-w-[240px] text-right`}>الحساب</th>
                                    <th colSpan={2} className={thGroup}>الرصيد الافتتاحي</th>
                                    <th colSpan={2} className={thGroup}>مجموع الحركات</th>
                                    <th colSpan={2} className={thGroup}>الرصيد الختامي</th>
                                </tr>
                                {/* Sub-header: مدين / دائن for each group */}
                                <tr>
                                    <th className={thCell}>مدين</th>
                                    <th className={thCell}>دائن</th>
                                    <th className={thCell}>مدين</th>
                                    <th className={thCell}>دائن</th>
                                    <th className={thCell}>مدين</th>
                                    <th className={thCell}>دائن</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm border border-gray-300">
                                            لا توجد بيانات
                                        </td>
                                    </tr>
                                ) : (
                                    renderRows(reportData)
                                )}
                            </tbody>
                            {reportData.length > 0 && (
                                <tfoot>
                                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                                        <td className="px-3 py-2.5 text-sm text-gray-900 border border-gray-300">المجموع</td>
                                        <td className="px-2 py-2.5 text-sm text-center border border-gray-300 tabular-nums" dir="ltr">{fmt(totals.initialDebit)}</td>
                                        <td className="px-2 py-2.5 text-sm text-center border border-gray-300 tabular-nums" dir="ltr">{fmt(totals.initialCredit)}</td>
                                        <td className="px-2 py-2.5 text-sm text-center border border-gray-300 tabular-nums" dir="ltr">{fmt(totals.transactionDebit)}</td>
                                        <td className="px-2 py-2.5 text-sm text-center border border-gray-300 tabular-nums" dir="ltr">{fmt(totals.transactionCredit)}</td>
                                        <td className="px-2 py-2.5 text-sm text-center border border-gray-300 tabular-nums" dir="ltr">{fmt(totals.endDebit)}</td>
                                        <td className="px-2 py-2.5 text-sm text-center border border-gray-300 tabular-nums" dir="ltr">{fmt(totals.endCredit)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrialBalanceReport;
