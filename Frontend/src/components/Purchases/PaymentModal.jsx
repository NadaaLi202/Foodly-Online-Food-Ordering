import React, { useState, useEffect } from 'react';
import { X, Calendar, User, DollarSign, FileText, CheckCircle, Clock, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import logError from '../../utils/logerror';

const PaymentModal = ({ isOpen, onClose, payment, onSave }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [safes, setSafes] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    // Form State
    const [formData, setFormData] = useState({
        contact: '',
        date: new Date().toISOString().split('T')[0],
        operationType: 'spend',
        treasury: '',
        treasuryType: 'safe',
        amount: '',
        notes: ''
    });

    const [errors, setErrors] = useState({});

    // Load Suppliers on mount
    useEffect(() => {
        if (isOpen) {
            fetchSuppliers();
            fetchAccounts();
        }
    }, [isOpen]);

    // Initialize Form Data when Payment changes
    useEffect(() => {
        if (payment) {
            const type = payment.treasuryType || (payment.treasury === 'main' ? 'safe' : 'bank');
            setFormData({
                contact: payment.contact?._id || payment.contact || '',
                date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                operationType: payment.operationType || 'spend',
                // Force reset legacy string values to empty so user must select a valid account
                treasury: (payment.treasury && /^[0-9a-fA-F]{24}$/.test(payment.treasury)) ? payment.treasury : '',
                treasuryType: type,
                amount: payment.amount || '',
                notes: payment.notes || ''
            });
            setPaymentMethod(type === 'bank' ? 'bank' : 'cash');
        } else {
            // Reset for Add Mode
            setFormData({
                contact: '',
                date: new Date().toISOString().split('T')[0],
                operationType: 'spend',
                treasury: '',
                treasuryType: 'safe',
                amount: '',
                notes: ''
            });
            setPaymentMethod('cash');
        }
        setErrors({});
    }, [payment, isOpen]);

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/contacts/suppliers');
            setSuppliers(response.data.contacts || []);
        } catch (error) {
            logError('Error fetching suppliers:', error);
        }
    };

    const fetchAccounts = async () => {
        try {
            const [safesRes, banksRes] = await Promise.all([
                api.get('/safes'),
                api.get('/bank-accounts')
            ]);
            setSafes(safesRes.data?.safes || safesRes.data?.data || []);
            setBankAccounts(banksRes.data?.data || []);
        } catch (error) {
            logError('Error fetching accounts:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.contact) newErrors.contact = t('sales.common.required');
        if (!formData.date) newErrors.date = t('sales.common.required');
        if (!formData.treasury) newErrors.treasury = t('sales.common.required');
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = t('sales.common.required');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount)
            };

            // If editing, call update. If adding, call create.
            // Delegate actual API call to parent or do it here? 
            // Parent `SupplierPayments.jsx` has logic. But `PaymentModal` can handle it to be self-contained
            // or pass back to parent.
            // The plan said "Integrate Modal with Payments.jsx".
            // Let's passed back to onSave which handles the API call?
            // Or do it here. `SupplierPayments` logic was:

            /*
            const response = editingPayment
                ? await api.patch(`/payments/${editingPayment._id}`, body)
                : await api.post('/payments/purchases', body);
            */

            // I'll do it here to make it cleaner, but need to know if I should call `onSave` with data or result.
            // Let's call `onSave(payload)`. 
            // Wait, existing `SupplierPayments` takes care of refresh.
            // Let's keep API logic in `SupplierPayments`? No, let's move it here for cleaner Parent.
            // Actually, keep it simple. Do API call here.

            let response;
            if (payment && payment._id) {
                response = await api.patch(`/payments/${payment._id}`, payload);
            } else {
                response = await api.post('/payments/purchases', payload);
            }

            if (response.status === 200 || response.status === 201) {
                onSave(); // Refresh parent
                onClose();
            }
        } catch (error) {
            logError("Save error", error);
            // Show error
            // Maybe set a specific error state
        } finally {
            setLoading(false);
        }
    };

    // Header Status Badge
    const getStatusBadge = () => {
        // Status is usually computed or static.
        // If payment exists, assume 'completed' unless we have logic.
        // Backend default is 'completed'.
        return (
            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={12} />
                {t('sales.common.completed') || "Completed"}
            </span>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans text-slate-800 animate-in fade-in duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 ring-1 ring-slate-200/50">

                {/* Header */}
                <div className="px-10 py-7 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {payment ? t('purchases.payments.view_payment') : t('purchases.payments.add_payment')}
                            </h2>
                        </div>
                        {payment && (
                            <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">#{payment.referenceNumber || payment._id.slice(-6)}</span>
                                <span className="opacity-30">•</span>
                                <span className="flex items-center gap-1"><Calendar size={14} /> {payment.date ? new Date(payment.date).toLocaleDateString() : ''}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-5">
                        {payment && getStatusBadge()}
                        <button onClick={onClose} className="group relative text-slate-400 hover:text-slate-600 transition-all p-2 rounded-xl hover:bg-slate-100/80 active:scale-95">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <form id="payment-form" onSubmit={handleSubmit} className="space-y-10">
                        {/* Summary Cards Integration */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

                            {/* Left Column: Form Fields */}
                            <div className="md:col-span-12 space-y-8">

                                {/* Transaction Details Section */}
                                <section>
                                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <div className="w-4 h-px bg-indigo-200"></div>
                                        {t('sales.common.transaction_details') || "Transaction Details"}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Supplier Select */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
                                                <User size={16} className="text-slate-400" />
                                                {t('purchases.invoices.supplier')}
                                            </label>
                                            <div className="relative group">
                                                <select
                                                    name="contact"
                                                    value={formData.contact}
                                                    onChange={handleInputChange}
                                                    disabled={!!payment}
                                                    className="w-full h-12 bg-slate-50/50 border border-slate-200 rounded-2xl px-4 text-sm font-semibold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-60 disabled:bg-slate-100 cursor-pointer appearance-none"
                                                >
                                                    <option value="">{t('purchases.payments.select_supplier')}</option>
                                                    {suppliers.map(s => (
                                                        <option key={s._id} value={s._id}>{s.name}</option>
                                                    ))}
                                                </select>
                                                <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-4' : 'right-4'} pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors`}>
                                                    <Clock size={16} className="rotate-90" />
                                                </div>
                                            </div>
                                            {errors.contact && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-1 px-1">{errors.contact}</p>}
                                        </div>

                                        {/* Date Input */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
                                                <Calendar size={16} className="text-slate-400" />
                                                {t('sales.common.date')}
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="date"
                                                    name="date"
                                                    value={formData.date}
                                                    onChange={handleInputChange}
                                                    className="w-full h-12 bg-slate-50/50 border border-slate-200 rounded-2xl px-12 text-sm font-semibold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                                                />
                                                <Calendar className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'} text-slate-400 group-focus-within:text-indigo-500 transition-colors`} size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Financial Details Section */}
                                <section>
                                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <div className="w-4 h-px bg-indigo-200"></div>
                                        {t('sales.common.financial_info') || "Financial Information"}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Operation Type */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
                                                <FileText size={16} className="text-slate-400" />
                                                {t('sales.payments.operation_type')}
                                            </label>
                                            <div className="flex p-1 bg-slate-100 rounded-2xl">
                                                <button
                                                    type="button"
                                                    onClick={() => handleInputChange({ target: { name: 'operationType', value: 'spend' } })}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${formData.operationType === 'spend' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    {t('sales.payments.spend')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleInputChange({ target: { name: 'operationType', value: 'receive' } })}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${formData.operationType === 'receive' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    {t('sales.payments.receive')}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
                                                    <DollarSign size={16} className="text-slate-400" />
                                                    {t('sales.common.payment_method')}
                                                </label>
                                                <select
                                                    value={paymentMethod}
                                                    onChange={(e) => {
                                                        const method = e.target.value;
                                                        setPaymentMethod(method);
                                                        setFormData(prev => ({ 
                                                            ...prev, 
                                                            treasury: '', 
                                                            treasuryType: method === 'cash' ? 'safe' : 'bank' 
                                                        }));
                                                    }}
                                                    className="w-full h-12 bg-slate-50/50 border border-slate-200 rounded-2xl px-4 text-sm font-semibold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="cash">{t('sales.common.cash')}</option>
                                                    <option value="bank">{t('sales.common.bank')}</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
                                                    <DollarSign size={16} className="text-slate-400" />
                                                    {paymentMethod === 'cash' ? t('finance.safe') : t('finance.bank_account')}
                                                </label>
                                                <div className="relative group">
                                                    <select
                                                        name="treasury"
                                                        value={formData.treasury || ''}
                                                        onChange={handleInputChange}
                                                        className={`w-full h-12 bg-slate-50/50 border ${errors.treasury ? 'border-red-400' : 'border-slate-200'} rounded-2xl px-4 text-sm font-semibold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer`}
                                                    >
                                                        <option value="">{t('sales.payments.select_treasury') || 'Select...'}</option>
                                                        {paymentMethod === 'cash' ? (
                                                            safes.map(s => (
                                                                <option key={s._id} value={s._id}>{s.name}</option>
                                                            ))
                                                        ) : (
                                                            bankAccounts.map(b => (
                                                                <option key={b._id} value={b._id}>{b.name}</option>
                                                            ))
                                                        )}
                                                    </select>
                                                    <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-4' : 'right-4'} pointer-events-none text-slate-400`}>
                                                        <ChevronDown size={16} />
                                                    </div>
                                                </div>
                                                {errors.treasury && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-1 px-1">{errors.treasury}</p>}
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
                                                <DollarSign size={16} className="text-emerald-500" />
                                                {t('sales.common.amount')}
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={formData.amount}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    className="w-full h-12 bg-emerald-50/30 border border-emerald-200/50 rounded-2xl px-12 text-lg font-black text-emerald-700 placeholder:text-emerald-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'} text-emerald-500 group-focus-within:scale-110 transition-transform`}>
                                                    <DollarSign size={20} />
                                                </div>
                                            </div>
                                            {errors.amount && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-1 px-1">{errors.amount}</p>}
                                        </div>
                                    </div>
                                </section>

                                {/* Notes Section */}
                                <section>
                                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <div className="w-4 h-px bg-indigo-200"></div>
                                        {t('sales.common.notes')}
                                    </h3>
                                    <div className="relative group">
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows={3}
                                            placeholder={t('sales.common.notes_placeholder') || "Write something..."}
                                            className="w-full p-6 bg-slate-50/50 border border-slate-200 rounded-[2rem] text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all resize-none placeholder:text-slate-300"
                                        />
                                        <div className={`absolute bottom-6 ${isRtl ? 'left-6' : 'right-6'} text-slate-300 group-focus-within:text-indigo-300 transition-colors`}>
                                            <FileText size={20} />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-10 py-7 border-t border-slate-50 bg-slate-50/30 flex justify-end items-center gap-4">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-6 py-3 rounded-[1.25rem] border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-700 transition-all text-sm active:scale-95"
                    >
                        {t('sales.common.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        type="button"
                        className="relative group overflow-hidden px-10 py-3 rounded-[1.25rem] bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all text-sm shadow-xl shadow-indigo-200 disabled:opacity-70 disabled:grayscale active:scale-95"
                    >
                        <div className="relative flex items-center gap-2 z-10">
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                            ) : (
                                <CheckCircle size={18} />
                            )}
                            {t('sales.common.save')}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PaymentModal;
