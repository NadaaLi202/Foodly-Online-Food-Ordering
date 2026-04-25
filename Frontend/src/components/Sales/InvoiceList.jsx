import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Plus, MoreVertical, Eye, Undo2, Copy, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currencyFormatter';
import ClientLink from '../navigation/clientlink';

const InvoiceList = ({ invoices, loading, onAddClick, onRefresh, onInvoiceClick, onDuplicate, onDelete, i18n, noItemsKey, startKey, clientLabelKey, isSupplier = false, canAdd = true }) => {
    const { t } = useTranslation();
    const { companySettings } = useAuth();
    const systemCurrency = companySettings?.currency || 'EGP';
    const noItemsMsg = noItemsKey ? t(noItemsKey) : t('sales.invoices.no_invoices');
    const startMsg = startKey ? t(startKey) : t('sales.invoices.start_creating');

    const [selectedIds, setSelectedIds] = useState([]);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuToggle = (e, invoiceId) => {
        e.stopPropagation();
        if (openMenuId === invoiceId) {
            setOpenMenuId(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const dropdownWidth = 220;
        // If the button's left + dropdown would overflow the viewport, anchor to right edge
        const leftPos = rect.left + dropdownWidth > window.innerWidth
            ? window.innerWidth - dropdownWidth - 8
            : rect.left;
        setMenuPos({
            top: rect.bottom + 4,
            left: leftPos,
        });
        setOpenMenuId(invoiceId);
    };

    const toggleSelection = (e, id) => {
        e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const toggleAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(invoices.map(inv => inv._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkDelete = () => {
        if (onDelete && selectedIds.length > 0) {
            if (window.confirm('هل أنت متأكد من حذف الفواتير المحددة؟')) {
                selectedIds.forEach(id => onDelete(id));
                setSelectedIds([]);
            }
        }
    };

    const handleActionClick = (e, action, invoice) => {
        e.stopPropagation();
        setOpenMenuId(null);
        if (action === 'view') {
            onInvoiceClick(invoice);
        } else if (action === 'return' && onCreateReturn) {
            onCreateReturn(invoice);
        } else if (action === 'duplicate' && onDuplicate) {
            onDuplicate(invoice);
        } else if (action === 'select') {
            setSelectedIds(prev => [...new Set([...prev, invoice._id])]);
        } else if (action === 'delete' && onDelete) {
            if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
                onDelete(invoice._id);
            }
        }
    };

    return (
        <div className="min-h-screen bg-white" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white border-b border-gray-100 px-6 py-4">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    {canAdd && (
                        <button type="button" onClick={onAddClick} className="flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm shadow-sm">
                            <span>{t('sales.common.add')}</span>
                            <Plus size={18} />
                        </button>
                    )}
                    <button type="button" onClick={onRefresh} className="flex items-center gap-2 border-2 border-gray-100 text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all font-bold text-sm">
                        <RefreshCw size={16} />
                        <span>{t('sales.common.search_filter')}</span>
                    </button>
                </div>
                <div className="flex justify-between items-center text-indigo-600 font-bold text-sm">
                    <span>{t('sales.payments.total')} {invoices.length}</span>
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg">
                            <span>تم تحديد {selectedIds.length} فاتورة</span>
                            <button onClick={handleBulkDelete} className="text-red-700 hover:text-red-800 flex items-center gap-1">
                                <Trash2 size={16} /> حذف المحدد
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* List Content */}
            <div className="p-6">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-80 text-gray-300">
                        <div className="text-6xl mb-4 opacity-20">📄</div>
                        <p className="text-lg font-bold text-gray-400">{noItemsMsg}</p>
                        <p className="text-sm text-gray-400 mt-1">{startMsg}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr>
                                    <th className="px-4 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 w-4 h-4"
                                            checked={invoices.length > 0 && selectedIds.length === invoices.length}
                                            onChange={toggleAll}
                                        />
                                    </th>
                                    <th className="px-2 py-4 w-10"></th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.number')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{clientLabelKey ? t(clientLabelKey) : t('sales.common.client')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.date')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.total')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {invoices.map((invoice) => {
                                    const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled';
                                    const displayStatus = isOverdue ? 'overdue' : (invoice.status || 'unpaid');

                                    let statusColor = 'bg-gray-100 text-gray-600';
                                    let statusLabel = displayStatus;

                                    if (displayStatus === 'paid') { statusColor = 'bg-green-100 text-green-700'; statusLabel = 'مدفوعة'; }
                                    else if (displayStatus === 'unpaid' || displayStatus === 'issued') { statusColor = 'bg-red-100 text-red-700'; statusLabel = 'غير مدفوعة'; }
                                    else if (displayStatus === 'partial' || displayStatus === 'partially_paid') { statusColor = 'bg-orange-100 text-orange-700'; statusLabel = 'مدفوعة جزئياً'; }
                                    else if (displayStatus === 'draft') { statusColor = 'bg-gray-100 text-gray-600'; statusLabel = 'مسودة'; }
                                    else if (displayStatus === 'cancelled') { statusColor = 'bg-red-100 text-red-700'; statusLabel = 'ملغية'; }
                                    else if (displayStatus === 'overdue') { statusColor = 'bg-red-100 text-red-700'; statusLabel = 'متأخرة'; }

                                    return (
                                        <tr
                                            key={invoice._id}
                                            className={`hover:bg-indigo-50/30 cursor-pointer transition-all group ${selectedIds.includes(invoice._id) ? 'bg-indigo-50/20' : ''}`}
                                            onClick={() => onInvoiceClick(invoice)}
                                        >
                                            <td className="px-4 py-5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 w-4 h-4 cursor-pointer"
                                                    checked={selectedIds.includes(invoice._id)}
                                                    onChange={(e) => toggleSelection(e, invoice._id)}
                                                />
                                            </td>
                                            <td className="px-2 py-5 whitespace-nowrap text-gray-500" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => handleMenuToggle(e, invoice._id)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-700 group-hover:text-indigo-600">
                                                {invoice.transactionNumber || invoice.invoiceNumber || invoice.number}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-500" onClick={(e) => e.stopPropagation()}>
                                                <ClientLink client={invoice.contact} clientId={invoice.contact?._id} isSupplier={isSupplier}>
                                                    {invoice.contact?.name || invoice.clientName}
                                                </ClientLink>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-400">
                                                {new Date(invoice.issueDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-gray-800">
                                                {formatCurrency(invoice.totalAmount ?? invoice.total, invoice.currency || systemCurrency)}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className={`px-4 py-1.5 text-[10px] tracking-wide font-black rounded-full shadow-sm ${statusColor}`}>
                                                    {statusLabel}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
                }
            </div>

            {/* Fixed-position dropdown — rendered outside overflow container */}
            {openMenuId && (
                <div
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        top: menuPos.top,
                        left: menuPos.left,
                        zIndex: 9999,
                        minWidth: '210px',
                        direction: 'rtl',
                    }}
                    className="bg-white rounded-xl shadow-2xl border border-gray-100 py-1 overflow-hidden"
                    dir="rtl"
                >
                    {(() => {
                        const invoice = invoices.find(inv => inv._id === openMenuId);
                        if (!invoice) return null;
                        return (
                            <>
                                <button onClick={(e) => handleActionClick(e, 'view', invoice)} className="w-full text-right px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center justify-between gap-3">
                                    <span className="font-medium">عرض</span>
                                    <Eye size={16} className="text-gray-400 flex-shrink-0" />
                                </button>
                                <button onClick={(e) => handleActionClick(e, 'return', invoice)} className="w-full text-right px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center justify-between gap-3">
                                    <span className="font-medium">إنشاء فاتورة مرتجعات</span>
                                    <Undo2 size={16} className="text-gray-400 flex-shrink-0" />
                                </button>
                                <button onClick={(e) => handleActionClick(e, 'duplicate', invoice)} className="w-full text-right px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center justify-between gap-3">
                                    <span className="font-medium">تكرار</span>
                                    <Copy size={16} className="text-gray-400 flex-shrink-0" />
                                </button>
                                <button onClick={(e) => handleActionClick(e, 'select', invoice)} className="w-full text-right px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center justify-between gap-3">
                                    <span className="font-medium">تحديد</span>
                                    <div className="w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0"></div>
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button onClick={(e) => handleActionClick(e, 'delete', invoice)} className="w-full text-right px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 flex items-center justify-between gap-3">
                                    <span className="font-medium">حذف</span>
                                    <Trash2 size={16} className="flex-shrink-0" />
                                </button>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default InvoiceList;
