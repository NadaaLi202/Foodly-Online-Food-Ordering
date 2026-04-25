import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, ChevronRight, FileSpreadsheet, FileText, Printer, Filter } from 'lucide-react';
import { exportBalanceSheetToExcel, buildAccountingReportPdf } from '../../../utils/accountingreportsexport';
import api from '../../../services/api';
import PrintHeader from '../../../components/common/printheader';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency as utilFormatCurrency } from '../../../utils/currencyFormatter';

const fmt = (n) => {
    const v = Number(n || 0);
    if (v === 0) return '0.00';
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const BalanceSheetReport = () => {
    const { t, i18n } = useTranslation();
    const { companySettings } = useAuth();
    const currency = companySettings?.currency || 'EGP';
    const isRTL = i18n.language === 'ar';

    const [filters, setFilters] = useState({
        toDate: new Date().toISOString().slice(0, 10),
        branch: 'all',
    });

    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState({
        assets: { items: [], total: 0 },
        liabilities: { items: [], total: 0 },
        equity: { items: [], total: 0 },
        totalLiabilitiesAndEquity: 0
    });
    
    // expanded state keyed by account id
    const [expanded, setExpanded] = useState({
        'root-assets': true,
        'root-liabilities': true,
        'root-equity': true
    });

    const hasFetched = useRef(false);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
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
            const response = await api.get('/reports/accounting/balance-sheet', {
                params: {
                    asOfDate: filters.toDate,
                    branch: filters.branch !== 'all' ? filters.branch : undefined,
                }
            });
            setReportData(response.data);
            
            // Auto expand roots
            const newExpanded = { 'root-assets': true, 'root-liabilities': true, 'root-equity': true };
            const walk = (items) => {
                items.forEach(item => {
                    if (item.children?.length > 0) {
                        newExpanded[item.id] = true;
                        walk(item.children);
                    }
                });
            };
            walk([...(response.data.assets?.items || []), ...(response.data.liabilities?.items || []), ...(response.data.equity?.items || [])]);
            setExpanded(newExpanded);
        } catch (error) {
            console.error('Error fetching balance sheet:', error);
        } finally {
            setLoading(false);
        }
    }, [filters.branch, filters.toDate]);

    useEffect(() => {
        fetchBranches();
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchReport();
    }, []);

    const toggleRow = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const handleExportExcel = () => exportBalanceSheetToExcel(reportData, t);
    const handlePrint = () => window.print();

    const formatCurrency = (amount) => utilFormatCurrency(amount, currency);

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
        <>
            <tr className={`${color} font-bold text-gray-900 border-b-2 border-gray-300`}>
                <td className="px-4 py-3 text-base border-l border-gray-300">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleRow(id)}>
                        <ChevronDown className={`w-5 h-5 transition-transform ${expanded[id] ? '' : '-rotate-90'}`} />
                        <span>{title}</span>
                    </div>
                </td>
                <td className="px-4 py-3 text-center text-base border-l border-gray-300 tabular-nums" dir="ltr">
                    {fmt(total)}
                </td>
            </tr>
        </>
    );

    return (
        <div className="p-4" dir="rtl">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: A4 portrait; margin: 1cm; }
                    .print\\:hidden { display: none !important; }
                    tr, div { page-break-inside: avoid !important; }
                    table { font-size: 10pt !important; width: 100% !important; }
                    body { margin: 0 !important; padding: 0 !important; }
                }
            `}} />
            <div className="hidden print:block mb-6">
                <PrintHeader title="قائمة المركز المالي" isRTL={true} showLogo={false} />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 print:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">في تاريخ</label>
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
                    {loading ? '...' : 'عرض التقرير'}
                </button>
            </div>

            {/* Report Content */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 print:hidden bg-gray-50">
                        <div className="flex gap-2">
                            <button onClick={handlePrint} className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100"><Printer className="w-3" /> طباعة</button>
                            <button onClick={handleExportExcel} className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-white border border-green-300 rounded hover:bg-green-50"><FileSpreadsheet className="w-3" /> Excel</button>
                        </div>
                    </div>

                    <div className="px-4 py-2 text-center font-bold border-b border-gray-200 text-gray-800">
                        قائمة المركز المالي في {filters.toDate}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-200 text-gray-800 font-bold text-sm">
                                    <th className="px-4 py-2 text-right border border-gray-300">البيان</th>
                                    <th className="px-4 py-2 text-center border border-gray-300 w-48">الرصيد ({currency})</th>
                                </tr>
                            </thead>
                            <tbody>
                                <SectionHeader id="root-assets" title="الأصول (Assets)" total={reportData.assets.total} />
                                {expanded['root-assets'] && renderRows(reportData.assets.items)}

                                <SectionHeader id="root-liabilities" title="الخصوم (Liabilities)" total={reportData.liabilities.total} color="bg-orange-50" />
                                {expanded['root-liabilities'] && renderRows(reportData.liabilities.items)}

                                <SectionHeader id="root-equity" title="حقوق الملكية (Equity)" total={reportData.equity.total} color="bg-blue-50" />
                                {expanded['root-equity'] && renderRows(reportData.equity.items)}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-800 text-white font-bold text-base">
                                    <td className="px-4 py-3 border border-gray-700 text-right">إجمالي الخصوم وحقوق الملكية</td>
                                    <td className="px-4 py-3 text-center border border-gray-700 tabular-nums" dir="ltr">{fmt(reportData.totalLiabilitiesAndEquity)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BalanceSheetReport;
