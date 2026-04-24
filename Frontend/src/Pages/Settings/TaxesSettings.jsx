import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, RefreshCw, Pencil, Trash2, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import taxesService from '../../services/taxesservice';
import chartOfAccountsService from '../../services/chartofaccountsservice';
import ConfirmDeleteModal from '../../components/confirmdeletemodal';
import TaxModal from './taxmodal';

const TaxesSettings = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const [taxes, setTaxes] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [taxesRes, accountsRes] = await Promise.all([
                taxesService.getAllTaxes(),
                chartOfAccountsService.getAllAccounts({ type: 'sub' })
            ]);
            setTaxes(taxesRes.taxes || []);
            setAccounts(accountsRes.accounts || []);
        } catch (err) {
            const errorMessage = err.response?.data?.message || t('taxes_settings.error_load');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredTaxes = useMemo(() => {
        if (!searchTerm.trim()) return taxes;
        const term = searchTerm.toLowerCase().trim();
        return taxes.filter(tax =>
            tax.name.toLowerCase().includes(term) ||
            tax.percentage.toString().includes(term)
        );
    }, [taxes, searchTerm]);

    const handleOpenAdd = () => {
        setEditingTax(null);
        setIsModalOpen(true);
    };

    const handleEdit = (tax) => {
        setEditingTax(tax);
        setIsModalOpen(true);
    };

    const handleSave = async (formData) => {
        setSubmitLoading(true);
        try {
            if (editingTax) {
                await taxesService.updateTax(editingTax._id, formData);
                toast.success(t('taxes_settings.success_update'));
            } else {
                await taxesService.createTax(formData);
                toast.success(t('taxes_settings.success_add'));
            }
            await fetchData();
            setIsModalOpen(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || t('taxes_settings.error_save');
            toast.error(errorMessage);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ open: true, id });
    };

    const confirmDelete = async () => {
        setDeleteLoading(true);
        try {
            await taxesService.deleteTax(deleteModal.id);
            toast.success(t('taxes_settings.success_delete'));
            await fetchData();
            setDeleteModal({ open: false, id: null });
        } catch (err) {
            toast.error(t('sales.common.error_message'));
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="p-6 bg-[#F8F9FA] min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Toolbar - Matching Screenshot 1 */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4 order-2 sm:order-1">
                    <div className="flex items-center bg-white border border-gray-200 rounded overflow-hidden h-10 shadow-sm px-2 gap-2">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="text-gray-400 hover:text-gray-600 px-1 border-l border-gray-100 last:border-l-0"
                        >
                            <Home size={18} />
                        </button>
                        <div className="flex items-center text-[#4B5563] font-medium text-sm gap-1">
                            <span className="text-gray-400">{t('taxes_settings.settings')}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-700 font-bold">{t('taxes_settings.title')}</span>
                        </div>
                        <button
                            type="button"
                            onClick={fetchData}
                            disabled={loading}
                            className="text-gray-400 hover:text-gray-600 px-1 border-r border-gray-100 first:border-r-0"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3 order-1 sm:order-2">
                    <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 h-10 rounded hover:bg-indigo-700 transition-colors font-bold shadow-sm text-sm"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>{t('taxes_settings.add_tax')}</span>
                    </button>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white border border-gray-100 rounded shadow-sm overflow-hidden">
                <table className="w-full text-sm text-start">
                    <thead className="bg-[#F9FAFB] text-gray-700 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-start font-bold whitespace-nowrap">{t('taxes_settings.name')}</th>
                            <th className="px-6 py-4 text-center font-bold whitespace-nowrap">{t('taxes_settings.percentage')}</th>
                            <th className="px-6 py-4 text-center font-bold whitespace-nowrap">{t('taxes_settings.is_inclusive')}</th>
                            <th className="px-6 py-4 text-start font-bold"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium font-bold">
                                    {t('sales.common.loading')}
                                </td>
                            </tr>
                        ) : filteredTaxes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium font-bold">
                                    {t('sales.common.empty')}
                                </td>
                            </tr>
                        ) : (
                            filteredTaxes.map((tax) => (
                                <tr key={tax._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-800 font-bold">
                                        {tax.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-bold text-center">
                                        {tax.percentage}%
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-bold text-center">
                                        {tax.isInclusive ? t('taxes_settings.yes') : t('taxes_settings.no')}
                                    </td>
                                    <td className="px-6 py-4 text-start">
                                        <div className="flex items-center gap-4 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(tax)}
                                                className="text-blue-500 hover:text-blue-700 font-bold text-sm"
                                            >
                                                {t('sales.common.edit')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteClick(tax._id)}
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

            <TaxModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingTax}
                accounts={accounts}
                submitLoading={submitLoading}
            />

            <ConfirmDeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null })}
                onConfirm={confirmDelete}
                loading={deleteLoading}
                title={t('taxes_settings.delete_confirm_title')}
                message={t('taxes_settings.delete_confirm_message', { name: taxes.find(t => t._id === deleteModal.id)?.name || '' })}
            />
        </div>
    );
};

export default TaxesSettings;
