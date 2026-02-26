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
import { Upload, X } from 'lucide-react';

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

const SIG_POSITION_OPTIONS = [
    { value: 'afterNotes', label: 'After Notes' },
    { value: 'afterContent', label: 'After Content' },
    { value: 'bottomPage', label: 'Bottom of Page' },
];

/** Maps a branch DB record to the placeholder keys used in templates */
const buildBranchContext = (branch = {}) => ({
    name: branch.name || '',
    address_line_1: branch.address1 || '',
    address_line_2: branch.address2 || '',
    city: branch.city || '',
    region: branch.region || '',
    neighborhood: branch.neighborhood || '',
    postal_code: branch.postalCode || '',
    country: branch.country || '',
    phone: branch.phone || '',
    commercial_register: branch.commercialRegister || '',
});

/** Maps a company DB/auth record to placeholder keys */
const buildCompanyContext = (user = {}) => ({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    tax_number: user.taxNumber || user.tax_number || '',
    register: user.commercialRegister || user.register || '',
    currency: { ar: 'ر.س', en: 'SAR' },
});

const SignatureSection = ({ title, rows, setRows, dir, imageUrl, onImageUpload, onImageDelete, imageSize, setImageSize }) => (
    <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <TextBlockList rows={rows} setRows={setRows} dir={dir} />
        <div className="relative">
            {imageUrl ? (
                <div className="relative border border-gray-200 rounded-lg p-3 flex items-center justify-center bg-gray-50">
                    <img src={imageUrl} alt="" className="max-h-20 max-w-full object-contain" />
                    <button
                        type="button"
                        onClick={onImageDelete}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                        title="Remove image"
                    >
                        <X size={12} />
                    </button>
                </div>
            ) : (
                <label className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 transition-colors">
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                        <Upload size={20} />
                        <span className="text-xs">Upload files or drag and drop here</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
                </label>
            )}
        </div>
        <div>
            <Label>Image Size</Label>
            <input type="number" value={imageSize} min={10} max={500} onChange={e => setImageSize(+e.target.value)}
                className={inputClass} style={{ width: '100px' }} />
        </div>
    </div>
);

