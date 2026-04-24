import React, { useState } from 'react';
import { X, Calendar, ChevronDown, Upload, Trash2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AddSupplierModal from './addsuppliermodal';

const AddPurchaseInvoiceModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [lineItems, setLineItems] = useState([
        { id: 1, product: '', description: '', quantity: '', price: '', discount: '', discountType: '%', taxes: 'Exempted' }
    ]);
    const [activeTab, setActiveTab] = useState('Payment');
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

    if (!isOpen) return null;

    const handleAddLineItem = () => {
        setLineItems([...lineItems, {
            id: Date.now(),
            product: '',
            description: '',
            quantity: '',
            price: '',
            discount: '',
            discountType: '%',
            taxes: 'Exempted'
        }]);
    };

    const handleRemoveLineItem = (id) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter(item => item.id !== id));
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                {/* Backdrop */}
                <div className="fixed inset-0 backdrop-blur-md bg-black/20 transition-opacity" onClick={onClose}></div>

                {/* Modal Panel */}
                <div className="relative transform rounded-lg bg-gray-100 text-start shadow-xl transition-all w-full my-8 max-w-7xl z-10">

                    {/* Header */}
                    <div className="border-b border-gray-200 bg-white px-6 py-4 rounded-t-lg">
                        <div className="flex flex-wrap items-center justify-between sm:flex-nowrap">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">
                                    {t('purchases.invoices.add_title', 'Add Purchase Invoice')}
                                </h3>
                            </div>
                            <div className="flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="px-6 py-5 bg-gray-50 rounded-b-lg">
                        <form className="space-y-7 divide-y divide-gray-300">

                            {/* Top Details Grid */}
                            <div className="grid md:grid-cols-3 gap-3 pb-1">
                                {/* Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('sales.common.number', 'Number')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            disabled
                                            className="block w-full rounded-md border-gray-300 disabled:bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border text-gray-500"
                                            value="BILL-26-1-000001"
                                        />
                                        <div className="absolute inset-y-0 end-0 flex items-center pe-3">
                                            {/* Edit Icon Placeholder */}
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 cursor-pointer text-indigo-900">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Issue Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('sales.common.issue_date', 'Issue Date')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                        />
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('sales.common.due_date', 'Due Date')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                        />
                                    </div>
                                </div>

                                {/* Supplier Row */}
                                <div className="col-start-1 md:col-span-3 flex items-end gap-2 mt-2">
                                    <div className="grow">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('sales.common.supplier', 'Supplier')} <span className="font-bold text-red-600">*</span>
                                        </label>
                                        <div className="relative">
                                            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white appearance-none">
                                                <option value="">{t('sales.common.choose_supplier', 'Choose Supplier')}</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-gray-500">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsSupplierModalOpen(true)}
                                        className="inline-flex items-center rounded-md bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-600 shadow-sm hover:bg-indigo-200 outline-none"
                                    >
                                        <Plus size={16} className="-ms-1 me-1" />
                                        {t('sales.common.new', 'New')}
                                    </button>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="pt-4">
                                <div className="flow-root">
                                    <div className="-my-2 -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-auto">
                                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                            <table className="min-w-full divide-y divide-gray-300">
                                                <thead>
                                                    <tr>
                                                        <th className="py-3 px-3 w-8"></th>
                                                        <th className="py-3 px-3 w-8"></th>
                                                        <th className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 py-3 px-3">
                                                            {t('sales.common.product', 'Product')} <span className="font-bold text-red-600">*</span>
                                                        </th>
                                                        <th className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 py-3 px-3">
                                                            {t('purchases.common.description', 'Description')}
                                                        </th>
                                                        <th className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 py-3 px-3 w-24">
                                                            {t('sales.common.quantity', 'Quantity')}
                                                        </th>
                                                        <th className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 py-3 px-3 w-24">
                                                            {t('sales.common.price', 'Price')}
                                                        </th>
                                                        <th className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 py-3 px-3" colSpan="2">
                                                            {t('sales.common.discount', 'Discount')}
                                                        </th>
                                                        <th className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 py-3 px-3">
                                                            {t('sales.common.taxes', 'Taxes')}
                                                        </th>
                                                        <th className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 py-3 px-3 w-32">
                                                            {t('sales.common.total', 'Total')}
                                                        </th>
                                                        <th className="py-3 px-3 w-8"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white">
                                                    {lineItems.map((item, index) => (
                                                        <tr key={item.id}>
                                                            <td className="py-2 px-3 align-top pt-3">
                                                                <button type="button" className="text-gray-400 hover:text-gray-600 cursor-move">
                                                                    <svg fill="currentColor" viewBox="0 0 16 16" className="size-5"><path fillRule="evenodd" d="M7.375 3.67c0-.645-.56-1.17-1.25-1.17s-1.25.525-1.25 1.17c0 .646.56 1.17 1.25 1.17s1.25-.524 1.25-1.17zm0 8.66c0-.646-.56-1.17-1.25-1.17s-1.25.524-1.25 1.17c0 .645.56 1.17 1.25 1.17s1.25-.525 1.25-1.17zm-1.25-5.5c.69 0 1.25.525 1.25 1.17 0 .645-.56 1.17-1.25 1.17S4.875 8.645 4.875 8c0-.645.56-1.17 1.25-1.17zm5-3.16c0-.645-.56-1.17-1.25-1.17s-1.25.525-1.25 1.17c0 .646.56 1.17 1.25 1.17s1.25-.524 1.25-1.17zm-1.25 7.49c.69 0 1.25.524 1.25 1.17 0 .645-.56 1.17-1.25 1.17s-1.25-.525-1.25-1.17c0-.646.56-1.17 1.25-1.17zM11.125 8c0-.645-.56-1.17-1.25-1.17s-1.25.525-1.25 1.17c0 .645.56 1.17 1.25 1.17s1.25-.525 1.25-1.17z"></path></svg>
                                                                </button>
                                                            </td>
                                                            <td className="py-2 px-3 align-top pt-3">
                                                                <button type="button" className="text-gray-400 hover:text-gray-600">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd"></path></svg>
                                                                </button>
                                                            </td>
                                                            <td className="py-2 px-3 align-top">
                                                                <div className="relative">
                                                                    <input type="text" placeholder="Choose Product" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-3 align-top">
                                                                <input type="text" placeholder="Line Item Description" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                                            </td>
                                                            <td className="py-2 px-3 align-top">
                                                                <input type="number" min="1" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                                            </td>
                                                            <td className="py-2 px-3 align-top">
                                                                <input type="number" min="0" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                                            </td>
                                                            <td className="py-2 px-3 align-top w-24">
                                                                <input type="number" min="0" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-indigo-50" />
                                                            </td>
                                                            <td className="py-2 px-3 align-top">
                                                                <div className="relative">
                                                                    <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-indigo-50 appearance-none">
                                                                        <option>%</option>
                                                                        <option>EGP</option>
                                                                    </select>
                                                                    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-gray-400">
                                                                        <ChevronDown size={14} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-3 align-top">
                                                                <div className="relative">
                                                                    <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white appearance-none">
                                                                        <option>Exempted</option>
                                                                    </select>
                                                                    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-gray-400">
                                                                        <ChevronDown size={14} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-3 align-top text-end font-medium">
                                                                <div className="py-2 px-2 border border-gray-300 bg-gray-50 rounded-md">
                                                                    0.00 EGP
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-3 align-top text-center w-8">
                                                                {lineItems.length > 1 && (
                                                                    <button type="button" onClick={() => handleRemoveLineItem(item.id)} className="text-red-500 hover:text-red-700 pt-2">
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr>
                                                        <td colSpan="4" className="pt-4">
                                                            <button
                                                                type="button"
                                                                onClick={handleAddLineItem}
                                                                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-indigo-700"
                                                            >
                                                                <Plus className="-ms-0.5 me-2 h-4 w-4" />
                                                                Add Line Item
                                                            </button>
                                                        </td>
                                                        <td colSpan="5" className="px-3 py-4 text-sm font-medium text-gray-900 text-end">
                                                            Subtotal
                                                        </td>
                                                        <td className="px-3 py-4 text-sm font-medium text-gray-900 text-end">
                                                            0.00 EGP
                                                        </td>
                                                        <td></td>
                                                    </tr>
                                                    <tr>
                                                        <td colSpan="9" className="px-3 py-2 text-sm font-medium text-gray-900 text-end border-t border-gray-300">
                                                            Total
                                                        </td>
                                                        <td className="px-3 py-2 text-sm font-bold text-gray-900 text-end border-t border-gray-300">
                                                            0.00 EGP
                                                        </td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs & Payment Section */}
                            <div className="pt-2">
                                {/* Mobile Select for Tabs */}
                                <div className="sm:hidden mb-4">
                                    <select
                                        className="block w-full rounded-md border-gray-300 py-2 ps-3 pe-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                        value={activeTab}
                                        onChange={(e) => setActiveTab(e.target.value)}
                                    >
                                        <option>Payment</option>
                                        <option>Discount</option>
                                        <option>Settlement</option>
                                        <option>Storehouse</option>
                                    </select>
                                </div>
                                {/* Desktop Tabs */}
                                <div className="hidden sm:block">
                                    <div className="border-b border-gray-300">
                                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                            {['Payment', 'Discount', 'Settlement', 'Storehouse'].map((tab) => (
                                                <button
                                                    key={tab}
                                                    type="button"
                                                    onClick={() => setActiveTab(tab)}
                                                    className={`${activeTab === tab
                                                        ? 'border-indigo-500 text-indigo-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </nav>
                                    </div>
                                </div>

                                {/* Tab Content (Currently only Payment shown in design) */}
                                {activeTab === 'Payment' && (
                                    <div className="pt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('sales.common.paid_amount', 'Paid Amount')}
                                        </label>
                                        <div className="flex items-center flex-wrap gap-2">
                                            <div className="w-32">
                                                <input type="number" min="0" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                            </div>
                                            <div className="w-48 relative">
                                                <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white appearance-none">
                                                    <option>{t('safes.main_safe', 'الخزنة الرئيسية')}</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-gray-500">
                                                    <ChevronDown size={16} />
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <input id="fully_paid" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <label htmlFor="fully_paid" className="ms-2 block text-sm text-gray-900">
                                                    {t('sales.common.fully_paid', 'Fully Paid')}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Grid: Notes & Attachments */}
                            <div className="grid md:grid-cols-2 gap-4 pt-4">
                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('sales.common.notes', 'Notes')}
                                    </label>
                                    <textarea rows="4" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"></textarea>
                                </div>

                                {/* Attachments */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('sales.common.attachments', 'Attachments')}
                                    </label>
                                    <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                                        <div className="space-y-1 text-center">
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="flex text-sm text-gray-600">
                                                <label className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500">
                                                    <span>Upload files</span>
                                                    <input type="file" className="sr-only" multiple />
                                                </label>
                                                <p className="ps-1">or drag and drop here</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-4 flex gap-x-3 justify-end border-t border-gray-200 mt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    {t('common.save_draft', 'Save as Draft')}
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                                >
                                    {t('common.issue', 'Issue')}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>

            <AddSupplierModal
                isOpen={isSupplierModalOpen}
                onClose={() => setIsSupplierModalOpen(false)}
            />
        </div>
    );
};

export default AddPurchaseInvoiceModal;
