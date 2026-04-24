import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Save,
    Check,
    Loader2,
    ChevronRight,
    Home,
    Upload,
    X,
    AlertCircle,
    Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmDelete } from '../../utils/confirmdelete';
import api from '../../services/api';
import logError from '../../utils/logerror';
import { useAuth } from '../../context/authcontext';
import { SUPPORTED_CURRENCIES } from '../../utils/currencyformatter';

const GeneralSettings = () => {
    const { t, i18n } = useTranslation();
    const { updateCompanySettings } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [showTaxWarning, setShowTaxWarning] = useState(false);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    const [settings, setSettings] = useState({
        company_name: '',
        tax_number: '',
        commercial_register: '',
        country: 'Egypt',
        region: '',
        timezone: '(GMT+02:00) Cairo',
        currency: 'EGP',
        language: 'ar',
        logo_path: '',
        logo_public_id: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings?category=general');
            if (response.data.status === 'success' && response.data.data.settings) {
                setSettings(prev => ({
                    ...prev,
                    ...response.data.data.settings
                }));
            }
        } catch (error) {
            logError('Error fetching general settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));

        // Special handling for language switch (instant)
        if (name === 'language') {
            handleLanguageChange(value);
        }

        // Clear error when typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        // Also update AuthContext immediately for sidebars/layouts
        updateCompanySettings({ language: lang });
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error(t('general_settings.file_type_not_allowed') || 'Only images are allowed');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('logo', file);

        try {
            const response = await api.post('/settings/general/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.status === 'success') {
                setSettings(prev => ({
                    ...prev,
                    logo_path: response.data.data.settings.logo_path,
                    logo_public_id: response.data.data.settings.logo_public_id
                }));
                toast.success(t('general_settings.upload_success'));
            }
        } catch (error) {
            logError('Error uploading logo:', error);
            toast.error(t('general_settings.error_message'));
        } finally {
            setUploading(false);
        }
    };

    const handleLogoDelete = async () => {
        const confirmed = await confirmDelete({ title: t('sales.common.confirm_delete', 'Confirm Delete'), message: t('general_settings.delete_confirm'), confirmText: t('sales.common.confirm', 'Confirm'), cancelText: t('sales.common.cancel') });
        if (!confirmed) return;

        try {
            const response = await api.delete('/settings/general/logo');
            if (response.data.status === 'success') {
                setSettings(prev => ({
                    ...prev,
                    logo_path: '',
                    logo_public_id: ''
                }));
                toast.success(t('general_settings.delete_success'));
            }
        } catch (error) {
            logError('Error deleting logo:', error);
            toast.error(t('general_settings.error_message'));
        }
    };

    const validateAndSave = () => {
        const newErrors = {};

        // Required field validation
        if (!settings.company_name || !settings.company_name.trim()) {
            newErrors.company_name = t('general_settings.company_name_required');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Auto-scroll to first error
            const firstErrorField = Object.keys(newErrors)[0];
            const element = document.getElementsByName(firstErrorField)[0];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
            }
            return;
        }

        // Search requirements: Tax number must be 15 digits
        if (settings.tax_number && settings.tax_number.length !== 15) {
            setShowTaxWarning(true);
            return;
        }
        handleSave();
    };

    const handleSave = async () => {
        setShowTaxWarning(false);
        setSaving(true);
        try {
            await api.patch('/settings/general', { settings });

            // Propagate settings to global AuthContext
            updateCompanySettings({
                currency: settings.currency,
                language: settings.language,
                company_name: settings.company_name,
                logo_path: settings.logo_path,
                tax_number: settings.tax_number,
                commercial_register: settings.commercial_register,
                country: settings.country,
                region: settings.region,
                address: settings.address || settings.address_line_1 || '',
                city: settings.city || '',
                location: settings.location || ''
            });

            toast.custom((t_toast) => (
                <div className={`${t_toast.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border-l-4 border-green-500`}>
                    <div className="flex-1 w-0">
                        <div className="flex items-start">
                            <div className={`ml-3 mr-3 flex-1 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                                <p className="text-sm font-bold text-gray-900">
                                    {t('general_settings.success_title') || t('customers_settings.success')}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {t('general_settings.success')}
                                </p>
                            </div>
                            <div className="flex-shrink-0 flex items-center justify-center p-1 bg-green-100 rounded-full">
                                <Check className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>
            ), {
                position: i18n.language === 'ar' ? 'top-left' : 'top-right',
                duration: 3000
            });

        } catch (error) {
            logError('Error saving general settings:', error);
            toast.error(t('general_settings.error_message') || t('customers_settings.error_message'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const tabs = [
        { id: 'general', label: t('general_settings.title') }
    ];

    const isRTL = i18n.language === 'ar';

    return (
        <div className={`min-h-screen bg-gray-50/50 pb-20 ${isRTL ? 'font-arabic text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Breadcrumb Header */}
            <div className="bg-white border-b border-gray-200 mb-8">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-2 text-sm text-gray-500">
                    <Home className="h-4 w-4" />
                    <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                    <span>{t('sidebar.settings')}</span>
                    <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                    <span className="text-gray-900 font-medium">{t('general_settings.title')}</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6">
                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 min-h-[400px] flex flex-col overflow-hidden">
                    {/* Tabs Header */}
                    <div className="flex border-b border-gray-100 px-6 pt-4 bg-gray-50/30">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-8">
                        {activeTab === 'general' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                {/* Company Name */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        {t('general_settings.company_name')} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="company_name"
                                        value={settings.company_name}
                                        onChange={handleInputChange}
                                        placeholder={t('general_settings.enter_company_name')}
                                        rows={3}
                                        className={`w-full px-4 py-2 rounded-lg border focus:ring-2 transition-all outline-none resize-none ${errors.company_name
                                            ? 'border-red-500 focus:ring-red-500/20'
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            }`}
                                    />
                                    {errors.company_name && (
                                        <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.company_name}
                                        </p>
                                    )}
                                </div>

                                {/* Logo Upload */}
                                <div className="space-y-2 row-span-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        {t('general_settings.logo')}
                                    </label>

                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`relative border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all min-h-[160px] ${settings.logo_path ? 'bg-gray-50' : ''}`}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />

                                        {uploading ? (
                                            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                                        ) : settings.logo_path ? (
                                            <div className="relative group">
                                                <img
                                                    src={settings.logo_path}
                                                    alt="Company Logo"
                                                    className="max-h-32 rounded-lg shadow-sm"
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLogoDelete();
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="p-4 bg-blue-50 rounded-full">
                                                    <Upload className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <p className="text-[13px] text-gray-500 text-center font-medium">
                                                    {t('general_settings.drag_drop')}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Tax Number */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        {t('general_settings.tax_number')}
                                    </label>
                                    <input
                                        type="text"
                                        name="tax_number"
                                        value={settings.tax_number}
                                        onChange={handleInputChange}
                                        placeholder={t('general_settings.enter_tax_number')}
                                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>

                                {/* Commercial Register */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        {t('general_settings.commercial_register')}
                                    </label>
                                    <input
                                        type="text"
                                        name="commercial_register"
                                        value={settings.commercial_register}
                                        onChange={handleInputChange}
                                        placeholder={t('general_settings.enter_commercial_register')}
                                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>

                                {/* Country */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        {t('general_settings.country')}
                                    </label>
                                    <select
                                        name="country"
                                        value={settings.country}
                                        onChange={handleInputChange}
                                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white appearance-none"
                                    >
                                        <option value="Egypt">{t('sales.common.egypt_country')}</option>
                                        <option value="Saudi Arabia">{t('sales.common.saudi_arabia')}</option>
                                        <option value="UAE">{t('sales.common.uae')}</option>
                                        <option value="Kuwait">{t('sales.common.kuwait')}</option>
                                    </select>
                                </div>

                                {/* Region/City */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        {t('general_settings.region')}
                                    </label>
                                    <input
                                        type="text"
                                        name="region"
                                        value={settings.region}
                                        onChange={handleInputChange}
                                        placeholder={t('general_settings.enter_region')}
                                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>

                                {/* Timezone */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        {t('general_settings.timezone')}
                                    </label>
                                    <select
                                        name="timezone"
                                        value={settings.timezone}
                                        onChange={handleInputChange}
                                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white appearance-none"
                                    >
                                        <option value="(GMT+02:00) Cairo">(GMT+02:00) Cairo</option>
                                        <option value="(GMT+03:00) Riyadh">(GMT+03:00) Riyadh</option>
                                        <option value="(GMT+04:00) Dubai">(GMT+04:00) Dubai</option>
                                    </select>
                                </div>

                                {/* Currency */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        {t('general_settings.currency')}
                                    </label>
                                    <select
                                        name="currency"
                                        value={settings.currency}
                                        onChange={handleInputChange}
                                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white appearance-none"
                                    >
                                        {SUPPORTED_CURRENCIES.map(curr => (
                                            <option key={curr} value={curr}>
                                                {curr} — {t(`currencies.${curr}`)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Language */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        {t('general_settings.language')}
                                    </label>
                                    <div className="flex gap-4 pt-1">
                                        {['ar', 'en'].map(lang => (
                                            <label key={lang} className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="language"
                                                    value={lang}
                                                    checked={settings.language === lang}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className={`text-sm font-medium ${settings.language === lang ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                                    {lang === 'ar' ? 'العربية' : 'English'}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer for Action */}
                <div className={`mt-8 flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                    <button
                        onClick={validateAndSave}
                        disabled={saving}
                        className="min-w-[120px] h-11 flex items-center justify-center gap-2 bg-[#00a884] text-white px-8 rounded-lg hover:bg-[#008f70] active:scale-[0.98] transition-all font-bold text-[15px] shadow-[0_4px_10px_rgba(0,168,132,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        <span>{t('general_settings.save')}</span>
                    </button>
                </div>
            </div>

            {/* Tax Number Warning Modal */}
            {showTaxWarning && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-enter">
                        <div className="p-6">
                            <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="bg-amber-100 p-3 rounded-full flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-amber-600" />
                                </div>
                                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                        {t('general_settings.tax_warning_title')}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {t('general_settings.tax_warning_message')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end items-center border-t border-gray-100">
                            <button
                                onClick={() => setShowTaxWarning(false)}
                                className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                {t('general_settings.cancel')}
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-[#00a884] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#008f70] transition-colors shadow-sm"
                            >
                                {t('general_settings.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes enter {
                    from { transform: translateY(-20px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes leave {
                    from { transform: translateY(0) scale(1); opacity: 1; }
                    to { transform: translateY(-20px) scale(0.95); opacity: 0; }
                }
                .animate-enter { animation: enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-leave { animation: leave 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

export default GeneralSettings;

