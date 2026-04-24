import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, FileSpreadsheet, FileText, Printer, Search, Settings2 } from 'lucide-react';
import reportsService from '../../../services/reportsservice';
import chartOfAccountsService from '../../../services/chartofaccountsservice';
import branchService from '../../../services/branchservice';
import { exportSupplierStatementToExcel, exportSupplierStatementToPdf } from '../../../utils/customersupplierinventoryexport';
import PrintHeader from '../../../components/common/printheader';
import { useAuth } from '../../../context/authcontext';
import { formatCurrency as utilFormatCurrency } from '../../../utils/currencyformatter';

const SupplierGeneralLedger = () => {
    const { t } = useTranslation();
    const { companySettings } = useAuth();
    const currency = companySettings?.currency || 'EGP';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [totals, setTotals] = useState(null);

    // Filter Options Lists
    const [branches, setBranches] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [supplierSearch, setSupplierSearch] = useState('');
    const [isSupplierOpen, setIsSupplierOpen] = useState(false);
    const supplierRef = useRef(null);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${y}-${m}-${d}`;
    };

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: formatDate(firstDay),
        toDate: formatDate(lastDay),
        branch: 'all',
        supplierId: 'all',
        accountId: 'all',
        showAccounts: 'with_activity',
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (supplierRef.current && !supplierRef.current.contains(event.target)) {
                setIsSupplierOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtered suppliers list
    const filteredSuppliers = suppliers.filter(s =>
        s.name?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.code?.toLowerCase().includes(supplierSearch.toLowerCase())
    );

    const selectedSupplier = suppliers.find(s => s._id === filters.supplierId);

    const handleFilterChange = (field, value) => {
        setFilters(prev => {
            const newFilters = { ...prev, [field]: value };
            if (field === 'period') {
                const now = new Date();
                if (value === 'current_month') {
                    newFilters.fromDate = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
                    newFilters.toDate = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
                } else if (value === 'last_month') {
                    newFilters.fromDate = formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
                    newFilters.toDate = formatDate(new Date(now.getFullYear(), now.getMonth(), 0));
                } else if (value === 'current_year') {
                    newFilters.fromDate = formatDate(new Date(now.getFullYear(), 0, 1));
                    newFilters.toDate = formatDate(new Date(now.getFullYear(), 11, 31));
                }
            }
            return newFilters;
        });
        setError(null);
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [branchesList, accountsList, suppliersList] = await Promise.all([
                    branchService.getAllBranches(),
                    chartOfAccountsService.getAllAccounts({ type: 'sub' }),
                    reportsService.getSuppliersList()
                ]);
                setBranches(Array.isArray(branchesList) ? branchesList : (branchesList?.data || []));
                setAccounts(Array.isArray(accountsList) ? accountsList : (accountsList?.accounts || []));
                setSuppliers(suppliersList);
            } catch (err) {
                console.error("Error loading filter options:", err);
            }
        };
        loadInitialData();
    }, []);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await reportsService.getSupplierGeneralLedger({
                fromDate: filters.fromDate,
                toDate: filters.toDate,
                branch: filters.branch,
                supplierId: filters.supplierId,
                accountId: filters.accountId,
            });

            let data = res?.data ?? [];
            if (filters.showAccounts === 'with_activity') {
                data = data.filter(acc => acc.entries?.length > 0 || acc.openingBalance !== 0);
            }

            setReportData(data);
            setTotals(res?.totals || null);
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('reports.error_load'));
            setReportData([]);
            setTotals(null);
        } finally {
            setLoading(false);
        }
    }, [filters, t]);

    useEffect(() => {
        fetchReport();
    }, []);

    const formatCellDate = (d) => {
        if (!d) return '—';
        const date = new Date(d);
        return date.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatCurrency = (amount) => {
        if (!amount || amount === 0) return '0.00';
        return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handlePrint = () => window.print();
    const handleExportExcel = () => exportSupplierStatementToExcel(reportData, totals, { fromDate: filters.fromDate, toDate: filters.toDate }, t);
    const handleExportPdf = () => exportSupplierStatementToPdf(reportData, totals, { fromDate: filters.fromDate, toDate: filters.toDate }, t);

    const getReportTitle = () => {
        const fromDate = new Date(filters.fromDate);
        const toDate = new Date(filters.toDate);
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return `تقرير حساب الأستاذ لحسابات الموردين من تاريخ ${fromDate.toLocaleDateString('ar-EG', options)} إلى تاريخ ${toDate.toLocaleDateString('ar-EG', options)}`;
    };

    return (
        <div className="p-4 bg-white min-h-screen text-right" dir="rtl">
            <div className="max-w-full mx-auto space-y-4">

                {/* Filters Section */}
                <div className="bg-[#fcfcfc] rounded shadow-sm border border-gray-100 p-6 no-print">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                        {/* Period Column */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-gray-700">الفترة</label>
                            <div className="relative">
                                <select
                                    value={filters.period}
                                    onChange={(e) => handleFilterChange('period', e.target.value)}
                                    className="w-full h-[42px] px-3 bg-white border border-gray-300 rounded text-sm appearance-none focus:border-blue-500"
                                >
                                    <option value="current_month">الشهر الحالي</option>
                                    <option value="last_month">الشهر الماضي</option>
                                    <option value="current_year">السنة الحالية</option>
                                    <option value="custom">فترة مخصصة</option>
                                </select>
                                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* From Date */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-gray-700">من تاريخ</label>
                            <input
                                type="date"
                                value={filters.fromDate}
                                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                className="w-full h-[42px] px-3 bg-white border border-gray-300 rounded text-sm"
                            />
                        </div>

                        {/* To Date */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-gray-700">إلى تاريخ</label>
                            <input
                                type="date"
                                value={filters.toDate}
                                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                className="w-full h-[42px] px-3 bg-white border border-gray-300 rounded text-sm"
                            />
                        </div>

                        {/* Supplier Filter */}
                        <div className="flex flex-col gap-1" ref={supplierRef}>
                            <label className="text-sm font-bold text-gray-700">المورد</label>
                            <div className="relative">
                                <div
                                    className="w-full h-[42px] px-3 bg-white border border-gray-300 rounded text-sm flex items-center justify-between cursor-pointer hover:border-blue-500"
                                    onClick={() => setIsSupplierOpen(!isSupplierOpen)}
                                >
                                    <span className="truncate">
                                        {filters.supplierId === 'all' ? "كل الموردين" : (selectedSupplier?.name || filters.supplierId)}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSupplierOpen ? 'rotate-180' : ''}`} />
                                </div>

                                {isSupplierOpen && (
                                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden min-w-[200px]">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                                            <div className="relative">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="بحث عن مورد..."
                                                    className="w-full h-8 pl-8 pr-3 text-sm bg-white border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                                                    value={supplierSearch}
                                                    onChange={(e) => setSupplierSearch(e.target.value)}
                                                />
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="max-h-[250px] overflow-y-auto">
                                            <div
                                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${filters.supplierId === 'all' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`}
                                                onClick={() => {
                                                    handleFilterChange('supplierId', 'all');
                                                    setIsSupplierOpen(false);
                                                }}
                                            >
                                                كل الموردين
                                            </div>
                                            {filteredSuppliers.length > 0 ? (
                                                filteredSuppliers.map(s => (
                                                    <div
                                                        key={s._id}
                                                        className={`px-3 py-2 text-sm cursor-pointer border-t border-gray-50 hover:bg-blue-50 ${filters.supplierId === s._id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`}
                                                        onClick={() => {
                                                            handleFilterChange('supplierId', s._id);
                                                            setIsSupplierOpen(false);
                                                        }}
                                                    >
                                                        <div className="flex justify-between gap-2">
                                                            <span className="truncate">{s.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-mono self-center shrink-0">#{s.code || s._id.slice(-4)}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-3 py-4 text-xs text-center text-gray-500 italic">لا توجد نتائج مطابقة</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Account */}
                        <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-sm font-bold text-gray-700">الحساب</label>
                            <div className="relative">
                                <select
                                    value={filters.accountId}
                                    onChange={(e) => handleFilterChange('accountId', e.target.value)}
                                    className="w-full h-[42px] px-3 bg-white border border-gray-300 rounded text-sm appearance-none"
                                >
                                    <option value="all">كل الحسابات</option>
                                    {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name} #{acc.code}</option>)}
                                </select>
                                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Show Accounts */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-gray-700">إظهار الحسابات</label>
                            <div className="relative">
                                <select
                                    value={filters.showAccounts}
                                    onChange={(e) => handleFilterChange('showAccounts', e.target.value)}
                                    className="w-full h-[42px] px-3 bg-white border border-gray-300 rounded text-sm appearance-none"
                                >
                                    <option value="with_activity">الحسابات التي لها قيود قبل أو خلال الفترة</option>
                                    <option value="all">كل الحسابات</option>
                                </select>
                                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* View Button */}
                        <div className="flex items-end">
                            <button
                                onClick={fetchReport}
                                disabled={loading}
                                className="w-full h-[42px] px-6 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded transition-colors flex items-center justify-center gap-2"
                                style={{ backgroundColor: '#10b981' }}
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>{t('reports.show_reports')}</span>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toolbar Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 no-print">
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded text-xs font-bold hover:bg-gray-100">
                            <Settings2 className="w-3.5 h-3.5" />
                            <span>{t('reports.select_columns')}</span>
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe] rounded text-xs font-bold hover:bg-[#ede9fe]">
                            <Printer className="w-3.5 h-3.5" />
                            <span>طباعة</span>
                        </button>
                        <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fdf2f8] text-[#be185d] border border-[#fbcfe8] rounded text-xs font-bold hover:bg-[#fce7f3]">
                            <FileText className="w-3.5 h-3.5" />
                            <span>PDF</span>
                        </button>
                        <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] rounded text-xs font-bold hover:bg-[#dcfce7]">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Excel</span>
                        </button>
                    </div>
                    <div className="text-center font-bold text-gray-900 text-[15px] flex-1">
                        {getReportTitle()}
                    </div>
                    <div className="w-48 invisible md:visible" />
                </div>

                {/* Table Content */}
                <div className="overflow-hidden border border-gray-200">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 space-y-4 bg-white">
                            <div className="w-8 h-8 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white">
                            <table className="w-full text-right border-collapse">
                                <thead className="bg-[#fcfcfc] border-b border-gray-200">
                                    <tr className="border-b border-gray-200 text-gray-700">
                                        <th rowSpan="2" className="px-4 py-3 border-l border-gray-200 text-sm font-bold w-32">قيد اليومية</th>
                                        <th rowSpan="2" className="px-4 py-3 border-l border-gray-200 text-sm font-bold w-32">التاريخ</th>
                                        <th rowSpan="2" className="px-4 py-3 border-l border-gray-200 text-sm font-bold w-48">المصدر</th>
                                        <th rowSpan="2" className="px-4 py-3 border-l border-gray-200 text-sm font-bold min-w-[300px]">الوصف</th>
                                        <th colSpan="2" className="px-4 py-2 border-l border-gray-200 text-sm font-bold text-center">القيد</th>
                                        <th colSpan="2" className="px-4 py-2 text-sm font-bold text-center">الرصيد</th>
                                    </tr>
                                    <tr className="border-b border-gray-200 text-gray-600">
                                        <th className="px-3 py-2 border-l border-gray-200 text-xs font-bold text-center w-28">مدين</th>
                                        <th className="px-3 py-2 border-l border-gray-200 text-xs font-bold text-center w-28">دائن</th>
                                        <th className="px-3 py-2 border-l border-gray-200 text-xs font-bold text-center w-28">مدين</th>
                                        <th className="px-3 py-2 text-xs font-bold text-center w-28">دائن</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-20 text-center text-gray-400">لا توجد حركات لعرضها للفترة المختارة</td>
                                        </tr>
                                    ) : (
                                        reportData.map((account) => (
                                            <React.Fragment key={account.accountId}>
                                                {/* Section Header */}
                                                <tr className="bg-white border-b border-gray-100">
                                                    <td colSpan="8" className="px-4 py-3 text-center text-[13px] font-bold text-gray-800">
                                                        {account.accountName} #{account.accountCode}
                                                    </td>
                                                </tr>

                                                {/* Opening Balance Row */}
                                                <tr className="border-b border-gray-50 bg-[#fffbeb]/20">
                                                    <td className="border-l border-gray-100"></td>
                                                    <td className="border-l border-gray-100"></td>
                                                    <td className="border-l border-gray-100"></td>
                                                    <td className="px-4 py-2.5 text-[13px] font-bold text-gray-700 border-l border-gray-100">الرصيد السابق</td>
                                                    <td className="border-l border-gray-100"></td>
                                                    <td className="border-l border-gray-100"></td>
                                                    <td className="px-4 py-2.5 text-[13px] font-bold text-left border-l border-gray-100">
                                                        {account.openingBalance > 0 ? formatCurrency(account.openingBalance) : '0.00'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-[13px] font-bold text-left">
                                                        {account.openingBalance < 0 ? formatCurrency(Math.abs(account.openingBalance)) : '0.00'}
                                                    </td>
                                                </tr>

                                                {/* Entries */}
                                                {account.entries.map((entry, idx) => {
                                                    const bal = entry.balance;
                                                    return (
                                                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                            <td className="px-4 py-3 text-[12px] text-gray-600 border-l border-gray-100 font-medium">{entry.journalNumber}</td>
                                                            <td className="px-4 py-3 text-[12px] text-gray-500 border-l border-gray-100">{formatCellDate(entry.date)}</td>
                                                            <td className="px-4 py-3 text-[12px] text-gray-600 border-l border-gray-100">{entry.source || '—'}</td>
                                                            <td className="px-4 py-3 text-[13px] text-gray-700 border-l border-gray-100">{entry.description}</td>
                                                            <td className="px-3 py-3 text-[13px] text-left border-l border-gray-100 text-gray-800">{entry.debit > 0 ? formatCurrency(entry.debit) : ''}</td>
                                                            <td className="px-3 py-3 text-[13px] text-left border-l border-gray-100 text-gray-800">{entry.credit > 0 ? formatCurrency(entry.credit) : ''}</td>
                                                            <td className="px-3 py-3 text-[13px] text-left border-l border-gray-100 font-bold text-gray-800">
                                                                {bal > 0 ? formatCurrency(bal) : '0.00'}
                                                            </td>
                                                            <td className="px-3 py-3 text-[13px] text-left font-bold text-gray-800">
                                                                {bal < 0 ? formatCurrency(Math.abs(bal)) : '0.00'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                                {/* Footer row */}
                                                <tr className="bg-white border-b border-gray-200">
                                                    <td colSpan="4" className="px-4 py-3 text-[13px] font-bold text-gray-800 border-l border-gray-100">المجموع</td>
                                                    <td className="px-3 py-3 text-[13px] font-bold text-left border-l border-gray-100 text-gray-900">{formatCurrency(account.totalDebit)}</td>
                                                    <td className="px-3 py-3 text-[13px] font-bold text-left border-l border-gray-100 text-gray-900">{formatCurrency(account.totalCredit)}</td>
                                                    <td className="px-3 py-3 text-[13px] font-bold text-left border-l border-gray-100 text-gray-900">{account.closingBalance > 0 ? formatCurrency(account.closingBalance) : '0.00'}</td>
                                                    <td className="px-3 py-3 text-[13px] font-bold text-left text-gray-900">{account.closingBalance < 0 ? formatCurrency(Math.abs(account.closingBalance)) : '0.00'}</td>
                                                </tr>
                                                <tr className="h-6 no-print bg-[#fcfcfc]"><td colSpan="8" className="border-b border-gray-200"></td></tr>
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                                {totals && reportData.length > 0 && (
                                    <tfoot className="bg-[#f8fafc] border-t-2 border-gray-300 font-bold uppercase no-print">
                                        <tr className="text-gray-900">
                                            <td colSpan="4" className="px-4 py-4 text-[14px] font-extrabold border-l border-gray-200">إجمالي الموردين</td>
                                            <td className="px-3 py-4 text-[14px] text-left border-l border-gray-200 text-[#047857]">{formatCurrency(totals.totalDebit)}</td>
                                            <td className="px-3 py-4 text-[14px] text-left border-l border-gray-200 text-[#b91c1c]">{formatCurrency(totals.totalCredit)}</td>
                                            <td className="px-3 py-4 text-[14px] text-left border-l border-gray-200 bg-gray-50 font-black">
                                                {totals.finalBalance > 0 ? formatCurrency(totals.finalBalance) : '0.00'}
                                            </td>
                                            <td className="px-3 py-4 text-[14px] text-left bg-gray-50 font-black">
                                                {totals.finalBalance < 0 ? formatCurrency(Math.abs(totals.finalBalance)) : '0.00'}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: landscape; margin: 1cm; }
                    .no-print { display: none !important; }
                    body { background: white !important; font-size: 9pt; }
                    table { border: 1px solid #ccc !important; width: 100% !important; }
                    th, td { border: 0.5px solid #eee !important; padding: 3px 6px !important; }
                    thead { display: table-header-group; }
                    tr { page-break-inside: avoid; }
                }
                select, input { outline: none !important; border-radius: 4px !important; }
                table th { color: #374151 !important; font-weight: 700 !important; }
                table td { font-family: sans-serif; }
            `}} />
        </div>
    );
};

export default SupplierGeneralLedger;
