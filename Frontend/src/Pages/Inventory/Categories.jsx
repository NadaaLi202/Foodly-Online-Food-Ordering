import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, X, FolderTree } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import logError from '../../utils/logerror';
import { confirmDelete } from '../../utils/confirmdelete';

const Categories = () => {
    const { t, i18n } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parentCategory: ''
    });

    // Fetch categories from API
    const fetchCategories = async (search = '') => {
        setLoading(true);
        try {
            const url = search
                ? `/category?search=${search}`
                : '/category';
            const response = await api.get(url);
            setCategories(response.data.categories || []);
        } catch (error) {
            logError('Error fetching categories:', error);
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
            const url = editingCategory
                ? `/category/${editingCategory._id}`
                : '/category';

            const method = editingCategory ? 'PUT' : 'POST';

            const payload = {
                name: formData.name,
                description: formData.description,
                parentCategory: formData.parentCategory || null
            };

            await api({
                method,
                url,
                data: payload,
            });

            alert(i18n.language === 'ar'
                ? (editingCategory ? 'تم تحديث التصنيف بنجاح!' : 'تم إضافة التصنيف بنجاح!')
                : (editingCategory ? 'Category updated successfully!' : 'Category added successfully!'));
            setIsModalOpen(false);
            setEditingCategory(null);
            fetchCategories();
            resetForm();

        } catch (error) {
            logError('Error saving category:', error);
            const msg = error.response?.data?.message || (i18n.language === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر' : 'Server connection error');
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    // Handle Edit
    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || '',
            description: category.description || '',
            parentCategory: category.parentCategory?._id || category.parentCategory || ''
        });
        setIsModalOpen(true);
    };

    // Handle Delete
    const handleDelete = async (id) => {
        const confirmed = await confirmDelete({ title: t('sales.common.confirm_delete'), message: t('sales.common.confirm_delete'), confirmText: t('sales.common.confirm'), cancelText: t('sales.common.cancel') });
        if (!confirmed) {
            return;
        }

        try {
            await api.delete(`/category/${id}`);
            alert(i18n.language === 'ar' ? 'تم حذف التصنيف بنجاح!' : 'Category deleted successfully!');
            fetchCategories();
        } catch (error) {
            logError('Error deleting category:', error);
            const msg = error.response?.data?.message || (i18n.language === 'ar' ? 'حدث خطأ في الحذف' : 'Error deleting category');
            alert(msg);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            parentCategory: ''
        });
        setEditingCategory(null);
        setErrors({});
    };

    return (
        <div className="min-h-screen bg-gray-50" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white flex-1 max-w-md">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('sales.common.search_filter')}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                fetchCategories(e.target.value);
                            }}
                            className={`w-full focus:outline-none text-sm text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-100 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>{t('sales.common.add')}</span>
                    </button>

                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
                        <FolderTree size={18} className="text-gray-500" />
                        <span className="text-gray-700 font-medium">{t('stocked.categories.title')}</span>
                        <RefreshCw
                            size={16}
                            className={`text-gray-400 cursor-pointer hover:text-indigo-600 transition-colors ${loading ? 'animate-spin text-indigo-600' : ''}`}
                            onClick={() => fetchCategories(searchTerm)}
                        />
                    </div>
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
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('stocked.categories.category_name')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('stocked.categories.description')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('stocked.categories.parent_category')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('sales.common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.map((category) => (
                                    <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {category.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {category.parentCategory?.name || t('stocked.categories.no_parent')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                                >
                                                    {i18n.language === 'ar' ? 'تعديل' : 'Edit'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category._id)}
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
                <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                                {editingCategory ? (i18n.language === 'ar' ? 'تعديل التصنيف' : 'Edit Category') : t('stocked.categories.add_category')}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingCategory(null);
                                }}
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
                                        {categories
                                            .filter(c => !editingCategory || c._id !== editingCategory._id) // Prevent self-parenting
                                            .map((category) => (
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



