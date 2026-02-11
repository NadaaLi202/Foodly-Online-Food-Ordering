import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RefreshCw, X, Home } from 'lucide-react';
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
            const msg =
                err.response?.data?.message ||
                t('sales.common.error_message', 'An error occurred');
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
                toast.success(
                    t('sales.common.success_message', 'Activity updated successfully')
                );
            } else {
                await activitiesService.createActivity(payload);
                toast.success(
                    t('sales.common.success_message', 'Activity created successfully')
                );
            }

            await fetchActivities();
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                t('sales.common.error_message', 'An error occurred');
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
            toast.success(
                t('sales.common.success_message', 'Activity deleted successfully')
            );
            await fetchActivities();
            setDeleteModal({ open: false, id: null });
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                t('sales.common.error_message', 'An error occurred');
            toast.error(msg);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 h-10 rounded-md hover:bg-indigo-700 transition-colors font-semibold shadow-sm text-sm"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>{t('sales.common.add')}</span>
                    </button>
                    <h1 className="text-lg font-bold text-gray-800">
                        {t('activities_page.title')}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchActivities}
                        disabled={loading}
                        className="text-gray-500 hover:text-gray-700 transition-colors bg-white p-2 rounded-full border border-gray-100 shadow-sm disabled:opacity-50"
                        title={t('sales.common.refresh', 'Refresh')}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="text-gray-500 hover:text-gray-700 transition-colors bg-white p-2 rounded-full border border-gray-100 shadow-sm"
                        title={t('sales.common.home', 'Home')}
                    >
                        <Home size={18} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="py-12 text-center text-gray-500">
                        {t('sales.common.loading', 'Loading...')}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        {t('activities_page.no_activities_yet')}
                    </div>
                ) : (
                    activities.map((item) => (
                        <div
                            key={item._id}
                            className="flex items-center justify-between gap-4 py-4 px-5 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-gray-50/50 transition-colors"
                        >
                            <span className="text-gray-700 font-semibold text-base truncate">
                                {item.name || '—'}
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleEdit(item)}
                                    className="text-red-500 hover:text-red-700 font-bold text-sm"
                                >
                                    {t('accounting.chart_of_accounts.edit')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteClick(item._id)}
                                    className="text-red-500 hover:text-red-700 font-bold text-sm"
                                >
                                    {t('accounting.chart_of_accounts.delete')}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px]">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-xl font-bold">
                                {editingId
                                    ? t('activities_page.edit_activity')
                                    : t('activities_page.add_activity')}
                            </h2>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }}>
                                <X />
                            </button>
                        </div>

                        <div className="p-6">
                            {errors.length > 0 && (
                                <div className="mb-4 p-4 bg-red-50 border-r-4 border-red-500">
                                    <ul className="text-red-600 text-sm font-bold">
                                        {errors.map((e, i) => (
                                            <li key={i}>{e}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <label className="block text-sm font-bold mb-1">
                                {t('activities_page.activity_name')} *
                            </label>
                            <input
                                value={formData.name}
                                onChange={(e) => setFormData({ name: e.target.value })}
                                className="w-full h-11 px-4 border-2 border-blue-300 rounded-lg"
                            />
                        </div>

                        <div className="px-6 py-5 border-t flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={submitLoading}
                                className="px-8 py-2.5 bg-emerald-500 text-white font-bold rounded-lg"
                            >
                                {submitLoading
                                    ? t('sales.common.loading')
                                    : t('sales.common.save')}
                            </button>
                            <button
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="px-8 py-2.5 border rounded-lg"
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
                title={t('sales.common.confirm_delete')}
                message={t('activities_page.delete_confirm_message')}
                loading={deleteLoading}
            />
        </div>
    );
};

export default Activities;
