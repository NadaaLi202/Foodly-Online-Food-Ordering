import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RefreshCw, X, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import partnerListsService from '../../services/partnerListsService';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

const PartnerLists = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [partnerLists, setPartnerLists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [errors, setErrors] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [formData, setFormData] = useState({ name: '' });

    const fetchPartnerLists = async () => {
        setLoading(true);
        try {
            const res = await partnerListsService.getAllPartnerLists();
            setPartnerLists(res.partnerLists || []);
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
        fetchPartnerLists();
    }, []);

    const validateForm = () => {
        const newErrors = [];
        if (!(formData.name || '').trim()) newErrors.push(t('partner_lists_page.validation.name_required'));
        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const resetForm = () => {
        setFormData({ name: '' });
        setEditingId(null);
        setErrors([]);
    };

    const handleOpenAdd = () => {
        setFormData({ name: '' });
        setEditingId(null);
        setErrors([]);
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
                await partnerListsService.updatePartnerList(editingId, payload);
                toast.success(t('sales.common.success_message', 'Partner list updated successfully'));
            } else {
                await partnerListsService.createPartnerList(payload);
                toast.success(t('sales.common.success_message', 'Partner list created successfully'));
            }
            await fetchPartnerLists();
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
            await partnerListsService.deletePartnerList(deleteModal.id);
            toast.success(t('sales.common.success_message', 'Partner list deleted successfully'));
            await fetchPartnerLists();
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
            {/* Toolbar: Add (left), Title (center), Refresh + Home (right) */}
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
                        {t('partner_lists_page.title')}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchPartnerLists}
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

            {/* List: card-like rows with name and actions (Edit, Delete) on the left */}
            <div className="space-y-3">
                {loading ? (
                    <div className="py-12 text-center text-gray-500">{t('sales.common.loading', 'Loading...')}</div>
                ) : partnerLists.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">{t('partner_lists_page.no_lists_yet')}</div>
                ) : (
                    partnerLists.map((item) => (
                        <div
                            key={item._id}
                            className="flex items-center justify-between gap-4 py-4 px-5 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-gray-50/50 transition-colors"
                        >
                            <div className="flex items-center min-w-0 flex-1">
                                <span className="text-gray-700 font-semibold text-base truncate">
                                    {item.name || '—'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
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

            {/* Add/Edit Modal - only Name field */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? t('partner_lists_page.edit_partner_list') : t('partner_lists_page.add_partner_list')}
                            </h2>
                            <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition p-1">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            {errors.length > 0 && (
                                <div className="mb-4 p-4 bg-red-50 border-r-4 border-red-500 rounded-md">
                                    <ul className="list-disc list-inside text-red-600 text-sm font-bold space-y-1">
                                        {errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-gray-700 text-start">
                                    {t('partner_lists_page.partner_list_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ name: e.target.value })}
                                    className="w-full h-11 px-4 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-700 text-start bg-white"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-5 border-t border-gray-100 flex items-center gap-3 justify-start bg-white">
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
                title={t('sales.common.confirm_delete')}
                message={t('partner_lists_page.delete_confirm_message')}
                loading={deleteLoading}
            />
        </div>
    );
};

export default PartnerLists;
