import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api.js';
import toast from 'react-hot-toast';
import TemplateEditor from '../components/TemplateEditor.jsx';
import { TextBlockList } from '../components/TextBlock.jsx';
import MarginsPopover from '../components/MarginsPopover.jsx';
import { GeneralPreview } from '../components/DocumentPreview.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import branchService from '../../../services/branchService.js';

const TABS = [
    { id: 'design', label: 'Design' },
    { id: 'page', label: 'Page' },
    { id: 'logo', label: 'Logo' },
    { id: 'header', label: 'Header' },
    { id: 'content', label: 'Content' },
    { id: 'footer', label: 'Footer' },
];

const ensureRows = (rows) => (rows?.length ? rows : [{ text: '', format: {} }]);
const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-indigo-400";
const selectClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-indigo-400 appearance-none";
const Label = ({ children }) => <label className="block text-sm font-semibold text-gray-700 mb-1">{children}</label>;

const GeneralTemplateEdit = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('design');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [companyData, setCompanyData] = useState({});
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');

    const [name, setName] = useState('');
    const [page, setPage] = useState({ direction: 'rtl', pageSize: 'A4', fontSize: 12, margins: { top: 40, right: 40, bottom: 40, left: 40 } });
    const [logo, setLogo] = useState({ url: '', size: 70 });
    const [headerRows, setHeaderRows] = useState([
        { text: '{{company.name}}', format: { fontSize: 14, bold: true } },
        { text: 'السجل التجاري : {{company.register}}', format: { fontSize: 12 } },
        { text: 'الرقم الضريبي : {{company.tax_number}}', format: { fontSize: 12 } },
    ]);
    const [contentLang, setContentLang] = useState('ar');
    const [footerRows, setFooterRows] = useState([{ text: '', format: {} }]);
    const [sigRows1, setSigRows1] = useState([{ text: '', format: {} }]);
    const [sigRows2, setSigRows2] = useState([{ text: '', format: {} }]);
    const [sigRows3, setSigRows3] = useState([{ text: '', format: {} }]);

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
                if (t.header?.rows?.length) setHeaderRows(t.header.rows);
                setContentLang(t.content?.language ?? 'ar');
                if (t.footer?.notesRows?.length) setFooterRows(t.footer.notesRows);
                if (t.footer?.signatures?.length >= 3) {
                    setSigRows1(ensureRows(t.footer.signatures[0]?.rows));
                    setSigRows2(ensureRows(t.footer.signatures[1]?.rows));
                    setSigRows3(ensureRows(t.footer.signatures[2]?.rows));
                }
                const bl = branchRes.branches || branchRes || [];
                setBranches(Array.isArray(bl) ? bl : []);
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
                header: { rows: headerRows },
                content: { language: contentLang },
                footer: {
                    notesRows: footerRows,
                    signatures: [
                        { label: 'right', rows: sigRows1, imageUrl: '', imageSize: 100 },
                        { label: 'middle', rows: sigRows2, imageUrl: '', imageSize: 100 },
                        { label: 'left', rows: sigRows3, imageUrl: '', imageSize: 100 },
                    ],
                },
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

    const pageDir = page.direction ?? 'rtl';

    if (loading) return <div className="flex items-center justify-center h-96 text-gray-500">جارٍ التحميل...</div>;

    const activeBranch = branches.find(b => b._id === selectedBranch) || branches[0] || {};
    const previewContext = {
        company: companyData,
        branch: { name: activeBranch.name || '', address_line_1: activeBranch.address1 || '', city: activeBranch.city || '' },
    };

    const templateData = {
        page, logo,
        header: { rows: headerRows },
        footer: { signatures: [{ label: 'right', rows: sigRows1 }, { label: 'middle', rows: sigRows2 }, { label: 'left', rows: sigRows3 }] },
    };

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
                        <div><Label>حجم الصفحة</Label><select value={page.pageSize} onChange={e => setPage(p => ({ ...p, pageSize: e.target.value }))} className={selectClass}>{['A4', 'A5', 'Letter', 'Legal'].map(s => <option key={s}>{s}</option>)}</select></div>
                        <div><Label>حجم الخط</Label><div className="flex items-center border border-gray-300 rounded bg-white h-9 w-24"><input type="number" value={page.fontSize} min={6} max={72} onChange={e => setPage(p => ({ ...p, fontSize: +e.target.value }))} className="w-full text-center text-sm border-none outline-none bg-transparent" /></div></div>
                        <div><Label>الهوامش</Label><MarginsPopover margins={page.margins} onChange={m => setPage(p => ({ ...p, margins: m }))} /></div>
                        <div className="pt-3 border-t border-gray-100"><TextBlockList rows={headerRows} setRows={setHeaderRows} dir={pageDir} title="المقدمة" /></div>
                        <div className="pt-3 border-t border-gray-100"><TextBlockList rows={footerRows} setRows={setFooterRows} dir={pageDir} title="التذييل" /></div>
                    </div>
                );
            case 'logo':
                return (
                    <div className="space-y-4">
                        {logo.url ? (
                            <div className="space-y-2"><img src={logo.url} alt="" className="max-h-20 max-w-full object-contain rounded border border-gray-200 p-2" /><button onClick={() => setLogo(l => ({ ...l, url: '' }))} className="text-xs text-red-500">حذف</button></div>
                        ) : (
                            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400"><span className="text-sm text-gray-500">اضغط لرفع شعار</span><input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label>
                        )}
                        <div><Label>الحجم</Label><input type="number" value={logo.size} min={10} max={500} onChange={e => setLogo(l => ({ ...l, size: +e.target.value }))} className={inputClass} /></div>
                    </div>
                );
            case 'header':
                return <TextBlockList rows={headerRows} setRows={setHeaderRows} dir={pageDir} title="المقدمة" />;
            case 'content':
                return <div><Label>لغة المحتوى</Label><select value={contentLang} onChange={e => setContentLang(e.target.value)} className={selectClass}><option value="ar">العربية</option><option value="en">English</option></select></div>;
            case 'footer':
                return (
                    <div className="space-y-5">
                        <TextBlockList rows={sigRows1} setRows={setSigRows1} dir={pageDir} title="التوقيع ١" />
                        <div className="border-t border-gray-100 pt-3"><TextBlockList rows={sigRows2} setRows={setSigRows2} dir={pageDir} title="التوقيع ٢" /></div>
                        <div className="border-t border-gray-100 pt-3"><TextBlockList rows={sigRows3} setRows={setSigRows3} dir={pageDir} title="التوقيع ٣" /></div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <TemplateEditor
            breadcrumbs={[{ label: 'Template Designs', to: '/dashboard/templates' }, { label: 'General Templates', to: '/dashboard/templates/general' }, { label: 'Edit' }]}
            tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}
            tabContent={renderTab()}
            previewContent={<GeneralPreview template={templateData} direction={pageDir} context={previewContext} />}
            previewHeader={<div className="flex items-center gap-2 p-3"><button className="flex-1 bg-indigo-600 text-white py-2 rounded text-sm font-semibold hover:bg-indigo-700 transition-colors">Preview</button></div>}
            onSave={handleSave} saving={saving} backUrl="/dashboard/templates/general"
        />
    );
};

export default GeneralTemplateEdit;
