import React, { useState, useEffect } from 'react';
import { X, Calendar, User, DollarSign, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currencyFormatter';

const PaymentModal = ({ isOpen, onClose, payment, onSave }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        contact: '',
        date: new Date().toISOString().split('T')[0],
        operationType: 'spend', // Default for purchases is spend usually? But let's keep 'receive' if that's defaults elsewhere, but for PAYING a supplier it is usually SPEND. The list shows 'receive'/'spend'. Let's stick to what was there or default 'spend'.
        // Actually, for Supplier Payments, it's usually 'spend' (paying money out).
        // Check `SupplierPayments.jsx` default: it was 'receive'. Wait. 
        // Paying a supplier = SPEND. Receiving refund = RECEIVE. 
        // I will default to 'spend' as it makes more sense for "Payments".
        treasury: 'main',
        amount: '',
        notes: ''
    });

    const [errors, setErrors] = useState({});
    const [linkedInvoice, setLinkedInvoice] = useState(null);

    // Load Suppliers on mount
    useEffect(() => {
        if (isOpen) {
            fetchSuppliers();
        }
    }, [isOpen]);

    // Initialize Form Data when Payment changes
    useEffect(() => {
        if (payment) {
            setFormData({
                contact: payment.contact?._id || payment.contact || '',
                date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                operationType: payment.operationType || 'spend',
                treasury: payment.treasury || 'main',
                amount: payment.amount || '',
                notes: payment.notes || ''
            });
            setLinkedInvoice(payment.invoice); // Set linked invoice data
        } else {
            // Reset for Add Mode
            setFormData({
                contact: '',
                date: new Date().toISOString().split('T')[0],
                operationType: 'spend',
                treasury: 'main',
                amount: '',
                notes: ''
            });
            setLinkedInvoice(null);
        }
        setErrors({});
    }, [payment, isOpen]);

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/contacts/suppliers');
            setSuppliers(response.data.contacts || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
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
            console.error("Save error", error);
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans text-gray-800" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                            {payment ? t('purchases.payments.view_payment') : t('purchases.payments.add_payment')}
                        </h2>
                        {payment && (
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                <span className="font-mono bg-gray-200 px-2 py-0.5 rounded text-gray-700 font-bold">#{payment.referenceNumber || payment._id.slice(-6)}</span>
                                <span>•</span>
                                <span>{payment.date ? new Date(payment.date).toLocaleDateString() : ''}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {payment && getStatusBadge()}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <form id="payment-form" onSubmit={handleSubmit}>
                        {/* Top Cards Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Supplier Card */}
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <User size={20} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1 block">
                                        {t('purchases.invoices.supplier')}
                                    </label>
                                    <select
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleInputChange}
                                        disabled={!!payment} // Disable supplier change on edit? Usually safer.
                                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-800 focus:ring-0 cursor-pointer disabled:cursor-default"
                                    >
                                        <option value="">{t('purchases.payments.select_supplier')}</option>
                                        {suppliers.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                    {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
                                </div>
                            </div>

                            {/* Payment Info Card */}
                            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-1 block">
                                        {t('sales.payments.operation_type')}
                                    </label>
                                    <select
                                        name="operationType"
                                        value={formData.operationType}
                                        onChange={handleInputChange}
                                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-800 focus:ring-0 cursor-pointer"
                                    >
                                        <option value="spend">{t('sales.payments.spend')}</option>
                                        <option value="receive">{t('sales.payments.receive')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Treasury Card */}
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <DollarSign size={20} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1 block">
                                        {t('sales.payments.treasury')}
                                    </label>
                                    <select
                                        name="treasury"
                                        value={formData.treasury}
                                        onChange={handleInputChange}
                                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-800 focus:ring-0 cursor-pointer"
                                    >
                                        <option value="main">{t('sales.payments.main_treasury')}</option>
                                        <option value="bank">{t('sales.payments.main_bank_account')}</option>
                                    </select>
                                    {errors.treasury && <p className="text-red-500 text-xs mt-1">{errors.treasury}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Main Form Details */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-8 space-y-6">
                                {/* Amount & Date Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            {t('sales.common.date')} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            />
                                            <Calendar className={`absolute top-2.5 ${isRtl ? 'right-3' : 'left-3'} text-gray-400`} size={18} />
                                        </div>
                                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            {t('sales.common.amount')} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-black text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            />
                                            <DollarSign className={`absolute top-2.5 ${isRtl ? 'right-3' : 'left-3'} text-gray-400`} size={18} />
                                        </div>
                                        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                                    </div>
                                </div>

                                {/* Linked Invoice Table */}
                                <div className="mt-8">
                                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <FileText size={16} className="text-indigo-600" />
                                        {t('sales.payments.linked_invoice') || "Linked Invoice"}
                                    </h3>

                                    {linkedInvoice ? (
                                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                            <table className="min-w-full divide-y divide-gray-100">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className={`px-4 py-3 text-${isRtl ? 'right' : 'left'} text-xs font-bold text-gray-500 uppercase`}>{t('sales.common.invoice')}</th>
                                                        <th className={`px-4 py-3 text-${isRtl ? 'right' : 'left'} text-xs font-bold text-gray-500 uppercase`}>{t('sales.common.date')}</th>
                                                        <th className={`px-4 py-3 text-${isRtl ? 'right' : 'left'} text-xs font-bold text-gray-500 uppercase`}>{t('sales.common.total')}</th>
                                                        <th className={`px-4 py-3 text-${isRtl ? 'right' : 'left'} text-xs font-bold text-gray-500 uppercase flex items-center gap-1`}>
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            {t('sales.common.paid')}
                                                        </th>
                                                        <th className={`px-4 py-3 text-${isRtl ? 'right' : 'left'} text-xs font-bold text-gray-500 uppercase flex items-center gap-1`}>
                                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                            {t('sales.common.remaining')}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    <tr className="hover:bg-indigo-50/10 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-800">
                                                            {linkedInvoice.transactionNumber}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {linkedInvoice.issueDate ? new Date(linkedInvoice.issueDate).toLocaleDateString() : (linkedInvoice.date ? new Date(linkedInvoice.date).toLocaleDateString() : '-')}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-800">
                                                            {formatCurrency(linkedInvoice.totalAmount)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-green-600">
                                                            {formatCurrency(linkedInvoice.paidAmount || 0)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-red-600">
                                                            {formatCurrency(linkedInvoice.remainingAmount || 0)}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="border border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                            <AlertCircle size={32} className="mb-2 opacity-50" />
                                            <p className="text-sm font-medium">{t('sales.payments.no_linked_invoice') || "No linked invoice"}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar / Notes */}
                            <div className="md:col-span-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    {t('sales.common.notes')}
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={8}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-inner"
                                    placeholder={t('sales.common.notes_placeholder') || "Add any notes here..."}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 transition-colors text-sm"
                    >
                        {t('sales.common.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        type="button"
                        className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors text-sm shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>}
                        {t('sales.common.save')}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PaymentModal;
