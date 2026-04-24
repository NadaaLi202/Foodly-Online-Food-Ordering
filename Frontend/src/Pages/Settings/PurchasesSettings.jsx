import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Save,
    Check,
    Loader2,
    ChevronRight,
    Home,
    ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import logError from '../../utils/logerror';

const PurchasesSettings = () => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [suppliers, setSuppliers] = useState([]);

    const [settings, setSettings] = useState({
        // General Settings
        allow_edit_purchase_number: false,
        allow_edit_purchase_account: false,
        enable_purchase_rep: false,
        enable_product_discount: false,
        enable_invoice_discount: false,
        allow_create_product_on_invoice: false,
        enable_default_payment_method: false,
        show_settlement: false,
        allow_edit_settlement_account: false,
        auto_show_new_invoice: false,

        // Supplier Settings
        enable_default_supplier: false,
        default_supplier_id: '',

        // Invoice Settings
        auto_print_after_save: false,
        invoice_template: 'tax'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const settingsRes = await api.get('/settings?category=purchases');
            if (settingsRes.data.status === 'success' && settingsRes.data.data.settings) {
                setSettings(prev => ({
                    ...prev,
                    ...settingsRes.data.data.settings
                }));
            }

            const suppliersRes = await api.get('/contacts/suppliers');
            setSuppliers(suppliersRes.data?.contacts || []);

        } catch (error) {
            logError('Error fetching data:', error);
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

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/settings/purchases', { settings });

            toast.custom((t_toast) => (
                <div className={`${t_toast.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border-l-4 border-green-500`}>
                    <div className="flex-1 w-0">
                        <div className="flex items-start">
                            <div className={`ml-3 mr-3 flex-1 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                                <p className="text-sm font-bold text-gray-900">
                                    {t('purchases_settings.success')}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {t('purchases_settings.save_success')}
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
            logError('Error saving settings:', error);
            toast.error(t('purchases_settings.error_message'));
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
        { id: 'general', label: t('purchases_settings.general_tab') },
        { id: 'suppliers', label: t('purchases_settings.suppliers_tab') },
        { id: 'invoices', label: t('purchases_settings.invoices_tab') }
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
                    <span className="text-gray-900 font-medium">{t('purchases_settings.title')}</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6">
                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 min-h-[600px] flex flex-col overflow-hidden">
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
                                    { key: 'allow_edit_purchase_number', label: t('purchases_settings.allow_edit_purchase_number') },
                                    { key: 'allow_edit_purchase_account', label: t('purchases_settings.allow_edit_purchase_account') },
                                    { key: 'enable_purchase_rep', label: t('purchases_settings.enable_purchase_rep') },
                                    { key: 'enable_product_discount', label: t('purchases_settings.enable_product_discount') },
                                    { key: 'enable_invoice_discount', label: t('purchases_settings.enable_invoice_discount') },
                                    { key: 'allow_create_product_on_invoice', label: t('purchases_settings.allow_create_product_on_invoice') },
                                    { key: 'enable_default_payment_method', label: t('purchases_settings.enable_default_payment_method') },
                                    { key: 'show_settlement', label: t('purchases_settings.show_settlement') },
                                    { key: 'allow_edit_settlement_account', label: t('purchases_settings.allow_edit_settlement_account') },
                                    { key: 'auto_show_new_invoice', label: t('purchases_settings.auto_show_new_invoice') },
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

                        {activeTab === 'suppliers' && (
                            <div className="max-w-2xl space-y-6">
                                <label className="flex items-center gap-3 cursor-pointer group w-fit mb-4">
                                    <input
                                        type="checkbox"
                                        checked={settings.enable_default_supplier}
                                        onChange={() => handleToggle('enable_default_supplier')}
                                        className="w-4.5 h-4.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500/20 transition-all cursor-pointer"
                                    />
                                    <span className="text-[15px] font-medium text-gray-700">
                                        {t('purchases_settings.enable_default_supplier')}
                                    </span>
                                </label>

                                {settings.enable_default_supplier && (
                                    <div className="space-y-2 max-w-md">
                                        <label className="block text-sm font-bold text-gray-800">
                                            {t('purchases_settings.default_supplier')}
                                        </label>
                                        <div className="relative group">
                                            <select
                                                name="default_supplier_id"
                                                value={settings.default_supplier_id}
                                                onChange={handleSelectChange}
                                                className="w-full h-11 px-4 border border-gray-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer pr-10 rtl:pl-10 rtl:pr-4"
                                            >
                                                <option value="">{i18n.language === 'ar' ? 'اختر' : 'Choose'}</option>
                                                {suppliers.map((supplier) => (
                                                    <option key={supplier._id} value={supplier._id}>
                                                        {supplier.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 pointer-events-none text-gray-400`}>
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'invoices' && (
                            <div className="max-w-2xl space-y-8">
                                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                    <input
                                        type="checkbox"
                                        checked={settings.auto_print_after_save}
                                        onChange={() => handleToggle('auto_print_after_save')}
                                        className="w-4.5 h-4.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500/20 transition-all cursor-pointer"
                                    />
                                    <span className="text-[15px] font-medium text-gray-700">
                                        {t('purchases_settings.auto_print_after_save')}
                                    </span>
                                </label>

                                <div className="space-y-3 max-w-md">
                                    <label className="block text-sm font-bold text-gray-800">
                                        {t('purchases_settings.invoice_template')}
                                    </label>
                                    <div className="relative group">
                                        <select
                                            name="invoice_template"
                                            value={settings.invoice_template}
                                            onChange={handleSelectChange}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer pr-10 rtl:pl-10 rtl:pr-4"
                                        >
                                            <option value="tax">{i18n.language === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice'}</option>
                                            <option value="normal">{i18n.language === 'ar' ? 'فاتورة عادية' : 'Normal Invoice'}</option>
                                            <option value="thermal">{i18n.language === 'ar' ? 'حراري' : 'Thermal'}</option>
                                        </select>
                                        <div className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 pointer-events-none text-gray-400`}>
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>
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
                        <span>{t('purchases_settings.save')}</span>
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

export default PurchasesSettings;
