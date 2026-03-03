import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api.js';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import TemplateEditor from '../components/TemplateEditor.jsx';
import { TextBlockList } from '../components/TextBlock.jsx';
import MarginsPopover from '../components/MarginsPopover.jsx';
import { LabelPreview } from '../components/DocumentPreview.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import branchService from '../../../services/branchService.js';

const getTabs = (t) => [
    { id: 'design', label: t('Design', 'التصميم') },
    { id: 'label', label: t('Label', 'الملصق') },
    { id: 'content', label: t('Content', 'المحتوى') },
];

const DEFAULT_CONTENT_ROWS = [
    { text: '{{product.name}}', format: { fontSize: 10 } },
    { text: '{{barcode_image}}', format: { fontSize: 10 } },
    { text: '{{barcode_text}}', format: { fontSize: 8 } },
    { text: '{{price}} {{company.currency.ar}}', format: { fontSize: 10 } },
    { text: '{{quantity}}', format: { fontSize: 8 } },
];

const ensureRows = (rows) => (rows?.length ? rows : DEFAULT_CONTENT_ROWS);
const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-indigo-400";
const selectClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-indigo-400 appearance-none";
const Label = ({ children }) => <label className="block text-sm font-semibold text-gray-700 mb-1">{children}</label>;

const ProductLabelEdit = () => {
    const { id } = useParams();
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('design');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');

    const [name, setName] = useState('');
    const [direction, setDirection] = useState('rtl');
    const [width, setWidth] = useState(40);
    const [height, setHeight] = useState(22);
    const [fontSize, setFontSize] = useState(10);
    const [margins, setMargins] = useState({ top: 2, right: 3, bottom: 2, left: 3 });
    const [contentRows, setContentRows] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const [tmplRes, branchRes] = await Promise.all([
                    api.get(`/templates/${id}`),
                    branchService.getAllBranches().catch(() => ({ branches: [] })),
                ]);
                const t = tmplRes.data.template;
                setName(t.name ?? '');
                setDirection(t.page?.direction ?? 'rtl');
                setWidth(t.label?.width ?? 40);
                setHeight(t.label?.height ?? 22);
                setFontSize(t.page?.fontSize ?? 10);
                setMargins(t.page?.margins ?? { top: 2, right: 3, bottom: 2, left: 3 });
                setContentRows(ensureRows(t.label?.contentRows));
                const bl = branchRes.branches || branchRes || [];
                setBranches(Array.isArray(bl) ? bl : []);
            } catch { toast.error(t('Failed to load template', 'فشل تحميل القالب')); }
            finally { setLoading(false); }
        })();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/templates/${id}`, { name, page: { direction, fontSize, margins }, label: { width, height, contentRows } });
            toast.success(t('Saved successfully', 'تم الحفظ'));
        } catch { toast.error(t('Failed to save', 'فشل الحفظ')); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-96 text-gray-500">{t('Loading...', 'جارٍ التحميل...')}</div>;

    const previewContext = {
        company: { name: user?.name || 'Company', register: user?.commercialRegister || '', currency: { ar: 'ر.س', en: 'SAR' } },
        product: { name: 'قلم رصاص خشبي' },
        price: '2.00',
        barcode_image: '||||||||||||||||',
        barcode_text: '6281234567890',
        quantity: '10',
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'design': return (
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
            case 'label': return (
                <div className="space-y-5">
                    <div><Label>{t('Direction', 'الاتجاه')}</Label><select value={direction} onChange={e => setDirection(e.target.value)} className={selectClass}><option value="rtl">{t('Right to Left', 'من اليمين إلى اليسار')}</option><option value="ltr">{t('Left to Right', 'من اليسار إلى اليمين')}</option></select></div>
                    <div><Label>{t('Width', 'العرض')}</Label><div className="flex items-center gap-2"><input type="number" value={width} min={5} max={500} onChange={e => setWidth(+e.target.value)} className={inputClass} style={{ width: '100px' }} /><span className="text-xs text-gray-400">{t('mm', 'ملم')}</span></div></div>
                    <div><Label>{t('Height', 'الارتفاع')}</Label><div className="flex items-center gap-2"><input type="number" value={height} min={5} max={500} onChange={e => setHeight(+e.target.value)} className={inputClass} style={{ width: '100px' }} /><span className="text-xs text-gray-400">{t('mm', 'ملم')}</span></div></div>
                    <div><Label>{t('Font Size', 'حجم الخط')}</Label><input type="number" value={fontSize} min={4} max={48} onChange={e => setFontSize(+e.target.value)} className={inputClass} style={{ width: '100px' }} /></div>
                    <div><Label>{t('Margins', 'الهوامش')}</Label><MarginsPopover margins={margins} onChange={setMargins} /></div>
                </div>
            );
            case 'content': return <TextBlockList rows={contentRows} setRows={setContentRows} dir={direction} title={t('Label Content', 'محتوى الملصق')} />;
            default: return null;
        }
    };

    return (
        <TemplateEditor
            breadcrumbs={[{ label: t('Template Designs', 'تصاميم القوالب'), to: '/dashboard/templates' }, { label: t('Product Labels', 'ملصقات المنتجات'), to: '/dashboard/templates/product-labels' }, { label: t('Edit', 'تعديل') }]}
            tabs={getTabs(t)} activeTab={activeTab} onTabChange={setActiveTab}
            tabContent={renderTab()}
            previewContent={<LabelPreview width={width} height={height} direction={direction} rows={contentRows} fontSize={fontSize} margins={margins} context={previewContext} />}
            previewHeader={<div className="flex items-center gap-2 p-3"><button className="flex-1 bg-indigo-600 text-white py-2 rounded text-sm font-semibold hover:bg-indigo-700 transition-colors">{t('Preview', 'معاينة')}</button></div>}
            onSave={handleSave} saving={saving} backUrl="/dashboard/templates/product-labels"
        />
    );
};

export default ProductLabelEdit;
