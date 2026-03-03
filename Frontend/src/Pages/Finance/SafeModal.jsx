import React, { useState, useEffect } from 'react';
import { X, Save, Building, Landmark, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import logError from '../../utils/logError';

const SafeModal = ({ isOpen, onClose, onSave, safeId = null }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const isEdit = !!safeId;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [branches, setBranches] = useState([]);
    const [users, setUsers] = useState([]);

    // Dropdown state for design matching
    const [activeDropdown, setActiveDropdown] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        accountNumber: '',
        branches: ['main'],
        users: [],
        enableReceiptPermissions: false,
        enablePaymentPermissions: false,
        balance: 0
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            if (isEdit) {
                fetchSafeData();
            } else {
                setFormData({
                    name: '',
                    accountNumber: '',
                    branches: ['main'],
                    users: [],
                    enableReceiptPermissions: false,
                    enablePaymentPermissions: false,
                    balance: 0
                });
            }
        }
    }, [isOpen, safeId]);

    const fetchInitialData = async () => {
        try {
            const [branchesRes, usersRes] = await Promise.all([
                api.get('/branches'),
                api.get('/users')
            ]);
            setBranches(branchesRes.data.branches || []);
            setUsers(usersRes.data.users || []);
        } catch (error) {
            logError('Error fetching initial data:', error);
        }
    };

    const fetchSafeData = async () => {
        try {
            setFetching(true);
            const response = await api.get(`/safes/${safeId}`);
            const safe = response.data.safe;
            setFormData({
                name: safe.name || '',
                accountNumber: safe.accountNumber || '',
                branches: safe.branches || ['main'],
                users: safe.users?.map(u => typeof u === 'object' ? u._id : u) || [],
                enableReceiptPermissions: safe.enableReceiptPermissions || false,
                enablePaymentPermissions: safe.enablePaymentPermissions || false,
                balance: safe.balance || 0
            });
        } catch (error) {
            logError('Error fetching safe:', error);
            toast.error(t('sales.common.error_message'));
            onClose();
        } finally {
            setFetching(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const toggleUser = (userId) => {
        setFormData(prev => {
            const currentUsers = [...prev.users];
            if (currentUsers.includes(userId)) {
                return { ...prev, users: currentUsers.filter(id => id !== userId) };
            } else {
                return { ...prev, users: [...currentUsers, userId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const submitData = {
            ...formData,
            name: formData.name.trim(),
            balance: Number(formData.balance || 0),
            users: formData.users.filter(Boolean),
            branches: ['main'] // Enforce main branch
        };

        try {
            if (isEdit) {
                await api.put(`/safes/${safeId}`, submitData);
            } else {
                await api.post('/safes', submitData);
            }
            toast.success(t('sales.common.success_message'));
            onSave();
            onClose();
        } catch (error) {
            logError('Error saving safe:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message');
            toast.error(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Landmark size={22} className="text-indigo-600" />
                        {isEdit ? t('safes_page.edit_safe') : t('safes_page.add_cash_safe')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {fetching ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                                {t('safes_page.name')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                placeholder={t('safes_page.name')}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                            />
                        </div>

                        {/* Account Account (Design matching) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                {t('safes_page.account')}
                            </label>
                            <div className="relative">
                                <select
                                    name="accountNumber"
                                    value={formData.accountNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none font-medium text-gray-800"
                                >
                                    <option value="">{t('safes_page.new_account')}</option>
                                    <option value="main_treasury">{isRtl ? 'الخزنة الرئيسية' : 'Main Treasury'}</option>
                                    <option value="main_bank">{isRtl ? 'الحساب البنكي الرئيسي' : 'Main Bank Account'}</option>
                                </select>
                                <ChevronDown className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} size={18} />
                            </div>
                        </div>

                        {/* Branches (Restricted to Main with consistent UI) */}
                        <div className="relative">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                {t('safes_page.branches')}
                            </label>
                            <div
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between cursor-not-allowed opacity-80"
                            >
                                <span className="text-sm font-medium text-gray-800">
                                    {isRtl ? 'الفرع الرئيسي' : 'Main Branch'}
                                </span>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                                    {isRtl ? 'افتراضي' : 'Default'}
                                </span>
                            </div>
                        </div>

                        {/* Users (Dropdown Multi-select as in BankAccountModal) */}
                        <div className="relative">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                {t('safes_page.users')}
                            </label>
                            <div
                                onClick={() => setActiveDropdown(activeDropdown === 'users' ? null : 'users')}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all"
                            >
                                <span className="text-sm font-medium text-gray-600 truncate max-w-[85%]">
                                    {formData.users.length > 0
                                        ? users.filter(u => formData.users.includes(u._id)).map(u => u.name).join(', ')
                                        : (isRtl ? 'اختر المستخدمين' : 'Choose users')}
                                </span>
                                <ChevronDown className={`text-gray-400 transition-transform ${activeDropdown === 'users' ? 'rotate-180' : ''}`} size={18} />
                            </div>

                            {activeDropdown === 'users' && (
                                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                    {users.length > 0 ? users.map(user => (
                                        <div
                                            key={user._id}
                                            onClick={() => toggleUser(user._id)}
                                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex items-center justify-between group transition-colors border-b border-gray-50 last:border-0"
                                        >
                                            <span className={`text-sm ${formData.users.includes(user._id) ? 'font-bold text-indigo-600' : 'text-gray-700'}`}>
                                                {user.name}
                                            </span>
                                            {formData.users.includes(user._id) && <Check size={16} className="text-indigo-600" />}
                                        </div>
                                    )) : (
                                        <div className="px-4 py-3 text-sm text-gray-400 italic">
                                            {t('sales.common.none')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Checkboxes */}
                        <div className="space-y-3 pt-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="enableReceiptPermissions"
                                    checked={formData.enableReceiptPermissions}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                                    {t('safes_page.enable_receipt_vouchers')}
                                </span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="enablePaymentPermissions"
                                    checked={formData.enablePaymentPermissions}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                                    {t('safes_page.enable_payment_vouchers')}
                                </span>
                            </label>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl transition-all"
                            >
                                {t('sales.common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? t('sales.common.saving') : t('sales.common.save')}
                                {!loading && <Save size={18} />}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SafeModal;
