import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, RefreshCw, X, Home, MoreVertical, Building2 } from 'lucide-react';

const countries = [
    { code: 'EG', name_ar: 'جمهورية مصر العربية', name_en: 'Egypt' },
    { code: 'SA', name_ar: 'المملكة العربية السعودية', name_en: 'Saudi Arabia' },
    { code: 'AE', name_ar: 'الإمارات العربية المتحدة', name_en: 'United Arab Emirates' },
    { code: 'KW', name_ar: 'الكويت', name_en: 'Kuwait' },
    { code: 'QA', name_ar: 'قطر', name_en: 'Qatar' },
    { code: 'BH', name_ar: 'البحرين', name_en: 'Bahrain' },
    { code: 'OM', name_ar: 'عمان', name_en: 'Oman' },
    { code: 'JO', name_ar: 'الأردن', name_en: 'Jordan' },
    { code: 'LB', name_ar: 'لبنان', name_en: 'Lebanon' },
    { code: 'SY', name_ar: 'سوريا', name_en: 'Syria' },
    { code: 'IQ', name_ar: 'العراق', name_en: 'Iraq' },
    { code: 'YE', name_ar: 'اليمن', name_en: 'Yemen' },
    { code: 'LY', name_ar: 'ليبيا', name_en: 'Libya' },
    { code: 'SD', name_ar: 'السودان', name_en: 'Sudan' },
    { code: 'MA', name_ar: 'المغرب', name_en: 'Morocco' },
    { code: 'DZ', name_ar: 'الجزائر', name_en: 'Algeria' },
    { code: 'TN', name_ar: 'تونس', name_en: 'Tunisia' },
    { code: 'MR', name_ar: 'موريتانيا', name_en: 'Mauritania' },
    { code: 'SO', name_ar: 'الصومال', name_en: 'Somalia' },
    { code: 'DJ', name_ar: 'جيبوتي', name_en: 'Djibouti' },
    { code: 'KM', name_ar: 'جزر القمر', name_en: 'Comoros' },
    { code: 'PS', name_ar: 'فلسطين', name_en: 'Palestine' },
    // Add more if needed, but this covers Arab countries which are most likely
];

