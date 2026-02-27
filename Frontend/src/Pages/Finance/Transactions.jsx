import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, RefreshCw, Landmark, ArrowLeftRight, Edit, Trash2, ChevronDown, Wallet, FileText, MoreVertical, Copy, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { confirmDelete } from '../../utils/confirmDelete';
import FinancialTransactionModal from './FinancialTransactionModal';

const Transactions = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('receipt');
    const [editingId, setEditingId] = useState(null);
    const [modalMode, setModalMode] = useState('add');
    const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
    const [openActionMenu, setOpenActionMenu] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/financial-transactions');
            setTransactions(response.data.transactions || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (tx) => {
        const confirmed = await confirmDelete({ title: t('sales.common.confirm_delete', 'Confirm Delete'), message: t('sales.common.confirm_delete'), confirmText: t('sales.common.confirm', 'Confirm'), cancelText: t('sales.common.cancel') });
        if (!confirmed) return;
        try {
            await api.delete(`/financial-transactions/${tx._id}?type=${tx.type}`);
            toast.success(t('sales.common.success_message'));
            fetchTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error(t('sales.common.error_message'));
        }
    };

    const openAddModal = (type) => {
        setModalType(type);
        setEditingId(null);
        setModalMode('add');
        setIsModalOpen(true);
        setIsAddDropdownOpen(false);
    };

    const handleEdit = (tx) => {
        setEditingId(tx._id);
        setModalType(tx.type);
        setModalMode('edit');
        setIsModalOpen(true);
        setOpenActionMenu(null);
    };

    const handleView = (tx) => {
        setEditingId(tx._id);
        setModalType(tx.type);
        setModalMode('view');
        setIsModalOpen(true);
        setOpenActionMenu(null);
    };

    const handleDuplicate = (tx) => {
        setEditingId(tx._id);
        setModalType(tx.type);
        setModalMode('add'); // Pre-fill but treated as a new entry
        setIsModalOpen(true);
        setOpenActionMenu(null);
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'receipt': return t('finance.receipt');
            case 'disbursement': return t('finance.disbursement');
            case 'transfer': return t('finance.transfer');
            default: return type;
        }
    };

    const getTypeStyle = (type) => {
        switch (type) {
            case 'receipt': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'disbursement': return 'bg-red-50 text-red-700 border-red-100';
            case 'transfer': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const filteredTransactions = transactions.filter(tx =>
        tx.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.externalAccount?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                    <input
                        type="text"
                        placeholder={t('sales.common.search_filter')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm shadow-sm`}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={fetchTransactions}
                        className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                        title={t('sales.common.refresh')}
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <div className="relative flex-1 sm:flex-none">
                        <button
                            onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold gap-2"
                        >
                            <Plus size={20} />
                            {t('finance.add_transaction')}
                            <ChevronDown size={14} className={`transition-transform ${isAddDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isAddDropdownOpen && (
                            <div className={`absolute z-20 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${isRtl ? 'left-0' : 'right-0'}`}>
                                <button
                                    onClick={() => openAddModal('receipt')}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-gray-700 text-sm font-medium border-b border-gray-50 group"
                                >
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <Landmark size={18} />
                                    </div>
                                    {t('finance.receipt')}
                                </button>
                                <button
                                    onClick={() => openAddModal('disbursement')}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-gray-700 text-sm font-medium border-b border-gray-50 group"
                                >
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                                        <Landmark size={18} />
                                    </div>
                                    {t('finance.disbursement')}
                                </button>
                                <button
                                    onClick={() => openAddModal('transfer')}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-gray-700 text-sm font-medium group"
                                >
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <ArrowLeftRight size={18} />
                                    </div>
                                    {t('finance.transfer')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="mx-auto max-w-7xl flex flex-col">
                <div className="-my-2 -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-auto">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg overflow-hidden border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className={`whitespace-nowrap text-start text-sm font-bold text-gray-900 py-3.5 ${isRtl ? 'pr-4 sm:pr-6 pl-3' : 'pl-4 sm:pl-6 pr-3'}`}>
                                            {t('sales.common.actions')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-bold text-gray-900 px-3 py-3.5">
                                            {t('finance.code')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-bold text-gray-900 px-3 py-3.5">
                                            {t('finance.date')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-bold text-gray-900 px-3 py-3.5">
                                            {t('sales.common.status')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-bold text-gray-900 px-3 py-3.5">
                                            {t('finance.type')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-bold text-gray-900 px-3 py-3.5">
                                            {t('finance.account')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-bold text-gray-900 px-3 py-3.5">
                                            {t('finance.amount')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="py-10">
                                                <div className="flex justify-center flex-col items-center gap-2">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                                                    <span className="text-xs text-gray-500 font-medium">{t('sales.common.loading')}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="p-4 bg-gray-50 rounded-full text-gray-300">
                                                        <FileText size={40} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-bold text-gray-900">{t('finance_page.no_transactions')}</h3>
                                                        <p className="text-sm text-gray-500 mt-1">{t('finance_page.no_transactions_desc')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map((tx) => (
                                            <tr key={tx._id} className="hover:bg-gray-50 transition-colors group">
                                                <td className={`align-middle text-sm whitespace-nowrap text-start py-4 ${isRtl ? 'pr-4 sm:pr-6 pl-3' : 'pl-4 sm:pl-6 pr-3'}`}>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setOpenActionMenu(openActionMenu === tx._id ? null : tx._id)}
                                                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>

                                                        {openActionMenu === tx._id && (
                                                            <div className={`absolute ${isRtl ? 'right-0' : 'left-0'} mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden`}>
                                                                <button
                                                                    onClick={() => handleView(tx)}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                                                >
                                                                    <Eye size={16} className="text-indigo-600" />
                                                                    <span>{t('sales.common.view')}</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEdit(tx)}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                                                >
                                                                    <Edit size={16} className="text-emerald-600" />
                                                                    <span>{t('sales.common.edit')}</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDuplicate(tx)}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                                                >
                                                                    <Copy size={16} className="text-blue-600" />
                                                                    <span>{t('sales.common.duplicate')}</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(tx)}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                    <span>{t('sales.common.delete')}</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-indigo-600 font-bold">
                                                    #{tx.code}
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-600">
                                                    {new Date(tx.date).toLocaleDateString(i18n.language)}
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase`}>
                                                        {t('sales.common.posted')}
                                                    </span>
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getTypeStyle(tx.type)}`}>
                                                        {getTypeLabel(tx.type)}
                                                    </span>
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">
                                                            {tx.type === 'transfer'
                                                                ? `${tx.fromAccount?.name || '-'} → ${tx.toAccount?.name || '-'}`
                                                                : (tx.account?.name || '-')}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                                                            {tx.description || '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-900 font-black">
                                                    {Number(tx.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('currency_label')}
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

            <FinancialTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchTransactions}
                transactionId={editingId}
                initialType={modalType}
                mode={modalMode}
            />
        </div>
    );
};

export default Transactions;

