import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, FileSpreadsheet, FileText, Printer, Filter, Calendar } from 'lucide-react';
import { exportIncomeStatementToExcel, buildAccountingReportPdf } from '../../../utils/accountingreportsexport';
import api from '../../../services/api';
import PrintHeader from '../../../components/common/printheader';
import { useAuth } from '../../../context/authcontext';
import { formatCurrency as utilFormatCurrency } from '../../../utils/currencyformatter';

const getMonthRange = (date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const toISO = (d) => d.toISOString().slice(0, 10);
    return { startDate: toISO(start), endDate: toISO(end) };
};

const fmt = (n) => {
    const v = Math.abs(Number(n || 0));
    if (v === 0) return '0.00';
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const IncomeStatementReport = () => {
    const { t, i18n } = useTranslation();
    const { companySettings } = useAuth();
    const currency = companySettings?.currency || 'EGP';
    const isRTL = i18n.language === 'ar';
    const { startDate: defaultFrom, endDate: defaultTo } = getMonthRange();

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: defaultFrom,
        toDate: defaultTo,
        branch: 'all',
    });

    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState({
        revenue: { items: [], total: 0 },
        expenses: { items: [], total: 0 },
        netIncome: 0,
    });

    const [expanded, setExpanded] = useState({
        'root-rev': true,
        'root-exp': true
    });

    const hasFetched = useRef(false);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handlePeriodChange = (period) => {
        const range = applyPeriod(period);
        setFilters(prev => ({ ...prev, period, fromDate: range.startDate, toDate: range.endDate }));
    };

    const applyPeriod = (value) => {
        const now = new Date();
        if (value === 'current_month') return getMonthRange(now);
        if (value === 'last_month') return getMonthRange(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        if (value === 'current_quarter') {
            const qm = Math.floor(now.getMonth() / 3) * 3;
            return { startDate: new Date(now.getFullYear(), qm, 1).toISOString().slice(0, 10), endDate: new Date(now.getFullYear(), qm + 3, 0).toISOString().slice(0, 10) };
        }
        if (value === 'current_year') {
            return { startDate: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10), endDate: new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10) };
        }
        return { startDate: filters.fromDate, endDate: filters.toDate };
    };

    const fetchBranches = useCallback(async () => {
        try {
            const res = await api.get('/branches');
            setBranches(Array.isArray(res.data) ? res.data : (res.data.branches || []));
        } catch { setBranches([]); }
    }, []);

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
            setReportData(response.data);

            const newExp = { 'root-rev': true, 'root-exp': true };
            const walk = (items) => items.forEach(n => {
                if (n.children?.length > 0) {
                    newExp[n.id] = true;
                    walk(n.children);
                }
            });
            walk([...(response.data.revenue?.items || []), ...(response.data.expenses?.items || [])]);
            setExpanded(newExp);
        } catch {
            setReportData({ revenue: { items: [], total: 0 }, expenses: { items: [], total: 0 }, netIncome: 0 });
        } finally {
            setLoading(false);
        }
    }, [filters.branch, filters.fromDate, filters.toDate]);

    useEffect(() => {
        fetchBranches();
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchReport();
    }, []);

    const toggleRow = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const handlePrint = () => window.print();

    const renderRows = (nodes, depth = 0) => {
        const rows = [];
        for (const item of nodes) {
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = !!expanded[item.id];

            rows.push(
                <tr key={item.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${item.level === 0 ? 'bg-gray-50 font-bold' : ''}`}>
                    <td className="px-4 py-2 text-sm text-gray-900 border-l border-gray-300">
                        <div className="flex items-center gap-1" style={{ paddingRight: `${depth * 20}px` }}>
                            {hasChildren ? (
                                <button onClick={() => toggleRow(item.id)} className="w-5 h-5 flex items-center justify-center text-gray-500">
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                                </button>
                            ) : <span className="w-5" />}
                            <span>{item.name} {item.code && <span className="text-gray-400 text-xs mr-1">#{item.code}</span>}</span>
                        </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-center border-l border-gray-300 tabular-nums font-semibold" dir="ltr">
                        {fmt(Math.abs(item.netBalance))}
                    </td>
                </tr>
            );

            if (hasChildren && isOpen) {
                rows.push(...renderRows(item.children, depth + 1));
            }
        }
        return rows;
    };

    const SectionHeader = ({ id, title, total, color = 'bg-gray-100' }) => (
        <tr className={`${color} font-bold text-gray-900 border-b-2 border-gray-300`}>
            <td className="px-4 py-3 text-base border-l border-gray-300 cursor-pointer" onClick={() => toggleRow(id)}>
                <div className="flex items-center gap-2">
                    <ChevronDown className={`w-5 h-5 transition-transform ${expanded[id] ? '' : '-rotate-90'}`} />
                    <span>{title}</span>
                </div>
            </td>
            <td className="px-4 py-3 text-center text-base border-l border-gray-300 tabular-nums" dir="ltr">
                {fmt(total)}
            </td>
        </tr>
    );

    return (
        <div className="p-4" dir="rtl">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4 portrait; margin: 1cm; }
                    .print\\:hidden { display: none !important; }
                    tr, div { page-break-inside: avoid !important; }
                    table { font-size: 10pt !important; width: 100% !important; }
                    body { margin: 0 !important; padding: 0 !important; }
                }
            `}} />
            <div className="hidden print:block mb-6">
                <PrintHeader title="قائمة الدخل" isRTL={true} showLogo={false} />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 print:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">الفترة</label>
                        <select value={filters.period} onChange={e => handlePeriodChange(e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white">
                            <option value="current_month">الشهر الحالي</option>
                            <option value="last_month">الشهر الماضي</option>
                            <option value="current_quarter">الربع الحالي</option>
                            <option value="current_year">السنة الحالية</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">من تاريخ</label>
                        <input type="date" value={filters.fromDate} onChange={e => handleFilterChange('fromDate', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">إلى تاريخ</label>
                        <input type="date" value={filters.toDate} onChange={e => handleFilterChange('toDate', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">الفرع</label>
                        <select value={filters.branch} onChange={e => handleFilterChange('branch', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white">
                            <option value="all">جميع الفروع</option>
                            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                    </div>
                </div>
                <button onClick={fetchReport} className="px-5 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition-colors">
                    عرض التقرير
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                    <div className="flex px-4 py-2 border-b border-gray-200 print:hidden bg-gray-50">
                        <button onClick={handlePrint} className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100"><Printer className="w-3" /> طباعة</button>
                    </div>

                    <div className="px-4 py-2 text-center font-bold border-b border-gray-200 text-gray-800">
                        قائمة الدخل للفترة من {filters.fromDate} إلى {filters.toDate}
                    </div>

                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-200 text-gray-800 font-bold text-sm">
                                <th className="px-4 py-2 text-right border border-gray-300">البيان</th>
                                <th className="px-4 py-2 text-center border border-gray-300 w-48">القيمة ({currency})</th>
                            </tr>
                        </thead>
                        <tbody>
                            <SectionHeader id="root-rev" title="الإيرادات (Revenue)" total={reportData.revenue.total} color="bg-green-50" />
                            {expanded['root-rev'] && renderRows(reportData.revenue.items)}

                            <SectionHeader id="root-exp" title="المصروفات (Expenses)" total={reportData.expenses.total} color="bg-red-50" />
                            {expanded['root-exp'] && renderRows(reportData.expenses.items)}
                        </tbody>
                        <tfoot>
                            <tr className={`font-bold text-lg ${reportData.netIncome >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                                <td className="px-4 py-3 border border-gray-700 text-right">صافي الربح / الخسارة</td>
                                <td className="px-4 py-3 text-center border border-gray-700 tabular-nums" dir="ltr">{fmt(reportData.netIncome)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

export default IncomeStatementReport;
