import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api.js';
import toast from 'react-hot-toast';
import TemplateEditor from '../components/TemplateEditor.jsx';
import { TextBlockList } from '../components/TextBlock.jsx';
import MarginsPopover from '../components/MarginsPopover.jsx';
import { LabelPreview } from '../components/DocumentPreview.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

const TABS = [
    { id: 'design', label: 'Design' },
    { id: 'label', label: 'Label' },
    { id: 'content', label: 'Content' },
];

const ensureRows = (rows) => (rows?.length ? rows : [{ text: '{{product.name}}', format: { fontSize: 10 } }, { text: '{{barcode_image}}', format: { fontSize: 10 } }, { text: '{{price}}', format: { fontSize: 10 } }]);
const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-indigo-400";
const selectClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-indigo-400 appearance-none";
const Label = ({ children }) => <label className="block text-sm font-semibold text-gray-700 mb-1">{children}</label>;

const ProductLabelEdit = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('design');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

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
                const { data } = await api.get(`/templates/${id}`);
                const t = data.template;
                setName(t.name ?? '');
                setDirection(t.page?.direction ?? 'rtl');
                setWidth(t.label?.width ?? 40);
                setHeight(t.label?.height ?? 22);
                setFontSize(t.page?.fontSize ?? 10);
                setMargins(t.page?.margins ?? { top: 2, right: 3, bottom: 2, left: 3 });
                setContentRows(ensureRows(t.label?.contentRows));
            } catch { toast.error('فشل تحميل القالب'); }
            finally { setLoading(false); }
        })();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/templates/${id}`, { name, page: { direction, fontSize, margins }, label: { width, height, contentRows } });
            toast.success('تم الحفظ');
        } catch { toast.error('فشل الحفظ'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-96 text-gray-500">جارٍ التحميل...</div>;

    const previewContext = {
        company: { name: user?.name || 'Company', register: user?.commercialRegister || '' },
        product: { name: 'قلم رصاص خشبي' },
        price: '2.00 ر.س',
        barcode_image: '||||||||||||',
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'design': return <div><Label>Name</Label><input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} /></div>;
            case 'label': return (
                <div className="space-y-5">
                    <div><Label>الاتجاه</Label><select value={direction} onChange={e => setDirection(e.target.value)} className={selectClass}><option value="rtl">RTL</option><option value="ltr">LTR</option></select></div>
                    <div><Label>العرض (ملم)</Label><input type="number" value={width} min={5} max={500} onChange={e => setWidth(+e.target.value)} className={inputClass} /></div>
                    <div><Label>الارتفاع (ملم)</Label><input type="number" value={height} min={5} max={500} onChange={e => setHeight(+e.target.value)} className={inputClass} /></div>
                    <div><Label>حجم الخط</Label><input type="number" value={fontSize} min={4} max={48} onChange={e => setFontSize(+e.target.value)} className={inputClass} /></div>
                    <div><Label>الهوامش</Label><MarginsPopover margins={margins} onChange={setMargins} /></div>
                </div>
            );
            case 'content': return <TextBlockList rows={contentRows} setRows={setContentRows} dir={direction} title="محتوى الملصق" />;
            default: return null;
        }
    };

    return (
        <TemplateEditor
            breadcrumbs={[{ label: 'Template Designs', to: '/dashboard/templates' }, { label: 'Product Labels', to: '/dashboard/templates/product-labels' }, { label: 'Edit' }]}
            tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}
            tabContent={renderTab()}
            previewContent={<LabelPreview width={width} height={height} direction={direction} rows={contentRows} fontSize={fontSize} margins={margins} context={previewContext} />}
            previewHeader={<div className="flex items-center gap-2 p-3"><button className="flex-1 bg-indigo-600 text-white py-2 rounded text-sm font-semibold hover:bg-indigo-700">Preview</button></div>}
            onSave={handleSave} saving={saving} backUrl="/dashboard/templates/product-labels"
        />
    );
};

export default ProductLabelEdit;
