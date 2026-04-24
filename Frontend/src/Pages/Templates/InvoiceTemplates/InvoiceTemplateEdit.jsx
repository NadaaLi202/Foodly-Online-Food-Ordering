import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api.js';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import TemplateEditor from '../components/templateeditor.jsx';
import TextBlock, { TextBlockList } from '../components/textblock.jsx';
import MarginsPopover from '../components/marginspopover.jsx';
import InvoicePreview from '../components/documentpreview.jsx';
import { useAuth } from '../../../context/authcontext.jsx';
import branchService from '../../../services/branchservice.js';
import { X } from 'lucide-react';

/** Maps branch DB record to template placeholder keys */
const buildBranchContext = (branch = {}) => ({
    name: branch.name || '',
    address_line_1: branch.address1 || '',
    address_line_2: branch.address2 || '',
    city: branch.city || '',
    state: branch.state || branch.region || '',
    region: branch.region || '',
    neighborhood: branch.neighborhood || '',
    postal_code: branch.postalCode || '',
    country: branch.country || '',
    phone: branch.phone || '',
    commercial_register: branch.commercialRegister || '',
});

const getTabs = (t, pageSize) => {
    const tabs = [
        { id: 'design', label: t('Design', 'التصميم') },
        { id: 'page', label: t('Page', 'الصفحة') },
        { id: 'logo', label: t('Logo', 'الشعار') },
        { id: 'header', label: t('Header', 'المقدمة') },
        { id: 'company', label: t('Company', 'الشركة') },
        { id: 'partner', label: t('Client / Supplier', 'العميل / المورد') },
        { id: 'table', label: t('Table', 'الجدول') },
        { id: 'footer', label: t('Footer', 'التذييل') },
    ];
    // Thermal templates do not have a Company tab
    if (pageSize === '80mm') {
        return tabs.filter(tab => tab.id !== 'company');
    }
    return tabs;
};

const getTableColsDefault = (t) => [
    { key: 'lineNumber', label: t('Item', 'البند'), enabled: true },
    { key: 'description', label: t('Description', 'الوصف'), enabled: true },
    { key: 'quantity', label: t('Quantity', 'الكمية'), enabled: true },
    { key: 'price', label: t('Price', 'السعر'), enabled: true },
    { key: 'taxRate', label: t('Tax Rate', 'نسبة الضريبة'), enabled: true },
    { key: 'total', label: t('Total', 'الإجمالي'), enabled: true },
    { key: 'discount', label: t('Discount', 'الخصم'), enabled: false },
    { key: 'subtotal', label: t('Subtotal', 'الإجمالي قبل الضريبة'), enabled: false },
    { key: 'code', label: t('Code', 'الكود'), enabled: false },
];
const getTableFooterDefault = (t) => [
    { key: 'subtotal', label: t('Subtotal', 'الإجمالي قبل الضريبة'), enabled: true },
    { key: 'vat', label: t('VAT 15%', 'القيمة المضافة 15%'), enabled: true },
    { key: 'total', label: t('Total (SAR)', 'الإجمالي بعد الضريبة'), enabled: true },
    { key: 'paid', label: t('Paid', 'المدفوع'), enabled: false },
    { key: 'discount', label: t('Discount', 'الخصم'), enabled: false },
    { key: 'remaining', label: t('Remaining', 'المتبقي'), enabled: false },
];

const ensureRows = (rows) => (rows?.length ? rows : [{ text: '', format: {} }]);
const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-indigo-400";
const selectClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-indigo-400 appearance-none";
const Label = ({ children }) => <label className="block text-sm font-semibold text-gray-700 mb-1">{children}</label>;

const Toggle = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between gap-2 cursor-pointer py-2">
        <span className="text-sm text-gray-700">{label}</span>
        <button type="button" onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
    </label>
);

const InvoiceTemplateEdit = () => {
    const { id } = useParams();
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('design');
    const [tableSub, setTableSub] = useState('general');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [previewSearch, setPreviewSearch] = useState('');
    const [fetchedPreviewData, setFetchedPreviewData] = useState(null);
    const [fetchingPreview, setFetchingPreview] = useState(false);

    // Company + branch context for placeholder resolution
    const [companyData, setCompanyData] = useState({});
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [bankAccounts, setBankAccounts] = useState([]);

    const [name, setName] = useState('');
    const [designId, setDesignId] = useState('design-1');
    const [page, setPage] = useState({ direction: 'rtl', pageSize: 'A4', fontSize: 12, margins: { top: 40, right: 40, bottom: 40, left: 40 } });
    const [logo, setLogo] = useState({ url: '', size: 70 });
    const [headerOrder, setHeaderOrder] = useState('Logo, Company Info, Invoice Info');
    const [showBottomBorder, setShowBottomBorder] = useState(false);

    // Header Data
    const [headerRows, setHeaderRows] = useState([
        { text: '{{company.name}}', format: { fontSize: 13, bold: true } },
        { text: 'السجل التجاري : {{company.commercial_register}}', format: { fontSize: 11 } },
        { text: 'الرقم الضريبي : {{company.vat}}', format: { fontSize: 11 } },
        { text: '{{company.city}}', format: { fontSize: 11 } },
        { text: '{{branch.state}}', format: { fontSize: 11 } },
    ]);
    const [invoiceInfoRows, setInvoiceInfoRows] = useState([
        { text: 'الرقم : {{invoice.name}}', format: { fontSize: 11 } },
        { text: 'التاريخ : {{invoice.invoice_date}}', format: { fontSize: 11 } },
    ]);
    const [logoMargins, setLogoMargins] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
    const [titles, setTitles] = useState({
        saleInvoice: { text: t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة'), format: { fontSize: 14, bold: true } },
        saleCreditNote: { text: t('Credit Note', 'فاتورة مرتجعات'), format: { fontSize: 14, bold: true } },
        purchaseInvoice: { text: t('Purchase Invoice', 'فاتورة مشتريات'), format: { fontSize: 14, bold: true } },
        purchaseCreditNote: { text: t('Purchase Credit Note', 'فاتورة مرتجعات مشتريات'), format: { fontSize: 14, bold: true } },
        quotation: { text: t('Quotation', 'عرض سعر'), format: { fontSize: 14, bold: true } },
        salesOrder: { text: t('Sales Order', 'أمر بيع'), format: { fontSize: 14, bold: true } },
        purchaseRequest: { text: t('Purchase Request', 'طلب شراء'), format: { fontSize: 14, bold: true } },
        purchaseOrder: { text: t('Purchase Order', 'أمر شراء'), format: { fontSize: 14, bold: true } }
    });
    const [clientRows, setClientRows] = useState([
        { text: '{{invoice.partner.name}}', format: { fontSize: 12 } },
        { text: '{{invoice.partner.street}}', format: { fontSize: 11 } },
        { text: 'الرقم الضريبي : {{invoice.partner.vat}}', format: { fontSize: 11 } },
    ]);
    const [supplierRows, setSupplierRows] = useState([{ text: '', format: {} }]);
    const [tableCfg, setTableCfg] = useState({ deductTaxFromAmounts: false, showTableLines: true, cellMargins: { top: 3, right: 5, bottom: 3, left: 5 }, columns: getTableColsDefault(t), footerRows: getTableFooterDefault(t) });
    const [footerRows, setFooterRows] = useState([{ text: '', format: {} }]);
    const [sigRows1, setSigRows1] = useState([{ text: t('Signature', 'التوقيع'), format: { fontSize: 12 } }]);
    const [sigRows2, setSigRows2] = useState([{ text: '', format: {} }]);
    const [sigRows3, setSigRows3] = useState([{ text: '', format: {} }]);

    const [prevModule, setPrevModule] = useState('Sales');
    const [prevDocType, setPrevDocType] = useState('Invoice');

    // Load template + company + branches + latest invoice for preview
    useEffect(() => {
        (async () => {
            try {
                const [tmplRes, branchRes, bankRes] = await Promise.all([
                    api.get(`/templates/${id}`),
                    branchService.getAllBranches().catch(() => ({ branches: [] })),
                    api.get('/bank-accounts').catch(() => ({ data: { bankAccounts: [] } })),
                ]);
                const template = tmplRes.data.template;
                setName(template.name ?? '');
                setDesignId(template.designId ?? 'design-1');
                setPage(template.page ?? { direction: 'rtl', pageSize: 'A4', fontSize: 12, margins: { top: 40, right: 40, bottom: 40, left: 40 } });
                setLogo(template.logo ?? { url: '', size: 70 });
                setLogoMargins(template.logo?.margins ?? { top: 0, right: 0, bottom: 0, left: 0 });
                setHeaderOrder(template.header?.order ?? 'Logo, Company Info, Invoice Info');
                setShowBottomBorder(template.header?.showBottomBorder ?? false);
                if (template.header?.rows?.length) setHeaderRows(template.header.rows);
                if (template.header?.invoiceInfoRows?.length) setInvoiceInfoRows(template.header.invoiceInfoRows);
                if (template.header?.titles) setTitles(prev => ({ ...prev, ...template.header.titles }));
                if (template.partner?.clientRows?.length) setClientRows(template.partner.clientRows);
                if (template.partner?.supplierRows?.length) setSupplierRows(template.partner.supplierRows);
                if (template.table) {
                    setTableCfg({
                        deductTaxFromAmounts: template.table.deductTaxFromAmounts ?? false,
                        showTableLines: template.table.showTableLines ?? true,
                        cellMargins: template.table.cellMargins ?? { top: 3, right: 5, bottom: 3, left: 5 },
                        columns: template.table.columns?.length ? template.table.columns : getTableColsDefault(t),
                        footerRows: template.table.footerRows?.length ? template.table.footerRows : getTableFooterDefault(t),
                    });
                }
                if (template.footer?.notesRows?.length) setFooterRows(template.footer.notesRows);
                if (template.footer?.signatures?.length >= 3) {
                    setSigRows1(ensureRows(template.footer.signatures[0]?.rows));
                    setSigRows2(ensureRows(template.footer.signatures[1]?.rows));
                    setSigRows3(ensureRows(template.footer.signatures[2]?.rows));
                }
                // Branches
                const bl = branchRes.branches || branchRes || [];
                const branchList = Array.isArray(bl) ? bl : [];
                setBranches(branchList);
                if (branchList.length > 0) setSelectedBranch(branchList[0]._id);
                const bankList = bankRes?.data?.bankAccounts || bankRes?.data?.data || [];
                const normalizedBanks = Array.isArray(bankList) ? bankList : [];
                setBankAccounts(normalizedBanks);
                // Company data from user context
                setCompanyData({
                    name: user?.name || 'اسم الشركة',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    vat: user?.taxNumber || user?.tax_number || '',
                    tax_number: user?.taxNumber || user?.tax_number || '',
                    commercial_register: user?.commercialRegister || user?.register || '',
                    register: user?.commercialRegister || user?.register || '',
                    city: user?.city || user?.region || user?.location || '',
                    logo: user?.logo || user?.logo_path || '',
                    currency: { ar: 'ر.س', en: 'SAR' },
                    account_ids: normalizedBanks.map((bank) => ({
                        name: bank?.name || '',
                        accountNumber: bank?.accountNumber || '',
                        iban: bank?.iban || ''
                    })),
                });

                // AUTO-LOAD LATEST INVOICE
                try {
                    const { data } = await api.get('/transactions/sales/invoices', { params: { limit: 1 } });
                    if (data.data && data.data.length > 0) {
                        setFetchedPreviewData(data.data[0]);
                        setPreviewSearch(data.data[0].transactionNumber);
                    }
                } catch (e) {
                    console.error('Failed to auto-load preview data', e);
                }

            } catch { toast.error(t('Failed to load template', 'فشل تحميل القالب')); }
            finally { setLoading(false); }
        })();
    }, [id, user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/templates/${id}`, {
                type: 'invoice',
                designId,
                name, page, logo: { ...logo, margins: logoMargins },
                header: { rows: headerRows, invoiceInfoRows, order: headerOrder, showBottomBorder, titles },
                partner: { clientRows, supplierRows },
                table: tableCfg,
                footer: { notesRows: footerRows, signatures: [{ label: 'right', rows: sigRows1 }, { label: 'middle', rows: sigRows2 }, { label: 'left', rows: sigRows3 }] },
            });
            toast.success(t('Saved successfully', 'تم الحفظ بنجاح'));
        } catch { toast.error(t('Failed to save', 'فشل الحفظ')); }
        finally { setSaving(false); }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const form = new FormData();
        form.append('logo', file);
        try {
            const { data } = await api.post(`/templates/${id}/logo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            setLogo(l => ({ ...l, url: data.imageUrl || data.logoUrl || l.url }));
            toast.success(t('Logo uploaded', 'تم رفع الشعار'));
        } catch { toast.error(t('Failed to upload', 'فشل الرفع')); }
    };

    const updateCol = (idx, f, v) => { const cols = [...tableCfg.columns]; cols[idx] = { ...cols[idx], [f]: v }; setTableCfg(c => ({ ...c, columns: cols })); };
    const updateFooterRow = (idx, f, v) => { const rows = [...tableCfg.footerRows]; rows[idx] = { ...rows[idx], [f]: v }; setTableCfg(c => ({ ...c, footerRows: rows })); };

    const handlePreviewFetch = async () => {
        if (!previewSearch.trim()) return;
        setFetchingPreview(true);
        try {
            const module = prevModule.toLowerCase(); // 'sales' or 'purchases'
            const type = prevDocType === 'Invoice' ? 'invoices' : (prevDocType === 'Return' ? 'returns' : (prevDocType === 'Quote' ? 'quotations' : 'purchaseOrder'));
            
            // Fixed endpoint to use /transactions which handles both modules and all doc types
            const { data } = await api.get(`/transactions/${module}/${type}`, { params: { search: previewSearch } });
            const list = data.data || [];
            if (list.length > 0) {
                // Take the first match or the exact number match
                const match = list.find(it => it.transactionNumber === previewSearch.toUpperCase()) || list[0];
                setFetchedPreviewData(match);
                toast.success(t('Preview loaded', 'تم تحميل المعاينة'));
            } else {
                toast.error(t('Document not found', 'لم يتم العثور على المستند'));
            }
        } catch (err) {
            console.error(err);
            toast.error(t('Failed to fetch preview', 'فشل جلب المعاينة'));
        } finally {
            setFetchingPreview(false);
        }
    };

    const pageDir = page.direction ?? 'rtl';

    if (loading) return <div className="flex items-center justify-center h-96 text-gray-500">{t('Loading...', 'جارٍ التحميل...')}</div>;

    // Build context for placeholder resolution
    const activeBranch = branches.find(b => b._id === selectedBranch) || branches[0] || {};
    const branchContext = buildBranchContext(activeBranch);
    const resolvedBranchState = branchContext.state || branchContext.region || companyData?.city || '';
    const resolvedPartnerTaxNumber =
        fetchedPreviewData?.partner?.vat ||
        fetchedPreviewData?.contactSnapshot?.vat ||
        fetchedPreviewData?.contactSnapshot?.tax_number ||
        fetchedPreviewData?.contactSnapshot?.taxNumber ||
        fetchedPreviewData?.contact?.vat ||
        fetchedPreviewData?.contact?.tax_number ||
        fetchedPreviewData?.contact?.taxNumber ||
        '';
    const previewItems = fetchedPreviewData?.items?.map((it, idx) => ({
        lineNumber: String(idx + 1),
        description: it.productName || it.product?.name || it.description || '',
        quantity: String(it.quantity || 0),
        price: (it.unitPrice || 0).toFixed(2),
        taxRate: (it.taxPercent || 0) + '%',
        subtotal: (it.subtotal || 0).toFixed(2),
        taxAmount: (it.taxAmount || 0).toFixed(2),
        total: (it.total || 0).toFixed(2),
        code: it.product?.code || ''
    })) || [];
    const bankAccountContext = bankAccounts.map((bank) => ({
        name: bank?.name || '',
        accountNumber: bank?.accountNumber || '',
        iban: bank?.iban || ''
    }));
    const resolvedPartnerName = fetchedPreviewData?.contactSnapshot?.name || fetchedPreviewData?.contact?.name || 'اسم العميل';
    const resolvedPartnerStreet = fetchedPreviewData?.contact?.address?.address1 || fetchedPreviewData?.contactSnapshot?.address || '';
    const resolvedInvoiceDate = fetchedPreviewData?.issueDate ? new Date(fetchedPreviewData.issueDate).toLocaleDateString('en-CA') : '2026-04-11';
    const resolvedInvoiceName = fetchedPreviewData?.transactionNumber || 'INV-0001';
    const previewContext = {
        company: {
            ...companyData,
            logo: logo?.url || companyData?.logo || '',
            account_ids: bankAccountContext
        },
        branch: { ...branchContext, state: resolvedBranchState },
        partner: { 
            name: resolvedPartnerName,
            vat: resolvedPartnerTaxNumber,
            tax_number: resolvedPartnerTaxNumber, 
            address: resolvedPartnerStreet,
            street: resolvedPartnerStreet
        },
        invoice: { 
            name: resolvedInvoiceName,
            number: resolvedInvoiceName,
            invoice_date: resolvedInvoiceDate,
            date: resolvedInvoiceDate,
            partner: {
                name: resolvedPartnerName,
                street: resolvedPartnerStreet,
                vat: resolvedPartnerTaxNumber
            },
            invoice_line_ids: previewItems,
            amount_untaxed: (fetchedPreviewData?.subtotal || 0).toFixed(2),
            amount_tax: (fetchedPreviewData?.totalTax || 0).toFixed(2),
            amount_total: (fetchedPreviewData?.totalAmount || 0).toFixed(2),
            qr_code: fetchedPreviewData?.qrCode || fetchedPreviewData?.qr_code || '',
            company_id: { account_ids: bankAccountContext }
        },
        items: previewItems,
        totals: fetchedPreviewData ? {
            subtotal: (fetchedPreviewData.subtotal || 0).toFixed(2),
            discount: (fetchedPreviewData.totalDiscount || 0).toFixed(2),
            vat: (fetchedPreviewData.totalTax || 0).toFixed(2),
            total: (fetchedPreviewData.totalAmount || 0).toFixed(2),
            paid: (fetchedPreviewData.paidAmount || 0).toFixed(2),
            remaining: (fetchedPreviewData.remainingAmount || 0).toFixed(2)
        } : null
    };

    const templateData = { designId, page, logo: { ...logo, margins: logoMargins }, header: { rows: headerRows, invoiceInfoRows, showBottomBorder, order: headerOrder, titles }, partner: { clientRows, supplierRows }, table: tableCfg, footer: { notesRows: footerRows, signatures: [{ label: 'right', rows: sigRows1 }, { label: 'middle', rows: sigRows2 }, { label: 'left', rows: sigRows3 }] } };

    const subTabBtn = (k, l) => (
        <button key={k} onClick={() => setTableSub(k)}
            className={`flex-1 py-2 text-xs font-semibold rounded transition-colors ${tableSub === k ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {l}
        </button>
    );

    const renderTab = () => {
        switch (activeTab) {
            case 'design':
                return (
                    <div className="space-y-5">
                        <div><Label>{t('Name', 'الاسم')}</Label><input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} /></div>
                        <div><Label>{t('Branches', 'الفروع')}</Label>
                            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className={selectClass}>
                                <option value="">{t('All Branches', 'جميع الفروع')}</option>
                                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 'page':
                return (
                    <div className="space-y-5">
                        <div><Label>{t('Direction', 'الاتجاه')}</Label><select value={page.direction} onChange={e => setPage(p => ({ ...p, direction: e.target.value }))} className={selectClass}><option value="rtl">{t('Right to Left', 'من اليمين إلى اليسار')}</option><option value="ltr">{t('Left to Right', 'من اليسار إلى اليمين')}</option></select></div>
                        <div><Label>{t('Page Size', 'حجم الصفحة')}</Label><select value={page.pageSize} onChange={e => setPage(p => ({ ...p, pageSize: e.target.value }))} className={selectClass}>{['A4', 'A5', 'Letter'].map(s => <option key={s}>{s}</option>)}</select></div>
                        <div><Label>{t('Font Size', 'حجم الخط')}</Label><div className="flex items-center border border-gray-300 rounded bg-white h-9 w-24"><input type="number" value={page.fontSize} min={6} max={72} onChange={e => setPage(p => ({ ...p, fontSize: +e.target.value }))} className="w-full text-center text-sm border-none outline-none bg-transparent" /></div></div>
                        <div><Label>{t('Margins', 'الهوامش')}</Label><MarginsPopover margins={page.margins} onChange={m => setPage(p => ({ ...p, margins: m }))} /></div>
                    </div>
                );
            case 'logo':
                return (
                    <div className="space-y-4">
                        {logo.url ? (
                            <div className="relative border border-gray-200 rounded-lg p-3 flex items-center justify-center bg-gray-50">
                                <img src={logo.url} alt="" className="max-h-24 max-w-full object-contain" />
                                <button
                                    type="button"
                                    onClick={() => setLogo(l => ({ ...l, url: '' }))}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                                    title="Remove logo"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400">
                                <span className="text-sm text-gray-500">{t('Upload Logo', 'رفع شعار')}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            </label>
                        )}
                        <div><Label>{t('Size', 'الحجم')}</Label><input type="number" value={logo.size} min={10} max={500} onChange={e => setLogo(l => ({ ...l, size: +e.target.value }))} className={inputClass} /></div>
                    </div>
                );
            case 'header': {
                const normalizedOrderList = (headerOrder || 'Logo, Company Info, Invoice Info').split(',').map(s => s.trim().toLowerCase());

                const componentsMap = {
                    'company info': <TextBlockList key="company" rows={headerRows} setRows={setHeaderRows} dir={pageDir} title={t('Company Info', 'معلومات الشركة')} />,
                    'company': <TextBlockList key="company_short" rows={headerRows} setRows={setHeaderRows} dir={pageDir} title={t('Company Info', 'معلومات الشركة')} />,
                    'invoice info': <TextBlockList key="invoice" rows={invoiceInfoRows} setRows={setInvoiceInfoRows} dir={pageDir} title={t('Invoice Info', 'معلومات الفاتورة')} />,
                    'invoice': <TextBlockList key="invoice_short" rows={invoiceInfoRows} setRows={setInvoiceInfoRows} dir={pageDir} title={t('Invoice Info', 'معلومات الفاتورة')} />,
                    'logo': <div key="logo" className="pt-4"><label className="block text-sm font-medium text-gray-700 mb-1">{t('Logo Margin', 'توسيط الشعار')}</label><MarginsPopover margins={logoMargins} onChange={setLogoMargins} /></div>,
                };

                const currentOrderList = normalizedOrderList;

                return (
                    <div className="space-y-4">
                        <div className="divide-y-2 space-y-4">
                            {page.pageSize !== '80mm' && (
                                <div className="space-y-2">
                                    <div><Label>{t('Order', 'الترتيب')}</Label><select value={headerOrder} onChange={e => setHeaderOrder(e.target.value)} className={selectClass}><option>Logo, Company Info, Invoice Info</option><option>Company Info, Logo, Invoice Info</option><option>Company Info, Invoice Info, Logo</option></select></div>
                                    <Toggle label={t('Show Bottom Border', 'إظهار خط سفلي')} checked={showBottomBorder} onChange={setShowBottomBorder} />
                                </div>
                            )}

                            {/* Dynamic Order Rendering */}
                            {currentOrderList.map((item, idx) => (
                                <div key={item} className={idx > 0 && item !== 'logo' ? 'pt-4' : ''}>
                                    {componentsMap[item]}
                                </div>
                            ))}
                        </div>

                        {/* Document Titles */}
                        <div className="pt-4 divide-y space-y-4">
                            <div className="font-medium mb-2">{t('Title', 'العنوان')}</div>
                            <div className="grid gap-2">
                                {[
                                    { key: 'saleInvoice', label: t('Sale Invoice', 'فاتورة مبيعات') },
                                    { key: 'saleCreditNote', label: t('Sale Credit Note', 'مرتجع مبيعات') },
                                    { key: 'purchaseInvoice', label: t('Purchase Invoice', 'فاتورة مشتريات') },
                                    { key: 'purchaseCreditNote', label: t('Purchase Credit Note', 'مرتجع مشتريات') },
                                    { key: 'quotation', label: t('Quotation', 'عرض سعر') },
                                    { key: 'salesOrder', label: t('Sales Order', 'أمر بيع') },
                                    { key: 'purchaseRequest', label: t('Purchase Request', 'طلب شراء') },
                                    { key: 'purchaseOrder', label: t('Purchase Order', 'أمر شراء') },
                                ].map((type) => (
                                    <div key={type.key}>
                                        <label className="block text-sm font-medium text-gray-700">{type.label}</label>
                                        <div className="mt-1">
                                            <TextBlock
                                                row={titles[type.key]}
                                                dir={pageDir}
                                                onChange={(newRow) => setTitles(prev => ({ ...prev, [type.key]: newRow }))}
                                                canDelete={false}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }
            case 'company':
                return (
                    <div className="space-y-4">
                        <TextBlockList rows={headerRows} setRows={setHeaderRows} dir={pageDir} title={t('Company Info', 'معلومات الشركة')} />
                    </div>
                );
            case 'partner':
                return (
                    <div className="grid gap-2 divide-y divide-gray-300 space-y-4">
                        <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('Client', 'العميل')}</label>
                            <TextBlockList rows={clientRows} setRows={setClientRows} dir={pageDir} />
                        </div>
                        <div className="pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('Supplier', 'المورد')}</label>
                            <TextBlockList rows={supplierRows} setRows={setSupplierRows} dir={pageDir} />
                        </div>
                    </div>
                );
            case 'table':
                return (
                    <div className="space-y-4">
                        <div className="flex gap-1">{subTabBtn('general', t('General', 'عام'))}{subTabBtn('columns', t('Columns', 'الأعمدة'))}{subTabBtn('table_footer', t('Footer', 'التذييل'))}</div>
                        {tableSub === 'general' && (
                            <div className="space-y-2">
                                <Toggle label={t('Deduct Tax from Amounts', 'خصم الضريبة من المبالغ')} checked={tableCfg.deductTaxFromAmounts} onChange={v => setTableCfg(c => ({ ...c, deductTaxFromAmounts: v }))} />
                                <Toggle label={t('Show Table Lines', 'إظهار خطوط الجدول')} checked={tableCfg.showTableLines} onChange={v => setTableCfg(c => ({ ...c, showTableLines: v }))} />
                                <div className="pt-2"><Label>{t('Cell Margins', 'هوامش الخلية')}</Label><MarginsPopover margins={tableCfg.cellMargins} onChange={m => setTableCfg(c => ({ ...c, cellMargins: m }))} /></div>
                            </div>
                        )}
                        {tableSub === 'columns' && (
                            <div className="space-y-2">{tableCfg.columns.map((col, idx) => (
                                <div key={col.key} className={`flex items-center gap-2 p-2.5 rounded border ${col.enabled ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-100 bg-gray-50'}`}>
                                    <button type="button" onClick={() => updateCol(idx, 'enabled', !col.enabled)}
                                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${col.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${col.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </button>
                                    <input type="text" value={col.label} onChange={e => updateCol(idx, 'label', e.target.value)} disabled={!col.enabled}
                                        className={`flex-1 text-sm bg-transparent outline-none border-none ${col.enabled ? 'text-gray-800' : 'text-gray-400'}`} />
                                </div>
                            ))}</div>
                        )}
                        {tableSub === 'table_footer' && (
                            <div className="space-y-2">{tableCfg.footerRows.map((row, idx) => (
                                <Toggle key={row.key} label={row.label} checked={row.enabled} onChange={v => updateFooterRow(idx, 'enabled', v)} />
                            ))}</div>
                        )}
                    </div>
                );
            case 'footer':
                return (
                    <div className="space-y-5">
                        {page.pageSize !== '80mm' && (
                            <>
                                <TextBlockList rows={sigRows1} setRows={setSigRows1} dir={pageDir} title={t('Signature 1', 'التوقيع ١')} />
                                <div className="border-t border-gray-100 pt-3"><TextBlockList rows={sigRows2} setRows={setSigRows2} dir={pageDir} title={t('Signature 2', 'التوقيع ٢')} /></div>
                                <div className="border-t border-gray-100 pt-3"><TextBlockList rows={sigRows3} setRows={setSigRows3} dir={pageDir} title={t('Signature 3', 'التوقيع ٣')} /></div>
                            </>
                        )}
                        <div className="border-t border-gray-100 pt-3"><TextBlockList rows={footerRows} setRows={setFooterRows} dir={pageDir} title={t('Notes', 'الملاحظات')} /></div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <TemplateEditor
            breadcrumbs={[{ label: t('Template Designs', 'تصاميم القوالب'), to: '/dashboard/templates' }, { label: t('Invoices', 'الفواتير'), to: '/dashboard/templates/invoices' }, { label: t('Edit', 'تعديل') }]}
            tabs={getTabs(t, page.pageSize?.toLowerCase())} activeTab={activeTab === 'company' && page.pageSize?.toLowerCase() === '80mm' ? 'design' : activeTab} onTabChange={setActiveTab}
            tabContent={renderTab()}
            previewContent={
                <InvoicePreview template={templateData} direction={pageDir} context={previewContext} />
            }
            previewHeader={
                <div className="grid grid-cols-2 gap-3 p-4 bg-[#f8f9fc]">
                    <select value={prevModule} onChange={e => setPrevModule(e.target.value)} className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white outline-none cursor-pointer text-gray-700 hover:border-gray-300 transition-colors">
                        <option value="Sales">{t('Sales', 'Sales')}</option><option value="Purchases">{t('Purchases', 'Purchases')}</option>
                    </select>
                    <select value={prevDocType} onChange={e => setPrevDocType(e.target.value)} className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white outline-none cursor-pointer text-gray-700 hover:border-gray-300 transition-colors">
                        <option value="Invoice">{t('Invoice', 'Invoice')}</option><option value="Return">{t('Return', 'Return')}</option><option value="Quote">{t('Quote', 'Quote')}</option>
                    </select>
                    <input 
                        type="text" 
                        placeholder={t('Search Invoice #...', 'ابحث برقم الفاتورة...')} 
                        value={previewSearch}
                        onChange={e => setPreviewSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handlePreviewFetch()}
                        className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white outline-none focus:border-indigo-400 transition-colors" 
                    />
                    <button 
                        onClick={handlePreviewFetch}
                        disabled={fetchingPreview}
                        className="bg-[#6366f1] text-white rounded-md px-4 py-2 text-sm font-bold shadow-sm hover:bg-indigo-600 transition-colors disabled:opacity-50"
                    >
                        {fetchingPreview ? t('Searching...', 'جارٍ البحث...') : t('Preview', 'Preview')}
                    </button>
                </div>
            }
            onSave={handleSave} saving={saving} backUrl="/dashboard/templates/invoices"
        />
    );
};

export default InvoiceTemplateEdit;
