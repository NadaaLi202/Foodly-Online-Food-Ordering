import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api.js';
import toast from 'react-hot-toast';
import TemplateEditor from '../components/TemplateEditor.jsx';
import { TextBlockList } from '../components/TextBlock.jsx';
import MarginsPopover from '../components/MarginsPopover.jsx';
import InvoicePreview from '../components/DocumentPreview.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import branchService from '../../../services/branchService.js';

const TABS = [
    { id: 'design', label: 'Design' },
    { id: 'page', label: 'Page' },
    { id: 'logo', label: 'Logo' },
    { id: 'header', label: 'Header' },
    { id: 'partner', label: 'Partner' },
    { id: 'table', label: 'Table' },
    { id: 'footer', label: 'Footer' },
];

const TABLE_COLS_DEFAULT = [
    { key: 'lineNumber', label: 'البند', enabled: true },
    { key: 'description', label: 'الوصف', enabled: true },
    { key: 'quantity', label: 'الكمية', enabled: true },
    { key: 'price', label: 'السعر', enabled: true },
    { key: 'discount', label: 'الخصم', enabled: false },
    { key: 'taxRate', label: 'نسبة الضريبة', enabled: true },
    { key: 'subtotal', label: 'المجموع بدون الضريبة', enabled: true },
    { key: 'total', label: 'المجموع', enabled: true },
    { key: 'code', label: 'الكود', enabled: false },
];
const TABLE_FOOTER_DEFAULT = [
    { key: 'subtotal', label: 'الإجمالي قبل الضريبة', enabled: true },
    { key: 'discount', label: 'الخصم', enabled: false },
    { key: 'vat', label: 'القيمة المضافة 15%', enabled: true },
    { key: 'total', label: 'الإجمالي ( ر.س)', enabled: true },
    { key: 'paid', label: 'المستحق ( ر.س)', enabled: true },
    { key: 'remaining', label: 'المتبقي', enabled: false },
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
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('design');
    const [tableSub, setTableSub] = useState('general');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Company + branch context for placeholder resolution
    const [companyData, setCompanyData] = useState({});
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');

    const [name, setName] = useState('');
    const [page, setPage] = useState({ direction: 'rtl', pageSize: 'A4', fontSize: 12, margins: { top: 40, right: 40, bottom: 40, left: 40 } });
    const [logo, setLogo] = useState({ url: '', size: 70 });
    const [headerOrder, setHeaderOrder] = useState('Logo, Company Info, Invoice Info');
    const [showBottomBorder, setShowBottomBorder] = useState(false);
    const [headerRows, setHeaderRows] = useState([
        { text: '{{company.name}}', format: { fontSize: 14, bold: true } },
        { text: 'السجل التجاري : {{company.register}}', format: { fontSize: 12 } },
        { text: 'الرقم الضريبي : {{company.tax_number}}', format: { fontSize: 12 } },
    ]);
    const [invoiceInfoRows, setInvoiceInfoRows] = useState([
        { text: '{{branch.address_line_1}}', format: { fontSize: 12 } },
        { text: '{{branch.city}}', format: { fontSize: 12 } },
    ]);
    const [clientRows, setClientRows] = useState([
        { text: 'العميل : {{partner.name}}', format: { fontSize: 12 } },
        { text: 'العنوان : {{partner.address}}', format: { fontSize: 12 } },
    ]);
    const [supplierRows, setSupplierRows] = useState([{ text: '', format: {} }]);
    const [tableCfg, setTableCfg] = useState({ deductTaxFromAmounts: false, showTableLines: true, cellMargins: { top: 3, right: 5, bottom: 3, left: 5 }, columns: TABLE_COLS_DEFAULT, footerRows: TABLE_FOOTER_DEFAULT });
    const [footerRows, setFooterRows] = useState([{ text: '', format: {} }]);
    const [sigRows1, setSigRows1] = useState([{ text: '', format: {} }]);
    const [sigRows2, setSigRows2] = useState([{ text: '', format: {} }]);
    const [sigRows3, setSigRows3] = useState([{ text: '', format: {} }]);

    const [prevModule, setPrevModule] = useState('Sales');
    const [prevDocType, setPrevDocType] = useState('Invoice');

    // Load template + company + branches
    useEffect(() => {
        (async () => {
            try {
                const [tmplRes, branchRes] = await Promise.all([
                    api.get(`/templates/${id}`),
                    branchService.getAllBranches().catch(() => ({ branches: [] })),
                ]);
                const t = tmplRes.data.template;
                setName(t.name ?? '');
                setPage(t.page ?? { direction: 'rtl', pageSize: 'A4', fontSize: 12, margins: { top: 40, right: 40, bottom: 40, left: 40 } });
                setLogo(t.logo ?? { url: '', size: 70 });
                setHeaderOrder(t.header?.order ?? 'Logo, Company Info, Invoice Info');
                setShowBottomBorder(t.header?.showBottomBorder ?? false);
                if (t.header?.rows?.length) setHeaderRows(t.header.rows);
                if (t.header?.invoiceInfoRows?.length) setInvoiceInfoRows(t.header.invoiceInfoRows);
                if (t.partner?.clientRows?.length) setClientRows(t.partner.clientRows);
                if (t.partner?.supplierRows?.length) setSupplierRows(t.partner.supplierRows);
                if (t.table) {
                    setTableCfg({
                        deductTaxFromAmounts: t.table.deductTaxFromAmounts ?? false,
                        showTableLines: t.table.showTableLines ?? true,
                        cellMargins: t.table.cellMargins ?? { top: 3, right: 5, bottom: 3, left: 5 },
                        columns: t.table.columns?.length ? t.table.columns : TABLE_COLS_DEFAULT,
                        footerRows: t.table.footerRows?.length ? t.table.footerRows : TABLE_FOOTER_DEFAULT,
                    });
                }
                if (t.footer?.notesRows?.length) setFooterRows(t.footer.notesRows);
                if (t.footer?.signatures?.length >= 3) {
                    setSigRows1(ensureRows(t.footer.signatures[0]?.rows));
                    setSigRows2(ensureRows(t.footer.signatures[1]?.rows));
                    setSigRows3(ensureRows(t.footer.signatures[2]?.rows));
                }
                // Branches
                const bl = branchRes.branches || branchRes || [];
                setBranches(Array.isArray(bl) ? bl : []);
                // Company data from user context
                setCompanyData({
                    name: user?.name || 'Company Name',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    register: user?.commercialRegister || user?.register || '20501683340',
                    tax_number: user?.taxNumber || user?.tax_number || '300545522455',
                });
            } catch { toast.error('فشل تحميل القالب'); }
            finally { setLoading(false); }
        })();
    }, [id, user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/templates/${id}`, {
                name, page, logo,
                header: { rows: headerRows, invoiceInfoRows, order: headerOrder, showBottomBorder },
                partner: { clientRows, supplierRows },
                table: tableCfg,
                footer: { notesRows: footerRows, signatures: [{ label: 'right', rows: sigRows1 }, { label: 'middle', rows: sigRows2 }, { label: 'left', rows: sigRows3 }] },
            });
            toast.success('تم الحفظ بنجاح');
        } catch { toast.error('فشل الحفظ'); }
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
            toast.success('تم رفع الشعار');
        } catch { toast.error('فشل الرفع'); }
    };

    const updateCol = (idx, f, v) => { const cols = [...tableCfg.columns]; cols[idx] = { ...cols[idx], [f]: v }; setTableCfg(c => ({ ...c, columns: cols })); };
    const updateFooterRow = (idx, f, v) => { const rows = [...tableCfg.footerRows]; rows[idx] = { ...rows[idx], [f]: v }; setTableCfg(c => ({ ...c, footerRows: rows })); };

    const pageDir = page.direction ?? 'rtl';

    if (loading) return <div className="flex items-center justify-center h-96 text-gray-500">جارٍ التحميل...</div>;

    // Build context for placeholder resolution
    const activeBranch = branches.find(b => b._id === selectedBranch) || branches[0] || {};
    const previewContext = {
        company: companyData,
        branch: {
            name: activeBranch.name || 'Main Branch',
            address_line_1: activeBranch.address1 || 'dammam',
            address_line_2: activeBranch.address2 || '',
            city: activeBranch.city || 'region',
        },
        partner: { name: 'عبدالعزيز بن ناصر الشهري', address: 'طريق الملك فهد الرياض' },
        invoice: { number: 'INV-25-1-000001', date: '2025-09-04' },
    };

    const templateData = { page, logo, header: { rows: headerRows, invoiceInfoRows, showBottomBorder }, partner: { clientRows, supplierRows }, table: tableCfg, footer: { notesRows: footerRows, signatures: [{ label: 'right', rows: sigRows1 }, { label: 'middle', rows: sigRows2 }, { label: 'left', rows: sigRows3 }] } };

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
                        <div><Label>Name</Label><input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} /></div>
                        <div><Label>Branches</Label>
                            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className={selectClass}>
                                <option value="">جميع الفروع</option>
                                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 'page':
                return (
                    <div className="space-y-5">
                        <div><Label>الاتجاه</Label><select value={page.direction} onChange={e => setPage(p => ({ ...p, direction: e.target.value }))} className={selectClass}><option value="rtl">من اليمين إلى اليسار</option><option value="ltr">من اليسار إلى اليمين</option></select></div>
                        <div><Label>حجم الصفحة</Label><select value={page.pageSize} onChange={e => setPage(p => ({ ...p, pageSize: e.target.value }))} className={selectClass}>{['A4', 'A5', 'Letter'].map(s => <option key={s}>{s}</option>)}</select></div>
                        <div><Label>حجم الخط</Label><div className="flex items-center border border-gray-300 rounded bg-white h-9 w-24"><input type="number" value={page.fontSize} min={6} max={72} onChange={e => setPage(p => ({ ...p, fontSize: +e.target.value }))} className="w-full text-center text-sm border-none outline-none bg-transparent" /></div></div>
                        <div><Label>الهوامش</Label><MarginsPopover margins={page.margins} onChange={m => setPage(p => ({ ...p, margins: m }))} /></div>
                    </div>
                );
            case 'logo':
                return (
                    <div className="space-y-4">
                        {logo.url ? (
                            <div className="space-y-2"><img src={logo.url} alt="" className="max-h-20 object-contain rounded border p-2" /><button onClick={() => setLogo(l => ({ ...l, url: '' }))} className="text-xs text-red-500">حذف</button></div>
                        ) : (
                            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400"><span className="text-sm text-gray-500">رفع شعار</span><input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label>
                        )}
                        <div><Label>الحجم</Label><input type="number" value={logo.size} min={10} max={500} onChange={e => setLogo(l => ({ ...l, size: +e.target.value }))} className={inputClass} /></div>
                    </div>
                );
            case 'header':
                return (
                    <div className="space-y-4">
                        <div><Label>Order</Label><select value={headerOrder} onChange={e => setHeaderOrder(e.target.value)} className={selectClass}><option>Logo, Company Info, Invoice Info</option><option>Company Info, Logo, Invoice Info</option><option>Logo, Invoice Info, Company Info</option></select></div>
                        <Toggle label="Show Bottom Border" checked={showBottomBorder} onChange={setShowBottomBorder} />
                        <TextBlockList rows={headerRows} setRows={setHeaderRows} dir={pageDir} title="Company Info" />
                        <div className="pt-3 border-t border-gray-100"><TextBlockList rows={invoiceInfoRows} setRows={setInvoiceInfoRows} dir={pageDir} title="Invoice Info" /></div>
                    </div>
                );
            case 'partner':
                return (
                    <div className="space-y-4">
                        <TextBlockList rows={clientRows} setRows={setClientRows} dir={pageDir} title="العميل / المورد" />
                    </div>
                );
            case 'table':
                return (
                    <div className="space-y-4">
                        <div className="flex gap-1">{subTabBtn('general', 'عام')}{subTabBtn('columns', 'الأعمدة')}{subTabBtn('table_footer', 'التذييل')}</div>
                        {tableSub === 'general' && (
                            <div className="space-y-2">
                                <Toggle label="خصم الضريبة من المبالغ" checked={tableCfg.deductTaxFromAmounts} onChange={v => setTableCfg(c => ({ ...c, deductTaxFromAmounts: v }))} />
                                <Toggle label="إظهار خطوط الجدول" checked={tableCfg.showTableLines} onChange={v => setTableCfg(c => ({ ...c, showTableLines: v }))} />
                                <div className="pt-2"><Label>هوامش الخلية</Label><MarginsPopover margins={tableCfg.cellMargins} onChange={m => setTableCfg(c => ({ ...c, cellMargins: m }))} /></div>
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
                        <TextBlockList rows={sigRows1} setRows={setSigRows1} dir={pageDir} title="التوقيع ١" />
                        <div className="border-t border-gray-100 pt-3"><TextBlockList rows={sigRows2} setRows={setSigRows2} dir={pageDir} title="التوقيع ٢" /></div>
                        <div className="border-t border-gray-100 pt-3"><TextBlockList rows={sigRows3} setRows={setSigRows3} dir={pageDir} title="التوقيع ٣" /></div>
                        <div className="border-t border-gray-100 pt-3"><TextBlockList rows={footerRows} setRows={setFooterRows} dir={pageDir} title="الملاحظات" /></div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <TemplateEditor
            breadcrumbs={[{ label: 'Template Designs', to: '/dashboard/templates' }, { label: 'Invoices', to: '/dashboard/templates/invoices' }, { label: 'Edit' }]}
            tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}
            tabContent={renderTab()}
            previewContent={<InvoicePreview template={templateData} direction={pageDir} context={previewContext} />}
            previewHeader={
                <div className="flex items-center gap-2 p-3">
                    <select value={prevModule} onChange={e => setPrevModule(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm bg-white flex-1">
                        <option>Sales</option><option>Purchases</option>
                    </select>
                    <select value={prevDocType} onChange={e => setPrevDocType(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm bg-white flex-1">
                        <option>Invoice</option><option>Return</option><option>Quote</option>
                    </select>
                    <input type="text" placeholder="" className="border border-gray-300 rounded px-3 py-2 text-sm bg-white w-24" />
                    <button className="bg-indigo-600 text-white px-5 py-2 rounded text-sm font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap">Preview</button>
                </div>
            }
            onSave={handleSave} saving={saving} backUrl="/dashboard/templates/invoices"
        />
    );
};

export default InvoiceTemplateEdit;
