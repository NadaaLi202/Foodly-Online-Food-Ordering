import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Customers() {
    const { t, i18n } = useTranslation();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        type: 'individual',
        code: '1-000001',
        mobile: '',
        email: '',
        notes: '',
        address1: '',
        address2: '',
        city: '',
        neighborhood: '',
        zipCode: '',
        country: ''
    });

    const [contactMethods, setContactMethods] = useState({
        mobile: true,
        email: true,
        phone: true
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [responseMessage, setResponseMessage] = useState({ type: '', text: '' });

    // Fetch customers from API
    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://t10550.alostaz.io/api/clients');
            const data = await response.json();
            setCustomers(data.customers || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const validateForm = () => {
        const newErrors = {};

        // Name validation (required)
        if (!formData.name.trim()) {
            newErrors.name = t('sales.customers.customer_name') + ' ' + t('sales.common.required');
        }

        // Mobile validation (required, must be valid format)
        if (!formData.mobile.trim()) {
            newErrors.mobile = t('sales.customers.mobile') + ' ' + t('sales.common.required');
        } else if (!/^[0-9]{10,15}$/.test(formData.mobile.replace(/[\s-]/g, ''))) {
            newErrors.mobile = t('sales.customers.mobile') + ' ' + t('sales.common.invalid');
        }

        // Email validation (if provided)
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('sales.customers.email') + ' ' + t('sales.common.invalid');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleContactMethodChange = (method) => {
        setContactMethods(prev => ({
            ...prev,
            [method]: !prev[method]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setResponseMessage({ type: '', text: '' });

        try {
            // Replace with your actual API endpoint
            const response = await fetch('https://t10550.alostaz.io/api/clients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    contactMethods
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || t('sales.common.error_message'));
            }

            console.log('Customer saved successfully:', result);

            // Show success message
            setResponseMessage({
                type: 'success',
                text: result.message || t('sales.common.success_message')
            });

            // Refresh customer list
            fetchCustomers();

            // Close modal and reset form after short delay
            setTimeout(() => {
                setIsModalOpen(false);
                setFormData({
                    name: '',
                    type: 'individual',
                    code: '1-000001',
                    mobile: '',
                    email: '',
                    notes: '',
                    address1: '',
                    address2: '',
                    city: '',
                    neighborhood: '',
                    zipCode: '',
                    country: ''
                });
                setResponseMessage({ type: '', text: '' });
            }, 1500);

        } catch (error) {
            console.error('Error saving customer:', error);
            setResponseMessage({
                type: 'error',
                text: error.message || t('sales.common.error_message')
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setResponseMessage({ type: '', text: '' });
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
                        onClick={fetchCustomers}
                        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={18} />
                        <span>{t('sales.customers.update')}</span>
                    </button>
                </div>

                <h1 className="text-xl font-bold text-gray-800">{t('sales.customers.title')}</h1>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading && !isModalOpen ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="text-6xl mb-4">👥</div>
                        <p className="text-lg font-medium">{t('sales.customers.no_customers')}</p>
                        <p className="text-sm">{t('sales.customers.start_customers')}</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.customers.customer_code')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.customers.customer_name')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.customers.mobile')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.customers.email')}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.customers.type')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {customers.map((customer) => (
                                    <tr key={customer._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {customer.code}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {customer.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.mobile}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.email || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${customer.type === 'commercial'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {customer.type === 'commercial' ? t('sales.customers.commercial') : t('sales.customers.individual')}
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                            <h2 className={`text-xl font-bold text-gray-800 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.add_customer')}</h2>
                            <button
                                onClick={handleCancel}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Response Message */}
                                {responseMessage.text && (
                                    <div className={`p-4 rounded-md ${responseMessage.type === 'success'
                                        ? 'bg-green-50 border border-green-200 text-green-800'
                                        : 'bg-red-50 border border-red-200 text-red-800'
                                        }`}>
                                        <p className="text-sm font-medium">{responseMessage.text}</p>
                                    </div>
                                )}

                                {/* Contact Methods and Type/Code Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Side - Contact Methods */}
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-3 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.contact_methods')}
                                        </label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={contactMethods.mobile}
                                                    onChange={() => handleContactMethodChange('mobile')}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm">{t('sales.customers.mobile')}</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={contactMethods.email}
                                                    onChange={() => handleContactMethodChange('email')}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm">{t('sales.customers.email')}</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={contactMethods.phone}
                                                    onChange={() => handleContactMethodChange('phone')}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm">{t('sales.customers.phone')}</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Right Side - Type and Code */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('sales.customers.type')}
                                            </label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="type"
                                                        value="individual"
                                                        checked={formData.type === 'individual'}
                                                        onChange={handleInputChange}
                                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm">{t('sales.customers.individual')}</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="type"
                                                        value="commercial"
                                                        checked={formData.type === 'commercial'}
                                                        onChange={handleInputChange}
                                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm">{t('sales.customers.commercial')}</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('sales.customers.customer_code')}
                                            </label>
                                            <input
                                                type="text"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-indigo-500 text-sm"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Name Field */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('sales.customers.customer_name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none transition-colors ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                                            }`}
                                        placeholder={t('sales.customers.customer_name')}
                                    />
                                    {errors.name && (
                                        <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                            <span>⚠</span> {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Mobile */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('sales.customers.mobile')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none transition-colors ${errors.mobile ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                                            }`}
                                        placeholder="05xxxxxxxx"
                                    />
                                    {errors.mobile && (
                                        <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                            <span>⚠</span> {errors.mobile}
                                        </p>
                                    )}
                                </div>

                                {/* Email and Notes */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.email')}
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                            placeholder="example@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.common.notes')}
                                        </label>
                                        <input
                                            type="text"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Address Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.address1')}
                                        </label>
                                        <input
                                            type="text"
                                            name="address1"
                                            value={formData.address1}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.address2')}
                                        </label>
                                        <input
                                            type="text"
                                            name="address2"
                                            value={formData.address2}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* City, Neighborhood, Zip, Province */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.city')}
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.neighborhood')}
                                        </label>
                                        <input
                                            type="text"
                                            name="neighborhood"
                                            value={formData.neighborhood}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.province')}
                                        </label>
                                        <input
                                            type="text"
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.zip_code')}
                                        </label>
                                        <input
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Country Dropdown */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('sales.customers.country')}
                                    </label>
                                    <select
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                                    >
                                        <option value="">{t('sales.common.select')}</option>
                                        <option value="saudi">{t('sales.common.saudi_arabia') || (i18n.language === 'ar' ? 'السعودية' : 'Saudi Arabia')}</option>
                                        <option value="egypt">{t('sales.common.egypt_country') || (i18n.language === 'ar' ? 'مصر' : 'Egypt')}</option>
                                        <option value="uae">{t('sales.common.uae') || (i18n.language === 'ar' ? 'الإمارات' : 'UAE')}</option>
                                        <option value="kuwait">{t('sales.common.kuwait') || (i18n.language === 'ar' ? 'الكويت' : 'Kuwait')}</option>
                                    </select>
                                </div>

                                {/* Additional Contact Section */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                                        >
                                            {t('sales.customers.add_new_contact')}
                                        </button>
                                        <h3 className={`text-base font-semibold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.additional_contacts')}</h3>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className={`bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-start gap-3 sticky bottom-0 ${i18n.language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="border-2 border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                            >
                                {t('sales.common.cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-teal-500 text-white px-6 py-2.5 rounded-lg hover:bg-teal-600 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? t('sales.common.saving') : t('sales.common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
