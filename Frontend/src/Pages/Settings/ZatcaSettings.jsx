import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Save,
    Check,
    Loader2,
    ChevronRight,
    Home,
    AlertCircle,
    Building2,
    Info,
    ShieldCheck,
    Settings2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import OtpHelpModal from './components/OtpHelpModal';

const ZatcaSettings = () => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('settings');
    const [errors, setErrors] = useState({});
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    const [settings, setSettings] = useState({
        isEnabled: false,
        phase: 'phase1',
        settings: {
            phase1: { isActive: false },
            phase2: {
                isActive: false,
                environment: 'simulation',
                taxNumber: '',
                otp: '',
                otp2: '',
                organizationName: '',
                organizationUnitName: '',
                registeredAddress: '',
                businessCategory: ''
            }
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/zatca');
            if (response.data.status === 'success' && response.data.data.zatca) {
                setSettings(response.data.data.zatca);
            }
        } catch (error) {
            console.error('Error fetching ZATCA settings:', error);
            toast.error(t('zatca.error_fetching') || 'Error fetching ZATCA settings');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        if (name === 'isEnabled' || name === 'phase') {
            setSettings(prev => ({ ...prev, [name]: val }));
        } else if (name.startsWith('phase2.')) {
            const field = name.split('.')[1];
            setSettings(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    phase2: {
                        ...prev.settings.phase2,
                        [field]: val
                    }
                }
            }));
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

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await api.patch('/zatca', settings);
            if (response.data.status === 'success') {
                toast.success(t('zatca.save_success') || 'Settings saved successfully');
            }
        } catch (error) {
            console.error('Error saving ZATCA settings:', error);
            const message = error.response?.data?.message || t('zatca.save_error') || 'Error saving settings';
            toast.error(message);
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
                    <span className="text-gray-900 font-medium">{t('zatca.title') || 'Saudi Electronic Invoicing'}</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Tabs Header */}
                    <div className="flex border-b border-gray-100 px-6 pt-4 bg-gray-50/30">
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-6 py-4 text-sm font-medium transition-all relative ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('zatca.settings_tab') || 'Settings'}
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Enable Toggle */}
                        <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-6 w-6 text-blue-600" />
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('zatca.enable_title') || 'Enable Electronic Invoicing'}</h3>
                                    <p className="text-sm text-gray-500">{t('zatca.enable_desc') || '(Zakat, Tax and Customs Authority)'}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isEnabled"
                                    checked={settings.isEnabled}
                                    onChange={handleInputChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {settings.isEnabled && (
                            <div className="space-y-6 animate-enter">
                                {/* Phase Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${settings.phase === 'phase1' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${settings.phase === 'phase1' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>1</div>
                                            <div>
                                                <p className="font-bold text-gray-900">{t('zatca.phase1_title') || 'Phase 1'}</p>
                                                <p className="text-xs text-gray-500">{t('zatca.phase1_desc') || '(Issue and Save)'}</p>
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            name="phase"
                                            value="phase1"
                                            checked={settings.phase === 'phase1'}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                    </label>

                                    <label className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${settings.phase === 'phase2' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${settings.phase === 'phase2' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>2</div>
                                            <div>
                                                <p className="font-bold text-gray-900">{t('zatca.phase2_title') || 'Phase 2'}</p>
                                                <p className="text-xs text-gray-500">{t('zatca.phase2_desc') || '(Integration and Connection)'}</p>
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            name="phase"
                                            value="phase2"
                                            checked={settings.phase === 'phase2'}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                    </label>
                                </div>

                                {/* Phase 2 Detailed Settings */}
                                {settings.phase === 'phase2' && (
                                    <div className="space-y-6 pt-4 border-t border-gray-100 animate-enter">
                                        {/* Platform Selection Tiles */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div
                                                onClick={() => handleInputChange({ target: { name: 'phase2.environment', value: 'simulation' } })}
                                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${settings.settings.phase2.environment === 'simulation' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                            >
                                                {settings.settings.phase2.environment === 'simulation' && (
                                                    <div className="absolute top-3 left-3 bg-blue-600 rounded-full p-1">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                                <div className="flex flex-col gap-1">
                                                    <h5 className="font-bold text-[#e65100] text-sm">{t('zatca.platform_simulation_title')}</h5>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed min-h-[32px]">
                                                        {t('zatca.platform_simulation_desc')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div
                                                onClick={() => handleInputChange({ target: { name: 'phase2.environment', value: 'production' } })}
                                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${settings.settings.phase2.environment === 'production' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                            >
                                                {settings.settings.phase2.environment === 'production' && (
                                                    <div className="absolute top-3 left-3 bg-blue-600 rounded-full p-1">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                                <div className="flex flex-col gap-1">
                                                    <h5 className="font-bold text-[#00a884] text-sm">{t('zatca.platform_production_title')}</h5>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed min-h-[32px]">
                                                        {t('zatca.platform_production_desc')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-blue-600 mb-4">
                                            <Settings2 className="h-5 w-5" />
                                            <h4 className="font-bold">{t('zatca.onboarding_details') || 'Onboarding Details'}</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-gray-700">{t('zatca.tax_number') || 'Tax Number'} <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="phase2.taxNumber"
                                                    value={settings.settings.phase2.taxNumber}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm ${isRTL ? 'text-right' : 'text-left font-mono'}`}
                                                    placeholder="300XXXXXXXXXXXX"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-gray-700">{t('zatca.org_name') || 'Organization Name'} <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="phase2.organizationName"
                                                    value={settings.settings.phase2.organizationName}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-gray-700">{t('zatca.registered_address') || 'Registered Address'} <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="phase2.registeredAddress"
                                                    value={settings.settings.phase2.registeredAddress}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm ${isRTL ? 'text-right' : 'text-left font-mono'}`}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-gray-700">{t('zatca.branch_name') || 'Branch Name'} <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="phase2.organizationUnitName"
                                                    value={settings.settings.phase2.organizationUnitName}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-gray-700">{t('zatca.business_category') || 'Activity Classification'} <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="phase2.businessCategory"
                                                    value={settings.settings.phase2.businessCategory}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                                                />
                                            </div>

                                            <div className="space-y-2 opacity-0 hidden md:block" aria-hidden="true"></div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-gray-700">{t('zatca.otp1') || 'First OTP'} <span className="text-red-500">*</span></label>
                                                <input
                                                    type="password"
                                                    name="phase2.otp"
                                                    value={settings.settings.phase2.otp}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-gray-700">{t('zatca.otp2') || 'Second OTP'} <span className="text-red-500">*</span></label>
                                                <input
                                                    type="password"
                                                    name="phase2.otp2"
                                                    value={settings.settings.phase2.otp2}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                                                />
                                            </div>

                                            <div className="col-span-full flex justify-center py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsHelpModalOpen(true)}
                                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                                >
                                                    {t('zatca.how_to_get_otp') || 'كيفية الحصول على رموز تفعيل OTP؟'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3">
                                            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-amber-800 leading-relaxed">
                                                {t('zatca.phase2_warning') || 'Initiating connection for Phase 2 requires a valid OTP from ZATCA Fatoora portal. Ensure all company details match your ZATCA registration.'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 px-8 py-4 flex items-center justify-end border-t border-gray-100">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-[#00a884] text-white px-8 py-2.5 rounded-lg hover:bg-[#008f70] transition-all font-bold disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            <span>{isRTL ? 'تهيئة' : 'Setup'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes enter {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-enter { animation: enter 0.3s ease-out forwards; }
            `}</style>
            {/* OTP Help Modal */}
            <OtpHelpModal
                isOpen={isHelpModalOpen}
                onClose={() => setIsHelpModalOpen(false)}
            />
        </div>
    );
};

export default ZatcaSettings;
