import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Info, Loader2, Plus, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import costCentersService from '../../services/costCentersService';
import settingsService from '../../services/settingsService';

const INITIAL_FORM = {
    type: 'main',
    name: '',
    parentId: ''
};

const CostCenters = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [loading, setLoading] = useState(true);
    const [featureLoading, setFeatureLoading] = useState(true);
    const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [costCenters, setCostCenters] = useState([]);
    const [mainCostCenterOptions, setMainCostCenterOptions] = useState([]);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCenter, setEditingCenter] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchCostCenters = async (silent = false) => {
        if (!silent) setLoading(true);
        if (silent) setRefreshing(true);
        setOptionsLoading(true);
        try {
            const response = await costCentersService.getAllCostCenters();
            setCostCenters(response?.costCenters || []);
            const backendOptions = response?.mainCostCenterOptions?.options;
            if (Array.isArray(backendOptions) && backendOptions.length > 0) {
                setMainCostCenterOptions(backendOptions);
            } else {
                const grouped = response?.mainCostCenterOptions?.grouped || {};
                const orderedKeys = ['projects', 'departments', 'activities', 'products'];
                const fallbackOptions = orderedKeys
                    .map((key) => grouped[key]?.[0])
                    .filter(Boolean);
                setMainCostCenterOptions(fallbackOptions);
            }
        } catch (error) {
            toast.error(t('sales.common.error_message'));
        } finally {
            setLoading(false);
            setRefreshing(false);
            setOptionsLoading(false);
        }
    };

    useEffect(() => {
        const initialize = async () => {
            setFeatureLoading(true);
            try {
                const accountingSettings = await settingsService.getAccountingSettings();
                const enabled = Boolean(accountingSettings?.enable_cost_centers);
                setIsFeatureEnabled(enabled);

                if (enabled) {
                    await fetchCostCenters();
                } else {
                    setLoading(false);
                }
            } catch {
                setIsFeatureEnabled(false);
                setLoading(false);
            } finally {
                setFeatureLoading(false);
            }
        };

        initialize();
    }, []);

    const mainCenters = useMemo(
        () => costCenters.filter((center) => center.type === 'main'),
        [costCenters]
    );

    const displayedCenters = useMemo(() => {
        const childrenByParent = new Map();
        costCenters.forEach((center) => {
            if (center.type === 'sub' && center.parentId?._id) {
                if (!childrenByParent.has(center.parentId._id)) childrenByParent.set(center.parentId._id, []);
                childrenByParent.get(center.parentId._id).push(center);
            }
        });

        const list = [];
        mainCenters.forEach((main) => {
            list.push({ ...main, rowType: 'main' });
            const children = childrenByParent.get(main._id) || [];
            children.forEach((child) => list.push({ ...child, rowType: 'sub' }));
        });
        return list;
    }, [costCenters, mainCenters]);

    const openAddModal = () => {
        setEditingCenter(null);
        setForm(INITIAL_FORM);
        setErrors({});
        setIsModalOpen(true);
    };

    const openEditModal = (center) => {
        setEditingCenter(center);
        setForm({
            type: center.type,
            name: center.name || '',
            parentId: center.parentId?._id || ''
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const validateForm = () => {
        const nextErrors = {};
        if (!form.name.trim()) nextErrors.name = t('cost_centers.validation.name_required');
        if (form.type === 'sub' && !form.parentId) nextErrors.parentId = t('cost_centers.validation.parent_required');
        if (form.type === 'main' && form.parentId) nextErrors.parentId = t('cost_centers.validation.main_parent_null');
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            const payload = {
                type: form.type,
                name: form.name.trim(),
                parentId: form.type === 'sub' ? form.parentId : null
            };
            if (editingCenter?._id) {
                await costCentersService.updateCostCenter(editingCenter._id, payload);
                toast.success(t('cost_centers.success.update'));
            } else {
                await costCentersService.createCostCenter(payload);
                toast.success(t('cost_centers.success.create'));
            }
            setIsModalOpen(false);
            setForm(INITIAL_FORM);
            setEditingCenter(null);
            await fetchCostCenters(true);
        } catch (error) {
            const message = error.response?.data?.message || t('sales.common.error_message');
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (center) => {
        setDeleteModal({ open: true, id: center._id, name: center.name });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.id) return;
        setDeleteLoading(true);
        try {
            await costCentersService.deleteCostCenter(deleteModal.id);
            toast.success(t('cost_centers.success.delete'));
            await fetchCostCenters(true);
        } catch (error) {
            const message = error.response?.data?.message || t('sales.common.error_message');
            toast.error(message);
        } finally {
            setDeleteLoading(false);
            setDeleteModal({ open: false, id: null, name: '' });
        }
    };

    if (featureLoading) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
                <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!isFeatureEnabled) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] p-6" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="bg-[#EBF5FF] border border-[#DEEDFF] rounded-lg p-5 flex gap-3 shadow-sm">
                    <div className="flex-shrink-0 mt-0.5">
                        <div className="bg-[#2563EB] text-white rounded-full p-0.5 flex items-center justify-center">
                            <Info size={14} fill="currentColor" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 text-[#2563EB]">
                        <span className="font-bold text-sm">{t('accounting.cost_centers.info')}</span>
                        <div className="text-[#3B82F6] text-sm font-bold">
                            {t('accounting.cost_centers.disabled_message')}
                        </div>
                        <Link to="/settings/accounting" className="text-sm font-bold underline mt-1">
                            {t('sidebar.settings_accounting')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#F8F9FA] min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center bg-white border border-gray-200 rounded overflow-hidden h-10 shadow-sm px-2 gap-2">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="text-gray-400 hover:text-gray-600 px-1 border-l border-gray-100 last:border-l-0"
                    >
                        <Home size={18} />
                    </button>
                    <div className="flex items-center text-[#4B5563] font-medium text-sm gap-1">
                        <span className="text-gray-400">{t('sidebar.accounting')}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-700 font-bold">{t('sidebar.cost_centers')}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => fetchCostCenters(true)}
                        className="text-gray-400 hover:text-gray-600 px-1 border-r border-gray-100 first:border-r-0"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 h-10 rounded hover:bg-indigo-700 transition-colors font-bold shadow-sm text-sm"
                >
                    <Plus size={18} strokeWidth={3} />
                    <span>{t('cost_centers.add_btn')}</span>
                </button>
            </div>

            <div className="bg-white border border-gray-100 rounded shadow-sm overflow-hidden">
                <table className="w-full text-sm text-start">
                    <thead className="bg-[#F9FAFB] text-gray-700 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-start font-bold whitespace-nowrap">{t('cost_centers.table.name')}</th>
                            <th className="px-6 py-4 text-start font-bold whitespace-nowrap">{t('cost_centers.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={2} className="px-6 py-12 text-center text-gray-500 font-medium">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                    {t('sales.common.loading')}
                                </td>
                            </tr>
                        ) : displayedCenters.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="px-6 py-12 text-center text-gray-500 font-medium">
                                    {t('cost_centers.empty')}
                                </td>
                            </tr>
                        ) : (
                            displayedCenters.map((center) => (
                                <tr key={center._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-800 font-bold">
                                        {center.rowType === 'sub' ? (
                                            <span className="inline-flex items-center gap-2">
                                                <span className="text-gray-400">└</span>
                                                <span>{center.name}</span>
                                            </span>
                                        ) : center.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(center)}
                                                className="text-blue-500 hover:text-blue-700 font-bold text-sm"
                                            >
                                                {t('sales.common.edit')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteClick(center)}
                                                className="text-red-500 hover:text-red-700 font-bold text-sm"
                                            >
                                                {t('sales.common.delete')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden">
                        <div className="h-10 px-4 border-b border-gray-100 flex items-center justify-between">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                            <h3 className="font-bold text-gray-800">
                                {editingCenter ? t('cost_centers.modal.edit_title') : t('cost_centers.modal.add_title')}
                            </h3>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">{t('cost_centers.modal.type')}</label>
                                <div className="flex items-center gap-4">
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="radio"
                                            checked={form.type === 'main'}
                                            onChange={() => setForm((prev) => ({ ...prev, type: 'main', parentId: '' }))}
                                        />
                                        {t('cost_centers.modal.main')}
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="radio"
                                            checked={form.type === 'sub'}
                                            onChange={() => setForm((prev) => ({ ...prev, type: 'sub' }))}
                                        />
                                        {t('cost_centers.modal.sub')}
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">{t('cost_centers.modal.name')} <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                    className={`w-full h-10 px-3 rounded border outline-none ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">
                                    {t('cost_centers.modal.parent')} {form.type === 'sub' ? <span className="text-red-500">*</span> : null}
                                </label>
                                <select
                                    value={form.parentId}
                                    onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                                    className={`w-full h-10 px-3 rounded border outline-none bg-white ${errors.parentId ? 'border-red-400' : 'border-gray-300'}`}
                                    disabled={optionsLoading}
                                >
                                    <option value="">
                                        {optionsLoading
                                            ? t('cost_centers.modal.loading_parents')
                                            : t('cost_centers.modal.parent_placeholder')}
                                    </option>
                                    {mainCostCenterOptions.map((center) => (
                                        <option key={center._id} value={center._id}>{center.name}</option>
                                    ))}
                                </select>
                                {!optionsLoading && mainCostCenterOptions.length === 0 && (
                                    <p className="text-xs text-amber-600 font-medium">{t('cost_centers.modal.parent_empty_hint')}</p>
                                )}
                                {errors.parentId && <p className="text-xs text-red-500 font-medium">{errors.parentId}</p>}
                            </div>
                        </div>

                        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="h-8 px-4 rounded bg-[#10B981] text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50"
                            >
                                {saving ? t('sales.common.loading') : t('sales.common.save')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="h-8 px-4 rounded border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50"
                            >
                                {t('sales.common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
                onConfirm={handleConfirmDelete}
                loading={deleteLoading}
                title={t('cost_centers.delete_title')}
                message={t('cost_centers.delete_message', { name: deleteModal.name })}
            />
        </div>
    );
};

export default CostCenters;
