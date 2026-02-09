import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Search, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currencyFormatter';

export default function SupplierPayments() {
    const { t, i18n } = useTranslation();
    const [payments, setPayments] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        contact: '',
        operationType: 'receive',
        treasury: '',
        amount: '',
        notes: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [responseMessage, setResponseMessage] = useState({ type: '', text: '' });

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/payments/purchases');
            setPayments(response.data.payments || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/contacts/suppliers');
            setSuppliers(response.data.contacts || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    useEffect(() => {
        fetchPayments();
        fetchSuppliers();
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.date) newErrors.date = t('sales.common.required');
        if (!formData.contact) newErrors.contact = t('sales.common.required');
        if (!formData.treasury) newErrors.treasury = t('sales.common.required');
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = t('sales.common.required');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        setResponseMessage({ type: '', text: '' });
        try {
            const body = {
                date: formData.date,
                contact: formData.contact || undefined,
                operationType: formData.operationType || 'receive',
                treasury: formData.treasury,
                amount: parseFloat(formData.amount),
                notes: formData.notes || ''
            };

            const response = editingPayment
                ? await api.patch(`/payments/${editingPayment._id}`, body)
                : await api.post('/payments/purchases', body);

            const result = response.data;
            if (response.status === 200 || response.status === 201) {
                setResponseMessage({ type: 'success', text: result.message || t('sales.common.success_message') });
                fetchPayments();
                setTimeout(() => {
                    setIsModalOpen(false);
                    setEditingPayment(null);
                    resetForm();
                }, 1200);
            }
        } catch (error) {
            setResponseMessage({ type: 'error', text: error.response?.data?.message || t('sales.common.error_message') });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            contact: '',
            operationType: 'receive',
            treasury: '',
            amount: '',
            notes: ''
        });
        setResponseMessage({ type: '', text: '' });
        setErrors({});
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingPayment(null);
        resetForm();
    };

    const openAddModal = () => {
        setEditingPayment(null);
        resetForm();
        setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
        setIsModalOpen(true);
    };

    const openEditModal = async (payment) => {
        setLoading(true);
        try {
            const res = await api.get(`/payments/${payment._id}`);
            const data = res.data;
            if (res.status === 200 && data.payment) {
                const p = data.payment;
                setFormData({
                    date: p.date ? new Date(p.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    contact: p.contact?._id || p.contact || '',
                    operationType: p.operationType || 'receive',
                    treasury: p.treasury || '',
                    amount: p.amount ?? '',
                    notes: p.notes || ''
                });
                setEditingPayment(payment);
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('sales.common.confirm_delete'))) return;
        try {
            const res = await api.delete(`/payments/${id}`);
            const data = res.data;
            if (res.status === 200) {
                setPayments(prev => prev.filter(p => p._id !== id));
            } else {
                alert(data.message || t('sales.common.error_message'));
            }
        } catch (err) {
            alert(t('sales.common.error_message'));
        }
        setMenuOpenId(null);
    };

    const contactName = (payment) => payment.contact?.name || (payment.contact && typeof payment.contact === 'object' ? payment.contact.name : '-');

    return (
        <div className="min-h-screen bg-gray-50 overflow-hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={openAddModal}
                        className="flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm shadow-sm"
                    >
                        <Plus size={18} />
                        <span>{t('sales.common.add')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={fetchPayments}
                        className="flex items-center gap-2 border-2 border-gray-100 text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all font-bold text-sm"
                    >
                        <RefreshCw size={16} />
                        <span>{t('sales.common.search_filter')}</span>
                    </button>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                    <Search size={18} />
                    <span>{t('sales.common.view')}</span>
                </div>
            </div>

            <div className="p-6">
                {loading && !isModalOpen ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
                    </div>
                ) : payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-80 text-gray-300">
                        <div className="text-6xl mb-4 opacity-20">💰</div>
                        <p className="text-lg font-bold text-gray-400">{t('purchases.payments.no_payments')}</p>
                        <p className="text-sm text-gray-400 mt-1">{t('purchases.payments.start_payments')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.date')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.supplier')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.payments.operation_type')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.payments.treasury')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.amount')}</th>
                                    <th className="px-6 py-4 w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-indigo-50/30 transition-all group">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                                            {payment.date ? new Date(payment.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') : '—'}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-700">
                                            {contactName(payment)}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className={`px-4 py-1.5 text-[10px] font-black rounded-full ${payment.operationType === 'receive' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {payment.operationType === 'receive' ? t('sales.payments.receive') : t('sales.payments.spend')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-600">
                                            {payment.treasury === 'main' ? t('sales.payments.main_treasury') : t('sales.payments.main_bank_account')}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-gray-800">
                                            {formatCurrency(payment.amount ?? 0, payment.currency || 'EGP')}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right relative">
                                            <button
                                                type="button"
                                                onClick={() => setMenuOpenId(menuOpenId === payment._id ? null : payment._id)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            {menuOpenId === payment._id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                                                    <div className="absolute top-full mt-1 right-0 z-20 py-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px]">
                                                        <button type="button" onClick={() => { openEditModal(payment); setMenuOpenId(null); }} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                                            {t('sales.common.edit')}
                                                        </button>
                                                        <button type="button" onClick={() => { handleDelete(payment._id); }} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                                                            {t('sales.common.delete')}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-800">
                                {editingPayment ? t('purchases.payments.edit_payment') : t('purchases.payments.add_payment')}
                            </h2>
                            <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {responseMessage.text && (
                                    <div className={`p-3 rounded-lg text-sm ${responseMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                        {responseMessage.text}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.common.supplier')} <span className="text-red-500">*</span></label>
                                    <select
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleInputChange}
                                        className={`w-full border-2 rounded-lg px-3 py-2.5 text-sm font-bold bg-white ${errors.contact ? 'border-red-500' : 'border-gray-100 focus:border-indigo-500'}`}
                                    >
                                        <option value="">{t('purchases.payments.select_supplier')}</option>
                                        {suppliers.map((s) => (
                                            <option key={s._id} value={s._id}>{s.name} {s.code ? `#${s.code}` : ''}</option>
                                        ))}
                                    </select>
                                    {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.common.date')} <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className={`w-full border-2 rounded-lg px-3 py-2.5 text-sm ${errors.date ? 'border-red-500' : 'border-gray-100 focus:border-indigo-500'}`}
                                    />
                                    {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.payments.operation_type')}</label>
                                    <select
                                        name="operationType"
                                        value={formData.operationType}
                                        onChange={handleInputChange}
                                        className="w-full border-2 border-gray-100 rounded-lg px-3 py-2.5 text-sm font-bold bg-white focus:border-indigo-500"
                                    >
                                        <option value="receive">{t('sales.payments.receive')}</option>
                                        <option value="spend">{t('sales.payments.spend')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.payments.treasury')} <span className="text-red-500">*</span></label>
                                    <select
                                        name="treasury"
                                        value={formData.treasury}
                                        onChange={handleInputChange}
                                        className={`w-full border-2 rounded-lg px-3 py-2.5 text-sm font-bold bg-white ${errors.treasury ? 'border-red-500' : 'border-gray-100 focus:border-indigo-500'}`}
                                    >
                                        <option value="">{t('sales.payments.select_treasury')}</option>
                                        <option value="main">{t('sales.payments.main_treasury')}</option>
                                        <option value="bank">{t('sales.payments.main_bank_account')}</option>
                                    </select>
                                    {errors.treasury && <p className="text-red-500 text-xs mt-1">{errors.treasury}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.payments.amount')} <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        className={`w-full border-2 rounded-lg px-3 py-2.5 text-sm font-bold ${errors.amount ? 'border-red-500' : 'border-gray-100 focus:border-indigo-500'}`}
                                    />
                                    {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.payments.notes')}</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} className="w-full border-2 border-gray-100 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 resize-none" />
                                </div>
                            </form>
                        </div>
                        <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
                            <button type="button" onClick={handleCancel} className="px-6 py-2.5 border-2 border-gray-200 text-gray-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-50">
                                {t('sales.common.cancel')}
                            </button>
                            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-2.5 bg-green-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-700 disabled:opacity-60">
                                {isSubmitting ? t('sales.common.saving') : t('sales.common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
