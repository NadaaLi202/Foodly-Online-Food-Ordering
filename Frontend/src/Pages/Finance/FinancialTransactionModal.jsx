import React, { useState, useEffect } from 'react';
import { X, Save, Landmark, Calendar, DollarSign, FileText, ChevronDown, Check, Upload, Trash2, ArrowLeftRight, Plus, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const FinancialTransactionModal = ({ isOpen, onClose, onSave, transactionId = null, initialType = 'receipt', mode = 'add' }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const isEdit = mode === 'edit';
    const isView = mode === 'view';

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit || isView);
    const [accounts, setAccounts] = useState([]); // Safes + Bank Accounts
    const [type, setType] = useState(initialType);

    const [activeDropdown, setActiveDropdown] = useState(null);

    const [formData, setFormData] = useState({
        code: `FT-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        type: initialType,
        account: '',
        accountModel: 'Safe',
        fromAccount: '',
        fromAccountModel: 'Safe',
        toAccount: '',
        toAccountModel: 'Safe',
        externalAccount: '',
        amount: '',
        taxes: 'none',
        description: '',
        attachments: []
    });

    const [selectedFiles, setSelectedFiles] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchAccounts();
            if (isEdit || isView) {
                fetchTransactionData();
            } else {
                setType(initialType);
                setFormData({
                    code: `FT-${Date.now().toString().slice(-6)}`,
                    date: new Date().toISOString().split('T')[0],
                    type: initialType,
                    account: '',
                    accountModel: 'Safe',
                    fromAccount: '',
                    fromAccountModel: 'Safe',
                    toAccount: '',
                    toAccountModel: 'Safe',
                    externalAccount: '',
                    amount: '',
                    taxes: 'none',
                    description: '',
                    attachments: []
                });
                setSelectedFiles([]);
            }
        }
    }, [isOpen, transactionId, initialType]);

    const fetchAccounts = async () => {
        try {
            const [safesRes, banksRes] = await Promise.all([
                api.get('/safes'),
                api.get('/bank-accounts')
            ]);

            const safes = (safesRes.data.safes || []).map(s => ({ ...s, model: 'Safe' }));
            const banks = (banksRes.data.data || []).map(b => ({ ...b, model: 'BankAccount' }));

            setAccounts([...safes, ...banks]);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const fetchTransactionData = async () => {
        try {
            setFetching(true);
            const response = await api.get(`/financial-transactions/${transactionId}?type=${initialType}`);
            const tx = response.data.transaction;

            setType(tx.type || initialType);
            if (mode === 'add') {
                // Duplication logic
                setFormData({
                    ...tx,
                    _id: undefined,
                    code: `FT-${Date.now().toString().slice(-6)}`,
                    date: new Date().toISOString().split('T')[0],
                    account: tx.account?._id || tx.account || '',
                    fromAccount: tx.fromAccount?._id || tx.fromAccount || '',
                    toAccount: tx.toAccount?._id || tx.toAccount || '',
                    attachments: [] // Don't duplicate attachments for now to avoid complexity
                });
            } else {
                setFormData({
                    ...tx,
                    date: new Date(tx.date).toISOString().split('T')[0],
                    account: tx.account?._id || tx.account || '',
                    fromAccount: tx.fromAccount?._id || tx.fromAccount || '',
                    toAccount: tx.toAccount?._id || tx.toAccount || ''
                });
            }
        } catch (error) {
            console.error('Error fetching transaction:', error);
            toast.error(t('sales.common.error_message'));
            onClose();
        } finally {
            setFetching(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAccountSelect = (field, account) => {
        setFormData(prev => ({
            ...prev,
            [field]: account._id,
            [`${field}Model`]: account.model
        }));
        setActiveDropdown(null);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeNewFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingAttachment = (publicId) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter(a => a.publicId !== publicId)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const submitForm = new FormData();

        // Append all fields
        Object.keys(formData).forEach(key => {
            if (key === 'attachments') {
                submitForm.append(key, JSON.stringify(formData[key]));
            } else {
                submitForm.append(key, formData[key]);
            }
        });

        // Append new files
        selectedFiles.forEach(file => {
            submitForm.append('attachments', file);
        });

        try {
            if (isEdit) {
                await api.patch(`/financial-transactions/${transactionId}`, submitForm, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // If it's view mode and they somehow submit, treat as add or ignore? 
                // But button is hidden in view mode.
                await api.post('/financial-transactions', submitForm, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            toast.success(t('sales.common.success_message'));
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving transaction:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message');
            toast.error(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getAccountLabel = (id) => {
        const acc = accounts.find(a => a._id === id);
        return acc ? acc.name : (isRtl ? 'اختر الحساب' : 'Choose Account');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200 my-8"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {type === 'receipt' && <Landmark size={22} className="text-emerald-600" />}
                        {type === 'disbursement' && <Landmark size={22} className="text-red-600" />}
                        {type === 'transfer' && <ArrowLeftRight size={22} className="text-indigo-600" />}
                        {isView ? (isRtl ? 'عرض عملية مالية' : 'View Transaction') : (isEdit ? t('finance.edit_transaction') : (
                            type === 'receipt' ? t('finance.add_receipt') :
                                type === 'disbursement' ? t('finance.add_disbursement') :
                                    t('finance.add_transfer')
                        ))}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {fetching ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Code */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    {t('finance.code')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isView}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                    />
                                    <FileText size={18} className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    {t('finance.date')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isView}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                    />
                                    <Calendar size={18} className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                                </div>
                            </div>
                        </div>

                        {type === 'transfer' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* From Account */}
                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        {t('finance.from_safe')} <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        onClick={() => !isView && setActiveDropdown(activeDropdown === 'from' ? null : 'from')}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between transition-all ${isView ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-indigo-300'}`}
                                    >
                                        <span className="text-sm font-medium text-gray-800 truncate">
                                            {getAccountLabel(formData.fromAccount)}
                                        </span>
                                        <ChevronDown size={18} className="text-gray-400" />
                                    </div>
                                    {activeDropdown === 'from' && (
                                        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                            {accounts.map(acc => (
                                                <div
                                                    key={acc._id}
                                                    onClick={() => handleAccountSelect('fromAccount', acc)}
                                                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex items-center justify-between group"
                                                >
                                                    <span className="text-sm text-gray-700">{acc.name}</span>
                                                    {acc.model === 'Safe' ? <Wallet size={14} className="text-gray-400" /> : <Landmark size={14} className="text-gray-400" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* To Account */}
                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        {t('finance.to_safe')} <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        onClick={() => !isView && setActiveDropdown(activeDropdown === 'to' ? null : 'to')}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between transition-all ${isView ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-indigo-300'}`}
                                    >
                                        <span className="text-sm font-medium text-gray-800 truncate">
                                            {getAccountLabel(formData.toAccount)}
                                        </span>
                                        <ChevronDown size={18} className="text-gray-400" />
                                    </div>
                                    {activeDropdown === 'to' && (
                                        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                            {accounts.map(acc => (
                                                <div
                                                    key={acc._id}
                                                    onClick={() => handleAccountSelect('toAccount', acc)}
                                                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex items-center justify-between group"
                                                >
                                                    <span className="text-sm text-gray-700">{acc.name}</span>
                                                    {acc.model === 'Safe' ? <Wallet size={14} className="text-gray-400" /> : <Landmark size={14} className="text-gray-400" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Safe/Bank Account */}
                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        {t('finance.safe')} <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        onClick={() => !isView && setActiveDropdown(activeDropdown === 'account' ? null : 'account')}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between transition-all ${isView ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-indigo-300'}`}
                                    >
                                        <span className="text-sm font-medium text-gray-800 truncate">
                                            {getAccountLabel(formData.account)}
                                        </span>
                                        <ChevronDown size={18} className="text-gray-400" />
                                    </div>
                                    {activeDropdown === 'account' && (
                                        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                            {accounts.map(acc => (
                                                <div
                                                    key={acc._id}
                                                    onClick={() => handleAccountSelect('account', acc)}
                                                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex items-center justify-between group"
                                                >
                                                    <span className="text-sm text-gray-700">{acc.name}</span>
                                                    {acc.model === 'Safe' ? <Wallet size={14} className="text-gray-400" /> : <Landmark size={14} className="text-gray-400" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* External Account (GL or Contact) */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        {t('finance.account')}
                                    </label>
                                    <input
                                        type="text"
                                        name="externalAccount"
                                        value={formData.externalAccount}
                                        onChange={handleInputChange}
                                        placeholder={isRtl ? 'اختر حساب' : 'Choose Account'}
                                        disabled={isView}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Amount */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    {t('finance.amount')} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        step="0.01"
                                        disabled={isView}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                    />
                                    <DollarSign size={18} className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
                                </div>
                            </div>

                            {/* Taxes (Disabled or Select as in screenshot) */}
                            {type !== 'transfer' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        {t('finance.taxes')}
                                    </label>
                                    <select
                                        name="taxes"
                                        value={formData.taxes}
                                        onChange={handleInputChange}
                                        disabled={isView}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                    >
                                        <option value="none">{isRtl ? 'بدون ضرائب' : 'No Taxes'}</option>
                                        <option value="vat_14">VAT 14%</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                {t('finance.description')}
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                                disabled={isView}
                                className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                            />
                        </div>

                        {/* Attachments */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                {t('finance.attachments')}
                            </label>
                            {!isView && (
                                <div className="mt-1 border-2 border-dashed border-gray-200 rounded-2xl p-6 transition-colors hover:border-indigo-400 group relative">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <Upload className="h-8 w-8 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                        <p className="text-sm font-medium text-indigo-600">
                                            {isRtl ? 'اضغط لرفع الملفات أو اسحبها هنا' : 'Click to upload or drag and drop'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* File List */}
                            <div className="mt-3 space-y-2">
                                {/* Existing Attachments */}
                                {formData.attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                        <span className="text-xs font-medium text-indigo-700 truncate max-w-[80%]">{file.fileName}</span>
                                        <button type="button" onClick={() => !isView && removeExistingAttachment(file.publicId)} className={`p-1 hover:bg-indigo-200 rounded-md text-red-500 ${isView ? 'hidden' : ''}`}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {/* New Selected Files */}
                                {selectedFiles.map((file, idx) => (
                                    <div key={`new-${idx}`} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <span className="text-xs font-medium text-emerald-700 truncate max-w-[80%]">{file.name}</span>
                                        <button type="button" onClick={() => removeNewFile(idx)} className="p-1 hover:bg-emerald-200 rounded-md text-red-500">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl transition-all"
                            >
                                {isView ? t('sales.common.close') : t('sales.common.cancel')}
                            </button>
                            {!isView && (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-2.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? t('sales.common.saving') : t('sales.common.save')}
                                    {!loading && <Save size={18} />}
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default FinancialTransactionModal;
