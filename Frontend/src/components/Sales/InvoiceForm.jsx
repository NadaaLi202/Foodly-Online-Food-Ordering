import React, { useState, useEffect } from 'react';
import { X, Plus, Search, ChevronDown, Upload, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AddContactModal from './AddContactModal';

const InvoiceForm = ({ invoice, onClose, onSave, i18n }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [errors, setErrors] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [showAddContactModal, setShowAddContactModal] = useState(false);

    const [formData, setFormData] = useState({
        invoiceNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        clientId: '',
        clientName: '',
        items: [
            {
                productId: '',
                productName: '',
                description: '',
                quantity: 1,
                price: 0,
                discount: 0,
                discountType: '%',
                tax: 0
            }
        ],
        notes: '',
        paidAmount: 0,
        paymentMethod: 'cash',
        activeTab: 'payment',
        invoiceDiscount: 0,
        invoiceDiscountType: '%',
        warehouse: '',
        status: 'unpaid'
    });

    useEffect(() => {
        if (invoice) {
            setFormData({
                invoiceNumber: invoice.transactionNumber || '',
                issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '',
                dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
                clientId: invoice.contact?._id || invoice.contact || '',
                clientName: invoice.contact?.name || '',
                items: (invoice.items || []).map(item => ({
                    productId: item.product?._id || item.product,
                    productName: item.productName || '',
                    description: '',
                    quantity: item.quantity,
                    price: item.unitPrice,
                    discount: item.discountPercent || item.discountAmount || 0,
                    discountType: item.discountPercent ? '%' : 'fixed',
                    tax: item.taxPercent || 0
                })),
                notes: invoice.notes || '',
                paidAmount: invoice.paidAmount || 0,
                paymentMethod: invoice.paymentMethod || 'cash',
                activeTab: 'payment',
                invoiceDiscount: invoice.generalDiscountPercent || invoice.generalDiscount || 0,
                invoiceDiscountType: invoice.generalDiscountPercent ? '%' : 'fixed',
                warehouse: invoice.warehouse || '',
                status: invoice.status || 'unpaid'
            });
            setExistingAttachments(invoice.attachments || []);
        } else {
            // Generate a default invoice number if needed or wait for user input
        }
        fetchClients();
        fetchProducts();
    }, [invoice]);

    const fetchClients = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/v1/contacts/customers');
            const data = await response.json();
            setClients(data.contacts || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/v1/products');
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleClientChange = (e) => {
        const clientId = e.target.value;
        const client = clients.find(c => c._id === clientId);
        if (client) {
            setFormData({
                ...formData,
                clientId: client._id,
                clientName: client.name
            });
        } else {
            setFormData({
                ...formData,
                clientId: '',
                clientName: ''
            });
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];

        if (field === 'productName') {
            const product = products.find(p => p.name === value);
            if (product) {
                newItems[index].productId = product._id;
                newItems[index].price = product.sellingPrice;
                newItems[index].description = product.description || '';
            } else {
                newItems[index].productId = '';
            }
        }

        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
        const errorKey = `item_${field}_${index}`;
        if (errors[errorKey]) {
            setErrors({ ...errors, [errorKey]: '' });
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [
                ...formData.items,
                { productId: '', productName: '', description: '', quantity: 1, price: 0, discount: 0, discountType: '%', tax: 0 }
            ]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateItemTotal = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        const discount = parseFloat(item.discount) || 0;

        const subtotal = qty * price;
        const discountAmount = item.discountType === '%'
            ? (subtotal * discount / 100)
            : discount;
        return subtotal - discountAmount;
    };

    const calculateTotals = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
        const totalTax = formData.items.reduce((sum, item) => {
            const itemTotal = calculateItemTotal(item);
            const taxValue = parseFloat(item.tax) || 0;
            return sum + (itemTotal * taxValue / 100);
        }, 0);

        const invDiscount = parseFloat(formData.invoiceDiscount) || 0;
        const invDiscountAmount = formData.invoiceDiscountType === '%'
            ? (subtotal * invDiscount / 100)
            : invDiscount;

        const total = subtotal + totalTax - invDiscountAmount;
        return { subtotal, totalTax, total, invDiscountAmount };
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setUploadedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.invoiceNumber) newErrors.invoiceNumber = t('sales.common.required');
        if (!formData.clientId) newErrors.clientId = t('sales.common.required');
        if (formData.items.length === 0) newErrors.items = t('sales.invoices.at_least_one_item');

        formData.items.forEach((item, index) => {
            if (!item.productName) newErrors[`item_product_${index}`] = t('sales.common.required');
            if (item.quantity <= 0) newErrors[`item_quantity_${index}`] = t('sales.common.required');
            if (item.price < 0) newErrors[`item_price_${index}`] = t('sales.common.required');
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const formDataToSend = new FormData();

        // Basic fields
        formDataToSend.append('transactionNumber', formData.invoiceNumber);
        formDataToSend.append('contact', formData.clientId);
        formDataToSend.append('issueDate', formData.issueDate);
        formDataToSend.append('dueDate', formData.dueDate);
        formDataToSend.append('paymentMethod', formData.paymentMethod);
        formDataToSend.append('paidAmount', formData.paidAmount);
        formDataToSend.append('notes', formData.notes);
        formDataToSend.append('warehouse', formData.warehouse);

        if (formData.invoiceDiscountType === '%') {
            formDataToSend.append('generalDiscountPercent', formData.invoiceDiscount);
        } else {
            formDataToSend.append('generalDiscount', formData.invoiceDiscount);
        }

        // Items mapping for Backend
        const mappedItems = formData.items.map(item => ({
            product: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.price,
            discountPercent: item.discountType === '%' ? item.discount : 0,
            discountAmount: item.discountType === 'fixed' ? item.discount : 0,
            taxPercent: item.tax
        }));
        formDataToSend.append('items', JSON.stringify(mappedItems));

        // Attachments
        uploadedFiles.forEach(file => {
            formDataToSend.append('attachments', file);
        });

        onSave(formDataToSend);
    };

    const totals = calculateTotals();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                {/* Modal Header */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 font-sans">
                    <h2 className="text-lg font-black text-gray-800">
                        {invoice ? t('sales.invoices.edit_invoice') : t('sales.invoices.add_invoice')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
                    <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Top Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">
                                    {t('sales.invoices.invoice_number')}
                                </label>
                                <input
                                    type="text"
                                    name="invoiceNumber"
                                    value={formData.invoiceNumber}
                                    onChange={handleInputChange}
                                    className={`w-full border-2 ${errors.invoiceNumber ? 'border-red-500' : 'border-gray-100'} rounded-lg px-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-indigo-500 transition-colors`}
                                    placeholder={t('sales.invoices.invoice_number_placeholder')}
                                />
                                {errors.invoiceNumber && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.invoiceNumber}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">
                                    {t('sales.invoices.issue_date')}
                                </label>
                                <input
                                    type="date"
                                    name="issueDate"
                                    value={formData.issueDate}
                                    onChange={handleInputChange}
                                    className="w-full border-2 border-gray-100 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">
                                    {t('sales.invoices.due_date')}
                                </label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleInputChange}
                                    className="w-full border-2 border-gray-100 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Client Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">
                                    {t('sales.invoices.client_name')}
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        name="clientId"
                                        value={formData.clientId}
                                        onChange={handleClientChange}
                                        className={`flex-1 border-2 ${errors.clientId ? 'border-red-500' : 'border-gray-100'} rounded-lg px-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-indigo-500 bg-white transition-colors`}
                                    >
                                        <option value="">{t('sales.common.select')}</option>
                                        {clients.map(client => (
                                            <option key={client._id} value={client._id}>{client.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddContactModal(true)}
                                        className="bg-indigo-50 text-indigo-600 border-2 border-indigo-100 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-1.5 text-xs font-black"
                                    >
                                        <Plus size={14} />
                                        <span>{t('sales.common.add_client')}</span>
                                    </button>
                                </div>
                                {errors.clientId && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.clientId}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">
                                    {t('sales.common.warehouse')}
                                </label>
                                <select
                                    name="warehouse"
                                    value={formData.warehouse}
                                    onChange={handleInputChange}
                                    className="w-full border-2 border-gray-100 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-indigo-500 bg-white transition-colors"
                                >
                                    <option value="">{t('sales.common.select_warehouse')}</option>
                                    <option value="main">{t('sales.common.main_warehouse')}</option>
                                    <option value="secondary">{t('sales.common.secondary_warehouse')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border border-gray-100 rounded-xl overflow-hidden font-sans shadow-sm">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className={`px-4 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.product')}</th>
                                        <th className={`px-4 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.description')}</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">{t('sales.common.quantity')}</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest w-28">{t('sales.common.price')}</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">{t('sales.common.discount')}</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">{t('sales.common.tax')}</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">{t('sales.common.total')}</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {formData.items.map((item, index) => (
                                        <tr key={index} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="p-3">
                                                <input
                                                    list={`products-${index}`}
                                                    type="text"
                                                    value={item.productName}
                                                    onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                                    className={`w-full border-2 ${errors[`item_product_${index}`] ? 'border-red-500' : 'border-transparent group-hover:border-gray-100'} rounded-lg p-2 text-sm font-bold text-gray-700 bg-transparent focus:bg-white focus:border-indigo-500 focus:outline-none transition-all`}
                                                    placeholder={t('sales.common.product')}
                                                />
                                                <datalist id={`products-${index}`}>
                                                    {products.map(p => (
                                                        <option key={p._id} value={p.name} />
                                                    ))}
                                                </datalist>
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                    className="w-full border-2 border-transparent group-hover:border-gray-100 rounded-lg p-2 text-sm font-medium text-gray-500 bg-transparent focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                                                    placeholder={t('sales.common.description')}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    className="w-full border-2 border-transparent group-hover:border-gray-100 rounded-lg p-2 text-sm font-bold text-gray-700 text-center bg-transparent focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                                                    min="1"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                                    className="w-full border-2 border-transparent group-hover:border-gray-100 rounded-lg p-2 text-sm font-bold text-gray-700 text-center bg-transparent focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1">
                                                    <select
                                                        value={item.discountType}
                                                        onChange={(e) => handleItemChange(index, 'discountType', e.target.value)}
                                                        className="border-none bg-indigo-50 text-indigo-600 rounded p-1.5 text-[10px] font-black focus:ring-0"
                                                    >
                                                        <option value="%">%</option>
                                                        <option value="fixed">{t('sales.common.currency')}</option>
                                                    </select>
                                                    <input
                                                        type="number"
                                                        value={item.discount}
                                                        onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                                                        className="w-full border-2 border-transparent group-hover:border-gray-100 rounded-lg p-2 text-sm font-bold text-gray-700 text-center bg-transparent focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                                                        min="0"
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1 justify-center">
                                                    <input
                                                        type="number"
                                                        value={item.tax}
                                                        onChange={(e) => handleItemChange(index, 'tax', e.target.value)}
                                                        className="w-12 border-2 border-transparent group-hover:border-gray-100 rounded-lg p-2 text-sm font-bold text-gray-700 text-center bg-transparent focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                                                        min="0"
                                                    />
                                                    <span className="text-[10px] font-black text-gray-300">%</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center text-sm font-black text-gray-800">
                                                {calculateItemTotal(item).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                                    disabled={formData.items.length === 1}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button
                                type="button"
                                onClick={addItem}
                                className="w-full py-4 bg-gray-50/50 text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center gap-2 text-sm font-black transition-all border-t border-gray-50"
                            >
                                <Plus size={16} />
                                {t('sales.common.add_item')}
                            </button>
                        </div>

                        {/* Bottom Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6 font-sans">
                                {/* Tabs */}
                                <div className="flex gap-6 border-b border-gray-100">
                                    {[
                                        { id: 'payment', label: t('sales.common.payment_details') },
                                        { id: 'discount', label: t('sales.common.discount') },
                                        { id: 'notes', label: t('sales.common.notes') },
                                        { id: 'attachments', label: t('sales.common.attachments') }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, activeTab: tab.id })}
                                            className={`pb-3 px-1 text-xs font-black uppercase tracking-widest transition-all ${formData.activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-300 hover:text-gray-500'}`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="min-h-[120px]">
                                    {formData.activeTab === 'payment' && (
                                        <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.common.payment_method')}</label>
                                                <select
                                                    name="paymentMethod"
                                                    value={formData.paymentMethod}
                                                    onChange={handleInputChange}
                                                    className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm font-bold text-gray-700 focus:border-indigo-500 focus:outline-none bg-white transition-colors"
                                                >
                                                    <option value="cash">{t('sales.common.cash')}</option>
                                                    <option value="card">{t('sales.common.card')}</option>
                                                    <option value="bank">{t('sales.common.bank')}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.invoices.paid_amount')}</label>
                                                <input
                                                    type="number"
                                                    name="paidAmount"
                                                    value={formData.paidAmount}
                                                    onChange={handleInputChange}
                                                    className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm font-bold text-gray-700 focus:border-indigo-500 focus:outline-none transition-colors"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {formData.activeTab === 'discount' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.invoices.invoice_discount')}</label>
                                            <div className="flex gap-2 max-w-sm">
                                                <select
                                                    value={formData.invoiceDiscountType}
                                                    onChange={(e) => setFormData({ ...formData, invoiceDiscountType: e.target.value })}
                                                    className="border-2 border-gray-100 rounded-lg p-2 bg-indigo-50 text-indigo-600 font-black text-xs focus:ring-0"
                                                >
                                                    <option value="%">%</option>
                                                    <option value="fixed">{t('sales.common.currency')}</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    name="invoiceDiscount"
                                                    value={formData.invoiceDiscount}
                                                    onChange={handleInputChange}
                                                    className="flex-1 border-2 border-gray-100 rounded-lg p-2 text-sm font-bold text-gray-700 focus:border-indigo-500 focus:outline-none transition-colors"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {formData.activeTab === 'notes' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.common.notes')}</label>
                                            <textarea
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                                className="w-full border-2 border-gray-100 rounded-lg p-3 text-sm font-bold text-gray-700 focus:border-indigo-500 focus:outline-none transition-colors"
                                                rows="3"
                                                placeholder={t('sales.common.notes')}
                                            ></textarea>
                                        </div>
                                    )}
                                    {formData.activeTab === 'attachments' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                                            <div className="flex items-center justify-center w-full">
                                                <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-gray-100 cursor-pointer hover:border-indigo-500 transition-all group">
                                                    <Upload size={24} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                                    <span className="mt-2 text-xs font-black text-gray-400 group-hover:text-indigo-600 uppercase tracking-widest">{t('sales.common.upload')}</span>
                                                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                                                </label>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {uploadedFiles.map((file, i) => (
                                                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                        <span className="text-[10px] font-bold text-gray-600 truncate max-w-[120px]">{file.name}</span>
                                                        <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {existingAttachments.map((file, i) => (
                                                    <div key={`exist-${i}`} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                                        <span className="text-[10px] font-bold text-indigo-600 truncate max-w-[120px]">{file.fileName}</span>
                                                        <span className="text-[8px] font-black text-indigo-300 uppercase">Existing</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Totals Summary */}
                            <div className="bg-indigo-50/30 rounded-2xl p-6 space-y-4 font-sans border border-indigo-50">
                                <div className="flex justify-between text-xs font-bold text-gray-500 italic">
                                    <span>{t('sales.common.subtotal')}</span>
                                    <span>{totals.subtotal.toLocaleString()} {t('sales.common.currency')}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-gray-500 italic">
                                    <span>{t('sales.common.tax')}</span>
                                    <span>{totals.totalTax.toLocaleString()} {t('sales.common.currency')}</span>
                                </div>
                                {totals.invDiscountAmount > 0 && (
                                    <div className="flex justify-between text-xs font-bold text-red-400 italic">
                                        <span>{t('sales.common.discount')}</span>
                                        <span>-{totals.invDiscountAmount.toLocaleString()} {t('sales.common.currency')}</span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-indigo-100/50 flex justify-between items-center">
                                    <span className="text-sm font-black text-gray-800 uppercase tracking-widest">{t('sales.common.total')}</span>
                                    <span className="text-2xl font-black text-indigo-600 tracking-tighter">{totals.total.toLocaleString()} {t('sales.common.currency')}</span>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-white border-t border-gray-100 px-6 py-5 flex justify-end gap-3 font-sans">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 border-2 border-gray-100 text-gray-400 rounded-xl hover:bg-gray-50 hover:text-gray-600 transition-all text-xs font-black uppercase tracking-widest"
                    >
                        {t('sales.common.cancel')}
                    </button>
                    <button
                        form="invoice-form"
                        type="submit"
                        disabled={loading}
                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                    >
                        {loading ? t('sales.common.saving') : t('sales.invoices.save_invoice')}
                    </button>
                </div>
            </div>
            {/* Add Contact Modal */}
            <AddContactModal
                isOpen={showAddContactModal}
                onClose={() => setShowAddContactModal(false)}
                onSave={(newContact) => {
                    setClients(prev => [...prev, newContact]);
                    setFormData(prev => ({
                        ...prev,
                        clientId: newContact._id,
                        clientName: newContact.name
                    }));
                }}
                i18n={i18n}
            />
        </div>
    );
};

export default InvoiceForm;
