import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Payments() {
    const { t, i18n } = useTranslation();
    const [payments, setPayments] = useState([]);
    const [clients, setClients] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        treasury: '',
        operationType: 'cash',
        client: '',
        invoice: '',
        amount: '',
        notes: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [responseMessage, setResponseMessage] = useState({ type: '', text: '' });

    // Fetch payments from API
    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:4000/api/v1/payments');
            const data = await response.json();
            setPayments(data.payments || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch clients from API
    const fetchClients = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/v1/contacts');
            const data = await response.json();
            setClients(data.contacts || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    // Fetch invoices from API
    const fetchInvoices = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/v1/invoices');
            const data = await response.json();
            setInvoices(data.invoices || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    // Fetch client-specific invoices
    const fetchClientInvoices = async (clientId) => {
        if (!clientId) {
            setInvoices([]);
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/api/v1/invoices?clientId=${clientId}`);
            const data = await response.json();
            setInvoices(data.invoices || []);
        } catch (error) {
            console.error('Error fetching client invoices:', error);
        }
    };

    useEffect(() => {
        fetchPayments();
        fetchClients();
    }, []);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.date) {
            newErrors.date = t('sales.common.required');
        }

        if (!formData.treasury.trim()) {
            newErrors.treasury = t('sales.common.required');
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = t('sales.common.required');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // إذا تغير العميل، جلب فواتيره
        if (name === 'client') {
            fetchClientInvoices(value);
            setFormData(prev => ({ ...prev, invoice: '' })); // مسح الفاتورة المختارة
        }

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setResponseMessage({ type: '', text: '' });

        try {
            // تحضير البيانات للإرسال
            const submitData = {
                ...formData,
                client: formData.client || undefined, // إرسال undefined بدلاً من string فارغ
                invoice: formData.invoice || undefined,
                amount: parseFloat(formData.amount)
            };

            const response = await fetch('http://localhost:4000/api/v1/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || t('sales.common.error_message'));
            }

            console.log('Payment saved successfully:', result);

            // Show success message
            setResponseMessage({
                type: 'success',
                text: result.message || t('sales.common.success_message')
            });

            // Refresh payments list
            fetchPayments();

            // Close modal and reset form after short delay
            setTimeout(() => {
                setIsModalOpen(false);
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    treasury: '',
                    operationType: 'cash',
                    client: '',
                    invoice: '',
                    amount: '',
                    notes: ''
                });
                setResponseMessage({ type: '', text: '' });
                setInvoices([]);
            }, 1500);

        } catch (error) {
            console.error('Error saving payment:', error);
            setResponseMessage({
                type: 'error',
                text: error.message || t('sales.common.error_message')
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            treasury: '',
            operationType: 'cash',
            client: '',
            invoice: '',
            amount: '',
            notes: ''
        });
        setResponseMessage({ type: '', text: '' });
        setInvoices([]);
    };

    // Helper function to get client name
    const getClientName = (clientId) => {
        const client = clients.find(c => c._id === clientId);
        return client ? client.name : '-';
    };

    return (
        <div className="min-h-screen bg-gray-50" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                    >
                        <Plus size={20} />
                        <span>{t('sales.common.add')}</span>
                    </button>

                    <button
                        onClick={fetchPayments}
                        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={18} />
                        <span>{t('sales.common.refresh_alt')}</span>
                    </button>
                </div>

                <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                    {t('sales.common.view')}
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading && !isModalOpen ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="text-6xl mb-4">💰</div>
                        <p className="text-lg font-medium">{t('sales.payments.no_payments')}</p>
                        <p className="text-sm">{t('sales.payments.start_payments')}</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.common.date')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.payments.treasury')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.payments.operation_type')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.common.client')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.common.amount')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.payments.notes')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {payments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(payment.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {payment.treasury === 'main' ? t('sales.common.main_treasury') :
                                                payment.treasury === 'secondary' ? t('sales.payments.secondary_treasury') :
                                                    t('sales.payments.cash_treasury')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.operationType === 'cash'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {payment.operationType === 'cash' ? t('sales.common.cash') : t('sales.payments.non_cash')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {payment.clientInfo?.name || payment.client || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                            {payment.amount?.toFixed(2)} {t('sales.common.currency')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {payment.notes || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                            <h2 className={`text-xl font-bold text-gray-800 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                {t('sales.payments.add_payment')}
                            </h2>
                            <button
                                onClick={handleCancel}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Response Message */}
                                {responseMessage.text && (
                                    <div className={`p-4 rounded-md ${responseMessage.type === 'success'
                                        ? 'bg-green-50 border border-green-200 text-green-800'
                                        : 'bg-red-50 border border-red-200 text-red-800'
                                        }`}>
                                        <p className="text-sm font-medium">{responseMessage.text}</p>
                                    </div>
                                )}

                                {/* Date and Treasury */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.common.date')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none transition-colors text-${i18n.language === 'ar' ? 'right' : 'left'} ${errors.date ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'}`}
                                        />
                                        {errors.date && (
                                            <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                                <span>⚠</span> {errors.date}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.payments.treasury')} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="treasury"
                                            value={formData.treasury}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none transition-colors bg-white ${errors.treasury ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                                                }`}
                                        >
                                            <option value="">{t('sales.payments.select_treasury')}</option>
                                            <option value="main">{t('sales.common.main_treasury')}</option>
                                            <option value="secondary">{t('sales.payments.secondary_treasury')}</option>
                                            <option value="cash">{t('sales.payments.cash_treasury')}</option>
                                        </select>
                                        {errors.treasury && (
                                            <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                                <span>⚠</span> {errors.treasury}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Operation Type and Amount */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.payments.operation_type')}
                                        </label>
                                        <select
                                            name="operationType"
                                            value={formData.operationType}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                                        >
                                            <option value="cash">{t('sales.common.cash')}</option>
                                            <option value="non-cash">{t('sales.payments.non_cash')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.common.amount')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={formData.amount}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none transition-colors ${i18n.language === 'ar' ? 'text-right' : 'text-left'} ${errors.amount ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                                                }`}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                        />
                                        {errors.amount && (
                                            <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                                <span>⚠</span> {errors.amount}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Client and Invoice */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.common.client')}
                                        </label>
                                        <select
                                            name="client"
                                            value={formData.client}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                                        >
                                            <option value="">{t('sales.common.select')}</option>
                                            {clients.map((client) => (
                                                <option key={client._id} value={client._id}>
                                                    {client.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.payments.invoice')}
                                        </label>
                                        <select
                                            name="invoice"
                                            value={formData.invoice}
                                            onChange={handleInputChange}
                                            disabled={!formData.client}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">{t('sales.common.select')}</option>
                                            {invoices.map((invoice) => (
                                                <option key={invoice._id} value={invoice._id}>
                                                    {invoice.invoiceNumber} - {invoice.total.toFixed(2)} {t('sales.common.currency')}
                                                </option>
                                            ))}
                                        </select>
                                        {!formData.client && (
                                            <p className={`mt-1 text-xs text-gray-400 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('sales.payments.select_client_first')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('sales.payments.notes')}
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className={`w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 resize-none ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
                                        placeholder={t('sales.payments.notes_placeholder')}
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className={`bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-start gap-3 sticky bottom-0 ${i18n.language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="border-2 border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                            >
                                {t('sales.common.cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? t('sales.common.saving') : t('sales.common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}