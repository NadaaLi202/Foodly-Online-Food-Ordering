import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AddContactModal from './AddContactModal';
import AddSupplierModal from '../AddSupplierModal';
import AttachmentsSection from '../AttachmentsSection';
import api from '../../services/api';
import logError from '../../utils/logError';
import { SUPPORTED_CURRENCIES } from '../../utils/currencyFormatter';
import { currencySymbols } from '../../utils/currencySymbols';
import { useAuth } from '../../context/AuthContext';

const TAX_PRESET_VALUES = ['0', '10', '15'];
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const getTaxMode = (taxValue) => {
    const normalized = String(taxValue ?? '0');
    return TAX_PRESET_VALUES.includes(normalized) ? normalized : 'custom';
};

const InvoiceForm = ({ invoice, mode, onClose, onSave, onDeleteAttachment, i18n, contactType = 'customers', addTitleKey, editTitleKey, numberPlaceholderKey, clientLabelKey, defaultCurrency = 'EGP', hidePaymentDetails = false, loading: isSavingProp }) => {
    const { t } = useTranslation();
    const { companySettings } = useAuth();
    const systemCurrency = companySettings?.currency || 'EGP';
    const activeCurrency = defaultCurrency || systemCurrency;
    const addTitle = addTitleKey ? t(addTitleKey) : t('sales.invoices.add_invoice');
    const editTitle = editTitleKey ? t(editTitleKey) : t('sales.invoices.edit_invoice');
    const numberPlaceholder = numberPlaceholderKey ? t(numberPlaceholderKey) : t('sales.invoices.invoice_number_placeholder');
    const clientLabel = clientLabelKey ? t(clientLabelKey) : t('sales.invoices.client_name');
    const [loading, setLoading] = useState(false);
    const isBusy = loading || isSavingProp;

    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [safes, setSafes] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
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
                tax: 0,
                taxMode: '0'
            }
        ],
        notes: '',
        paidAmount: 0,
        paymentMethod: 'cash',
        treasury: '',
        treasuryType: 'safe',
        activeTab: hidePaymentDetails ? 'discount' : 'payment',
        invoiceDiscount: 0,
        invoiceDiscountType: '%',
        warehouse: '',
        status: 'unpaid',
        currency: activeCurrency
    });

    useEffect(() => {
        if (invoice) {
            const isDuplicate = mode === 'duplicate';
            const isReturn = mode === 'return';

            const yy = new Date().getFullYear().toString().slice(-2);
            const mm = (new Date().getMonth() + 1).toString().padStart(2, '0');
            const suffix = Date.now().toString().slice(-6);
            const newInvoiceNumber = `INV-${yy}-${mm}-${suffix}`;

            setFormData({
                invoiceNumber: (isDuplicate || isReturn) ? newInvoiceNumber : (invoice.transactionNumber || invoice.invoiceNumber || invoice.number || ''),
                issueDate: (isDuplicate || isReturn) ? new Date().toISOString().split('T')[0] : (invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : ''),
                dueDate: (isDuplicate || isReturn) ? new Date().toISOString().split('T')[0] : (invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : ''),
                clientId: invoice.contact?._id || invoice.contact || '',
                clientName: invoice.contact?.name || '',
                items: (invoice.items || []).map(item => ({
                    productId: item.product?._id || item.product || item.productId,
                    productName: item.productName || '',
                    description: item.description || '',
                    quantity: item.quantity,
                    price: item.unitPrice || item.price,
                    discount: item.discountPercent || item.discountAmount || item.discount || 0,
                    discountType: item.discountPercent ? '%' : 'fixed',
                    tax: item.taxPercent || item.tax || 0,
                    taxMode: getTaxMode(item.taxPercent || item.tax || 0)
                })),
                notes: invoice.notes || '',
                paidAmount: (isDuplicate || isReturn) ? 0 : (invoice.paidAmount || 0),
                paymentMethod: (invoice.paymentMethod === 'credit' ? 'card' : invoice.paymentMethod === 'bank_transfer' ? 'bank' : invoice.paymentMethod) || 'cash',
                treasury: invoice.payment?.treasury || '',
                treasuryType: invoice.payment?.treasuryType || (invoice.paymentMethod === 'bank' || invoice.paymentMethod === 'bank_transfer' ? 'bank' : 'safe'),
                activeTab: hidePaymentDetails ? 'discount' : 'payment',
                invoiceDiscount: invoice.generalDiscountPercent || invoice.generalDiscount || invoice.invoiceDiscount || 0,
                invoiceDiscountType: (invoice.generalDiscountPercent || invoice.invoiceDiscountType === '%') ? '%' : 'fixed',
                warehouse: invoice.warehouse || '',
                status: isDuplicate ? 'draft' : (isReturn ? 'unpaid' : (invoice.status || 'unpaid')),
                currency: invoice.currency || defaultCurrency
            });
            setExistingAttachments((isDuplicate || isReturn) ? [] : (invoice.attachments || []));
        } else {
            const yy = new Date().getFullYear().toString().slice(-2);
            const mm = (new Date().getMonth() + 1).toString().padStart(2, '0');
            const suffix = Date.now().toString().slice(-6);
            setFormData(prev => ({ ...prev, invoiceNumber: prev.invoiceNumber || `INV-${yy}-${mm}-${suffix}` }));
        }
        fetchClients();
        fetchProducts();
        fetchAccounts();
    }, [invoice]);

    const fetchAccounts = async () => {
        try {
            const [safesRes, banksRes] = await Promise.all([
                api.get('/safes'),
                api.get('/bank-accounts')
            ]);

            // Handle safes response
            const safeData = safesRes.data?.safes || safesRes.data?.data || [];
            setSafes(Array.isArray(safeData) ? safeData : []);

            // Handle bank accounts response (using user suggested paths)
            const bankData = banksRes.data?.bankAccounts || banksRes.data?.data || [];
            setBankAccounts(Array.isArray(bankData) ? bankData : []);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    // Re-fetch accounts when payment method changes as requested
    useEffect(() => {
        if (formData.paymentMethod === 'bank') {
            fetchAccounts();
        }
    }, [formData.paymentMethod]);

    const fetchClients = async () => {
        try {
            const response = await api.get(`/contacts/${contactType}`);
            setClients(response.data.contacts || response.data.data || []);
        } catch (error) {
            logError('Error fetching contacts:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data.products || []);
        } catch (error) {
            logError('Error fetching products:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'paymentMethod') {
            setFormData({
                ...formData,
                [name]: value,
                treasury: '', // Reset treasury when switching method
                treasuryType: value === 'bank' ? 'bank' : 'safe'
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }

        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleTreasuryChange = (e) => {
        const { value } = e.target;
        const type = formData.paymentMethod === 'bank' ? 'bank' : 'safe';
        setFormData(prev => ({
            ...prev,
            treasury: value,
            treasuryType: type
        }));
        if (errors.treasury) {
            setErrors(prev => ({ ...prev, treasury: '' }));
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
                { productId: '', productName: '', description: '', quantity: 1, price: 0, discount: 0, discountType: '%', tax: 0, taxMode: '0' }
            ]
        });
    };

    const handleTaxPresetChange = (index, value) => {
        const nextItems = [...formData.items];
        nextItems[index].taxMode = value;
        nextItems[index].tax = value === 'custom' ? (nextItems[index].tax || 0) : Number(value);
        setFormData({ ...formData, items: nextItems });
    };

    const handleCustomTaxChange = (index, value) => {
        const nextItems = [...formData.items];
        nextItems[index].taxMode = 'custom';
        nextItems[index].tax = value;
        setFormData({ ...formData, items: nextItems });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateItemTotal = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        const discount = parseFloat(item.discount) || 0;

        const subtotal = round2(qty * price);
        const discountAmount = item.discountType === '%'
            ? round2(subtotal * discount / 100)
            : discount;
        return round2(subtotal - discountAmount);
    };

    const calculateTotals = () => {
        const subtotal = round2(formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0));
        const totalTax = formData.items.reduce((sum, item) => {
            const itemTotal = calculateItemTotal(item);
            const taxValue = parseFloat(item.tax) || 0;
            return sum + round2(itemTotal * taxValue / 100);
        }, 0);

        const invDiscount = parseFloat(formData.invoiceDiscount) || 0;
        const invDiscountAmount = formData.invoiceDiscountType === '%'
            ? round2(subtotal * invDiscount / 100)
            : invDiscount;

        const total = round2(subtotal + totalTax - invDiscountAmount);
        return { subtotal, totalTax: round2(totalTax), total, invDiscountAmount: round2(invDiscountAmount) };
    };

    const totals = calculateTotals();

    const handlePaidInFullChange = (e) => {
        if (e.target.checked) {
            setFormData({ ...formData, paidAmount: totals.total });
        } else {
            setFormData({ ...formData, paidAmount: 0 });
        }
    };

    const handleDeleteExistingAttachment = async (index) => {
        const updated = existingAttachments.filter((_, i) => i !== index);
        if (onDeleteAttachment && invoice?._id) {
            try {
                await onDeleteAttachment(invoice._id, updated);
                setExistingAttachments(updated);
            } catch (e) {
                logError('Delete attachment failed:', e);
            }
        } else {
            setExistingAttachments(updated);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.invoiceNumber) newErrors.invoiceNumber = t('sales.common.required');
        if (!formData.clientId) newErrors.clientId = t('sales.common.required');

        // Treasury validation for bank/cash when paidAmount > 0
        if (Number(formData.paidAmount) > 0) {
            if (!formData.treasury) {
                newErrors.treasury = formData.paymentMethod === 'bank' ? "يرجى اختيار الحساب البنكي" : "يرجى اختيار الخزينة";
            }
        }

        if (formData.items.length === 0) newErrors.items = t('sales.invoices.at_least_one_item');

        formData.items.forEach((item, index) => {
            if (!item.productName || !item.productId) {
                newErrors[`item_product_${index}`] = t('sales.common.required');
            }
            if ((parseFloat(item.quantity) || 0) <= 0) newErrors[`item_quantity_${index}`] = t('sales.common.required');
            if ((parseFloat(item.price) || 0) < 0) newErrors[`item_price_${index}`] = t('sales.common.required');
            if ((parseFloat(item.tax) || 0) < 0) newErrors[`item_tax_${index}`] = t('sales.common.required');
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
        const paymentMethodMap = { cash: 'cash', card: 'credit', bank: 'bank_transfer' };
        const normalizedCurrency = String(formData.currency || 'EGP').trim().toUpperCase();
        const paymentPayload = {
            paidAmount: Number(formData.paidAmount) || 0,
            paymentMethod: paymentMethodMap[formData.paymentMethod] || formData.paymentMethod,
            currency: normalizedCurrency,
            treasury: formData.treasury,
            treasuryType: formData.treasuryType
        };

        // Debug log requested by user
        console.log('[INVOICE SUBMIT] payment data:', {
            paymentMethod: paymentPayload.paymentMethod,
            treasuryType: formData.treasuryType,
            treasury: formData.treasury,
            bankAccount: formData.treasuryType === 'bank' ? formData.treasury : null
        });

        formDataToSend.append('paymentMethod', paymentMethodMap[formData.paymentMethod] || formData.paymentMethod);
        formDataToSend.append('paidAmount', formData.paidAmount);
        formDataToSend.append('notes', formData.notes);
        formDataToSend.append('warehouse', formData.warehouse);
        formDataToSend.append('payment', JSON.stringify(paymentPayload));

        if (formData.invoiceDiscountType === '%') {
            formDataToSend.append('generalDiscountPercent', formData.invoiceDiscount);
        } else {
            formDataToSend.append('generalDiscount', formData.invoiceDiscount);
        }

        // Items mapping for Backend
        const mappedItems = formData.items.map(item => ({
            product: item.productId,
            productName: item.productName,
            description: item.description || '',
            quantity: parseFloat(item.quantity) || 0,
            unitPrice: parseFloat(item.price) || 0,
            discountPercent: item.discountType === '%' ? (parseFloat(item.discount) || 0) : 0,
            discountAmount: item.discountType === 'fixed' ? (parseFloat(item.discount) || 0) : 0,
            taxPercent: parseFloat(item.tax) || 0
        }));
        formDataToSend.append('items', JSON.stringify(mappedItems));

        // Attachments
        uploadedFiles.forEach(file => {
            formDataToSend.append('attachments', file);
        });

        // Set status based on button clicked
        const clickedButton = e.nativeEvent?.submitter?.id;
        if (clickedButton === 'save-draft-btn') {
            formDataToSend.set('status', 'draft');
        } else if (clickedButton === 'issue-invoice-btn') {
            // Let backend calculate based on paidAmount or force 'unpaid' if 0
            formDataToSend.set('status', formData.paidAmount > 0 ? (formData.paidAmount >= totals.total ? 'paid' : 'partial') : 'unpaid');
        }

        onSave(formDataToSend);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                {/* Modal Header */}
                <div className="bg-white px-8 py-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">
                        {invoice ? editTitle : addTitle}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <form id="invoice-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* Top Info Row: Number - Issue Date - Due Date */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                            {/* Invoice Number */}
                            <div className="md:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('sales.invoices.invoice_number')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="invoiceNumber"
                                        value={formData.invoiceNumber}
                                        onChange={handleInputChange}
                                        className={`w-full bg-gray-50 border ${errors.invoiceNumber ? 'border-red-500' : 'border-gray-200'} rounded-lg px-4 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-left`}
                                        placeholder={numberPlaceholder}
                                        dir="ltr"
                                    />
                                    <div className={`absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400`}>
                                        <Pencil size={14} />
                                    </div>
                                </div>
                                {errors.invoiceNumber && <p className="text-red-500 text-xs mt-1 font-bold">{errors.invoiceNumber}</p>}
                            </div>

                            {/* Issue Date */}
                            <div className="md:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('sales.invoices.issue_date')}
                                </label>
                                <input
                                    type="date"
                                    name="issueDate"
                                    value={formData.issueDate}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                />
                            </div>

                            {/* Due Date */}
                            <div className="md:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('sales.invoices.due_date')}
                                </label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Client/Supplier Row */}
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {clientLabel} <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <select
                                            name="clientId"
                                            value={formData.clientId}
                                            onChange={handleClientChange}
                                            className={`w-full appearance-none bg-white border ${errors.clientId ? 'border-red-500' : 'border-gray-200'} rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all`}
                                        >
                                            <option value="">{t('sales.common.choose_client') || t('sales.common.select')}</option>
                                            {clients.map(client => (
                                                <option key={client._id} value={client._id}>{client.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddContactModal(true)}
                                        className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-5 py-2.5 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-2 text-sm font-bold whitespace-nowrap"
                                    >
                                        <Plus size={16} />
                                        <span>{t('sales.common.new')}</span>
                                    </button>
                                </div>
                                {errors.clientId && <p className="text-red-500 text-xs mt-1 font-bold">{errors.clientId}</p>}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className={`px-4 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-sm font-bold text-gray-600`}>{t('sales.common.product')} <span className="text-red-500">*</span></th>
                                        <th className={`px-4 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-sm font-bold text-gray-600`}>{t('sales.common.description')}</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-600 w-24">{t('sales.common.quantity')}</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-600 w-28">{t('sales.common.price')}</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-600 w-32">{t('sales.common.discount')}</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-600 w-24">{t('sales.common.tax')}</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-600 w-32">{t('sales.common.total')}</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {formData.items.map((item, index) => (
                                        <tr key={index} className="group hover:bg-gray-50/50">
                                            <td className="p-3 align-top">
                                                <input
                                                    list={`products-${index}`}
                                                    type="text"
                                                    value={item.productName}
                                                    onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                                    className={`w-full border ${errors[`item_product_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all`}
                                                    placeholder={t('sales.common.choose_product')}
                                                />
                                                <datalist id={`products-${index}`}>
                                                    {products.map(p => (
                                                        <option key={p._id} value={p.name} />
                                                    ))}
                                                </datalist>
                                            </td>
                                            <td className="p-3 align-top">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                                                    placeholder={t('sales.common.description_placeholder')}
                                                />
                                            </td>
                                            <td className="p-3 align-top">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                                                    min="0.01"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="p-3 align-top">
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="p-3 align-top">
                                                <div className="flex items-center gap-1 border border-gray-200 rounded overflow-hidden">
                                                    <input
                                                        type="number"
                                                        value={item.discount}
                                                        onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                                                        className="w-full px-2 py-2 text-sm text-gray-700 text-center focus:outline-none"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                    <select
                                                        value={item.discountType}
                                                        onChange={(e) => handleItemChange(index, 'discountType', e.target.value)}
                                                        className="bg-gray-50 border-l border-r border-gray-200 text-gray-600 text-xs font-bold px-1 py-2 focus:outline-none"
                                                    >
                                                        <option value="%">%</option>
                                                        <option value="fixed">{currencySymbols[formData.currency] || formData.currency || '$'}</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="p-3 align-top">
                                                <div className="space-y-1">
                                                    <select
                                                        value={item.taxMode || getTaxMode(item.tax)}
                                                        onChange={(e) => handleTaxPresetChange(index, e.target.value)}
                                                        className="w-full border border-gray-200 rounded px-2 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                                                    >
                                                        <option value="0">0%</option>
                                                        <option value="10">10%</option>
                                                        <option value="15">15%</option>
                                                        <option value="custom">{t('sales.common.custom') || 'Custom'}</option>
                                                    </select>
                                                    {(item.taxMode || getTaxMode(item.tax)) === 'custom' && (
                                                        <input
                                                            type="number"
                                                            value={item.tax}
                                                            onChange={(e) => handleCustomTaxChange(index, e.target.value)}
                                                            className={`w-full border ${errors[`item_tax_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded px-2 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white`}
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="%"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 align-top text-center font-bold text-gray-800 pt-4">
                                                {(currencySymbols[formData.currency] || formData.currency || 'EGP')} {calculateItemTotal(item).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-3 align-top text-center pt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                    disabled={formData.items.length === 1}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Item Button */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={addItem}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm font-bold shadow-sm"
                            >
                                <Plus size={18} />
                                {t('sales.common.add_item')}
                            </button>
                        </div>

                        {/* Totals Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-6">

                            {/* Left Side: Tabs for Payment, Warehouse, etc */}
                            <div className="space-y-4">
                                <div className="flex gap-8 border-b border-gray-200">
                                    {[
                                        { id: 'payment', label: t('sales.common.payment_details') },
                                        { id: 'discount', label: t('sales.common.discount') },
                                        { id: 'warehouse', label: t('sales.common.warehouse') },
                                    ].filter(tab => !hidePaymentDetails || tab.id !== 'payment').map(tab => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, activeTab: tab.id })}
                                            className={`pb-3 text-sm font-bold transition-all border-b-2 ${formData.activeTab === tab.id ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-4 min-h-[100px]">
                                    {formData.activeTab === 'payment' && (
                                        <div className="space-y-4 animate-in fade-in">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium text-gray-700">{t('sales.invoices.paid_amount')}</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="paidFull"
                                                        className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                        onChange={handlePaidInFullChange}
                                                        checked={parseFloat(formData.paidAmount) >= totals.total && totals.total > 0}
                                                    />
                                                    <label htmlFor="paidFull" className="text-xs text-gray-600 cursor-pointer">{t('sales.common.fully_paid')}</label>
                                                </div>
                                            </div>
                                            <input
                                                type="number"
                                                name="paidAmount"
                                                value={formData.paidAmount}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-700 focus:border-indigo-500 focus:outline-none"
                                                min="0"
                                                step="0.01"
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Payment Method */}
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">{t('sales.common.payment_method')}</label>
                                                    <select
                                                        name="paymentMethod"
                                                        value={formData.paymentMethod}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-700 focus:outline-none"
                                                    >
                                                        <option value="cash">{t('sales.common.cash')}</option>
                                                        <option value="card">{t('sales.common.card')}</option>
                                                        <option value="bank">{t('sales.common.bank')}</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">{t('currency')}</label>
                                                    <select
                                                        name="currency"
                                                        value={formData.currency || 'EGP'}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-700 focus:outline-none bg-white"
                                                    >
                                                        {SUPPORTED_CURRENCIES.map(code => (
                                                            <option key={code} value={code}>{t(`currencies.${code}`)}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {/* Treasury selector */}
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">{formData.paymentMethod === 'cash' ? t('finance.safe') : t('finance.bank_account')}</label>
                                                    <select
                                                        name="treasury"
                                                        value={formData.treasury || ''}
                                                        onChange={handleTreasuryChange}
                                                        className={`w-full bg-white border ${errors.treasury ? 'border-red-500' : 'border-gray-200'} rounded-lg p-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-500`}
                                                    >
                                                        <option value="">{t('sales.payments.select_treasury')}</option>
                                                        {formData.paymentMethod === 'bank' ? (
                                                            bankAccounts.map(account => (
                                                                <option key={account._id} value={account._id}>{account.name}</option>
                                                            ))
                                                        ) : (
                                                            safes.map(safe => (
                                                                <option key={safe._id} value={safe._id}>{safe.name}</option>
                                                            ))
                                                        )}
                                                    </select>
                                                    {errors.treasury && <p className="text-red-500 text-[10px] font-bold mt-1 tracking-tight">{errors.treasury}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {formData.activeTab === 'discount' && (
                                        <div className="space-y-4 animate-in fade-in">
                                            <div className="flex gap-4 items-end">
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('sales.invoices.invoice_discount')}</label>
                                                    <input
                                                        type="number"
                                                        name="invoiceDiscount"
                                                        value={formData.invoiceDiscount}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-700 focus:border-indigo-500 focus:outline-none"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <select
                                                        value={formData.invoiceDiscountType}
                                                        onChange={(e) => setFormData({ ...formData, invoiceDiscountType: e.target.value })}
                                                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50 text-gray-700 focus:outline-none"
                                                    >
                                                        <option value="%">%</option>
                                                        <option value="fixed">{t('sales.common.fixed')}</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {formData.activeTab === 'warehouse' && (
                                        <div className="space-y-4 animate-in fade-in">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('sales.common.warehouse')}</label>
                                                    <select
                                                        name="warehouse"
                                                        value={formData.warehouse}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-700 focus:border-indigo-500 focus:outline-none bg-white"
                                                    >
                                                        <option value="">{t('sales.common.select_warehouse')}</option>
                                                        <option value="main">{t('sales.common.main_warehouse')}</option>
                                                        <option value="secondary">{t('sales.common.secondary_warehouse')}</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Totals Summary */}
                            <div className="bg-gray-50 rounded-xl p-6 h-fit space-y-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>{t('sales.common.subtotal')} <span className="text-xs text-gray-400">{t('sales.common.before_tax')}</span></span>
                                    <span className="font-bold">{(currencySymbols[formData.currency] || formData.currency || 'EGP')} {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>{t('sales.common.tax')}</span>
                                    <span className="font-bold text-gray-800">{(currencySymbols[formData.currency] || formData.currency || 'EGP')} {totals.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>{t('sales.common.discount')}</span>
                                    <span className="font-bold text-red-500">- {(currencySymbols[formData.currency] || formData.currency || 'EGP')} {totals.invDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 flex justify-between items-center mt-2">
                                    <span className="text-lg font-bold text-gray-800">{t('sales.common.total')}</span>
                                    <span className="text-2xl font-black text-indigo-700">{(currencySymbols[formData.currency] || formData.currency || 'EGP')} {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Attachments and Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-6">

                            {/* Attachments with better styling container */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-gray-700 mb-2">{t('sales.common.attachments')}</h3>
                                <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                    <AttachmentsSection
                                        uploadedFiles={uploadedFiles}
                                        onFilesChange={setUploadedFiles}
                                        existingAttachments={existingAttachments}
                                        onDeleteExisting={handleDeleteExistingAttachment}
                                        documentId={invoice?._id}
                                    />
                                </div>
                            </div>

                            {/* Notes Section with min-height */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    {t('sales.common.notes')}
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none transition-colors min-h-[150px] resize-none bg-white"
                                    placeholder={t('sales.common.notes_placeholder')}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-end gap-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all text-sm font-bold shadow-sm"
                    >
                        {t('sales.common.cancel')}
                    </button>
                    <button
                        id="save-draft-btn"
                        type="submit"
                        disabled={isBusy}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all text-sm font-bold shadow-sm"
                    >
                        {t('sales.common.save_draft')}
                    </button>
                    <button
                        id="issue-invoice-btn"
                        form="invoice-form"
                        type="submit"
                        disabled={isBusy}
                        className="px-8 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-md text-sm font-bold flex items-center gap-2"
                    >
                        {isBusy ? t('sales.common.saving') : t('sales.invoices.issue_invoice')}
                    </button>
                </div>
            </div>

            {/* Add Contact Modal */}
            {contactType === 'suppliers' ? (
                <AddSupplierModal
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
                />
            ) : (
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
            )}
        </div>
    );
};

export default InvoiceForm;
