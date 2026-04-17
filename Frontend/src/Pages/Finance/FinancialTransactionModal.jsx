import React, { useState, useEffect } from 'react';
import { X, Save, Landmark, Calendar, DollarSign, FileText, ChevronDown, Check, Upload, Trash2, ArrowLeftRight, Plus, Wallet, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import logError from '../../utils/logError';
import costCentersService from '../../services/costCentersService';

const ACCOUNT_TYPE_LABELS = {
    asset: 'أصول',
    liability: 'التزامات',
    equity: 'حقوق الملكية',
    income: 'إيرادات',
    expense: 'مصروفات'
};
const ACCOUNT_TYPE_ORDER = ['asset', 'liability', 'equity', 'income', 'expense'];

const TAX_PRESETS = ['0', '10', '15'];
const normalizeTaxesValue = (raw) => {
    if (raw === null || raw === undefined || raw === '') return '0';
    if (raw === 'none') return '0';
    if (raw === 'vat_14') return '14';
    return String(raw);
};
const getTaxMode = (taxes) => (TAX_PRESETS.includes(String(taxes)) ? String(taxes) : 'custom');

const FinancialTransactionModal = ({ isOpen, onClose, onSave, transactionId = null, initialType = 'receipt', mode = 'add' }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const isEdit = mode === 'edit';
    const isView = mode === 'view';

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit || isView);
    const [accounts, setAccounts] = useState([]); // Safes + Bank Accounts
    const [chartAccounts, setChartAccounts] = useState([]); // Chart of accounts from API
    const [type, setType] = useState(initialType);

    // Extraneous Dropdown states
    const [availableCostCenters, setAvailableCostCenters] = useState([]);
    const [costCentersList, setCostCentersList] = useState([]);
    const [accountSearchTerm, setAccountSearchTerm] = useState('');

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
        taxes: '0',
        taxMode: '0',
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
                    taxes: '0',
                    taxMode: '0',
                    description: '',
                    attachments: []
                });
                setSelectedFiles([]);
            }
        }
    }, [isOpen, transactionId, initialType]);

    const fetchAccounts = async () => {
        try {
            const [safesRes, banksRes, costCentersRes, chartRes] = await Promise.all([
                api.get('/safes'),
                api.get('/bank-accounts'),
                costCentersService.getAllCostCenters().catch(() => ({ data: { costCenters: [] } })),
                api.get('/chart-of-accounts').catch(() => ({ data: { accounts: [] } }))
            ]);

            const safes = (safesRes.data.safes || []).map(s => ({ ...s, model: 'Safe' }));
            const banks = (banksRes.data.data || []).map(b => ({ ...b, model: 'BankAccount' }));

            setAccounts([...safes, ...banks]);
            setChartAccounts(chartRes.data.accounts || chartRes.data.data || []);

            const fetchedCC = costCentersRes.costCenters || costCentersRes.data?.costCenters || costCentersRes.data || [];
            setAvailableCostCenters(Array.isArray(fetchedCC) ? fetchedCC : (fetchedCC.data || []));
        } catch (error) {
            logError('Error fetching accounts:', error);
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
                setCostCentersList(tx.costCentersList || []);
                setFormData({
                    ...tx,
                    _id: undefined,
                    code: `FT-${Date.now().toString().slice(-6)}`,
                    date: new Date().toISOString().split('T')[0],
                    account: tx.account?._id || tx.account || '',
                    fromAccount: tx.fromAccount?._id || tx.fromAccount || '',
                    toAccount: tx.toAccount?._id || tx.toAccount || '',
                    taxes: normalizeTaxesValue(tx.taxes),
                    taxMode: getTaxMode(normalizeTaxesValue(tx.taxes)),
                    attachments: [] // Don't duplicate attachments for now to avoid complexity
                });
            } else {
                setCostCentersList(tx.costCentersList || []);
                setFormData({
                    ...tx,
                    date: new Date(tx.date).toISOString().split('T')[0],
                    account: tx.account?._id || tx.account || '',
                    fromAccount: tx.fromAccount?._id || tx.fromAccount || '',
                    toAccount: tx.toAccount?._id || tx.toAccount || '',
                    taxes: normalizeTaxesValue(tx.taxes),
                    taxMode: getTaxMode(normalizeTaxesValue(tx.taxes))
                });
            }
        } catch (error) {
            logError('Error fetching transaction:', error);
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

    const handleTaxModeChange = (value) => {
        setFormData(prev => ({
            ...prev,
            taxMode: value,
            taxes: value === 'custom' ? prev.taxes : value
        }));
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
            if (key === 'taxMode') return;
            if (key === 'attachments') {
                submitForm.append(key, JSON.stringify(formData[key]));
            } else {
                submitForm.append(key, formData[key]);
            }
        });

        // Append Cost Centers list
        submitForm.append('costCentersList', JSON.stringify(costCentersList));

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
            logError('Error saving transaction:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message');
            toast.error(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getAccountLabel = (id) => {
        const acc = accounts.find(a => a._id === id);
        return acc ? acc.name : (isRtl ? '???? ??????' : 'Choose Account');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200 my-8"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-center bg-white relative">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 absolute left-4">
                        <X size={20} />
                    </button>
                    <h2 className="text-lg font-bold text-gray-800">
                        {isView ? (isRtl ? 'عرض تفاصيل العملية' : 'View Transaction') : (isEdit ? t('finance.edit_transaction') : (
                            type === 'receipt' ? (isRtl ? 'إضافة عملية قبض مالية' : t('finance.add_receipt')) :
                                type === 'disbursement' ? (isRtl ? 'إضافة عملية صرف مالية' : t('finance.add_disbursement')) :
                                    (isRtl ? 'إضافة عملية تحويل مالي' : t('finance.add_transfer'))
                        ))}
                    </h2>
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
                                <label className="block text-sm font-medium text-gray-700 text-right mb-1">
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
                                        className={`w-full px-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-right ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                    />
                                    <Pencil size={16} className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-indigo-500`} />
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 text-right mb-1">
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
                                        className={`w-full px-10 py-2 bg-white border border-indigo-600 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-right ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                    />
                                    <Calendar size={18} className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                                </div>
                            </div>
                        </div>

                        {type === 'transfer' ? (
                            <div className="space-y-4">
                                {/* From Account */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                                        {t('finance.from_safe')} <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        onClick={() => !isView && setActiveDropdown(activeDropdown === 'from' ? null : 'from')}
                                        className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between transition-all ${isView ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-indigo-300'}`}
                                    >
                                        <ChevronDown size={18} className="text-gray-400" />
                                        <span className="text-sm text-gray-800 truncate w-full text-right">
                                            {getAccountLabel(formData.fromAccount)}
                                        </span>
                                    </div>
                                    {activeDropdown === 'from' && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                            {accounts.map(acc => (
                                                <div
                                                    key={acc._id}
                                                    onClick={() => handleAccountSelect('fromAccount', acc)}
                                                    className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between group"
                                                >
                                                    <span className="text-sm text-gray-700 w-full text-right">{acc.name}</span>
                                                    {acc.model === 'Safe' ? <Wallet size={14} className="ml-2 text-gray-400" /> : <Landmark size={14} className="ml-2 text-gray-400" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* To Account */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                                        {t('finance.to_safe')} <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        onClick={() => !isView && setActiveDropdown(activeDropdown === 'to' ? null : 'to')}
                                        className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between transition-all ${isView ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-indigo-300'}`}
                                    >
                                        <ChevronDown size={18} className="text-gray-400" />
                                        <span className="text-sm text-gray-800 truncate w-full text-right">
                                            {getAccountLabel(formData.toAccount)}
                                        </span>
                                    </div>
                                    {activeDropdown === 'to' && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                            {accounts.map(acc => (
                                                <div
                                                    key={acc._id}
                                                    onClick={() => handleAccountSelect('toAccount', acc)}
                                                    className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between group"
                                                >
                                                    <span className="text-sm text-gray-700 w-full text-right">{acc.name}</span>
                                                    {acc.model === 'Safe' ? <Wallet size={14} className="ml-2 text-gray-400" /> : <Landmark size={14} className="ml-2 text-gray-400" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Safe/Bank Account */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                                        {t('finance.safe')} <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        onClick={() => !isView && setActiveDropdown(activeDropdown === 'account' ? null : 'account')}
                                        className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between transition-all ${isView ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-indigo-300'}`}
                                    >
                                        <ChevronDown size={18} className="text-gray-400" />
                                        <span className="text-sm text-gray-800 truncate w-full text-right">
                                            {formData.account ? getAccountLabel(formData.account) : (isRtl ? 'اختر الخزنة' : 'Choose Account')}
                                        </span>
                                    </div>
                                    {activeDropdown === 'account' && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                            {accounts.map(acc => (
                                                <div
                                                    key={acc._id}
                                                    onClick={() => handleAccountSelect('account', acc)}
                                                    className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between group"
                                                >
                                                    <span className="text-sm text-gray-700 w-full text-right">{acc.name}</span>
                                                    {acc.model === 'Safe' ? <Wallet size={14} className="ml-2 text-gray-400" /> : <Landmark size={14} className="ml-2 text-gray-400" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* External Account (Searchable Dropdown) */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                                        {t('finance.account')}
                                    </label>
                                    <div
                                        onClick={() => {
                                            if (!isView) {
                                                setActiveDropdown(activeDropdown === 'externalAccount' ? null : 'externalAccount');
                                                if (activeDropdown !== 'externalAccount') setAccountSearchTerm('');
                                            }
                                        }}
                                        className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between transition-all ${isView ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-indigo-300'}`}
                                    >
                                        <ChevronDown size={18} className="text-gray-400" />
                                        <span className="text-sm text-gray-800 truncate w-full text-right">
                                            {PREDEFINED_ACCOUNTS.find(a => a.name === formData.externalAccount)?.name || formData.externalAccount || (isRtl ? 'اختر حساب' : 'Select Account')}
                                        </span>
                                    </div>
                                    {activeDropdown === 'externalAccount' && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-72 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-2 border-b border-gray-100">
                                                <input
                                                    type="text"
                                                    value={accountSearchTerm}
                                                    autoFocus
                                                    onChange={(e) => setAccountSearchTerm(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    placeholder={isRtl ? 'ابحث عن حساب...' : 'Search accounts...'}
                                                    className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-right"
                                                    dir="rtl"
                                                />
                                            </div>
                                            <div className="overflow-y-auto py-1">
                                                {ACCOUNT_TYPE_ORDER.map(typeKey => {
                                                    const group = chartAccounts.filter(a =>
                                                        a.accountCategory === typeKey &&
                                                        (`${a.name} #${a.code}`).toLowerCase().includes(accountSearchTerm.toLowerCase())
                                                    );
                                                    if (group.length === 0) return null;
                                                    return (
                                                        <div key={typeKey}>
                                                            <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                                                                {ACCOUNT_TYPE_LABELS[typeKey]}
                                                            </div>
                                                            {group.map(acc => (
                                                                <div
                                                                    key={acc._id || acc.code}
                                                                    onClick={() => {
                                                                        setFormData(prev => ({ ...prev, externalAccount: `${acc.name} #${acc.code}` }));
                                                                        setActiveDropdown(null);
                                                                    }}
                                                                    className={`px-4 py-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center ${formData.externalAccount === `${acc.name} #${acc.code}` ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-gray-700'}`}
                                                                >
                                                                    <span className="text-xs text-gray-400 font-mono">{acc.code}</span>
                                                                    <span className="text-sm font-medium text-right">{acc.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                                {chartAccounts.length === 0 && (
                                                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                                                        {isRtl ? 'لا توجد حسابات' : 'No accounts found'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Cost Centers */}
                        {type !== 'transfer' && (
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                                    {isRtl ? 'مراكز التكلفة' : 'Cost Centers'}
                                </label>
                                {!isView && (
                                    <div className="relative mb-2">
                                        <input
                                            type="text"
                                            readOnly
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 cursor-pointer text-right"
                                            placeholder={isRtl ? 'إضافة مركز تكلفة' : 'Add Cost Center'}
                                            onClick={() => setCostCentersList(prev => [...prev, { costCenter: '', value: '' }])}
                                            dir="rtl"
                                        />
                                        <ChevronDown size={14} className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    {costCentersList.map((cc, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <div className="flex-1 relative">
                                                <select
                                                    value={cc.costCenter}
                                                    onChange={(e) => {
                                                        const newList = [...costCentersList];
                                                        newList[idx].costCenter = e.target.value;
                                                        setCostCentersList(newList);
                                                    }}
                                                    disabled={isView}
                                                    className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none text-right ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                                    dir="rtl"
                                                >
                                                    <option value="">{isRtl ? 'اختر مركز التكلفة' : 'Select Cost Center'}</option>
                                                    {availableCostCenters.map(acc => (
                                                        <option key={acc._id} value={acc._id}>{acc.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                                            </div>
                                            <div className="w-1/3">
                                                <input
                                                    type="number"
                                                    value={cc.value}
                                                    placeholder={isRtl ? 'النسبة أو المبلغ' : 'Percentage or Amount'}
                                                    onChange={(e) => {
                                                        const newList = [...costCentersList];
                                                        newList[idx].value = e.target.value;
                                                        setCostCentersList(newList);
                                                    }}
                                                    disabled={isView}
                                                    className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-right ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                                    dir="rtl"
                                                />
                                            </div>
                                            {!isView && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newList = [...costCentersList];
                                                        newList.splice(idx, 1);
                                                        setCostCentersList(newList);
                                                    }}
                                                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Amount */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                                    {t('finance.amount')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    disabled={isView}
                                    className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-right ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                    dir="rtl"
                                />
                            </div>

                            {/* Taxes */}
                            {type !== 'transfer' && (
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                                        {t('finance.taxes')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="taxes"
                                            value={formData.taxMode || getTaxMode(normalizeTaxesValue(formData.taxes))}
                                            onChange={(e) => handleTaxModeChange(e.target.value)}
                                            disabled={isView}
                                            className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                        >
                                            <option value="0">{isRtl ? 'بدون ضرائب' : 'No Taxes'}</option>
                                            <option value="10">10%</option>
                                            <option value="15">15%</option>
                                            <option value="custom">{isRtl ? 'مخصص' : 'Custom'}</option>
                                        </select>
                                        <ChevronDown size={18} className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                                    </div>
                                    {(formData.taxMode || getTaxMode(normalizeTaxesValue(formData.taxes))) === 'custom' && (
                                        <input
                                            type="number"
                                            name="taxes"
                                            value={normalizeTaxesValue(formData.taxes)}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.01"
                                            disabled={isView}
                                            className={`mt-2 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-right ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                            dir="rtl"
                                            placeholder="%"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                                {t('finance.description')}
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                                disabled={isView}
                                className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none text-right ${isView ? 'cursor-not-allowed opacity-75' : ''}`}
                                dir="rtl"
                            />
                        </div>

                        {/* Attachments */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                                {t('finance.attachments')}
                            </label>
                            {!isView && (
                                <div className="mt-1 border border-dashed border-gray-300 bg-gray-50 rounded-lg p-6 transition-colors hover:border-indigo-400 group relative">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <Upload className="h-8 w-8 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                        <p className="text-xs font-medium text-indigo-600">
                                            {isRtl ? 'اضغط لرفع الملفات أو اسحبها هنا' : 'Click to upload or drag it here'}
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

                        <div className="flex items-center justify-center gap-3 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 min-w-[100px] justify-center"
                            >
                                {loading ? t('sales.common.saving') : t('sales.common.save')}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all min-w-[100px] justify-center"
                            >
                                {isView ? t('sales.common.close') : t('sales.common.cancel')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default FinancialTransactionModal;
