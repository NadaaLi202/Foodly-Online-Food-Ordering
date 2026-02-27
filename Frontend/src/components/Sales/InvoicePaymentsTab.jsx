import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currencyFormatter';
import ClientLink from '../navigation/ClientLink';
import { confirmDelete } from '../../utils/confirmDelete';
import { usePermissions } from '../../hooks/usePermissions';

const InvoicePaymentsTab = ({ invoice, paymentsModule, onRefreshInvoice }) => {
    const { t, i18n } = useTranslation();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        treasury: 'main',
        operationType: 'receive',
        referenceNumber: '',
        notes: ''
    });
    const [errors, setErrors] = useState({});
    const { hasPermission } = usePermissions();

    const paymentPermModule = paymentsModule === 'sales' ? 'customer_payments' : 'supplier_payments';
    const canViewPayments = hasPermission(paymentPermModule, 'view');
    const canAddPayments = hasPermission(paymentPermModule, 'add');
    const canDeletePayments = hasPermission(paymentPermModule, 'delete');

    const isRTL = i18n.language === 'ar';

    const fetchPayments = async () => {
        if (!invoice?._id) return;
        if (!canViewPayments) {
            setPayments([]);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/payments/${paymentsModule}`, { params: { invoiceId: invoice._id } });
            setPayments(res.data.payments || []);
        } catch (err) {
            console.error('Error fetching payments:', err);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [invoice?._id, paymentsModule, canViewPayments]);

    const getStatusBadge = (status) => {
        const s = status || 'unpaid';
        const map = {
            paid: { class: 'bg-emerald-100 text-emerald-700', key: 'paid' },
            partially_paid: { class: 'bg-amber-100 text-amber-700', key: 'partial' },
            partial: { class: 'bg-amber-100 text-amber-700', key: 'partial' },
            unpaid: { class: 'bg-rose-100 text-rose-700', key: 'unpaid' }
        };
        const conf = map[s] || map.unpaid;
        return (
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${conf.class}`}>
                {t(`sales.common.${conf.key}`)}
            </span>
        );
    };

    const validate = () => {
        const e = {};
        if (!formData.amount || parseFloat(formData.amount) <= 0) e.amount = t('sales.common.required');
        if (!formData.treasury) e.treasury = t('sales.common.required');
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        if (!canAddPayments) {
            toast.error(t('sales.common.error_message'));
            return;
        }
        if (!validate()) return;

        const amount = parseFloat(formData.amount);
        const remaining = invoice?.remainingAmount ?? (invoice?.totalAmount - invoice?.paidAmount) ?? 0;
        if (amount > remaining) {
            toast.error(t('sales.payments.amount_exceeds_remaining', 'Amount exceeds remaining balance'));
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/payments/${paymentsModule}`, {
                invoice: invoice._id,
                contact: invoice.contact?._id || invoice.contact,
                date: formData.date,
                amount,
                treasury: formData.treasury,
                operationType: formData.operationType || 'receive',
                referenceNumber: formData.referenceNumber || undefined,
                notes: formData.notes || ''
            });
            toast.success(t('sales.common.success_message', 'Success'));
            setIsAddModalOpen(false);
            setFormData({ date: new Date().toISOString().split('T')[0], amount: '', treasury: 'main', operationType: 'receive', referenceNumber: '', notes: '' });
            fetchPayments();
            onRefreshInvoice?.();
            // Dispatch event for real-time report updates
            window.dispatchEvent(new CustomEvent('payment-created'));
        } catch (err) {
            toast.error(err.response?.data?.message || t('sales.common.error_message'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (paymentId) => {
        if (!canDeletePayments) {
            toast.error(t('sales.common.error_message'));
            return;
        }
        const confirmed = await confirmDelete({
            title: t('sales.common.confirm_delete', 'Confirm Delete'),
            message: t('sales.common.confirm_delete', 'Are you sure?'),
            confirmText: t('sales.common.confirm', 'Confirm'),
            cancelText: t('sales.common.cancel')
        });
        if (!confirmed) return;
        try {
            await api.delete(`/payments/${paymentId}`);
            toast.success(t('sales.common.success_message', 'Success'));
            fetchPayments();
            onRefreshInvoice?.();
        } catch (err) {
            toast.error(err.response?.data?.message || t('sales.common.error_message'));
        }
    };

    const clientName = invoice?.contact?.name || invoice?.contactSnapshot?.name || invoice?.clientName || '—';
    const total = invoice?.totalAmount ?? 0;
    const paid = invoice?.paidAmount ?? 0;
    const remaining = invoice?.remainingAmount ?? (total - paid);
    const currency = invoice?.currency || 'EGP';

    if (!canViewPayments) {
        return (
            <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="bg-white rounded-xl border border-red-100 p-6 text-red-600 text-sm font-bold">
                    {t('sales.common.error_message')}
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            {/* Invoice summary */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">{t('sales.invoices.invoice_details', 'Invoice Details')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">{t('sales.invoices.invoice_number', 'Invoice Number')}</p>
                        <p className="text-sm font-bold text-gray-800">{invoice?.transactionNumber || invoice?.invoiceNumber || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">{t('sales.common.client')}</p>
                        <ClientLink client={invoice?.contact} clientId={invoice?.contact?._id}>
                            {clientName}
                        </ClientLink>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">{t('sales.common.total')}</p>
                        <p className="text-sm font-bold text-gray-800">{formatCurrency(total, currency)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">{t('sales.invoices.payment_status', 'Status')}</p>
                        {getStatusBadge(invoice?.status)}
                    </div>
                </div>
                <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <DollarSign size={18} className="text-emerald-600" />
                        <span className="text-xs font-bold text-gray-500">{t('sales.invoices.paid_amount', 'Paid')}:</span>
                        <span className="text-sm font-bold text-emerald-700">{formatCurrency(paid, currency)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign size={18} className="text-amber-600" />
                        <span className="text-xs font-bold text-gray-500">{t('sales.invoices.remaining_amount', 'Remaining')}:</span>
                        <span className="text-sm font-bold text-amber-700">{formatCurrency(remaining, currency)}</span>
                    </div>
                </div>
            </div>

            {/* Payments table + Add button */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">{t('sales.invoices.payments_tab')}</h3>
                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        disabled={!canAddPayments || remaining <= 0}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                    >
                        <Plus size={18} />
                        {t('sales.payments.add_payment', 'Add Payment')}
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
                    </div>
                ) : payments.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p className="text-sm font-medium">{t('sales.payments.no_payments', 'No payments yet')}</p>
                        <p className="text-xs mt-1">{t('sales.payments.add_first', 'Add a payment to get started')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr>
                                    <th className={`px-6 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-black text-gray-400 uppercase`}>{t('sales.common.date')}</th>
                                    <th className={`px-6 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-black text-gray-400 uppercase`}>{t('sales.payments.operation_type', 'Method')}</th>
                                    <th className={`px-6 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-black text-gray-400 uppercase`}>{t('sales.payments.reference_number', 'Reference')}</th>
                                    <th className={`px-6 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-black text-gray-400 uppercase`}>{t('sales.common.amount')}</th>
                                    <th className={`px-6 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-black text-gray-400 uppercase`}>{t('sales.common.notes')}</th>
                                    <th className="px-6 py-3 w-24 text-center text-xs font-black text-gray-400 uppercase">{t('sales.common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payments.map((p) => (
                                    <tr key={p._id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                            {p.date ? new Date(p.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${p.operationType === 'receive' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {p.operationType === 'receive' ? t('sales.payments.receive') : t('sales.payments.spend')}
                                            </span>
                                            <span className="ml-2 text-xs text-gray-500">
                                                {p.treasury === 'main' ? t('sales.payments.main_treasury') : t('sales.payments.main_bank_account')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{p.referenceNumber || '—'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800">{formatCurrency(p.amount ?? 0, p.currency || currency)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">{p.notes || '—'}</td>
                                        <td className="px-6 py-4 text-center">
                                            {canDeletePayments && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(p._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title={t('sales.common.delete')}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Payment Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">{t('sales.payments.add_payment', 'Add Payment')}</h2>
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddPayment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('sales.invoices.remaining_amount')}: {formatCurrency(remaining, currency)}</label>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('sales.common.date')} *</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('sales.payments.treasury')} *</label>
                                <select
                                    value={formData.treasury}
                                    onChange={(e) => setFormData(f => ({ ...f, treasury: e.target.value }))}
                                    className={`w-full border-2 rounded-lg px-3 py-2.5 text-sm ${errors.treasury ? 'border-red-500' : 'border-gray-100 focus:border-indigo-500'}`}
                                >
                                    <option value="">{t('sales.payments.select_treasury')}</option>
                                    <option value="main">{t('sales.payments.main_treasury')}</option>
                                    <option value="bank">{t('sales.payments.main_bank_account')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('sales.common.amount')} *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    max={remaining}
                                    value={formData.amount}
                                    onChange={(e) => setFormData(f => ({ ...f, amount: e.target.value }))}
                                    className={`w-full border-2 rounded-lg px-3 py-2.5 text-sm ${errors.amount ? 'border-red-500' : 'border-gray-100 focus:border-indigo-500'}`}
                                />
                                {remaining > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(f => ({ ...f, amount: String(remaining) }))}
                                        className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                    >
                                        {t('sales.payments.pay_full_remaining', 'Pay full remaining balance')}
                                    </button>
                                )}
                                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('sales.payments.reference_number')}</label>
                                <input
                                    type="text"
                                    value={formData.referenceNumber}
                                    onChange={(e) => setFormData(f => ({ ...f, referenceNumber: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('sales.common.notes')}</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                                    rows={2}
                                    className="w-full border-2 border-gray-100 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-lg font-bold text-sm">
                                    {t('sales.common.cancel')}
                                </button>
                                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 disabled:opacity-60">
                                    {submitting ? t('sales.common.saving') : t('sales.common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoicePaymentsTab;
