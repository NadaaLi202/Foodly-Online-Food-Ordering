import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, X, FolderTree } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Categories = () => {
    const { t, i18n } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parentCategory: ''
    });

    // Fetch categories from API
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:4000/api/v1/categories');
            const data = await response.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = `${t('stocked.categories.category_name')} ${t('sales.common.required')}`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
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
            const response = await fetch('http://localhost:4000/api/v1/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert(i18n.language === 'ar' ? 'تم إضافة التصنيف بنجاح!' : 'Category added successfully!');
                setIsModalOpen(false);
                fetchCategories();
                resetForm();
            } else {
                const error = await response.json();
                alert(error.message || (i18n.language === 'ar' ? 'حدث خطأ في إضافة التصنيف' : 'Error adding category'));
            }
        } catch (error) {
            console.error('Error creating category:', error);
            alert(i18n.language === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر' : 'Server connection error');
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            parentCategory: ''
        });
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

                    <button
                        onClick={fetchCategories}
                        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Search size={18} />
                        <span>{t('sales.common.search_filter')}</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                    <FolderTree size={18} className="text-gray-500" />
                    <span className="text-gray-700">{t('stocked.categories.title')}</span>
                    <RefreshCw
                        size={16}
                        className="text-gray-400 cursor-pointer hover:text-gray-600"
                        onClick={fetchCategories}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading && !isModalOpen ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="text-6xl mb-4">📁</div>
                        <p className="text-lg font-medium">{t('stocked.categories.no_categories')}</p>
                        <p className="text-sm text-indigo-600 cursor-pointer hover:underline" onClick={() => setIsModalOpen(true)}>
                            {t('stocked.categories.start_categories')}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('stocked.categories.category_name')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('stocked.categories.description')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('stocked.categories.parent_category')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('stocked.categories.products_count')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.map((category) => (
                                    <tr key={category._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {category.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {category.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {category.parentCategory?.name || t('stocked.categories.no_parent')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                {category.productsCount || 0}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">{t('stocked.categories.add_category')}</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                {/* Category Name */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('stocked.categories.category_name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder={t('stocked.categories.category_name')}
                                        className={`w-full border-2 ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none transition-colors`}
                                    />
                                    {errors.name && (
                                        <p className={`text-red-500 text-xs mt-1 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                            <span>⚠</span> {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('stocked.categories.description')}
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500 resize-none`}
                                        placeholder={t('stocked.categories.description')}
                                    />
                                </div>

                                {/* Parent Category */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('stocked.categories.parent_category')}
                                    </label>
                                    <select
                                        name="parentCategory"
                                        value={formData.parentCategory}
                                        onChange={handleInputChange}
                                        className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-indigo-500 bg-white`}
                                    >
                                        <option value="">{t('stocked.categories.no_parent')}</option>
                                        {categories.map((category) => (
                                            <option key={category._id} value={category._id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
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

export default Categories;
