import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, X, ChevronDown, Upload, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Products = () => {
    const { t, i18n } = useTranslation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState({});
    const [uploadedImage, setUploadedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: '',
        type: 'tracked', // 'tracked' or 'service'
        unitName: '',
        purchasePrice: '',
        sellingPrice: '',
        profitMargin: '',
        multipleUnits: false,
        description: '',
        image: null,
        stockQuantity: '',
        warehouse: 'main',
        lowStockThreshold: '',
        barcode: '',
        taxable: true,
        taxRate: 14
    });

    // Fetch products from API
    const fetchProducts = async (search = '') => {
        setLoading(true);
        try {
            const url = search
                ? `http://localhost:4000/api/v1/products?search=${search}`
                : 'http://localhost:4000/api/v1/products';
            const response = await fetch(url);
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = `${t('stocked.products.product_name')} ${t('sales.common.required')}`;
        }

        if (!formData.code.trim()) {
            newErrors.code = `${t('stocked.products.code')} ${t('sales.common.required')}`;
        }

        if (!formData.sellingPrice || parseFloat(formData.sellingPrice) < 0) {
            newErrors.sellingPrice = `${t('stocked.products.sale_price')} ${t('sales.common.required')}`;
        }

        if (!formData.purchasePrice || parseFloat(formData.purchasePrice) < 0) {
            newErrors.purchasePrice = `${t('stocked.products.purchase_price')} ${t('sales.common.required')}`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedImage(file);
            setFormData({ ...formData, image: file });

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove uploaded image
    const removeImage = () => {
        setUploadedImage(null);
        setImagePreview(null);
        setFormData({ ...formData, image: null });
    };

    // Handle drag and drop for image
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setUploadedImage(file);
            setFormData({ ...formData, image: file });

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Add/Remove barcode is simplified to single field
    const handleBarcodeChange = (e) => {
        setFormData({ ...formData, barcode: e.target.value });
    };

    // Simplify taxes to taxable/taxRate for matching backend
    const handleToggleTaxable = () => {
        setFormData({ ...formData, taxable: !formData.taxable });
    };

    const handleTaxRateChange = (e) => {
        setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 });
    };

    // Calculate profit margin
    const calculateProfitMargin = () => {
        const purchase = parseFloat(formData.purchasePrice) || 0;
        const sale = parseFloat(formData.sellingPrice) || 0;
        if (purchase > 0 && sale > 0) {
            return (((sale - purchase) / purchase) * 100).toFixed(2);
        }
        return '0';
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            alert(i18n.language === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
            return;
        }

        setLoading(true);

        try {
            const url = editingProduct
                ? `http://localhost:4000/api/v1/products/${editingProduct._id}`
                : 'http://localhost:4000/api/v1/products';

            const method = editingProduct ? 'PUT' : 'POST';

            // Use FormData for file upload
            const formDataToSend = new FormData();

            // Explicitly append all fields to ensure order and avoid missing keys
            formDataToSend.append('name', formData.name);
            formDataToSend.append('code', formData.code || '');
            formDataToSend.append('category', formData.category || '');
            formDataToSend.append('type', formData.type || 'tracked');
            formDataToSend.append('unitName', formData.unitName || '');
            formDataToSend.append('purchasePrice', formData.purchasePrice);
            formDataToSend.append('sellingPrice', formData.sellingPrice);
            formDataToSend.append('description', formData.description || '');
            formDataToSend.append('stockQuantity', formData.stockQuantity || 0);
            formDataToSend.append('warehouse', formData.warehouse || 'main');
            formDataToSend.append('lowStockThreshold', formData.lowStockThreshold || 0);
            formDataToSend.append('barcode', formData.barcode || '');
            formDataToSend.append('taxable', formData.taxable ? 'true' : 'false');
            formDataToSend.append('taxRate', formData.taxRate || 0);
            formDataToSend.append('multipleUnits', formData.multipleUnits ? 'true' : 'false');

            // Add image if uploaded
            if (uploadedImage) {
                formDataToSend.append('image', uploadedImage);
            }

            const response = await fetch(url, {
                method,
                body: formDataToSend
            });    // Don't set Content-Type header - browser will set it with boundary for FormData

            if (response.ok) {
                alert(i18n.language === 'ar'
                    ? (editingProduct ? 'تم تحديث المنتج بنجاح!' : 'تم إضافة المنتج بنجاح!')
                    : (editingProduct ? 'Product updated successfully!' : 'Product added successfully!'));
                setIsModalOpen(false);
                setEditingProduct(null);
                fetchProducts();
                resetForm();
            } else {
                const error = await response.json();
                // Handle both single string and array of strings for error messages
                const errorMessage = Array.isArray(error.message)
                    ? error.message.join('\n')
                    : (error.message || (i18n.language === 'ar' ? 'حدث خطأ' : 'Error occurred'));
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert(i18n.language === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر' : 'Server connection error');
        } finally {
            setLoading(false);
        }
    };

    // Handle Edit
    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            code: product.code || '',
            category: product.category || '',
            type: product.type || 'tracked',
            unitName: product.unitName || '',
            purchasePrice: product.purchasePrice || '',
            sellingPrice: product.sellingPrice || '',
            profitMargin: product.profitMargin || '',
            multipleUnits: product.multipleUnits || false,
            description: product.description || '',
            image: null,
            stockQuantity: product.stockQuantity || '',
            warehouse: product.warehouse || 'main',
            lowStockThreshold: product.lowStockThreshold || '',
            barcode: product.barcode || '',
            taxable: product.taxable !== undefined ? product.taxable : true,
            taxRate: product.taxRate || 14
        });

        // Set image preview if product has an image
        if (product.image) {
            setImagePreview(`http://localhost:4000${product.image}`);
        } else {
            setImagePreview(null);
        }
        setUploadedImage(null);

        setIsModalOpen(true);
    };

    // Handle Delete
    const handleDelete = async (id) => {
        if (!window.confirm(i18n.language === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/api/v1/products/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert(i18n.language === 'ar' ? 'تم حذف المنتج بنجاح!' : 'Product deleted successfully!');
                fetchProducts();
            } else {
                const error = await response.json();
                alert(error.message || (i18n.language === 'ar' ? 'حدث خطأ في الحذف' : 'Error deleting product'));
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(i18n.language === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر' : 'Server connection error');
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            category: '',
            type: 'tracked',
            unitName: '',
            purchasePrice: '',
            sellingPrice: '',
            profitMargin: '',
            multipleUnits: false,
            description: '',
            image: null,
            stockQuantity: '',
            warehouse: 'main',
            lowStockThreshold: '',
            barcode: '',
            taxable: true,
            taxRate: 14
        });
        setEditingProduct(null);
        setUploadedImage(null);
        setImagePreview(null);
        setErrors({});
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

                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white flex-1 max-w-md">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('sales.common.search_filter')}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                fetchProducts(e.target.value);
                            }}
                            className={`w-full focus:outline-none text-sm text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
                    <Package size={18} className="text-gray-500" />
                    <span className="text-gray-700 font-medium">{t('stocked.products.title')}</span>
                    <RefreshCw
                        size={16}
                        className={`text-gray-400 cursor-pointer hover:text-indigo-600 transition-colors ${loading ? 'animate-spin text-indigo-600' : ''}`}
                        onClick={() => fetchProducts(searchTerm)}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading && !isModalOpen ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-lg font-medium">{t('stocked.products.no_products')}</p>
                        <p className="text-sm text-indigo-600 cursor-pointer hover:underline" onClick={() => setIsModalOpen(true)}>
                            {t('stocked.products.start_products')}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('stocked.products.product_name')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('stocked.products.code')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('stocked.products.category')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('stocked.products.sale_price')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('stocked.products.stock')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('sales.common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {product.image ? (
                                                    <img
                                                        src={`http://localhost:4000${product.image}`}
                                                        alt={product.name}
                                                        className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className="h-10 w-10 flex-shrink-0 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold"
                                                    style={{ display: product.image ? 'none' : 'flex' }}
                                                >
                                                    {product.name.charAt(0)}
                                                </div>
                                                <div className={`${i18n.language === 'ar' ? 'mr-4' : 'ml-4'}`}>
                                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                    <div className="text-sm text-gray-500">{product.type === 'service' ? t('stocked.products.service_no_inventory') : t('stocked.products.product_with_inventory')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {product.code || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {product.category || '-'}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold`}>
                                            {product.sellingPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {t('sales.common.currency')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {product.type === 'service' ? (
                                                <span className="text-gray-400 text-xs italic">-</span>
                                            ) : (
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.stockQuantity <= (product.lowStockThreshold || 0)
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {product.stockQuantity || 0}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                                >
                                                    {i18n.language === 'ar' ? 'تعديل' : 'Edit'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                >
                                                    {i18n.language === 'ar' ? 'حذف' : 'Delete'}
                                                </button>
                                            </div>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                                {editingProduct ? (i18n.language === 'ar' ? 'تعديل المنتج' : 'Edit Product') : t('stocked.products.add_product')}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingProduct(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                {/* Basic Info - Responsive columns */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Name */}
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('stocked.products.product_name')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder={t('stocked.products.product_name')}
                                            className={`w-full border-2 ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                        />
                                        {errors.name && (
                                            <p className={`text-red-500 text-xs mt-1 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                                <span>⚠</span> {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Code */}
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('stocked.products.code')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            placeholder="1-000001"
                                            className={`w-full border-2 ${errors.code ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                        />
                                        {errors.code && (
                                            <p className={`text-red-500 text-xs mt-1 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                                <span>⚠</span> {errors.code}
                                            </p>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('stocked.products.category')}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className={`flex-1 border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500 bg-white`}
                                            >
                                                <option value="">{t('stocked.products.no_category')}</option>
                                            </select>
                                            <button
                                                type="button"
                                                className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Type */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('stocked.products.type')}
                                    </label>
                                    <div className={`flex flex-col gap-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="tracked"
                                                checked={formData.type === 'tracked'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">{t('stocked.products.product_with_inventory')}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="service"
                                                checked={formData.type === 'service'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">{t('stocked.products.service_no_inventory')}</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Units and Pricing */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className={`text-sm font-semibold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('stocked.products.units_pricing')}
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className="text-sm text-gray-600">{t('stocked.products.multiple_units')}</span>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    name="multipleUnits"
                                                    checked={formData.multipleUnits}
                                                    onChange={handleInputChange}
                                                    className="sr-only"
                                                />
                                                <div className={`w-10 h-5 rounded-full transition-colors ${formData.multipleUnits ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${formData.multipleUnits ? (i18n.language === 'ar' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0.5'} mt-0.5`}></div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <label className={`block text-sm text-gray-600 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('stocked.products.unit_name')}
                                            </label>
                                            <input
                                                type="text"
                                                name="unitName"
                                                value={formData.unitName}
                                                onChange={handleInputChange}
                                                className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500`}
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-sm text-gray-600 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('stocked.products.purchase_price')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="purchasePrice"
                                                value={formData.purchasePrice}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className={`w-full border-2 ${errors.purchasePrice ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                            />
                                            {errors.purchasePrice && (
                                                <p className={`text-red-500 text-xs mt-1 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                                    <span>⚠</span> {errors.purchasePrice}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={`block text-sm text-gray-600 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('stocked.products.sale_price')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="sellingPrice"
                                                value={formData.sellingPrice}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className={`w-full border-2 ${errors.sellingPrice ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                            />
                                            {errors.sellingPrice && (
                                                <p className={`text-red-500 text-xs mt-1 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                                    <span>⚠</span> {errors.sellingPrice}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={`block text-sm text-gray-600 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('stocked.products.profit_margin')} %
                                            </label>
                                            <input
                                                type="text"
                                                value={calculateProfitMargin()}
                                                readOnly
                                                className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} bg-gray-50`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description and Image */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('stocked.products.description')}
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="5"
                                            className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500 resize-none`}
                                            placeholder={t('stocked.products.description')}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('stocked.products.product_image')}
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 cursor-pointer transition-colors block h-32 flex items-center justify-center"
                                        >
                                            {imagePreview ? (
                                                <div className="relative">
                                                    <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded" />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); removeImage(); }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-gray-400 mb-2">📷</div>
                                                    <p className="text-sm text-gray-500">{t('sales.common.drop_files')}</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                {/* Stock Info (only for tracked type) */}
                                {formData.type === 'tracked' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('stocked.products.stock_quantity')}
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    name="warehouse"
                                                    value={formData.warehouse}
                                                    onChange={handleInputChange}
                                                    className={`flex-1 border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500 bg-white`}
                                                >
                                                    <option value="main">{t('sales.common.main_warehouse')}</option>
                                                    <option value="secondary">{t('sales.common.secondary_warehouse')}</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    name="stockQuantity"
                                                    value={formData.stockQuantity}
                                                    onChange={handleInputChange}
                                                    placeholder="0"
                                                    min="0"
                                                    className={`w-24 border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500`}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('stocked.products.low_stock_threshold')}
                                            </label>
                                            <input
                                                type="number"
                                                name="lowStockThreshold"
                                                value={formData.lowStockThreshold}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                                min="0"
                                                className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500`}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('stocked.products.barcode')}
                                    </label>
                                    <input
                                        type="text"
                                        name="barcode"
                                        value={formData.barcode}
                                        onChange={handleInputChange}
                                        placeholder={t('stocked.products.barcode')}
                                        className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500`}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('stocked.products.taxes')}
                                    </label>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="taxable"
                                                checked={formData.taxable}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">{i18n.language === 'ar' ? 'خاضع للضريبة' : 'Taxable'}</span>
                                        </label>

                                        {formData.taxable && (
                                            <div className="flex items-center gap-3">
                                                <label className="text-sm text-gray-600 min-w-[100px]">{t('stocked.products.vat')} %</label>
                                                <input
                                                    type="number"
                                                    name="taxRate"
                                                    value={formData.taxRate}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    max="100"
                                                    className={`w-24 border-2 border-gray-200 rounded-lg px-3 py-1.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-start gap-3 sticky bottom-0">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('sales.common.saving') : t('sales.common.save')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                            >
                                {t('sales.common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
