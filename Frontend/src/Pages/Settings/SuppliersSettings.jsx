import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Save,
    Check,
    Loader2,
    ChevronRight,
    Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import logError from '../../utils/logerror';

const SuppliersSettings = () => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const [settings, setSettings] = useState({
        enable_responsible_employee: false,
        allow_edit_supplier_account: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings?category=suppliers');
            if (response.data.status === 'success' && response.data.data.settings) {
                setSettings(prev => ({
                    ...prev,
                    ...response.data.data.settings
                }));
            }
        } catch (error) {
            logError('Error fetching suppliers settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/settings/suppliers', { settings });

            toast.custom((t_toast) => (
                <div className={`${t_toast.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border-l-4 border-green-500`}>
                    <div className="flex-1 w-0">
                        <div className="flex items-start">
                            <div className={`ml-3 mr-3 flex-1 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                                <p className="text-sm font-bold text-gray-900">
                                    {t('suppliers_settings.success')}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {t('suppliers_settings.save_success')}
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
            logError('Error saving suppliers settings:', error);
            toast.error(t('suppliers_settings.error_message'));
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
        { id: 'general', label: t('suppliers_settings.general_tab') }
    ];

    const isRTL = i18n.language === 'ar';

    return (
        <div className={`min-h-screen bg-gray-50/50 pb-20 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Breadcrumb Header */}
            <div className="bg-white border-b border-gray-200 mb-8">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-2 text-sm text-gray-500">
                    <Home className="h-4 w-4" />
                    <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                    <span>{t('sidebar.settings')}</span>
                    <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                    <span className="text-gray-900 font-medium">{t('suppliers_settings.title')}</span>
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
                    <div className="flex-1 p-10">
                        {activeTab === 'general' && (
                            <div className="space-y-1">
                                {[
                                    { key: 'enable_responsible_employee', label: t('suppliers_settings.enable_responsible_employee') },
                                    { key: 'allow_edit_supplier_account', label: t('suppliers_settings.allow_edit_supplier_account') }
                                ].map((setting) => (
                                    <label
                                        key={setting.key}
                                        className="flex items-center gap-3 group cursor-pointer py-3 hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
                                    >
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={settings[setting.key]}
                                                onChange={() => handleToggle(setting.key)}
                                                className="w-4.5 h-4.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1 text-[15px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                            {setting.label}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer for Action */}
                <div className={`mt-8 flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="min-w-[100px] h-11 flex items-center justify-center gap-2 bg-[#00a884] text-white px-8 rounded-lg hover:bg-[#008f70] active:scale-[0.98] transition-all font-bold text-[15px] shadow-[0_4px_10px_rgba(0,168,132,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        <span>{t('suppliers_settings.save')}</span>
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes enter {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes leave {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(-20px); opacity: 0; }
                }
                .animate-enter { animation: enter 0.3s ease-out forwards; }
                .animate-leave { animation: leave 0.3s ease-in forwards; }
            `}</style>
        </div>
    );
};

export default SuppliersSettings;
