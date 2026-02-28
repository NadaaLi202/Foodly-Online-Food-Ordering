import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RefreshCw, Home, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api.js';
import toast from 'react-hot-toast';

const InvoiceTemplates = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.language === 'ar';
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenu, setOpenMenu] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/templates?type=invoice');
            setTemplates(data.templates ?? []);
        } catch { toast.error('فشل تحميل القوالب'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const handleAdd = () => {
        navigate('/dashboard/templates/invoices/add');
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation(); setOpenMenu(null);
        if (!window.confirm('هل أنت متأكد من حذف هذا القالب؟')) return;
        try { await api.delete(`/templates/${id}`); setTemplates(t => t.filter(x => x._id !== id)); toast.success('تم الحذف'); }
        catch { toast.error('فشل الحذف'); }
    };

    return (
        <div className="min-h-screen bg-[#f5f7f9]" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between px-4 py-3">
                <button onClick={handleAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded transition-colors">
                    <Plus size={16} /> إضافة
                </button>
                <div className="flex items-center gap-1">
                    <Link to="/dashboard" className="flex items-center justify-center w-9 h-9 rounded bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"><Home size={16} className="text-gray-500" /></Link>
                    <Link to="/dashboard/templates" className="px-3 h-9 flex items-center rounded bg-white border border-gray-200 hover:bg-gray-50 text-sm text-gray-600 shadow-sm">تصاميم القوالب</Link>
                    <span className="px-3 h-9 flex items-center rounded bg-white border border-gray-200 text-sm font-semibold text-gray-800 shadow-sm">قوالب الفواتير</span>
                    <button onClick={load} className="flex items-center justify-center w-9 h-9 rounded bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"><RefreshCw size={15} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} /></button>
                </div>
            </div>
            <div className="px-4">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full">
                        <thead><tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-4 py-3 text-start text-sm font-bold text-gray-700">الاسم</th>
                            <th className="px-4 py-3 text-start text-sm font-bold text-gray-700">القالب</th>
                            <th className="px-4 py-3 w-10" />
                        </tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">جارٍ التحميل...</td></tr>
                                : templates.length === 0 ? <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">لا توجد قوالب</td></tr>
                                    : templates.map(tpl => (
                                        <tr key={tpl._id} onClick={() => navigate(`/dashboard/templates/invoices/${tpl._id}/edit`)} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">{tpl.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{tpl.designId ? `Invoice Template ${tpl.designId.replace('design-', '')}` : 'Invoice Template 1'}</td>
                                            <td className="px-4 py-3 relative" onClick={e => e.stopPropagation()} ref={openMenu === tpl._id ? menuRef : null}>
                                                <button onClick={() => setOpenMenu(openMenu === tpl._id ? null : tpl._id)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"><MoreVertical size={18} /></button>
                                                {openMenu === tpl._id && (
                                                    <div className={`absolute top-full mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg z-30 overflow-hidden ${isRtl ? 'left-0' : 'right-0'}`}>
                                                        <Link to={`/dashboard/templates/invoices/${tpl._id}/edit`} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Pencil size={14} className="text-gray-400" /> تعديل</Link>
                                                        <button onClick={e => handleDelete(tpl._id, e)} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> حذف</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default InvoiceTemplates;
