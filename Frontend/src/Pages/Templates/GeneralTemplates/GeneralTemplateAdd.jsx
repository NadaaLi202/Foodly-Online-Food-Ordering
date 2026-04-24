import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ChevronLeft } from 'lucide-react';
import api from '../../../services/api.js';
import branchService from '../../../services/branchservice.js';
import toast from 'react-hot-toast';

const GeneralTemplateAdd = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.language === 'ar';

    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState('general-1');
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('ar');
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

    const templateOptions = [
        { id: 'general-1', label: t('General Template 1', 'قالب عام 1') },
    ];

    const languageOptions = [
        { id: 'ar', label: t('Arabic', 'العربية'), desc: t('The document will be in Arabic.', 'سيكون المستند باللغة العربية.') },
        { id: 'en', label: t('English', 'الإنجليزية'), desc: t('The document will be in English.', 'سيكون المستند باللغة الإنجليزية.') },
        { id: 'ar-en', label: t('Arabic and English', 'العربية والإنجليزية'), desc: t('The document will be in Arabic and English.', 'سيكون المستند باللغة العربية والإنجليزية.') },
    ];

    const handleNext = () => {
        setErrors({});
        setStep(s => s + 1);
    };

    const handleBack = () => {
        setErrors({});
        setStep(s => s - 1);
    };

    const handleSave = async () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = t('Please enter the name', 'من فضلك أدخل الاسم');
        if (selectedBranches.length === 0) newErrors.branches = t('Please select at least one branch', 'من فضلك اختر فرع واحد على الأقل');
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSaving(true);
        try {
            const direction = language === 'en' ? 'ltr' : 'rtl';
            const { data } = await api.post('/templates', {
                name: name.trim(),
                type: 'general',
                page: { direction },
                branches: selectedBranches,
            });
            toast.success(t('Template created successfully', 'تم إنشاء القالب بنجاح'));
            navigate(`/dashboard/templates/general/${data.template._id}/edit`);
        } catch {
            toast.error(t('Failed to create template', 'فشل إنشاء القالب'));
        } finally {
            setSaving(false);
        }
    };

    const toggleBranch = (id) => {
        setSelectedBranches(prev =>
            prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
        );
        setErrors(e => ({ ...e, branches: undefined }));
    };

    /* ── Breadcrumbs ─────────────────────────────────────────────── */

    /* ── Step 1: Select template ──────────────────────────────────── */
    const Step1 = () => (
        <div className="px-6 py-4 max-w-3xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <h2 className="text-lg font-bold text-gray-800 mb-5">{t('Choose Template', 'اختر القالب')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {templateOptions.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setSelectedTemplate(opt.id)}
                        className={`p-5 rounded-lg border-2 text-right transition-all ${selectedTemplate === opt.id
                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                    >
                        <span className="text-sm font-bold text-gray-800">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    /* ── Step 2: Name, Language, Branches ─────────────────────────── */
    const Step2 = () => (
        <div className="px-6 py-4 max-w-xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Name */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('Name', 'الاسم')} <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); setErrors(er => ({ ...er, name: undefined })); }}
                    className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                        }`}
                    placeholder={t('Enter template name', 'أدخل اسم القالب')}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
            </div>

            {/* Language */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('Initial Design', 'التصميم الأولي')} <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                    {languageOptions.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setLanguage(opt.id)}
                            className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-right ${language === opt.id
                                ? 'border-indigo-400 bg-indigo-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${language === opt.id ? 'border-indigo-500' : 'border-gray-300'
                                }`}>
                                {language === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                            </div>
                            <div>
                                <span className="text-sm font-bold text-gray-800">{opt.label}</span>
                                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Branches */}
            <div className="mb-6 relative">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('Branches', 'الفروع')} <span className="text-red-500">*</span>
                </label>
                <button
                    type="button"
                    onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm text-right transition ${errors.branches ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                        }`}
                >
                    <span className={selectedBranches.length > 0 ? 'text-gray-800' : 'text-gray-400'}>
                        {selectedBranches.length > 0
                            ? branches.filter(b => selectedBranches.includes(b._id)).map(b => b.name).join(', ')
                            : t('Choose branches', 'اختر الفروع')}
                    </span>
                    <ChevronLeft size={14} className={`text-gray-400 transition-transform ${branchDropdownOpen ? 'rotate-90' : '-rotate-90'}`} />
                </button>
                {branchDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {branches.map(branch => (
                            <button
                                key={branch._id}
                                type="button"
                                onClick={() => toggleBranch(branch._id)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-right text-sm text-gray-700 transition-colors"
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedBranches.includes(branch._id) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
                                    }`}>
                                    {selectedBranches.includes(branch._id) && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    )}
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
    );

    /* ── Wizard footer ───────────────────────────────────────────── */
    const WizardFooter = () => (
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 bg-white" dir={isRtl ? 'rtl' : 'ltr'}>
            {step > 1 ? (
                <button onClick={handleBack} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                    {t('Previous', 'السابق')}
                </button>
            ) : (
                <Link to="/dashboard/templates/general" className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                    {t('Cancel', 'إلغاء')}
                </Link>
            )}

            {step < 2 ? (
                <button onClick={handleNext} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors">
                    {t('Next', 'التالي')}
                </button>
            ) : (
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors"
                >
                    {saving ? t('Saving...', 'جارٍ الحفظ...') : t('Save', 'حفظ')}
                </button>
            )}
        </div>
    );

    /* ── Main render ──────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-[#f5f7f9] flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex-1 flex flex-col">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-4 py-4">
                    {[1, 2].map(s => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {s}
                            </div>
                            <span className={`text-sm font-medium ${step >= s ? 'text-indigo-600' : 'text-gray-400'}`}>
                                {s === 1 ? t('Choose Template', 'اختيار القالب') : t('Basic Details', 'البيانات الأساسية')}
                            </span>
                            {s < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
                        </div>
                    ))}
                </div>

                {/* Step content */}
                <div className="flex-1 bg-white mx-4 mb-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        {step === 1 && <Step1 />}
                        {step === 2 && <Step2 />}
                    </div>
                    <WizardFooter />
                </div>
            </div>
        </div>
    );
};

export default GeneralTemplateAdd;
