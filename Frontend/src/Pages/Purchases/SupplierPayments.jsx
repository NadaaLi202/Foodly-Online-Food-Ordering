import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, RefreshCw, X, MoreVertical, Eye, FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currencyFormatter';
import ClientLink from '../../components/navigation/ClientLink';
import TreasuryLink from '../../components/navigation/TreasuryLink';
import OperationTypeLink from '../../components/navigation/OperationTypeLink';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import PaymentModal from '../../components/Purchases/PaymentModal';
import { paths } from '../../utils/navigationHelpers';
import logError from '../../utils/logError';

export default function SupplierPayments() {
    const { t, i18n } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const contactId = searchParams.get('contactId');
    const operationType = searchParams.get('operationType');
    const treasury = searchParams.get('treasury');
    const [payments, setPayments] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingPayment, setViewingPayment] = useState(null);
    const [editingPayment, setEditingPayment] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, paymentId: null });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                contact: contactId,
                operationType,
                treasury
            };
            const response = await api.get('/payments/purchases', { params });
            setPayments(response.data.payments || []);
            setTotalPages(response.data.totalPages || 1);
            setTotal(response.data.total || 0);
        } catch (error) {
            logError('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    }, [page, contactId, operationType, treasury]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingPayment(null);
        setViewingPayment(null);
    };

    const openAddModal = () => {
        setEditingPayment(null);
        setViewingPayment(null);
        setIsModalOpen(true);
    };



    const openEditModal = async (payment) => {
        setLoading(true);
        try {
            const res = await api.get(`/payments/${payment._id}`);
            const p = res.data.payment;
            if (p) {
                setFormData({
                    date: p.date ? new Date(p.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    contact: p.contact?._id || p.contact || '',
                    operationType: p.operationType || 'receive',
                    treasury: p.treasury || '',
                    amount: p.amount ?? '',
                    notes: p.notes || ''
                });
                setEditingPayment(payment);
                setViewingPayment(null);
                setIsModalOpen(true);
            }
        } catch (err) { logError(err); }
        finally { setLoading(false); }
        setMenuOpenId(null);
    };

    const openViewModal = async (payment) => {
        setLoading(true);
        try {
            const res = await api.get(`/payments/${payment._id}`);
            setViewingPayment(res.data.payment);
            setEditingPayment(null);
            setIsModalOpen(true);
        } catch (err) { logError(err); }
        finally { setLoading(false); }
        setMenuOpenId(null);
    };

    const handleDelete = (id) => setDeleteModal({ open: true, paymentId: id });
    const confirmDelete = async () => {
        if (!deleteModal.paymentId) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/payments/${deleteModal.paymentId}`);
            setPayments(prev => prev.filter(p => p._id !== deleteModal.paymentId));
            setTotal(prev => Math.max(0, prev - 1));
            setDeleteModal({ open: false, paymentId: null });
            if (viewingPayment?._id === deleteModal.paymentId) handleCancel();
        } catch (err) { alert(err.response?.data?.message || t('sales.common.error_message')); }
        finally { setDeleteLoading(false); }
    };

    const handleDownloadPDF = async (payment) => {
        setMenuOpenId(null);
        try {
            const res = await api.get(`/payments/${payment._id}/download`, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payment-${payment.referenceNumber || payment._id?.toString().slice(-8) || 'supplier'}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            logError('PDF download failed:', err);
            alert(err.response?.data?.message || t('sales.common.error_message'));
        }
    };

    const contactName = (payment) => payment.contact?.name || (payment.contact && typeof payment.contact === 'object' ? payment.contact.name : '-');
    const paymentId = (payment) => payment.referenceNumber || payment._id?.toString().slice(-8) || '—';

    return (
        <div className="min-h-screen bg-gray-50 overflow-hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white border-b border-gray-100 px-6 py-4">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <button type="button" onClick={openAddModal} className="flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm shadow-sm">
                        <Plus size={18} /><span>{t('sales.common.add')}</span>
                    </button>
                    <button type="button" onClick={fetchPayments} className="flex items-center gap-2 border-2 border-gray-100 text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all font-bold text-sm">
                        <RefreshCw size={16} /><span>{t('sales.common.search_filter')}</span>
                    </button>
                </div>
                <div className="text-indigo-600 font-bold text-sm">{t('sales.payments.total')} {total}</div>
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
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.payments.payment_id')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.date')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('purchases.invoices.supplier')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.payments.operation_type')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.payments.treasury')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.amount')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.payments.linked_invoice')}</th>
                                    <th className="px-6 py-4 w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-indigo-50/30 transition-all group">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-600">{paymentId(payment)}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-500">{payment.date ? new Date(payment.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') : '—'}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-700">
                                            <ClientLink client={payment.contact} clientId={payment.contact?._id} isSupplier>{contactName(payment)}</ClientLink>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <OperationTypeLink operationType={payment.operationType} contact={payment.contact} module="purchases" label={payment.operationType === 'receive' ? t('sales.payments.receive') : t('sales.payments.spend')} />
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-600">
                                            <TreasuryLink treasury={payment.treasury} label={payment.treasury === 'main' ? t('sales.payments.main_treasury') : t('sales.payments.main_bank_account')} />
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-gray-800">{formatCurrency(payment.amount ?? 0, payment.currency || 'EGP')}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                                            {payment.invoice ? (
                                                <Link to={paths.purchaseInvoiceDetails(payment.invoice._id)} className="text-indigo-600 hover:underline font-medium">{payment.invoice.transactionNumber || '—'}</Link>
                                            ) : '—'}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right relative">
                                            <button type="button" onClick={() => setMenuOpenId(menuOpenId === payment._id ? null : payment._id)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded">
                                                <MoreVertical size={18} />
                                            </button>
                                            {menuOpenId === payment._id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                                                    <div className={`absolute top-full mt-1 z-20 py-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] ${i18n.language === 'ar' ? 'left-0' : 'right-0'}`}>
                                                        <button type="button" onClick={() => openViewModal(payment)} className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"><Eye size={16} />{t('sales.common.view')}</button>
                                                        <button type="button" onClick={() => openEditModal(payment)} className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">{t('sales.common.edit')}</button>
                                                        <button type="button" onClick={() => handleDownloadPDF(payment)} className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"><FileDown size={16} />{t('sales.payments.download_pdf')}</button>
                                                        <button type="button" onClick={() => handleDelete(payment._id)} className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">{t('sales.common.delete')}</button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                                <span className="text-sm text-gray-500">{t('sales.payments.page')} {page} {t('sales.payments.of')} {totalPages}</span>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => handlePageChange(page - 1)} disabled={page <= 1} className="px-3 py-1 border rounded disabled:opacity-50 text-sm font-bold">‹</button>
                                    <button type="button" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages} className="px-3 py-1 border rounded disabled:opacity-50 text-sm font-bold">›</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <PaymentModal
                isOpen={isModalOpen}
                onClose={handleCancel}
                payment={editingPayment || viewingPayment}
                onSave={() => {
                    fetchPayments();
                    handleCancel();
                }}
            />

            <ConfirmDeleteModal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, paymentId: null })} onConfirm={confirmDelete} loading={deleteLoading} />
        </div>
    );
}
