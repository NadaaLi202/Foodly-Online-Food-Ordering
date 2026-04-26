import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, FileSpreadsheet, FileText, Printer, Filter } from 'lucide-react';
import { exportInventoryMovementsToExcel } from '../../../utils/customerSupplierInventoryExport';
import { downloadTablePdf } from '../../../utils/reportPdfBuilder';
import reportsService from '../../../services/reportsService';
import api from '../../../services/api';
import logError from '../../../utils/logError';
import { useAuth } from '../../../context/AuthContext';
import PrintHeader from '../../../components/common/PrintHeader';

const InventoryValueDetailedReport = () => {
    const { t, i18n } = useTranslation();
    const { companySettings } = useAuth();
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);

    const [filters, setFilters] = useState({
        period: 'current_month',
        fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-GB').split('/').join('-'),
        toDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('en-GB').split('/').join('-'),
        storehouse: 'all',
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
                logError('Error fetching filter data:', error);
            }
        };
        fetchFilterData();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportsService.getInventoryMovementsDetailed({
                startDate: filters.fromDate,
                endDate: filters.toDate,
                warehouse: filters.storehouse,
                product: filters.product,
                category: filters.productCategory
            });

            // Group data by product
            const rawData = res.data || [];
            const grouped = {};

            rawData.forEach(log => {
                const key = log.productName + log.productCode;
                if (!grouped[key]) {
                    grouped[key] = {
                        productName: log.productName,
                        productCode: log.productCode,
                        movements: []
                    };
                }
                grouped[key].movements.push({
                    type: log.type === 'in' ? t('reports.inventory.inventory_value_detailed_report.stock_in') : t('reports.inventory.inventory_value_detailed_report.stock_out'),
                    documentNumber: log.documentNumber,
                    date: log.date,
                    quantity: log.type === 'in' ? log.quantity : -log.quantity,
                    quantityAfter: log.newQuantity,
                    value: log.unitPrice ?? 0,
                    valueCorrection: (log.quantity * (log.unitPrice ?? 0))
                });
            });

            setReportData(Object.values(grouped));
        } catch (error) {
            logError('Error fetching detailed inventory report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handleFilterChange = (field, value) => {
        setFilters(prev => {
            const newFilters = { ...prev, [field]: value };
            if (field === 'period') {
                const today = new Date();
                let from = '';
                let to = '';
                if (value === 'current_month') {
                    from = new Date(today.getFullYear(), today.getMonth(), 1);
                    to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                } else if (value === 'last_month') {
                    from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    to = new Date(today.getFullYear(), today.getMonth(), 0);
                } else if (value === 'current_quarter') {
                    const quarter = Math.floor(today.getMonth() / 3);
                    from = new Date(today.getFullYear(), quarter * 3, 1);
                    to = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
                } else if (value === 'current_year') {
                    from = new Date(today.getFullYear(), 0, 1);
                    to = new Date(today.getFullYear(), 11, 31);
                }
                if (from && to) {
                    newFilters.fromDate = from.toLocaleDateString('en-GB').split('/').join('-');
                    newFilters.toDate = to.toLocaleDateString('en-GB').split('/').join('-');
                }
            }
            return newFilters;
        });
    };

    const periodOptions = [
        { value: 'current_month', label: t('reports.filters.current_month') },
        { value: 'last_month', label: t('reports.filters.last_month') },
        { value: 'current_quarter', label: t('reports.filters.current_quarter') },
        { value: 'current_year', label: t('reports.filters.current_year') },
        { value: 'custom', label: t('reports.filters.custom') },
    ];

    const handleExportExcel = () => {
        if (reportData.length === 0) return;
        const movements = [];
        reportData.forEach(pData => {
            pData.movements?.forEach(m => {
                movements.push({
                    productName: pData.productName,
                    productCode: pData.productCode,
                    type: m.type,
                    documentNumber: m.documentNumber,
                    date: new Date(m.date).toLocaleDateString(),
                    quantity: m.quantity,
                    quantityAfter: m.quantityAfter,
                    value: m.value,
                    valueCorrection: m.valueCorrection
                });
            });
        });
        if (movements.length > 0) {
            exportInventoryMovementsToExcel(movements, { fromDate: filters.fromDate, toDate: filters.toDate }, t);
        }
    };

    const handleExportPdf = async () => {
        if (reportData.length === 0) return;
        const headers = [
            'حركة المخزون',
            'المصدر',
            'التاريخ',
            'الكمية',
            'الكمية بعد',
            'القيمة (ج.م)',
            'تسوية القيمة (ج.م)',
        ];
        const rows = [];
        reportData.forEach((pData) => {
            rows.push([`${pData.productName} (${pData.productCode})`, '', '', '', '', '', '']);
            pData.movements?.forEach((m) => {
                rows.push([
                    m.type,
                    m.documentNumber,
                    new Date(m.date).toLocaleDateString(),
                    m.quantity,
                    m.quantityAfter,
                    m.value ? Number(m.value).toFixed(2) : '0.00',
                    m.valueCorrection ? Number(m.valueCorrection).toFixed(2) : '0.00',
                ]);
            });
        });
        await downloadTablePdf({
            title: 'تقرير قيمة المخزون المفصل',
            headers,
            rows,
            filename: `Inventory_Movements_${filters.fromDate}_${filters.toDate}.pdf`,
            landscape: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const isAr = i18n.language === 'ar';
    const textStart = isAr ? 'text-right' : 'text-left';

    return (
        <div className="p-6 text-start">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="hidden print:block mb-6">
                        <PrintHeader
                            title="تقرير قيمة المخزون المفصل"
                            isRTL={true}
                            showLogo={false}
                            companyInfo={companySettings}
                        />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 no-print">
                    <div className={textStart}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.period')}</label>
                        <div className="relative">
                            <select value={filters.period} onChange={(e) => handleFilterChange('period', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {periodOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            <ChevronDown className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    <div className={textStart}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.from_date')}</label>
                        <div className="relative">
                            <input type="text" value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)} className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isAr ? 'pr-3' : 'pl-3'}`} placeholder="DD-MM-YYYY" />
                            <Calendar className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

                    <div className={textStart}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filters.to_date')}</label>
                        <div className="relative">
                            <input type="text" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isAr ? 'pr-3' : 'pl-3'}`} placeholder="DD-MM-YYYY" />
                            <Calendar className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                        </div>
                    </div>

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
                        {`تقرير قيمة المخزون من تاريخ ${filters.fromDate} إلى تاريخ ${filters.toDate}`}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportExcel} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors border border-green-200">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            {t('reports.export.excel')}
                        </button>
                        <button onClick={handleExportPdf} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded text-xs font-medium hover:bg-purple-100 transition-colors border border-purple-200">
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
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_detailed_report.stock_transaction')}</th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_detailed_report.source')}</th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_detailed_report.date')}</th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_detailed_report.quantity')}</th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_detailed_report.quantity_after')}</th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_detailed_report.value')}</th>
                                <th className={`px-4 py-3 ${textStart} text-sm font-medium text-gray-700`}>{t('reports.inventory.inventory_value_detailed_report.value_correction')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-sm text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                            {t('reports.loading')}
                                        </div>
                                    </td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-sm text-gray-500">
                                        {t('reports.no_data')}
                                    </td>
                                </tr>
                            ) : (
                                reportData.map((prod, pIdx) => (
                                    <React.Fragment key={pIdx}>
                                        <tr className="bg-gray-50/50">
                                            <td colSpan="7" className={`px-4 py-2 text-sm font-bold text-gray-900 border-b border-gray-100 ${textStart}`}>
                                                {prod.productName} ({prod.productCode})
                                            </td>
                                        </tr>
                                        {prod.movements?.map((m, mIdx) => (
                                            <tr key={mIdx} className="bg-white hover:bg-gray-50 transition-colors">
                                                <td className={`px-4 py-3 text-sm text-gray-900 font-medium ${textStart}`}>{m.type}</td>
                                                <td className={`px-4 py-3 text-sm text-gray-500 ${textStart}`}>{m.documentNumber}</td>
                                                <td className={`px-4 py-3 text-sm text-gray-500 ${textStart}`}>{new Date(m.date).toLocaleDateString()}</td>
                                                <td className={`px-4 py-3 text-sm text-gray-500 ${textStart}`}>{m.quantity !== 0 ? m.quantity : ''}</td>
                                                <td className={`px-4 py-3 text-sm text-gray-900 font-medium ${textStart}`}>{m.quantityAfter}</td>
                                                <td className={`px-4 py-3 text-sm text-gray-500 ${textStart}`}>{m.value ? m.value.toFixed(2) : '0.00'}</td>
                                                <td className={`px-4 py-3 text-sm text-gray-500 ${textStart}`}>{m.valueCorrection ? m.valueCorrection.toFixed(2) : '0.00'}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryValueDetailedReport;

