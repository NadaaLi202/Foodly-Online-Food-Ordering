import { Search, RefreshCw, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InvoiceList = ({ invoices, loading, onAddClick, onFetchInvoices, onInvoiceClick, i18n, noItemsKey, startKey, clientLabelKey }) => {
    const { t } = useTranslation();
    const noItemsMsg = noItemsKey ? t(noItemsKey) : t('sales.invoices.no_invoices');
    const startMsg = startKey ? t(startKey) : t('sales.invoices.start_creating');

    return (
        <div className="min-h-screen bg-white" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onAddClick}
                        className="flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm shadow-sm"
                    >
                        <span>{t('sales.common.add')}</span>
                        <Plus size={18} />
                    </button>

                    <button
                        type="button"
                        onClick={onFetchInvoices}
                        className="flex items-center gap-2 border-2 border-gray-100 text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all font-bold text-sm"
                    >
                        <RefreshCw size={16} />
                        <span>{t('sales.common.search_filter')}</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm cursor-pointer hover:text-indigo-700 transition-colors">
                    <Search size={18} />
                    <span>{t('sales.common.view')}</span>
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
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.number')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{clientLabelKey ? t(clientLabelKey) : t('sales.common.client')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.date')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.total')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {invoices.map((invoice) => (
                                    <tr
                                        key={invoice._id}
                                        className="hover:bg-indigo-50/30 cursor-pointer transition-all group"
                                        onClick={() => onInvoiceClick(invoice)}
                                    >
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-700 group-hover:text-indigo-600">
                                            {invoice.transactionNumber || invoice.invoiceNumber || invoice.number}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-500">
                                            {invoice.contact?.name || invoice.clientName}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-400">
                                            {new Date(invoice.issueDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-gray-800">
                                            {(invoice.totalAmount ?? invoice.total)?.toLocaleString()} {t('sales.common.currency')}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className={`px-4 py-1.5 text-[10px] font-black rounded-full shadow-sm ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                invoice.status === 'unpaid' ? 'bg-red-100 text-red-700' :
                                                    invoice.status === 'partial' || invoice.status === 'partially_paid' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {t(`sales.common.${invoice.status === 'partially_paid' ? 'partial' : (invoice.status || 'unpaid')}`)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
                }
            </div>
        </div>
    );
};

export default InvoiceList;
