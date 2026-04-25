import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, RefreshCw, X, Home, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import activitiesService from '../../services/activitiesService';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

const Activities = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [formData, setFormData] = useState({ name: '' });

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const res = await activitiesService.getAllActivities();
            setActivities(res.activities || []);
        } catch (err) {
            const msg = err.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            if (err.response?.status !== 401 && err.response?.status !== 403) {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const filteredActivities = useMemo(() => {
        if (!searchTerm.trim()) return activities;
        const term = searchTerm.toLowerCase().trim();
        return activities.filter((a) => (a.name || '').toLowerCase().includes(term));
    }, [activities, searchTerm]);

    const validateForm = () => {
        const newErrors = [];
        if (!(formData.name || '').trim()) {
            newErrors.push(t('activities_page.validation.name_required'));
        }
        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const resetForm = () => {
        setFormData({ name: '' });
        setEditingId(null);
        setErrors([]);
    };

    const handleOpenAdd = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setSubmitLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                description: '',
            };

            if (editingId) {
                await activitiesService.updateActivity(editingId, payload);
                toast.success(t('sales.common.success_message', 'Activity updated successfully'));
            } else {
                await activitiesService.createActivity(payload);
                toast.success(t('sales.common.success_message', 'Activity created successfully'));
            }

            await fetchActivities();
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            const msg = err.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            toast.error(msg);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEdit = (item) => {
        setFormData({ name: item.name || '' });
        setEditingId(item._id);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ open: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;

        setDeleteLoading(true);
        try {
            await activitiesService.deleteActivity(deleteModal.id);
            toast.success(t('sales.common.success_message', 'Activity deleted successfully'));
            await fetchActivities();
            setDeleteModal({ open: false, id: null });
        } catch (err) {
            const msg = err.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            toast.error(msg);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Toolbar - Matching Branches style */}
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
                                {t('activities_page.title')}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchActivities}
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

            {/* List - Table style matching Branches */}
            <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
                <table className="w-full text-sm text-start">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-start">{t('activities_page.activity_name')}</th>
                            <th className="px-6 py-4 text-start">{t('common.actions', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                                    {t('sales.common.loading', 'Loading...')}
                                </td>
                            </tr>
                        ) : filteredActivities.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                                    {searchTerm ? t('sales.common.no_results', 'No results found') : t('activities_page.no_activities_yet')}
                                </td>
                            </tr>
                        ) : (
                            filteredActivities.map((item) => (
                                <tr key={item._id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 text-gray-700 font-bold">
                                        {item.name || '—'}
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(item)}
                                            className="text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1"
                                        >
                                            <Pencil size={16} />
                                            {t('sales.common.edit')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteClick(item._id)}
                                            className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                                        >
                                            <Trash2 size={16} />
                                            {t('sales.common.delete')}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add / Edit Modal - Matching Branches style */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-[1px] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] min-w-0 max-h-[95vh] overflow-hidden flex flex-col my-auto">
                        <div className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-gray-200 shrink-0 bg-gray-50/30">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? t('activities_page.edit_activity') : t('activities_page.add_activity')}
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
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-700 text-start">
                                        {t('activities_page.activity_name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ name: e.target.value })}
                                        placeholder=""
                                        className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white"
                                    />
                                </div>
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

            <ConfirmDeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null })}
                onConfirm={confirmDelete}
                loading={deleteLoading}
                message={i18n.language === 'ar' ? 'هل أنت متأكد من حذف هذا النشاط؟' : 'Are you sure you want to delete this activity?'}
            />
        </div>
    );
};

export default Activities;
