import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ChevronLeft } from 'lucide-react';
import api from '../../../services/api.js';
import branchService from '../../../services/branchService.js';
import toast from 'react-hot-toast';

const ProductLabelAdd = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.language === 'ar';

    const [name, setName] = useState('');
    const [branches, setBranches] = useState([]);
    const [selectedBranches, setSelectedBranches] = useState([]);
    const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        branchService.getAllBranches()
            .then(data => setBranches(data.branches || []))
            .catch(() => setBranches([]));
    }, []);

    const toggleBranch = (id) => {
        setSelectedBranches(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
        setErrors(e => ({ ...e, branches: undefined }));
    };

    const handleSave = async () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = t('Please enter the name', 'من فضلك أدخل الاسم');
        if (selectedBranches.length === 0) newErrors.branches = t('Please select at least one branch', 'من فضلك اختر فرع واحد على الأقل');
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        setSaving(true);
        try {
            const { data } = await api.post('/templates', {
                name: name.trim(),
                type: 'product-label',
                branches: selectedBranches,
            });
            toast.success(t('Label created successfully', 'تم إنشاء الملصق بنجاح'));
            navigate(`/dashboard/templates/product-labels/${data.template._id}/edit`);
        } catch { toast.error(t('Failed to create label', 'فشل إنشاء الملصق')); }
        finally { setSaving(false); }
    };

    return (
        <div className="min-h-screen bg-[#f5f7f9] flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Breadcrumbs */}
            {/* <div className="flex items-center gap-1 mb-6 px-4 pt-4">
                <Link to="/dashboard" className="flex items-center justify-center w-9 h-9 rounded bg-white border border-gray-200 hover:bg-gray-50 shadow-sm">
                    <Home size={16} className="text-gray-500" />
                </Link>
                <ChevronLeft size={14} className="text-gray-300 mx-1" />
                <Link to="/dashboard/templates" className="px-3 h-9 flex items-center rounded bg-white border border-gray-200 hover:bg-gray-50 text-sm text-gray-600 shadow-sm">تصاميم القوالب</Link>
                <ChevronLeft size={14} className="text-gray-300 mx-1" />
                <Link to="/dashboard/templates/product-labels" className="px-3 h-9 flex items-center rounded bg-white border border-gray-200 hover:bg-gray-50 text-sm text-gray-600 shadow-sm">ملصقات المنتجات</Link>
                <ChevronLeft size={14} className="text-gray-300 mx-1" />
                <span className="px-3 h-9 flex items-center rounded bg-white border border-gray-200 text-sm font-semibold text-gray-800 shadow-sm">إضافة</span>
            </div> */}

            {/* Form */}
            <div className="flex-1 flex flex-col">
                <div className="bg-white mx-4 mb-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                    <div className="px-6 py-6 max-w-xl mx-auto w-full">
                        {/* Name */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">{t('Name', 'الاسم')} <span className="text-red-500">*</span></label>
                            <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(er => ({ ...er, name: undefined })); }}
                                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}
                                placeholder={t('Enter label name', 'أدخل اسم الملصق')} />
                            {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                        </div>

                        {/* Branches */}
                        <div className="mb-6 relative">
                            <label className="block text-sm font-bold text-gray-700 mb-2">{t('Branches', 'الفروع')} <span className="text-red-500">*</span></label>
                            <button type="button" onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                                className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm text-right transition ${errors.branches ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}>
                                <span className={selectedBranches.length > 0 ? 'text-gray-800' : 'text-gray-400'}>
                                    {selectedBranches.length > 0 ? branches.filter(b => selectedBranches.includes(b._id)).map(b => b.name).join(', ') : t('Select Branches', 'اختر الفروع')}
                                </span>
                                <ChevronLeft size={14} className={`text-gray-400 transition-transform ${branchDropdownOpen ? 'rotate-90' : '-rotate-90'}`} />
                            </button>
                            {branchDropdownOpen && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {branches.map(branch => (
                                        <button key={branch._id} type="button" onClick={() => toggleBranch(branch._id)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-right text-sm text-gray-700 transition-colors">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedBranches.includes(branch._id) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                                                {selectedBranches.includes(branch._id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            {branch.name}
                                        </button>
                                    ))}
                                    {branches.length === 0 && <p className="px-4 py-3 text-sm text-gray-400 text-center">{t('No branches found', 'لا توجد فروع')}</p>}
                                </div>
                            )}
                            {errors.branches && <p className="text-red-500 text-xs mt-1 font-medium">{errors.branches}</p>}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 bg-white rounded-b-lg">
                        <Link to="/dashboard/templates/product-labels" className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">{t('Cancel', 'إلغاء')}</Link>
                        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">
                            {saving ? t('Saving...', 'جارٍ الحفظ...') : t('Save', 'حفظ')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductLabelAdd;