const Branches = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState([]);

    const [branches, setBranches] = useState([
        {
            id: 1,
            name: t('branches_page.main_branch'),
            activity: t('branches_page.main_activity'),
            partners: t('branches_page.default_partners'),
            address1: '',
            address2: '',
            neighborhood: '',
            city: '',
            postalCode: '',
            region: '',
            country: 'EG',
            commercialRegister: ''
        }
    ]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        address1: '',
        address2: '',
        neighborhood: '',
        city: '',
        postalCode: '',
        region: '',
        country: 'EG', // Default to Egypt as in screenshot
        commercialRegister: '',
        partners: '',
        activity: ''
    });

    const filteredBranches = branches.filter(branch =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.activity.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const validateForm = () => {
        const newErrors = [];
        if (!formData.name) newErrors.push(t('branches_page.validation.name_required'));
        if (!formData.country) newErrors.push(t('branches_page.validation.country_required'));
        if (!formData.partners) newErrors.push(t('branches_page.validation.partners_required'));
        if (!formData.activity) newErrors.push(t('branches_page.validation.activity_required'));

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            if (editingId) {
                setBranches(branches.map(b => b.id === editingId ? {
                    ...b,
                    ...formData,
                    activity: formData.activity === 'main' ? t('branches_page.main_activity') : formData.activity,
                    partners: formData.partners === 'default' ? t('branches_page.default_partners') : formData.partners
                } : b));
            } else {
                const newBranch = {
                    id: Date.now(),
                    ...formData,
                    activity: formData.activity === 'main' ? t('branches_page.main_activity') : formData.activity,
                    partners: formData.partners === 'default' ? t('branches_page.default_partners') : formData.partners
                };
                setBranches([...branches, newBranch]);
            }
            setIsModalOpen(false);
            resetForm();
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address1: '',
            address2: '',
            neighborhood: '',
            city: '',
            postalCode: '',
            region: '',
            country: 'EG',
            commercialRegister: '',
            partners: '',
            activity: ''
        });
        setEditingId(null);
        setErrors([]);
    };

    const handleEdit = (branch) => {
        setFormData({
            name: branch.name,
            address1: branch.address1 || '',
            address2: branch.address2 || '',
            neighborhood: branch.neighborhood || '',
            city: branch.city || '',
            postalCode: branch.postalCode || '',
            region: branch.region || '',
            country: branch.country || 'EG',
            commercialRegister: branch.commercialRegister || '',
            partners: branch.partners === t('branches_page.default_partners') ? 'default' : branch.partners,
            activity: branch.activity === t('branches_page.main_activity') ? 'main' : branch.activity
        });
        setEditingId(branch.id);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        setBranches(branches.filter(b => b.id !== id));
    };

    return (
        <div className="p-6 bg-white min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Top Toolbar */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden h-10 shadow-sm">
                        <button className="px-3 h-full text-gray-400 hover:text-gray-600 transition-colors bg-white">
                            <Home size={18} />
                        </button>
                        <div className="flex items-center text-[#4B5563] font-medium text-sm h-full relative">
                            <span className="h-full w-[1px] bg-gray-200 skew-x-[-20deg] mx-1"></span>
                            <div className="px-5 h-full flex items-center bg-gray-50/80 font-bold text-gray-700">
                                {t('branches_page.title')}
                            </div>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-2 rounded-md border border-gray-100 shadow-sm">
                        <RefreshCw size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 h-10 rounded-md hover:bg-indigo-700 transition-colors font-semibold shadow-sm text-sm"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>{t('sales.common.add')}</span>
                    </button>

                    <div className="relative h-10">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('sales.common.search_filter')}
                            className="bg-[#F0F7FF] border border-[#BFDBFE] text-[#2563EB] px-4 h-full pr-10 rounded-md hover:bg-blue-100 transition-colors outline-none focus:ring-1 focus:ring-blue-400 font-semibold w-72 placeholder:text-blue-400 text-sm"
                        />
                        <Search size={16} className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
                <table className="w-full text-sm text-start">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-start">{t('branches_page.title')}</th>
                            <th className="px-6 py-4 text-start">{t('branches_page.activity')}</th>
                            <th className="px-6 py-4 text-start">{t('branches_page.partners_list')}</th>
                            <th className="px-6 py-4 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredBranches.map((branch) => (
                            <tr key={branch.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-6 py-4 text-gray-700 font-bold">{branch.name}</td>
                                <td className="px-6 py-4 text-gray-600">{branch.activity}</td>
                                <td className="px-6 py-4 text-gray-600">{branch.partners}</td>
                                <td className="px-6 py-4 flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => handleEdit(branch)}
                                        className="text-blue-500 hover:text-blue-700 font-bold"
                                    >
                                        {t('accounting.chart_of_accounts.edit')}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(branch.id)}
                                        className="text-red-500 hover:text-red-700 font-bold"
                                    >
                                        {t('accounting.chart_of_accounts.delete')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Branch Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[700px] overflow-hidden flex flex-col max-h-[95vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? t('accounting.chart_of_accounts.edit') : t('branches_page.add_branch')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto flex-1 bg-white custom-scrollbar">
                            {/* Validation Errors */}
                            {errors.length > 0 && (
                                <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 rounded-md">
                                    <ul className="list-disc list-inside text-red-600 text-sm font-bold space-y-1">
                                        {errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600 text-start">
                                        {t('branches_page.branch_name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start transition-colors"
                                    />
                                </div>

                                {/* Addresses Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-600 text-start">{t('branches_page.address1')}</label>
                                        <input
                                            type="text"
                                            value={formData.address1}
                                            onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-600 text-start">{t('branches_page.address2')}</label>
                                        <input
                                            type="text"
                                            value={formData.address2}
                                            onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-600 text-start">{t('branches_page.neighborhood')}</label>
                                        <input
                                            type="text"
                                            value={formData.neighborhood}
                                            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-600 text-start">{t('branches_page.city')}</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-600 text-start">{t('branches_page.postal_code')}</label>
                                        <input
                                            type="text"
                                            value={formData.postalCode}
                                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-600 text-start">{t('branches_page.region')}</label>
                                        <input
                                            type="text"
                                            value={formData.region}
                                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Country Dropdown */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600 text-start">{t('branches_page.country')}</label>
                                    <select
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start appearance-none bg-white transition-colors"
                                    >
                                        <option value="">{t('branches_page.choose')}</option>
                                        {countries.map(country => (
                                            <option key={country.code} value={country.code}>
                                                {isRTL ? country.name_ar : country.name_en}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Commercial Register */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600 text-start">{t('branches_page.commercial_register')}</label>
                                    <input
                                        type="text"
                                        value={formData.commercialRegister}
                                        onChange={(e) => setFormData({ ...formData, commercialRegister: e.target.value })}
                                        className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start transition-colors"
                                    />
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed text-start">
                                        {t('branches_page.commercial_register_note')}
                                    </p>
                                </div>

                                {/* Partners List Dropdown */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600 text-start">
                                        {t('branches_page.partners_list')} <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.partners}
                                        onChange={(e) => setFormData({ ...formData, partners: e.target.value })}
                                        className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start appearance-none bg-white transition-colors"
                                    >
                                        <option value="">{t('branches_page.choose')}</option>
                                        <option value="default">{t('branches_page.default_partners')}</option>
                                    </select>
                                </div>

                                {/* Activity Dropdown */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600 text-start">
                                        {t('branches_page.activity')} <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.activity}
                                        onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                                        className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start appearance-none bg-white transition-colors"
                                    >
                                        <option value="">{t('branches_page.choose')}</option>
                                        <option value="main">{t('branches_page.main_activity')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 border-t border-gray-100 flex items-center gap-3 justify-start bg-white">
                            <button
                                onClick={handleSave}
                                className="px-8 py-2 bg-[#10B981] text-white font-bold rounded-md hover:bg-emerald-600 transition-colors shadow-sm"
                            >
                                {t('sales.common.save')}
                            </button>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                {t('sales.common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Branches;
