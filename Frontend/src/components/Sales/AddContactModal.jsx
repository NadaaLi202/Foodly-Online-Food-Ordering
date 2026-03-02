import React, { useState } from 'react';
import { X, Plus, Minus, Pencil } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { prepareContactPayload } from '../../utils/contactUtils';
import logError from '../../utils/logError';

const AddContactModal = ({ isOpen, onClose, onSave, i18n }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showOptions, setShowOptions] = useState({
        phone: true,
        email: true,
        address: true
    });

    const [formData, setFormData] = useState({
        type: 'individual',
        code: '',
        name: '',
        taxNumber: '',
        commercialRegister: '',
        initialBalance: 0,
        notes: '',
        phone: '',
        mobile: '',
        email: '',
        address: {
            address1: '',
            address2: '',
            city: '',
            neighborhood: '',
            province: '',
            zipCode: '',
            country: ''
        },
        additionalContacts: []
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData({
                ...formData,
                [parent]: { ...formData[parent], [child]: value }
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
        if (name === 'type' && value === 'individual') {
            setErrors((prev) => ({ ...prev, taxNumber: '', commercialRegister: '' }));
        }
    };

    const toggleOption = (option) => {
        setShowOptions({ ...showOptions, [option]: !showOptions[option] });
    };

    const addAdditionalContact = () => {
        setFormData({
            ...formData,
            additionalContacts: [
                ...formData.additionalContacts,
                { name: '', phone: '', email: '', title: '' }
            ]
        });
    };

    const removeAdditionalContact = (index) => {
        const updated = formData.additionalContacts.filter((_, i) => i !== index);
        setFormData({ ...formData, additionalContacts: updated });
    };

    const handleAdditionalContactChange = (index, field, value) => {
        const updated = [...formData.additionalContacts];
        updated[index][field] = value;
        setFormData({ ...formData, additionalContacts: updated });
    };

    const validate = () => {
        const newErrors = {};
        if (!(formData.name || '').trim()) {
            newErrors.name = t('sales.customers.customer_name') + ' ' + t('sales.common.required');
        }
        if (formData.type === 'commercial') {
            if (!(formData.taxNumber || '').trim()) {
                newErrors.taxNumber = t('sales.customers.tax_number') + ' ' + t('sales.common.required');
            }
            if (!(formData.commercialRegister || '').trim()) {
                newErrors.commercialRegister = t('sales.customers.commercial_register') + ' ' + t('sales.common.required');
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setErrors({});


        try {
            const payload = prepareContactPayload(formData);

            const response = await api.post('/contacts/customers', payload);
            const data = response.data;
            if (response.status === 200 || response.status === 201) {
                onSave(data.contact);
                onClose();
                // Dispatch event for real-time report updates
                window.dispatchEvent(new CustomEvent('customer-created'));
            } else {
                setErrors({ submit: data.message || t('sales.common.error_message') });
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message || t('sales.common.error_message');
            setErrors({ submit: msg });
            logError('Error saving contact:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isRtl = i18n?.language === 'ar';

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-[60] p-4">
            <div className="relative transform rounded-xl bg-white text-start shadow-xl transition-all w-full my-8 max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
                {/* Header - match reference */}
                <div className="border-b border-gray-200 bg-white px-6 py-4 flex-shrink-0">
                    <div className="flex flex-wrap items-center justify-between sm:flex-nowrap">
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                {t('sales.customers.add_customer')}
                            </h3>
                        </div>
                        <div className="flex-shrink-0">
                            <button type="button" onClick={onClose} className="flex rounded-md bg-white text-gray-400 hover:text-gray-500 p-1">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 divide-y divide-gray-300 px-6 py-5 flex-1 overflow-y-auto">
                    {errors.submit && (
                        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-100">
                            {errors.submit}
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left column */}
                        <div className="grid content-start grid-cols-1 sm:grid-cols-6 gap-y-2 gap-x-4">
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">{t('sales.customers.type')}</label>
                                <div className="mt-2 flex items-center space-x-7 rtl:space-x-reverse">
                                    <div className="flex items-center">
                                        <input id="individual" name="type" type="radio" value="individual" checked={formData.type === 'individual'} onChange={handleInputChange} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-transparent" />
                                        <label htmlFor="individual" className={`block text-sm font-medium text-gray-700 ${isRtl ? 'ms-2' : 'ml-2'}`}>{t('sales.customers.individual')}</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="commercial" name="type" type="radio" value="commercial" checked={formData.type === 'commercial'} onChange={handleInputChange} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-transparent" />
                                        <label htmlFor="commercial" className={`block text-sm font-medium text-gray-700 ${isRtl ? 'ms-2' : 'ml-2'}`}>{t('sales.customers.commercial')}</label>
                                    </div>
                                </div>
                            </div>

                            <div className="sm:col-span-6 xl:col-span-3">
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.customer_code')}</label>
                                <div className="relative">
                                    <input id="code" name="code" type="text" value={formData.code} onChange={handleInputChange} className={`block w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${isRtl ? 'pe-10 ps-3' : 'ps-10 pe-3'}`} placeholder={t('sales.customers.code_optional') || 'Optional — leave blank to auto-generate'} />
                                    <div className={`absolute inset-y-0 flex items-center pointer-events-none text-gray-400 ${isRtl ? 'start-0 ps-3' : 'end-0 pe-3'}`}>
                                        <Pencil className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.customer_name')} <span className="font-bold text-red-600">*</span></label>
                                <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} className={`rounded-md bg-white block w-full border shadow-sm focus:ring-indigo-500 sm:text-sm ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'}`} />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>

                            {formData.type === 'commercial' && (
                                <div className="sm:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.tax_number')} <span className="font-bold text-red-600">*</span></label>
                                        <input name="taxNumber" type="text" value={formData.taxNumber} onChange={handleInputChange} className={`rounded-md bg-white block w-full border shadow-sm focus:ring-indigo-500 sm:text-sm ${errors.taxNumber ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'}`} />
                                        {errors.taxNumber && <p className="mt-1 text-sm text-red-500">{errors.taxNumber}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.commercial_register')} <span className="font-bold text-red-600">*</span></label>
                                        <input name="commercialRegister" type="text" value={formData.commercialRegister} onChange={handleInputChange} className={`rounded-md bg-white block w-full border shadow-sm focus:ring-indigo-500 sm:text-sm ${errors.commercialRegister ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'}`} />
                                        {errors.commercialRegister && <p className="mt-1 text-sm text-red-500">{errors.commercialRegister}</p>}
                                    </div>
                                </div>
                            )}

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.opening_balance')}</label>
                                <input name="initialBalance" type="number" value={formData.initialBalance} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="0" />
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">{t('sales.common.notes')}</label>
                                <div className="mt-1">
                                    <textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleInputChange} className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="..." />
                                </div>
                            </div>
                        </div>

                        {/* Right column - Contact Information */}
                        <div className="grid content-start grid-cols-1 gap-y-2 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-6">
                                <h3 className="text-lg font-medium text-gray-900">{t('sales.customers.contact_methods')}</h3>
                                <div className="mt-2 flex gap-x-5 flex-wrap">
                                    <div className="flex items-center">
                                        <input id="opt-phone" type="checkbox" checked={showOptions.phone} onChange={() => toggleOption('phone')} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <label htmlFor="opt-phone" className={`align-middle text-gray-700 font-medium ${isRtl ? 'ms-1' : 'ml-1'}`}>{t('sales.customers.phone')}</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="opt-email" type="checkbox" checked={showOptions.email} onChange={() => toggleOption('email')} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <label htmlFor="opt-email" className={`align-middle text-gray-700 font-medium ${isRtl ? 'ms-1' : 'ml-1'}`}>{t('sales.customers.email')}</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="opt-address" type="checkbox" checked={showOptions.address} onChange={() => toggleOption('address')} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <label htmlFor="opt-address" className={`align-middle text-gray-700 font-medium ${isRtl ? 'ms-1' : 'ml-1'}`}>{t('sales.customers.address')}</label>
                                    </div>
                                </div>

                                <div className="grid content-start grid-cols-1 sm:grid-cols-6 gap-y-2 gap-x-4 mt-4">
                                    {showOptions.phone && (
                                        <>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.phone')}</label>
                                                <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.mobile')}</label>
                                                <input name="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                        </>
                                    )}
                                    {showOptions.email && (
                                        <div className="sm:col-span-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.email')}</label>
                                            <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                        </div>
                                    )}
                                    {showOptions.address && (
                                        <>
                                            <div className="sm:col-span-6">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.address1')}</label>
                                                <input name="address.address1" type="text" value={formData.address.address1} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-6">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.address2')}</label>
                                                <input name="address.address2" type="text" value={formData.address.address2} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.neighborhood')}</label>
                                                <input name="address.neighborhood" type="text" value={formData.address.neighborhood} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.city')}</label>
                                                <input name="address.city" type="text" value={formData.address.city} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.zip_code')}</label>
                                                <input name="address.zipCode" type="text" value={formData.address.zipCode} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.province')}</label>
                                                <input name="address.province" type="text" value={formData.address.province} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.country')}</label>
                                                <select name="address.country" value={formData.address.country} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                                                    <option value="">{t('sales.common.choose')}</option>
                                                    <option value="مصر">{t('sales.common.egypt_country')}</option>
                                                    <option value="السعودية">{t('sales.common.saudi_arabia')}</option>
                                                    <option value="الإمارات">{t('sales.common.uae')}</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Additional Contacts */}
                            <div className="sm:col-span-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">{t('sales.customers.additional_contacts')}</h3>
                            </div>
                            <div className="sm:col-span-6">
                                <button type="button" onClick={addAdditionalContact} className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-indigo-700">
                                    <Plus className={`h-4 w-4 ${isRtl ? 'ms-2 -me-0.5' : '-ms-0.5 me-2'}`} />
                                    {t('sales.customers.add_new_contact')}
                                </button>
                            </div>
                            <div className="sm:col-span-6 space-y-4">
                                {formData.additionalContacts.map((contact, index) => (
                                    <div key={index} className="flex flex-wrap items-start gap-4 p-4 bg-white rounded-md border border-gray-200">
                                        <button type="button" onClick={() => removeAdditionalContact(index)} className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600" aria-label={t('sales.common.delete')}>
                                            <Minus size={14} strokeWidth={3} />
                                        </button>
                                        <div className="flex-1 min-w-[200px] space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.contact_name')}</label>
                                                <input type="text" value={contact.name} onChange={(e) => handleAdditionalContactChange(index, 'name', e.target.value)} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.phone')}</label>
                                                    <input type="text" value={contact.phone} onChange={(e) => handleAdditionalContactChange(index, 'phone', e.target.value)} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.job_title')}</label>
                                                    <input type="text" value={contact.title} onChange={(e) => handleAdditionalContactChange(index, 'title', e.target.value)} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer - match reference: Cancel (white) + Save (emerald/green) */}
                    <div className="flex gap-x-2 justify-end pt-4">
                        <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-50 text-sm">
                            {t('sales.common.cancel')}
                        </button>
                        <button type="submit" disabled={loading} className="inline-flex gap-1 rounded-md border border-transparent bg-emerald-500 px-4 py-2 font-medium text-white shadow-sm hover:bg-emerald-600 text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                            {loading ? (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                t('sales.common.save')
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddContactModal;
