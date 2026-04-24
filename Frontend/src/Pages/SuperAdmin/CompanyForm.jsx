import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import companyService from '../../services/companyservice';
import { ArrowLeft, Upload, X } from 'lucide-react';
import logError from '../../utils/logerror';

const CompanyForm = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        subscriptionStatus: 'active',
        subscriptionEndDate: '',
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditMode) {
            fetchCompany();
        }
    }, [id]);

    const fetchCompany = async () => {
        setLoading(true);
        try {
            const response = await companyService.getCompany(id);
            const company = response.company;
            setFormData({
                name: company.name || '',
                email: company.email || '',
                password: '', // Don't show password
                subscriptionStatus: company.subscriptionStatus || 'active',
                subscriptionEndDate: company.subscriptionEndDate ? company.subscriptionEndDate.split('T')[0] : '',
            });
            if (company.logo?.url) {
                setLogoPreview(company.logo.url);
            }
        } catch (error) {
            logError('Error fetching company:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setErrors((prev) => ({ ...prev, logo: 'Only image files are allowed (JPEG, PNG, WebP).' }));
            e.target.value = '';
            return;
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setErrors((prev) => ({ ...prev, logo: 'File too large. Maximum size is 5MB.' }));
            e.target.value = '';
            return;
        }
        setErrors((prev) => ({ ...prev, logo: null }));
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        setErrors((prev) => ({ ...prev, logo: null }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = t('validation.required');
        if (!formData.email.trim()) newErrors.email = t('validation.required');
        if (!isEditMode && !formData.password.trim()) newErrors.password = t('validation.required');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            if (formData.password) data.append('password', formData.password);
            data.append('subscriptionStatus', formData.subscriptionStatus);
            if (formData.subscriptionEndDate) data.append('subscriptionEndDate', formData.subscriptionEndDate);
            if (logoFile) data.append('logo', logoFile);

            if (isEditMode) {
                await companyService.updateCompany(id, data);
            } else {
                await companyService.createCompany(data);
            }
            navigate('/super-admin/companies');
        } catch (error) {
            logError('Error saving company:', error);
            const msg = error.response?.data?.message;
            setErrors({ form: Array.isArray(msg) ? msg.join(' ') : msg || error.message || 'Failed to save company' });
        } finally {
            setLoading(false);
        }
    };

    const isRTL = i18n.language === 'ar';

    return (
        <div className="p-6">
            <button
                onClick={() => navigate('/super-admin/companies')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft size={20} className={isRTL ? 'ml-2' : 'mr-2'} />
                {t('common.back')}
            </button>

            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <h1 className="text-2xl font-bold mb-6">
                    {isEditMode ? t('superAdmin.editCompany') : t('superAdmin.addCompany')}
                </h1>

                {errors.form && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{errors.form}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('superAdmin.logo')}</label>
                        <div className="flex items-center gap-4">
                            {logoPreview ? (
                                <div className="relative">
                                    <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-lg object-cover" />
                                    <button
                                        type="button"
                                        onClick={removeLogo}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500">
                                    <Upload size={24} className="text-gray-400" />
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                        {errors.logo && <p className="mt-1 text-sm text-red-500">{errors.logo}</p>}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('superAdmin.companyName')} *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full p-3 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('superAdmin.email')} *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full p-3 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('superAdmin.password')} {!isEditMode && '*'}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={isEditMode ? t('superAdmin.leaveBlankPassword') : ''}
                            className={`w-full p-3 border rounded-lg ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                    </div>

                    {/* Subscription Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('superAdmin.subscriptionStatus')}</label>
                        <select
                            name="subscriptionStatus"
                            value={formData.subscriptionStatus}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        >
                            <option value="active">{t('superAdmin.active')}</option>
                            <option value="expired">{t('superAdmin.expired')}</option>
                        </select>
                    </div>

                    {/* Subscription End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('superAdmin.subscriptionEndDate')}</label>
                        <input
                            type="date"
                            name="subscriptionEndDate"
                            value={formData.subscriptionEndDate}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? t('common.saving') : (isEditMode ? t('common.save') : t('common.create'))}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/super-admin/companies')}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompanyForm;
