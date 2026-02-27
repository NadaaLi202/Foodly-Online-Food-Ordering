import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Edit, Trash2, FileText, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { confirmDelete } from '../../utils/confirmDelete';
import BankAccountModal from './BankAccountModal';

const BankAccounts = () => {
    const { t, i18n } = useTranslation();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/bank-accounts');
            setAccounts(response.data.bankAccounts || []);
        } catch (error) {
            console.error('Error fetching bank accounts:', error);
            toast.error(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleDelete = async (id) => {
        const confirmed = await confirmDelete({ title: t('sales.common.confirm_delete', 'Confirm Delete'), message: t('sales.common.confirm_delete'), confirmText: t('sales.common.confirm', 'Confirm'), cancelText: t('sales.common.cancel') });
        if (!confirmed) return;
        try {
            await api.delete(`/bank-accounts/${id}`);
            toast.success(t('sales.common.success_message'));
            fetchAccounts();
        } catch (error) {
            console.error('Error deleting bank account:', error);
            toast.error(t('sales.common.error_message'));
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
                    {t('bank_accounts_page.add_account')}
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
                                            {t('bank_accounts_page.name')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('bank_accounts_page.account_number')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('bank_accounts_page.balance')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('bank_accounts_page.general_ledger')}
                                        </th>
                                        <th scope="col" className="relative py-3.5 ps-3 pe-4 sm:pe-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {accounts.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-10 text-center text-gray-500">
                                                {t('bank_accounts_page.no_items')}
                                            </td>
                                        </tr>
                                    ) : (
                                        accounts.map((account) => (
                                            <tr key={account._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="align-middle text-sm whitespace-nowrap text-start py-4 ps-4 pe-3 sm:ps-6 text-gray-900 font-medium">
                                                    {account.name}
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700">
                                                    {account.accountNumber || '-'}
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700 font-semibold">
                                                    {account.balance?.toLocaleString()} {t('currency_label')}
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700">
                                                    <Link
                                                        to={`/dashboard/reports/accounting/general-ledger?journal_account_id=${account._id}`}
                                                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                                                    >
                                                        <FileText size={18} />
                                                        <span className="hidden sm:inline">{t('bank_accounts_page.general_ledger')}</span>
                                                    </Link>
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap text-end py-4 ps-3 pe-4 sm:pe-6 text-gray-700 relative font-medium">
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={() => handleEdit(account._id)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                                                            title={t('sales.common.edit')}
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(account._id)}
                                                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                                            title={t('sales.common.delete')}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
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

            <BankAccountModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchAccounts}
                accountId={editingId}
            />
        </div>
    );
};

export default BankAccounts;

