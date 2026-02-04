import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, X, Calendar, ChevronDown, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Returns = () => {
    const { t, i18n } = useTranslation();
    const [creditNotes, setCreditNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCreditNote, setSelectedCreditNote] = useState(null);
    const [view, setView] = useState('list'); // 'list', 'add', 'edit'

    const [formData, setFormData] = useState({
        transactionNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        contactId: '',
        contactName: '',
        items: [
            {
                productId: '',
                productName: '',
                description: '',
                quantity: 1,
                unitPrice: 0,
                discount: 0,
                discountType: '%',
                tax: 0
            }
        ],
        notes: '',
        paidAmount: 0,
        paymentMethod: 'cash',
        activeTab: 'payment',
        generalDiscount: 0,
        generalDiscountType: '%',
        warehouse: 'main'
    });

    // Fetch credit notes from API
    const fetchCreditNotes = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:4000/api/v1/transactions/sales/returns');
            const data = await response.json();
            setCreditNotes(data.data || []);
        } catch (error) {
            console.error('Error fetching credit notes:', error);
        } finally {
            setLoading(false);
        }
    };

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

    useEffect(() => {
        fetchCreditNotes();
        fetchClients();
        fetchProducts();
    }, []);

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.transactionNumber.trim()) {
            newErrors.transactionNumber = `${t('sales.returns.return_number')} ${t('sales.common.required')}`;
        }

        if (!formData.issueDate) {
            newErrors.issueDate = `${t('sales.invoices.issue_date')} ${t('sales.common.required')}`;
        }

        if (!formData.contactId) {
            newErrors.contactId = `${t('sales.common.client')} ${t('sales.common.required')}`;
        }

        // Validate items
        formData.items.forEach((item, index) => {
            if (!item.productId) {
                newErrors[`item_product_${index}`] = `${t('sales.common.product')} ${t('sales.common.required')}`;
            }
            if (!item.quantity || item.quantity <= 0) {
                newErrors[`item_quantity_${index}`] = `${t('sales.common.quantity')} ${t('sales.common.required')}`;
            }
            if (!item.unitPrice || item.unitPrice <= 0) {
                newErrors[`item_price_${index}`] = `${t('sales.common.price')} ${t('sales.common.required')}`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    // Handle item changes
    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
        // Clear error for this field
        const errorKey = `item_${field}_${index}`;
        if (errors[errorKey]) {
            setErrors({ ...errors, [errorKey]: '' });
        }
    };

    // Add new item row
    const addItem = () => {
        setFormData({
            ...formData,
            items: [
                ...formData.items,
                { product: '', description: '', quantity: '', price: '', discount: '', discountType: '%', tax: '' }
            ]
        });
    };

    // Remove item row
    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    // Handle file upload
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedFiles(prev => [...prev, ...files]);
        setFormData({ ...formData, attachments: files });
    };

    // Remove uploaded file
    const removeFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        setUploadedFiles(prev => [...prev, ...files]);
        setFormData({ ...formData, attachments: files });
    };

    // Handle new client button
    const handleNewClient = () => {
        const clientName = prompt(t('sales.common.enter_new_client'));
        if (clientName && clientName.trim()) {
            setFormData({ ...formData, clientName: clientName.trim() });
            if (errors.clientName) {
                setErrors({ ...errors, clientName: '' });
            }
        }
    };

    // Calculate item total
    const calculateItemTotal = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(item.discount) || 0;

        const subtotal = qty * price;
        const discountAmount = item.discountType === '%'
            ? (subtotal * discount / 100)
            : discount;
        return subtotal - discountAmount;
    };

    // Calculate invoice totals
    const calculateTotals = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
        const totalTax = formData.items.reduce((sum, item) => {
            const itemTotal = calculateItemTotal(item);
            const tax = parseFloat(item.tax) || 0;
            return sum + (itemTotal * tax / 100);
        }, 0);
        const total = subtotal + totalTax;
        return { subtotal, totalTax, total };
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            alert(t('sales.common.fill_required'));
            return;
        }

        setLoading(true);

        try {
            const fd = new FormData();
            fd.append('transactionNumber', formData.transactionNumber);
            fd.append('contact', formData.contactId);
            fd.append('issueDate', formData.issueDate);
            fd.append('dueDate', formData.dueDate);
            fd.append('notes', formData.notes);
            fd.append('warehouse', formData.warehouse);
            fd.append('paymentMethod', formData.paymentMethod);
            fd.append('paidAmount', formData.paidAmount);

            // General Discount
            if (formData.generalDiscountType === '%') {
                fd.append('generalDiscountPercent', formData.generalDiscount);
            } else {
                fd.append('generalDiscount', formData.generalDiscount);
            }

            // Items
            const formattedItems = formData.items.map(item => ({
                product: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxPercent: item.tax,
                [item.discountType === '%' ? 'discountPercent' : 'discountAmount']: item.discount
            }));
            fd.append('items', JSON.stringify(formattedItems));

            // Attachments
            if (uploadedFiles && uploadedFiles.length > 0) {
                uploadedFiles.forEach(file => {
                    fd.append('attachments', file);
                });
            }

            const response = await fetch('http://localhost:4000/api/v1/transactions/sales/returns', {
                method: 'POST',
                body: fd,
            });

            if (response.ok) {
                alert(t('sales.common.success_message'));
                setIsModalOpen(false);
                fetchCreditNotes();
                resetForm();
            } else {
                const error = await response.json();
                alert(error.message || t('sales.common.error_message'));
            }
        } catch (error) {
            console.error('Error creating credit note:', error);
            alert(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            transactionNumber: '',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0],
            contactId: '',
            contactName: '',
            items: [{ productId: '', productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, discountType: '%', tax: 0 }],
            notes: '',
            paidAmount: 0,
            paymentMethod: 'cash',
            activeTab: 'payment',
            generalDiscount: 0,
            generalDiscountType: '%',
            warehouse: 'main'
        });
        setUploadedFiles([]);
        setErrors({});
    };

    const totals = calculateTotals();

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
                        onClick={fetchCreditNotes}
                        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={18} />
                        <span>{t('sales.common.search_filter')}</span>
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
                ) : creditNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="text-6xl mb-4">📄</div>
                        <p className="text-lg font-medium">{t('sales.returns.no_returns')}</p>
                        <p className="text-sm">{t('sales.returns.start_returns')}</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.common.number')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.common.client')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.common.date')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.common.amount')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.common.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {creditNotes.map((note) => (
                                    <tr key={note._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {note.transactionNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {note.contact?.name || t('sales.common.none')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(note.issueDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {note.total?.toFixed(2)} {t('sales.common.currency')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                                {t('sales.returns.returned')}
                                            </span>
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                            <h2 className={`text-xl font-bold text-gray-800 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.returns.add_return')}</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Invoice Info - 3 columns */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.common.number')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="transactionNumber"
                                            value={formData.transactionNumber}
                                            onChange={handleInputChange}
                                            placeholder={t('sales.returns.return_number_placeholder') || "RINV-26-1-000001"}
                                            className={`w-full border-2 ${errors.transactionNumber ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                        />
                                        {errors.transactionNumber && (
                                            <p className={`text-red-500 text-xs mt-1 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                                <span>⚠</span> {errors.transactionNumber}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.invoices.issue_date')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="issueDate"
                                            value={formData.issueDate}
                                            onChange={handleInputChange}
                                            className={`w-full border-2 ${errors.issueDate ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                        />
                                        {errors.issueDate && (
                                            <p className={`text-red-500 text-xs mt-1 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                                <span>⚠</span> {errors.issueDate}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.invoices.due_date')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="dueDate"
                                            value={formData.dueDate}
                                            onChange={handleInputChange}
                                            className={`w-full border-2 ${errors.dueDate ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                        />
                                        {errors.dueDate && (
                                            <p className={`text-red-500 text-xs mt-1 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                                <span>⚠</span> {errors.dueDate}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Client with button */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('sales.common.client')} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center gap-1 whitespace-nowrap transition-colors"
                                        >
                                            <Plus size={18} />
                                            {t('sales.common.add')}
                                        </button>
                                        <select
                                            name="contactId"
                                            value={formData.contactId}
                                            onChange={(e) => {
                                                const selectedClient = clients.find(c => c._id === e.target.value);
                                                setFormData({ ...formData, contactId: e.target.value, contactName: selectedClient?.name || '' });
                                            }}
                                            className={`flex-1 border-2 ${errors.contactId ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors bg-white`}
                                        >
                                            <option value="">{t('sales.common.select') + ' ' + t('sales.common.client')}</option>
                                            {clients.map(client => (
                                                <option key={client._id} value={client._id}>{client.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.contactId && (
                                        <p className={`text-red-500 text-xs mt-1 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                            <span>⚠</span> {errors.contactId}
                                        </p>
                                    )}
                                </div>

                                {/* Items Table */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-1 text-sm"
                                        >
                                            <Plus size={16} />
                                            <span>{t('sales.common.add')}</span>
                                        </button>
                                        <label className="text-sm font-semibold text-gray-700">
                                            {t('sales.common.product')} <span className="text-red-500">*</span>
                                        </label>
                                    </div>

                                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className={`px-3 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-bold text-gray-700`}>{t('sales.common.total')}</th>
                                                    <th className={`px-3 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-bold text-gray-700`}>{t('sales.common.tax')}</th>
                                                    <th className={`px-3 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-bold text-gray-700`}>{t('sales.common.discount')}</th>
                                                    <th className={`px-3 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-bold text-gray-700`}>{t('sales.common.price')}</th>
                                                    <th className={`px-3 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-bold text-gray-700`}>{t('sales.common.quantity')}</th>
                                                    <th className={`px-3 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-bold text-gray-700`}>{t('sales.common.description')}</th>
                                                    <th className={`px-3 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-bold text-gray-700`}>{t('sales.common.product')}</th>
                                                    <th className="px-3 py-3"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.items.map((item, index) => (
                                                    <tr key={index} className="border-b border-gray-100">
                                                        {/* Total */}
                                                        <td className="px-3 py-3">
                                                            <div className={`text-sm font-bold text-gray-900 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                                {calculateItemTotal(item).toFixed(2)} {t('sales.common.currency')}
                                                            </div>
                                                        </td>

                                                        {/* Tax */}
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center gap-1">
                                                                <select
                                                                    value={item.tax}
                                                                    onChange={(e) => handleItemChange(index, 'tax', e.target.value)}
                                                                    className="w-20 border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                                                                >
                                                                    <option value="">{t('sales.common.none')}</option>
                                                                    <option value="14">14%</option>
                                                                    <option value="5">5%</option>
                                                                    <option value="10">10%</option>
                                                                </select>
                                                                <ChevronDown size={14} className="text-gray-400" />
                                                            </div>
                                                        </td>

                                                        {/* Discount */}
                                                        <td className="px-3 py-3">
                                                            <div className="flex gap-1">
                                                                <select
                                                                    value={item.discountType}
                                                                    onChange={(e) => handleItemChange(index, 'discountType', e.target.value)}
                                                                    className="w-14 border border-gray-200 rounded px-1 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                                                                >
                                                                    <option value="%">%</option>
                                                                    <option value="fixed">{t('sales.common.currency')}</option>
                                                                </select>
                                                                <input
                                                                    type="number"
                                                                    value={item.discount}
                                                                    onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                                                                    className={`w-20 border border-gray-200 rounded px-2 py-2 text-sm text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500`}
                                                                    placeholder="0.00"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </div>
                                                        </td>

                                                        {/* Price */}
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="number"
                                                                value={item.unitPrice}
                                                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                                className={`w-28 border-2 ${errors[`item_price_${index}`] ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded px-2 py-2 text-sm text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                                                placeholder="0.00"
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        </td>

                                                        {/* Quantity */}
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                                className={`w-20 border-2 ${errors[`item_quantity_${index}`] ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded px-2 py-2 text-sm text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                                                placeholder="1"
                                                                min="1"
                                                            />
                                                        </td>

                                                        {/* Description */}
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="text"
                                                                value={item.description}
                                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                                placeholder={t('sales.common.description')}
                                                                className={`w-full border-2 ${errors[`item_description_${index}`] ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded px-2 py-2 text-sm text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                                            />
                                                        </td>

                                                        {/* Product */}
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center gap-1">
                                                                <select
                                                                    value={item.productId}
                                                                    onChange={(e) => {
                                                                        const selectedProd = products.find(p => p._id === e.target.value);
                                                                        const newItems = [...formData.items];
                                                                        newItems[index] = {
                                                                            ...newItems[index],
                                                                            productId: e.target.value,
                                                                            productName: selectedProd?.name || '',
                                                                            unitPrice: selectedProd?.sellingPrice || 0
                                                                        };
                                                                        setFormData({ ...formData, items: newItems });
                                                                    }}
                                                                    className={`flex-1 border-2 ${errors[`item_product_${index}`] ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded px-2 py-2 text-sm text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors bg-white`}
                                                                >
                                                                    <option value="">{t('sales.common.select') + ' ' + t('sales.common.product')}</option>
                                                                    {products.map(p => (
                                                                        <option key={p._id} value={p._id}>{p.name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </td>

                                                        {/* Delete */}
                                                        <td className="px-3 py-3">
                                                            {formData.items.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeItem(index)}
                                                                    className="text-red-500 hover:text-red-700 p-1"
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Subtotals Row */}
                                    <div className={`flex justify-end mt-2 gap-8 text-sm text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        <div className={`text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            <div className="text-gray-600 mb-1">{t('sales.common.subtotal')}</div>
                                            <div className="font-bold">{totals.subtotal.toFixed(2)} {t('sales.common.currency')}</div>
                                        </div>
                                        <div className={`text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            <div className="text-gray-600 mb-1">{t('sales.common.tax')}</div>
                                            <div className="font-bold">{totals.totalTax.toFixed(2)} {t('sales.common.currency')}</div>
                                        </div>
                                        <div className={`text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            <div className="text-gray-600 mb-1">{t('sales.common.total')}</div>
                                            <div className="font-bold">{totals.total.toFixed(2)} {t('sales.common.currency')}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Tabs */}
                                <div>
                                    <div className="flex gap-2 border-b border-gray-200 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, activeTab: 'payment' })}
                                            className={`px-4 py-2 text-sm font-semibold ${formData.activeTab === 'payment' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {t('sales.invoices.payment_tab')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, activeTab: 'discount' })}
                                            className={`px-4 py-2 text-sm font-semibold ${formData.activeTab === 'discount' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {t('sales.invoices.discount_tab')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, activeTab: 'settlement' })}
                                            className={`px-4 py-2 text-sm font-semibold ${formData.activeTab === 'settlement' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {t('sales.invoices.settlement_tab')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, activeTab: 'warehouse' })}
                                            className={`px-4 py-2 text-sm font-semibold ${formData.activeTab === 'warehouse' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {t('sales.invoices.warehouse_tab')}
                                        </button>
                                    </div>

                                    {/* Tab Content */}
                                    {formData.activeTab === 'payment' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                    {t('sales.invoices.paid_amount')}
                                                </label>
                                                <input
                                                    type="number"
                                                    name="paidAmount"
                                                    value={formData.paidAmount}
                                                    onChange={handleInputChange}
                                                    className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} bg-white font-bold`}
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                    {t('sales.invoices.main_method')}
                                                </label>
                                                <select
                                                    name="paymentMethod"
                                                    value={formData.paymentMethod}
                                                    onChange={handleInputChange}
                                                    className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500 bg-white`}
                                                >
                                                    <option value="cash">{t('sales.common.fully_paid')}</option>
                                                    <option value="card">{t('sales.common.card')}</option>
                                                    <option value="bank">{t('sales.common.bank')}</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {formData.activeTab === 'discount' && (
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('sales.invoices.invoice_discount')}
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={formData.generalDiscountType || '%'}
                                                    onChange={(e) => setFormData({ ...formData, generalDiscountType: e.target.value })}
                                                    className={`w-24 border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500 bg-white`}
                                                >
                                                    <option value="%">%</option>
                                                    <option value="fixed">{t('sales.common.currency')}</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    name="generalDiscount"
                                                    value={formData.generalDiscount || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="0"
                                                    className={`flex-1 border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500`}
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.activeTab === 'settlement' && (
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('sales.invoices.paid_amount')}
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    className="border-2 border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50 text-sm"
                                                >
                                                    {t('sales.common.main_treasury')}
                                                </button>
                                                <input
                                                    type="text"
                                                    value={t('sales.common.fully_paid')}
                                                    readOnly
                                                    className={`flex-1 border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} bg-gray-50`}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.activeTab === 'warehouse' && (
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('sales.common.select_warehouse')}
                                            </label>
                                            <select
                                                name="warehouse"
                                                value={formData.warehouse || ''}
                                                onChange={handleInputChange}
                                                className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500 bg-white`}
                                            >
                                                <option value="">{t('sales.common.select_warehouse')}</option>
                                                <option value="main">{t('sales.common.main_warehouse')}</option>
                                                <option value="secondary">{t('sales.common.secondary_warehouse')}</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Attachments and Notes */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.common.attachments')}
                                        </label>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 cursor-pointer transition-colors block"
                                        >
                                            <div className="text-gray-400 mb-2">📎</div>
                                            <p className="text-sm text-gray-500">{t('sales.common.drop_files')}</p>
                                        </label>

                                        {/* Display uploaded files */}
                                        {uploadedFiles.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {uploadedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                                        <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(index)}
                                                            className="text-red-500 hover:text-red-700 ml-2"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.common.notes')}
                                        </label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows="5"
                                            className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500 resize-none`}
                                            placeholder=""
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-start gap-3 sticky bottom-0">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="border-2 border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                            >
                                {t('sales.common.cancel')}
                            </button>
                            <button
                                type="button"
                                className="border-2 border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                            >
                                {t('sales.common.save_draft') || (i18n.language === 'ar' ? 'حفظ كمسودة' : 'Save draft')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('sales.common.saving') : (i18n.language === 'ar' ? 'إصدار الفاتورة' : 'Issue Invoice')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Returns;