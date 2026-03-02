import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Loader2,
    ChevronDown,
    Check
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import logError from '../../utils/logError';

const SalesSettings = () => {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [customers, setCustomers] = useState([]);

    const [settings, setSettings] = useState({
        // General Settings
        allowEditInvoiceNumber: false,
        allowEditSalesAccount: false,
        enableSalesRep: false,
        showCustomerPO: false,
        allowEditProductPrice: true,
        enableMinSellingPrice: false,
        allowNegativeStock: false,
        enableProductDiscount: true,
        enableInvoiceDiscount: true,
        enableAccountingDiscount: false,
        allowCreateProductOnInvoice: true,
        enableDefaultPaymentMethod: false,
        showSettlement: false,
        allowEditSettlementAccount: false,
        autoShowNewInvoice: false,

        // Customer Settings
        enableDefaultCustomer: false,
        defaultCustomerId: '',

        // Invoice Settings
        autoPrintAfterSave: false,
        invoiceTemplate: 'tax'
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const settingsRes = await api.get('/settings?category=sales');
                if (settingsRes.data?.data?.settings) {
                    setSettings(prev => ({
                        ...prev,
                        ...settingsRes.data.data.settings
                    }));
                }

                const customersRes = await api.get('/contacts/customers');
                setCustomers(customersRes.data?.contacts || []);
            } catch (error) {
                logError('Error fetching sales settings data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: checked
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
            await api.patch('/settings/sales', { settings });

            // Custom Toast success based on screenshot
            toast.custom((t_toast) => (
                <div
                    className={`${t_toast.visible ? 'animate-enter' : 'animate-leave'
                        } max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border-l-4 border-green-500`}
                >
                    <div className="flex-1 w-0">
                        <div className="flex items-start">
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-bold text-gray-900">
                                    {t('sales_settings.success')}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {t('sales_settings.save_success')}
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
            logError('Error saving sales settings:', error);
            toast.error(t('sales_settings.error_message'));
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'general', label: t('sales_settings.general_tab') },
        { id: 'customers', label: t('sales_settings.customers_tab') },
        { id: 'invoices', label: t('sales_settings.invoices_tab') },
    ];

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/30 p-4 md:p-8" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Breadcrumb section */}
            <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-gray-400 mb-6 px-1">
                <span className="hover:text-gray-600 cursor-pointer">{t('sidebar.settings')}</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">{t('sidebar.sales')}</span>
            </div>

            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 min-h-[600px] flex flex-col">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-100 px-6 pt-4">
                    {tabs.map((tab) => (
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

                {/* Content Area */}
                <div className="flex-1 p-8 md:p-12">
                    {activeTab === 'general' && (
                        <div className="flex flex-col space-y-5">
                            {[
                                { name: 'allowEditInvoiceNumber', label: t('sales_settings.allow_edit_invoice_number') },
                                { name: 'allowEditSalesAccount', label: t('sales_settings.allow_edit_sales_account') },
                                { name: 'enableSalesRep', label: t('sales_settings.enable_sales_rep') },
                                { name: 'showCustomerPO', label: t('sales_settings.show_customer_po') },
                                { name: 'allowEditProductPrice', label: t('sales_settings.allow_edit_product_price') },
                                { name: 'enableMinSellingPrice', label: t('sales_settings.enable_min_selling_price') },
                                { name: 'allowNegativeStock', label: t('sales_settings.allow_negative_stock') },
                                { name: 'enableProductDiscount', label: t('sales_settings.enable_product_discount') },
                                { name: 'enableInvoiceDiscount', label: t('sales_settings.enable_invoice_discount') },
                                { name: 'enableAccountingDiscount', label: t('sales_settings.enable_accounting_discount') },
                                { name: 'allowCreateProductOnInvoice', label: t('sales_settings.allow_create_product_on_invoice') },
                                { name: 'enableDefaultPaymentMethod', label: t('sales_settings.enable_default_payment_method') },
                                { name: 'showSettlement', label: t('sales_settings.show_settlement') },
                                { name: 'allowEditSettlementAccount', label: t('sales_settings.allow_edit_settlement_account') },
                                { name: 'autoShowNewInvoice', label: t('sales_settings.auto_show_new_invoice') },
                            ].map((item) => (
                                <label key={item.name} className="flex items-center gap-3 cursor-pointer group w-fit">
                                    <input
                                        type="checkbox"
                                        name={item.name}
                                        checked={settings[item.name]}
                                        onChange={handleCheckboxChange}
                                        className="w-4.5 h-4.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500/20 transition-all cursor-pointer"
                                    />
                                    <span className="text-[15px] font-medium text-gray-700 leading-none pt-0.5">
                                        {item.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="max-w-2xl space-y-6">
                            <label className="flex items-center gap-3 cursor-pointer group w-fit mb-4">
                                <input
                                    type="checkbox"
                                    name="enableDefaultCustomer"
                                    checked={settings.enableDefaultCustomer}
                                    onChange={handleCheckboxChange}
                                    className="w-4.5 h-4.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500/20 transition-all cursor-pointer"
                                />
                                <span className="text-[15px] font-medium text-gray-700">
                                    {t('sales_settings.enable_default_customer')}
                                </span>
                            </label>

                            {settings.enableDefaultCustomer && (
                                <div className="space-y-2 max-w-md">
                                    <label className="block text-sm font-bold text-gray-800">
                                        {t('sales_settings.default_customer')}
                                    </label>
                                    <div className="relative group">
                                        <select
                                            name="defaultCustomerId"
                                            value={settings.defaultCustomerId}
                                            onChange={handleSelectChange}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer pr-10 rtl:pl-10 rtl:pr-4"
                                        >
                                            <option value="">{i18n.language === 'ar' ? 'اختر' : 'Choose'}</option>
                                            {customers.map((customer) => (
                                                <option key={customer._id} value={customer._id}>
                                                    {customer.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className={`absolute ${i18n.language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 pointer-events-none text-gray-400`}>
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
                                    name="autoPrintAfterSave"
                                    checked={settings.autoPrintAfterSave}
                                    onChange={handleCheckboxChange}
                                    className="w-4.5 h-4.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500/20 transition-all cursor-pointer"
                                />
                                <span className="text-[15px] font-medium text-gray-700">
                                    {t('sales_settings.auto_print_after_save')}
                                </span>
                            </label>

                            <div className="space-y-3 max-w-md">
                                <label className="block text-sm font-bold text-gray-800">
                                    {t('sales_settings.invoice_template')}
                                </label>
                                <div className="relative group">
                                    <select
                                        name="invoiceTemplate"
                                        value={settings.invoiceTemplate}
                                        onChange={handleSelectChange}
                                        className="w-full h-11 px-4 border border-gray-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer pr-10 rtl:pl-10 rtl:pr-4"
                                    >
                                        <option value="tax">{t('sales_settings.template_arabic_tax')}</option>
                                        <option value="normal">{t('sales_settings.template_arabic_normal')}</option>
                                        <option value="thermal">{t('sales_settings.template_arabic_thermal')}</option>
                                    </select>
                                    <div className={`absolute ${i18n.language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 pointer-events-none text-gray-400`}>
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Card Footer with Save Button */}
                <div className="p-8 border-t border-gray-50 flex items-center justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="min-w-[100px] h-11 flex items-center justify-center gap-2 bg-[#00a884] text-white px-8 rounded-lg hover:bg-[#008f70] active:scale-[0.98] transition-all font-bold text-[15px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        <span>{t('sales_settings.save')}</span>
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

export default SalesSettings;