const GeneralTemplateEdit = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('design');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');

    const [name, setName] = useState('');
    const [page, setPage] = useState({ direction: 'rtl', pageSize: 'A4', fontSize: 12, margins: { top: 40, right: 40, bottom: 40, left: 40 } });
    const [logo, setLogo] = useState({ url: '', size: 70 });

    // Header tab rows (Company Info TextBlocks)
    const [headerRows, setHeaderRows] = useState([
        { text: '{{company.name}}', format: { fontSize: 14, bold: true } },
        { text: 'السجل التجاري : {{company.register}}', format: { fontSize: 12 } },
        { text: 'الرقم الضريبي : {{company.tax_number}}', format: { fontSize: 12 } },
        { text: '{{branch.address_line_1}}', format: { fontSize: 11 } },
        { text: '{{branch.city}}', format: { fontSize: 11 } },
    ]);

    // Page tab inline header/footer blocks
    const [pageHeaderRows, setPageHeaderRows] = useState([{ text: '', format: {} }]);
    const [pageFooterRows, setPageFooterRows] = useState([{ text: '', format: {} }]);

    // Content
    const [contentLang, setContentLang] = useState('ar');

    // Footer
    const [sigPosition, setSigPosition] = useState('afterNotes');
    const [sigRows1, setSigRows1] = useState([{ text: 'المحاسب', format: { fontSize: 12 } }]);
    const [sig1ImageUrl, setSig1ImageUrl] = useState('');
    const [sig1ImageSize, setSig1ImageSize] = useState(100);
    const [sigRows2, setSigRows2] = useState([{ text: '', format: {} }]);
    const [sig2ImageUrl, setSig2ImageUrl] = useState('');
    const [sig2ImageSize, setSig2ImageSize] = useState(100);
    const [sigRows3, setSigRows3] = useState([{ text: 'المدير', format: { fontSize: 12 } }]);
    const [sig3ImageUrl, setSig3ImageUrl] = useState('');
    const [sig3ImageSize, setSig3ImageSize] = useState(100);

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
                if (t.page?.headerRows?.length) setPageHeaderRows(t.page.headerRows);
                if (t.page?.footerRows?.length) setPageFooterRows(t.page.footerRows);
                setContentLang(t.content?.language ?? 'ar');
                setSigPosition(t.footer?.signaturePosition ?? 'afterNotes');
                if (t.footer?.signatures?.length >= 1) {
                    const s0 = t.footer.signatures[0] || {};
                    setSigRows1(ensureRows(s0.rows)); setSig1ImageUrl(s0.imageUrl || ''); setSig1ImageSize(s0.imageSize || 100);
                }
                if (t.footer?.signatures?.length >= 2) {
                    const s1 = t.footer.signatures[1] || {};
                    setSigRows2(ensureRows(s1.rows)); setSig2ImageUrl(s1.imageUrl || ''); setSig2ImageSize(s1.imageSize || 100);
                }
                if (t.footer?.signatures?.length >= 3) {
                    const s2 = t.footer.signatures[2] || {};
                    setSigRows3(ensureRows(s2.rows)); setSig3ImageUrl(s2.imageUrl || ''); setSig3ImageSize(s2.imageSize || 100);
                }
                const bl = branchRes.branches || branchRes || [];
                setBranches(Array.isArray(bl) ? bl : []);
                // Auto-select first branch
                if (Array.isArray(bl) && bl.length > 0) setSelectedBranch(bl[0]._id);
            } catch { toast.error('فشل تحميل القالب'); }
            finally { setLoading(false); }
        })();
    }, [id, user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/templates/${id}`, {
                name,
                page: { ...page, headerRows: pageHeaderRows, footerRows: pageFooterRows },
                logo,
                header: { rows: headerRows },
                content: { language: contentLang },
                footer: {
                    signaturePosition: sigPosition,
                    signatures: [
                        { label: 'left', rows: sigRows1, imageUrl: sig1ImageUrl, imageSize: sig1ImageSize },
                        { label: 'middle', rows: sigRows2, imageUrl: sig2ImageUrl, imageSize: sig2ImageSize },
                        { label: 'right', rows: sigRows3, imageUrl: sig3ImageUrl, imageSize: sig3ImageSize },
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

    // Signature image upload handler - reads as base64 for local preview
    const handleSigImageUpload = (setter) => async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setter(reader.result);
        reader.readAsDataURL(file);
    };

    const pageDir = page.direction ?? 'rtl';

    if (loading) return <div className="flex items-center justify-center h-96 text-gray-500">جارٍ التحميل...</div>;

    const activeBranch = branches.find(b => b._id === selectedBranch) || branches[0] || {};
    const previewContext = {
        company: buildCompanyContext(user),
        branch: buildBranchContext(activeBranch),
    };

    const templateData = {
        page: { ...page, headerRows: pageHeaderRows, footerRows: pageFooterRows },
        logo,
        header: { rows: headerRows },
        footer: {
            signaturePosition: sigPosition,
            signatures: [
                { label: 'left', rows: sigRows1, imageUrl: sig1ImageUrl, imageSize: sig1ImageSize },
                { label: 'middle', rows: sigRows2, imageUrl: sig2ImageUrl, imageSize: sig2ImageSize },
                { label: 'right', rows: sigRows3, imageUrl: sig3ImageUrl, imageSize: sig3ImageSize },
            ],
        },
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
                        <div><Label>Direction</Label><select value={page.direction} onChange={e => setPage(p => ({ ...p, direction: e.target.value }))} className={selectClass}><option value="rtl">Right to Left</option><option value="ltr">Left to Right</option></select></div>
                        <div><Label>Page Size</Label><select value={page.pageSize} onChange={e => setPage(p => ({ ...p, pageSize: e.target.value }))} className={selectClass}>{['A4', 'A5', 'Letter', 'Legal'].map(s => <option key={s}>{s}</option>)}</select></div>
                        <div><Label>Font Size</Label><input type="number" value={page.fontSize} min={6} max={72} onChange={e => setPage(p => ({ ...p, fontSize: +e.target.value }))} className={inputClass} style={{ width: '100px' }} /></div>
                        <div><Label>Margins</Label><MarginsPopover margins={page.margins} onChange={m => setPage(p => ({ ...p, margins: m }))} /></div>
                        <div className="border-t border-gray-200 pt-4">
                            <TextBlockList rows={pageHeaderRows} setRows={setPageHeaderRows} dir={pageDir} title="Header" />
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                            <TextBlockList rows={pageFooterRows} setRows={setPageFooterRows} dir={pageDir} title="Footer" />
                        </div>
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
                            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors">
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <Upload size={28} />
                                    <span className="text-sm">Upload files or drag and drop here</span>
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            </label>
                        )}
                        <div><Label>Size</Label><input type="number" value={logo.size} min={10} max={500} onChange={e => setLogo(l => ({ ...l, size: +e.target.value }))} className={inputClass} style={{ width: '100px' }} /></div>
                    </div>
                );
            case 'header':
                return <TextBlockList rows={headerRows} setRows={setHeaderRows} dir={pageDir} title="Company Info" />;
            case 'content':
                return (
                    <div>
                        <Label>Content Locale</Label>
                        <select value={contentLang} onChange={e => setContentLang(e.target.value)} className={selectClass}>
                            <option value="ar">Arabic</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                );
            case 'footer':
                return (
                    <div className="space-y-6">
                        <div>
                            <Label>Signature Position</Label>
                            <select value={sigPosition} onChange={e => setSigPosition(e.target.value)} className={selectClass}>
                                {SIG_POSITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                            <SignatureSection title="Left Signature" rows={sigRows1} setRows={setSigRows1} dir={pageDir}
                                imageUrl={sig1ImageUrl} onImageUpload={handleSigImageUpload(setSig1ImageUrl)}
                                onImageDelete={() => setSig1ImageUrl('')}
                                imageSize={sig1ImageSize} setImageSize={setSig1ImageSize} />
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                            <SignatureSection title="Middle Signature" rows={sigRows2} setRows={setSigRows2} dir={pageDir}
                                imageUrl={sig2ImageUrl} onImageUpload={handleSigImageUpload(setSig2ImageUrl)}
                                onImageDelete={() => setSig2ImageUrl('')}
                                imageSize={sig2ImageSize} setImageSize={setSig2ImageSize} />
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                            <SignatureSection title="Right Signature" rows={sigRows3} setRows={setSigRows3} dir={pageDir}
                                imageUrl={sig3ImageUrl} onImageUpload={handleSigImageUpload(setSig3ImageUrl)}
                                onImageDelete={() => setSig3ImageUrl('')}
                                imageSize={sig3ImageSize} setImageSize={setSig3ImageSize} />
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <TemplateEditor
            breadcrumbs={[{ label: 'Template Designs', to: '/dashboard/templates' }, { label: 'General', to: '/dashboard/templates/general' }, { label: 'Edit' }]}
            tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}
            tabContent={renderTab()}
            previewContent={<GeneralPreview template={templateData} direction={pageDir} context={previewContext} />}
            previewHeader={<div className="flex items-center gap-2 p-3"><button className="flex-1 bg-indigo-600 text-white py-2 rounded text-sm font-semibold hover:bg-indigo-700 transition-colors">Preview</button></div>}
            onSave={handleSave} saving={saving} backUrl="/dashboard/templates/general"
        />
    );
};

export default GeneralTemplateEdit;
