import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Edit, Trash2, FileText, Plus, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import logError from '../../utils/logError';
import { confirmDelete } from '../../utils/confirmDelete';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currencyFormatter';
import SafeModal from './SafeModal';

const Safes = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { companySettings } = useAuth();
    const currency = companySettings?.currency || 'EGP';
    const [safes, setSafes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const fetchSafes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/safes');
            setSafes(response.data.safes || []);
        } catch (error) {
            logError('Error fetching safes:', error);
            toast.error(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSafes();
    }, []);

    const handleDelete = async (safe) => {
        if (safe.isDefault) {
            toast.error(i18n.language === 'ar' ? 'لا يمكن حذف الخزنة الرئيسية' : 'Cannot delete the main safe');
            return;
        }
        const confirmed = await confirmDelete({ title: t('sales.common.confirm_delete', 'Confirm Delete'), message: t('sales.common.confirm_delete'), confirmText: t('sales.common.confirm', 'Confirm'), cancelText: t('sales.common.cancel') });
        if (!confirmed) return;
        try {
            await api.delete(`/safes/${safe._id}`);
            toast.success(t('sales.common.success_message'));
            fetchSafes();
        } catch (error) {
            logError('Error deleting safe:', error);
            toast.error(error.response?.data?.message || t('sales.common.error_message'));
        }
    };

    const handleAdd = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    const isRtl = i18n.language === 'ar';

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex justify-end mb-4 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <Plus className={`${isRtl ? 'ml-2 -mr-1' : '-ml-1 mr-2'} h-5 w-5`} aria-hidden="true" />
                    {t('safes_page.add_safe')}
                </button>
            </div>

            <div className="mx-auto max-w-7xl flex flex-col">
                <div className="-my-2 -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-auto">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg overflow-hidden border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 py-3.5 ps-4 sm:ps-6 pe-3">
                                            {t('safes_page.name')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('safes_page.branches')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('safes_page.users')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('safes_page.permissions')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('safes_page.trustees')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('safes_page.balance')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('safes_page.account_statement')}
                                        </th>
                                        <th scope="col" className="relative py-3.5 ps-3 pe-4 sm:pe-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {safes.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-10 text-center text-gray-500">
                                                {t('safes_page.no_items')}
                                            </td>
                                        </tr>
                                    ) : (
                                        safes.map((safe) => (
                                            <tr key={safe._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="align-middle text-sm whitespace-nowrap text-start py-4 ps-4 pe-3 sm:ps-6 text-gray-900 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Landmark size={18} className="text-gray-400" />
                                                        <div className="flex flex-col">
                                                            <span>{safe.name}</span>
                                                            {safe.journalAccount && (
                                                                <span className="text-[10px] text-gray-400 font-mono">
                                                                    {safe.journalAccount.name} #{safe.journalAccount.code}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700">
                                                    {safe.branches && safe.branches.length > 0 ? safe.branches.join(', ') : 'Main'}
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700">
                                                    {safe.users && safe.users.length > 0 ? safe.users.map(user => user.name).join(', ') : '-'}
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700">
                                                    <div className="flex flex-col gap-1">
                                                        {safe.enableReceiptPermissions && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Receipt</span>}
                                                        {safe.enablePaymentPermissions && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Payment</span>}
                                                        {!safe.enableReceiptPermissions && !safe.enablePaymentPermissions && <span className="text-gray-400">-</span>}
                                                    </div>
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700">
                                                    {safe.custodians && safe.custodians.length > 0 ? safe.custodians.join(', ') : '-'}
                                                </td>
                                                <td className={`align-middle text-sm whitespace-nowrap px-3 py-4 font-bold ${safe.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {formatCurrency(safe.balance || 0, currency)}
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700">
                                                    <button
                                                        onClick={() => {
                                                            if (safe.journalAccount) {
                                                                const jAccountId = safe.journalAccount?._id || safe.journalAccount;
                                                                navigate(`/dashboard/reports/accounting/general-ledger?journal_account_id=${jAccountId}`);
                                                            } else {
                                                                toast.error(isRtl ? 'يرجى ربط الحساب المحاسبي من تعديل الخزنة أولاً' : 'Please link an accounting account from Edit Safe first');
                                                            }
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 transition-colors"
                                                    >
                                                        <FileText size={18} />
                                                        <span className="hidden sm:inline">{t('safes_page.account_statement')}</span>
                                                    </button>
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap text-end py-4 ps-3 pe-4 sm:pe-6 text-gray-700 relative font-medium">
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={() => handleEdit(safe._id)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                                                            title={t('sales.common.edit')}
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        {!safe.isDefault && (
                                                            <button
                                                                onClick={() => handleDelete(safe)}
                                                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                                                title={t('sales.common.delete')}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <SafeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchSafes}
                safeId={editingId}
            />
        </div>
    );
};

export default Safes;

