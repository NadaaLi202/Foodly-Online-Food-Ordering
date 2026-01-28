import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, X, Calendar, ChevronDown, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Quotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const { t, i18n } = useTranslation();

    const [formData, setFormData] = useState({
        quotationNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        clientName: '',
        items: [
            {
                product: '',
                description: '',
                quantity: '',
                price: '',
                discount: '',
                discountType: '%',
                tax: ''
            }
        ],
        notes: '',
        subtotal: 0,
        discount: 0,
        total: 0,
        paymentMethod: 'cash',
        attachments: null,
        activeTab: 'payment',
        invoiceDiscount: '',
        invoiceDiscountType: '%',
        warehouse: ''
    });

    // Fetch credit notes from API
    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:4000/api/v1/quotations');
            const data = await response.json();
            setQuotations(data.quotations || []);
        } catch (error) {
            console.error('Error fetching quotations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.quotationNumber.trim()) {
            newErrors.quotationNumber = t('sales.quotations.quotation_number') + ' ' + t('sales.common.required');
        }

        if (!formData.issueDate) {
            newErrors.issueDate = t('sales.common.issue_date') + ' ' + t('sales.common.required');
        }

        if (!formData.dueDate) {
            newErrors.dueDate = t('sales.common.due_date') + ' ' + t('sales.common.required');
        }

        if (!formData.clientName.trim()) {
            newErrors.clientName = t('sales.common.client') + ' ' + t('sales.common.required');
        }

        // Validate items
        formData.items.forEach((item, index) => {
            if (!item.product || !item.product.trim()) {
                newErrors[`item_product_${index}`] = t('sales.common.product') + ' ' + t('sales.common.required');
            }
            if (!item.description || !item.description.trim()) {
                newErrors[`item_description_${index}`] = t('sales.common.description') + ' ' + t('sales.common.required');
            }
            if (!item.quantity || item.quantity <= 0) {
                newErrors[`item_quantity_${index}`] = t('sales.common.quantity') + ' ' + t('sales.common.required');
            }
            if (!item.price || item.price <= 0) {
                newErrors[`item_price_${index}`] = t('sales.common.price') + ' ' + t('sales.common.required');
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
        const price = parseFloat(item.price) || 0;
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
            const totals = calculateTotals();
            const response = await fetch('http://localhost:4000/api/v1/quotations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    subtotal: totals.subtotal,
                    tax: totals.totalTax,
                    total: totals.total
                }),
            });

            if (response.ok) {
                alert(t('sales.common.success_message'));
                setIsModalOpen(false);
                fetchQuotations();
                resetForm();
            } else {
                const error = await response.json();
                alert(error.message || t('sales.common.error_message'));
            }
        } catch (error) {
            console.error('Error creating quotation:', error);
            alert(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            quotationNumber: '',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0],
            clientName: '',
            items: [{ product: '', description: '', quantity: '', price: '', discount: '', discountType: '%', tax: '' }],
            notes: '',
            subtotal: 0,
            discount: 0,
            total: 0,
            paymentMethod: 'cash',
            attachments: null,
            activeTab: 'payment',
            invoiceDiscount: '',
            invoiceDiscountType: '%',
            warehouse: ''
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
                        onClick={fetchQuotations}
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
                ) : quotations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="text-6xl mb-4">📄</div>
                        <p className="text-lg font-medium">{t('sales.quotations.no_quotations')}</p>
                        <p className="text-sm">{t('sales.quotations.start_quotations')}</p>
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
                                {quotations.map((note) => (
                                    <tr key={note._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {note.quotationNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {note.clientName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(note.issueDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
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
                            <h2 className={`text-xl font-bold text-gray-800 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.quotations.add_quotation')}</h2>
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
                                            name="quotationNumber"
                                            value={formData.quotationNumber}
                                            onChange={handleInputChange}
                                            placeholder={t('sales.quotations.quotation_number_placeholder') || "QTN-26-1-000001"}
                                            className={`w-full border-2 ${errors.quotationNumber ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                        />
                                        {errors.quotationNumber && (
                                            <p className={`text-red-500 text-xs mt-1 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                                <span>⚠</span> {errors.quotationNumber}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.common.issue_date')} <span className="text-red-500">*</span>
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
                                            {t('sales.common.due_date')} <span className="text-red-500">*</span>
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
                                            onClick={handleNewClient}
                                            className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center gap-1 whitespace-nowrap transition-colors"
                                        >
                                            <Plus size={18} />
                                            {t('sales.common.new')}
                                        </button>
                                        <input
                                            type="text"
                                            name="clientName"
                                            value={formData.clientName}
                                            onChange={handleInputChange}
                                            placeholder={t('sales.common.select') + ' ' + t('sales.common.client')}
                                            className={`flex-1 border-2 ${errors.clientName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-lg px-3 py-2.5 text-right focus:outline-none transition-colors`}
                                        />
                                    </div>
                                    {errors.clientName && (
                                        <p className={`text-red-500 text-xs mt-1 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                            <span>⚠</span> {errors.clientName}
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
                                            {t('sales.common.add')}
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
                                                                value={item.price}
                                                                onChange={(e) => handleItemChange(index, 'price', e.target.value)}
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
                                                                <input
                                                                    type="text"
                                                                    value={item.product}
                                                                    onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                                                                    placeholder={t('sales.common.select') + ' ' + t('sales.common.product')}
                                                                    className={`flex-1 border-2 ${errors[`item_product_${index}`] ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded px-2 py-2 text-sm text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                                                />
                                                                <button type="button" className="text-gray-400 hover:text-gray-600">
                                                                    <Search size={16} />
                                                                </button>
                                                                <button type="button" className="text-gray-400 hover:text-gray-600">
                                                                    <span className="text-lg">⋮</span>
                                                                </button>
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
                                            onClick={() => setFormData({ ...formData, activeTab: 'discount' })}
                                            className={`px-4 py-2 text-sm font-semibold ${formData.activeTab === 'discount' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {t('sales.invoices.discount_tab')}
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
                                                    value={totals.total.toFixed(2)}
                                                    readOnly
                                                    className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} bg-gray-50 font-bold`}
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
                                                    value={formData.invoiceDiscountType || '%'}
                                                    onChange={(e) => setFormData({ ...formData, invoiceDiscountType: e.target.value })}
                                                    className={`w-24 border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500 bg-white`}
                                                >
                                                    <option value="%">%</option>
                                                    <option value="fixed">{t('sales.common.currency')}</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    name="invoiceDiscount"
                                                    value={formData.invoiceDiscount || ''}
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
                                                {t('sales.common.warehouse')}
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
                                {i18n.language === 'ar' ? 'حفظ كمسودة' : 'Save as draft'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('sales.common.saving') : t('sales.quotations.add_quotation')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotations;