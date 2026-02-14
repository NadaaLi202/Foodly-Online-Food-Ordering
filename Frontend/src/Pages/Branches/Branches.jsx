import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, RefreshCw, X, Home, Eye, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import branchService from '../../services/branchService';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

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
];

const Branches = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [branches, setBranches] = useState([]);
    const [partnerLists, setPartnerLists] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewingBranch, setViewingBranch] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ open: false, branchId: null });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address1: '',
        address2: '',
        neighborhood: '',
        city: '',
        postalCode: '',
        region: '',
        country: '',
        phone: '',
        commercialRegister: '',
        partners: [],
        activity: '',
        status: 'active',
    });

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await branchService.getAllBranches();
            setBranches(res.branches || []);
        } catch (err) {
            const msg = err.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            if (err.response?.status !== 401 && err.response?.status !== 403) {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPartnerLists = async () => {
        try {
            const res = await branchService.getPartnerLists();
            setPartnerLists(res.partnerLists || []);
        } catch (e) {
            // optional for dropdown
        }
    };

    const fetchActivities = async () => {
        try {
            const res = await branchService.getActivities();
            setActivities(res.activities || []);
        } catch (e) {
            // optional for dropdown
        }
    };

    useEffect(() => {
        fetchBranches();
        fetchPartnerLists();
        fetchActivities();
    }, []);

    const filteredBranches = useMemo(() => {
        if (!searchTerm.trim()) return branches;
        const term = searchTerm.toLowerCase().trim();
        return branches.filter(
            (b) =>
                (b.name || '').toLowerCase().includes(term) ||
                (b.code || '').toLowerCase().includes(term) ||
                (b.city || '').toLowerCase().includes(term) ||
                (b.country || '').toLowerCase().includes(term)
        );
    }, [branches, searchTerm]);

    const getActivityName = (id) => {
        if (!id) return '—';
        const a = activities.find((x) => x._id === id);
        if (!a) return (id.toString ? id.toString().slice(-6) : '—');
        const isMain = !a.name || /main|رئيسي|الرئيسي|النشاط التجاري الرئيسي/i.test(a.name);
        return isMain ? t('branches_page.main_activity') : a.name;
    };

    const getPartnerListName = (id) => {
        if (!id) return '—';
        const p = partnerLists.find((x) => x._id === id);
        if (!p) return (id.toString ? id.toString().slice(-6) : '—');
        const isDefault = !p.name || /default|افتراض|الافتراضية/i.test(p.name);
        return isDefault ? t('branches_page.default_partners') : p.name;
    };

    const getDefaultPartnerListId = () => {
        const d = partnerLists.find((p) => p.name && /default|افتراض|الافتراضية/i.test(p.name));
        return d?._id || partnerLists[0]?._id || '';
    };

    const getMainActivityId = () => {
        const main = activities.find((a) => a.name && /main|رئيسي|الرئيسي|النشاط التجاري الرئيسي/i.test(a.name));
        return main?._id || activities[0]?._id || '';
    };

    const validateForm = () => {
        const newErrors = [];
        if (!(formData.name || '').trim()) newErrors.push(t('branches_page.validation.name_required'));
        if (!(formData.code || '').trim()) newErrors.push(t('branches_page.validation.code_required'));
        if (!formData.country) newErrors.push(t('branches_page.validation.country_required'));
        if (!formData.partners || (Array.isArray(formData.partners) && formData.partners.length === 0)) newErrors.push(t('branches_page.validation.partners_required'));
        if (!formData.activity) newErrors.push(t('branches_page.validation.activity_required'));
        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const getInitialFormData = () => ({
        name: '',
        code: '',
        address1: '',
        address2: '',
        neighborhood: '',
        city: '',
        postalCode: '',
        region: '',
        country: '',
        phone: '',
        commercialRegister: '',
        partners: [],
        activity: '',
        status: 'active',
    });

    const resetForm = () => {
        setFormData(getInitialFormData());
        setEditingId(null);
        setErrors([]);
    };

    const handleOpenAdd = async () => {
        let lists = partnerLists;
        let acts = activities;
        if (lists.length === 0 || acts.length === 0) {
            try {
                const [listRes, actRes] = await Promise.all([
                    branchService.getPartnerLists(),
                    branchService.getActivities(),
                ]);
                lists = listRes.partnerLists || [];
                acts = actRes.activities || [];
                if (lists.length > 0) setPartnerLists(lists);
                if (acts.length > 0) setActivities(acts);
            } catch (_) { /* use state */ }
        }
        const defaultPartnerId = (lists.find((p) => p.name && /default|افتراض|الافتراضية/i.test(p.name)) || lists[0])?._id;
        const mainActivityId = (acts.find((a) => a.name && /main|رئيسي|الرئيسي|النشاط التجاري الرئيسي/i.test(a.name)) || acts[0])?._id;
        const initial = getInitialFormData();
        initial.country = 'EG';
        initial.partners = defaultPartnerId ? [defaultPartnerId] : [];
        initial.activity = mainActivityId || '';
        setFormData(initial);
        setEditingId(null);
        setErrors([]);
        setIsModalOpen(true);
    };

    // When Add modal is open and partner/activity lists load after open, fill defaults if still empty
    useEffect(() => {
        if (!isModalOpen || editingId) return;
        const defaultPartner = getDefaultPartnerListId();
        const mainActivity = getMainActivityId();
        if (!defaultPartner && !mainActivity) return;
        setFormData((prev) => {
            const needPartners = (!Array.isArray(prev.partners) || prev.partners.length === 0) && defaultPartner;
            const needActivity = !prev.activity && mainActivity;
            if (!needPartners && !needActivity) return prev;
            return {
                ...prev,
                ...(needPartners && { partners: [defaultPartner] }),
                ...(needActivity && { activity: mainActivity }),
            };
        });
    }, [isModalOpen, editingId, partnerLists, activities]);

    const handleSave = async () => {
        if (!validateForm()) return;
        setSubmitLoading(true);
        try {
            let partners = [];
            if (Array.isArray(formData.partners)) {
                partners = formData.partners.filter(Boolean);
            } else if (formData.partners) {
                partners = [formData.partners];
            }
            const payload = {
                name: formData.name.trim(),
                code: formData.code.trim(),
                address1: formData.address1 || '',
                address2: formData.address2 || '',
                city: formData.city || '',
                neighborhood: formData.neighborhood || '',
                postalCode: formData.postalCode || '',
                region: formData.region || '',
                country: formData.country || '',
                phone: formData.phone || '',
                commercialRegister: formData.commercialRegister || '',
                partners,
                activity: formData.activity || undefined,
                status: formData.status || 'active',
            };
            if (editingId) {
                await branchService.updateBranch(editingId, payload);
                toast.success(t('sales.common.success_message', 'Branch updated successfully'));
            } else {
                await branchService.createBranch(payload);
                toast.success(t('sales.common.success_message', 'Branch created successfully'));
            }
            await fetchBranches();
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            const msg = err.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            toast.error(msg);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEdit = (branch) => {
        const partnerIds = (branch.partners || []).map((p) => (p && p._id) ? p._id : p).filter(Boolean);
        const fallbackPartner = branch.partnerList?._id ?? branch.partnerList;
        const partners = partnerIds.length > 0 ? partnerIds : (fallbackPartner ? [fallbackPartner] : []);
        setFormData({
            name: branch.name || '',
            code: branch.code || '',
            address1: branch.address1 || '',
            address2: branch.address2 || '',
            neighborhood: branch.neighborhood || '',
            city: branch.city || '',
            postalCode: branch.postalCode || '',
            region: branch.region || '',
            country: branch.country || 'EG',
            phone: branch.phone || '',
            commercialRegister: branch.commercialRegister || '',
            partners: partnerIds.length > 0 ? partnerIds[0] : (fallbackPartner || ''),
            activity: branch.activity?._id ?? branch.activity ?? '',
            status: branch.status || 'active',
        });
        setEditingId(branch._id);
        setIsModalOpen(true);
    };

    const handleView = (branch) => {
        setViewingBranch(branch);
        setViewModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ open: true, branchId: id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.branchId) return;
        setDeleteLoading(true);
        try {
            await branchService.deleteBranch(deleteModal.branchId);
            toast.success(t('sales.common.success_message', 'Branch deleted successfully'));
            await fetchBranches();
            setDeleteModal({ open: false, branchId: null });
        } catch (err) {
            const msg = err.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            toast.error(msg);
        } finally {
            setDeleteLoading(false);
        }
    };

    const countryName = (code) => {
        const c = countries.find((x) => x.code === code);
        return c ? (isRTL ? c.name_ar : c.name_en) : code || '—';
    };

    return (
        <div className="p-6 bg-white min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden h-10 shadow-sm">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-3 h-full text-gray-400 hover:text-gray-600 transition-colors bg-white"
                        >
                            <Home size={18} />
                        </button>
                        <div className="flex items-center text-[#4B5563] font-medium text-sm h-full">
                            <span className="h-full w-[1px] bg-gray-200 skew-x-[-20deg] mx-1" />
                            <div className="px-5 h-full flex items-center bg-gray-50/80 font-bold text-gray-700">
                                {t('branches_page.title')}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchBranches}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-2 rounded-md border border-gray-100 shadow-sm disabled:opacity-50"
                        title={t('sales.common.refresh', 'Refresh')}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleOpenAdd}
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

            <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
                <table className="w-full text-sm text-start">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-start">{t('branches_page.title')}</th>
                            <th className="px-6 py-4 text-start">{t('branches_page.activity')}</th>
                            <th className="px-6 py-4 text-start">{t('branches_page.partners_list')}</th>
                            <th className="px-6 py-4 text-start">{t('common.actions', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    {t('sales.common.loading', 'Loading...')}
                                </td>
                            </tr>
                        ) : filteredBranches.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    {searchTerm ? t('sales.common.no_results', 'No results found') : t('branches_page.no_branches_yet', 'No branches yet. Add a branch to get started.')}
                                </td>
                            </tr>
                        ) : (
                            filteredBranches.map((branch) => (
                                <tr key={branch._id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 text-gray-700 font-bold">{branch.name} {branch.code ? `#${branch.code}` : ''}</td>
                                    <td className="px-6 py-4 text-gray-600">{getActivityName(branch.activity?._id ?? branch.activity)}</td>
                                    <td className="px-6 py-4 text-gray-600">{getPartnerListName(branch.partnerList?._id ?? branch.partnerList ?? (branch.partners?.[0]?._id ?? branch.partners?.[0]))}</td>
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleView(branch)}
                                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                                        >
                                            <Eye size={16} />
                                            {t('topbar.view')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(branch)}
                                            className="text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1"
                                        >
                                            <Pencil size={16} />
                                            {t('accounting.chart_of_accounts.edit')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteClick(branch._id)}
                                            className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                                        >
                                            <Trash2 size={16} />
                                            {t('accounting.chart_of_accounts.delete')}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-[1px] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[900px] sm:max-w-[960px] min-w-0 max-h-[95vh] overflow-hidden flex flex-col my-auto">
                        <div className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-gray-200 shrink-0 bg-gray-50/30">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? t('accounting.chart_of_accounts.edit') : t('branches_page.add_branch')}
                            </h2>
                            <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition p-1">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-5 sm:p-6 md:p-8 overflow-y-auto flex-1">
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
                                {/* Name * - full width at top as per reference */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-700 text-start">
                                        {t('branches_page.branch_name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder=""
                                        className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-700 text-start">{t('branches_page.code')} <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-700 text-start">{t('branches_page.phone', 'Phone')}</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-700 text-start">{t('branches_page.address1')}</label>
                                        <input
                                            type="text"
                                            value={formData.address1}
                                            onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-700 text-start">{t('branches_page.address2')}</label>
                                        <input
                                            type="text"
                                            value={formData.address2}
                                            onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-700 text-start">{t('branches_page.neighborhood')}</label>
                                        <input
                                            type="text"
                                            value={formData.neighborhood}
                                            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-700 text-start">{t('branches_page.city')}</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-700 text-start">{t('branches_page.postal_code')}</label>
                                        <input
                                            type="text"
                                            value={formData.postalCode}
                                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-700 text-start">{t('branches_page.region')}</label>
                                        <input
                                            type="text"
                                            value={formData.region}
                                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-700 text-start">{t('branches_page.country')}</label>
                                    <select
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start appearance-none bg-white"
                                    >
                                        <option value="">{t('branches_page.choose')}</option>
                                        {countries.map((country) => (
                                            <option key={country.code} value={country.code}>
                                                {isRTL ? country.name_ar : country.name_en}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-700 text-start">{t('branches_page.commercial_register')}</label>
                                    <input
                                        type="text"
                                        value={formData.commercialRegister}
                                        onChange={(e) => setFormData({ ...formData, commercialRegister: e.target.value })}
                                        className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white"
                                    />
                                    <p className="text-xs text-gray-500 mt-1 text-start">{t('branches_page.commercial_register_note')}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-700 text-start">
                                            {t('branches_page.partners_list')} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={Array.isArray(formData.partners) ? formData.partners[0] || '' : formData.partners || ''}
                                            onChange={(e) => setFormData({ ...formData, partners: e.target.value ? [e.target.value] : [] })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start appearance-none bg-white"
                                        >
                                            <option value="">{t('branches_page.choose')}</option>
                                            {partnerLists.map((pl) => {
                                                const isDefault = !pl.name || /default|افتراض|الافتراضية/i.test(pl.name);
                                                const label = isDefault ? t('branches_page.default_partners') : pl.name;
                                                return <option key={pl._id} value={pl._id}>{label}</option>;
                                            })}
                                        </select>
                                        {partnerLists.length === 0 && (
                                            <p className="text-xs text-amber-600 mt-1 text-start">{t('branches_page.no_partner_lists_hint', 'No partner lists yet. Add one from Partners Lists page.')}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-700 text-start">
                                            {t('branches_page.activity')} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.activity}
                                            onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start appearance-none bg-white"
                                        >
                                            <option value="">{t('branches_page.choose')}</option>
                                            {activities.map((act) => {
                                                const isMain = !act.name || /main|رئيسي|الرئيسي|النشاط التجاري الرئيسي/i.test(act.name);
                                                const label = isMain ? t('branches_page.main_activity') : act.name;
                                                return <option key={act._id} value={act._id}>{label}</option>;
                                            })}
                                        </select>
                                        {activities.length === 0 && (
                                            <p className="text-xs text-amber-600 mt-1 text-start">{t('branches_page.no_activities_hint', 'No activities yet. Add one from Activities page.')}</p>
                                        )}
                                    </div>
                                </div>
                                {editingId && (
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-gray-700 text-start">{t('accounting.chart_of_accounts.status', 'Status')}</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white text-gray-700"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-5 sm:px-8 py-5 border-t border-gray-200 flex items-center gap-3 justify-start bg-gray-50/30 shrink-0">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={submitLoading}
                                className="px-8 py-2.5 bg-[#10B981] text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {submitLoading ? t('sales.common.loading', 'Loading...') : t('sales.common.save')}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="px-8 py-2.5 bg-white border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                {t('sales.common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewModalOpen && viewingBranch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">{t('branches_page.title')} — {viewingBranch.name}</h2>
                            <button type="button" onClick={() => setViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3 text-sm">
                            <p><span className="font-bold text-gray-600">{t('branches_page.code')}:</span> {viewingBranch.code || '—'}</p>
                            <p><span className="font-bold text-gray-600">{t('branches_page.branch_name')}:</span> {viewingBranch.name || '—'}</p>
                            <p><span className="font-bold text-gray-600">{t('branches_page.address1')}:</span> {viewingBranch.address1 || '—'}</p>
                            <p><span className="font-bold text-gray-600">{t('branches_page.address2')}:</span> {viewingBranch.address2 || '—'}</p>
                            <p><span className="font-bold text-gray-600">{t('branches_page.city')}:</span> {viewingBranch.city || '—'}</p>
                            <p><span className="font-bold text-gray-600">{t('branches_page.country')}:</span> {countryName(viewingBranch.country)}</p>
                            <p><span className="font-bold text-gray-600">{t('branches_page.partners_list')}:</span> {getPartnerListName(viewingBranch.partnerList?._id ?? viewingBranch.partnerList ?? (viewingBranch.partners?.[0]?._id ?? viewingBranch.partners?.[0]))}</p>
                            <p><span className="font-bold text-gray-600">{t('branches_page.activity')}:</span> {getActivityName(viewingBranch.activity?._id ?? viewingBranch.activity)}</p>
                            <p><span className="font-bold text-gray-600">{t('accounting.chart_of_accounts.status', 'Status')}:</span> {viewingBranch.status || 'active'}</p>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, branchId: null })}
                onConfirm={confirmDelete}
                loading={deleteLoading}
                message={i18n.language === 'ar' ? 'هل أنت متأكد من حذف هذا الفرع؟' : 'Are you sure you want to delete this branch?'}
            />
        </div>
    );
};

export default Branches;
