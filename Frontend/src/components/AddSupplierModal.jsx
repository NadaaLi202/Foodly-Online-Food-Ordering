import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const AddSupplierModal = ({ isOpen, onClose, editSupplier = null, onSave }) => {
    const { t, i18n } = useTranslation();
    const [showOptions, setShowOptions] = useState({ phone: true, email: true, address: true });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [formData, setFormData] = useState({
        type: 'individual',
        code: '1-000001',
        number: '',
        name: '',
        taxNumber: '',
        commercialRegister: '',
        initialBalance: '',
        notes: '',
        phone: '',
        mobile: '',
        email: '',
        address1: '',
        address2: '',
        district: '',
        city: '',
        postalCode: '',
        state: '',
        country: '',
        additionalContacts: [],
    });

    useEffect(() => {
        if (editSupplier) {
            setFormData((prev) => ({
                ...prev,
                type: editSupplier.type === 'commercial' || editSupplier.type === 'individual' ? editSupplier.type : 'individual',
                name: editSupplier.name ?? '',
                code: editSupplier.code ?? prev.code,
                number: editSupplier.number ?? '',
                taxNumber: editSupplier.taxNumber ?? '',
                commercialRegister: editSupplier.commercialRegister ?? '',
                initialBalance: editSupplier.initialBalance ?? '',
                notes: editSupplier.notes ?? '',
                phone: editSupplier.phone ?? '',
                mobile: editSupplier.mobile ?? '',
                email: editSupplier.email ?? '',
                address1: editSupplier.address?.address1 ?? '',
                address2: editSupplier.address?.address2 ?? '',
                district: editSupplier.address?.neighborhood ?? '',
                city: editSupplier.address?.city ?? '',
                postalCode: editSupplier.address?.zipCode ?? '',
                state: editSupplier.address?.province ?? '',
                country: editSupplier.address?.country ?? '',
                additionalContacts: editSupplier.additionalContacts?.length ? editSupplier.additionalContacts : [],
            }));
        } else if (!isOpen) {
            setFormData({
                type: 'individual',
                code: '1-000001',
                number: '',
                name: '',
                taxNumber: '',
                commercialRegister: '',
                initialBalance: '',
                notes: '',
                phone: '',
                mobile: '',
                email: '',
                address1: '',
                address2: '',
                district: '',
                city: '',
                postalCode: '',
                state: '',
                country: '',
                additionalContacts: [],
            });
        }
    }, [isOpen, editSupplier]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const toggleOption = (option) => {
        setShowOptions((prev) => ({ ...prev, [option]: !prev[option] }));
    };

    const addAdditionalContact = () => {
        setFormData((prev) => ({
            ...prev,
            additionalContacts: [...prev.additionalContacts, { name: '', phone: '', email: '', title: '' }],
        }));
    };

    const removeAdditionalContact = (index) => {
        setFormData((prev) => ({
            ...prev,
            additionalContacts: prev.additionalContacts.filter((_, i) => i !== index),
        }));
    };

    const handleAdditionalContactChange = (index, field, value) => {
        const updated = [...formData.additionalContacts];
        updated[index] = { ...updated[index], [field]: value };
        setFormData((prev) => ({ ...prev, additionalContacts: updated }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        if (!(formData.name || '').trim()) {
            setSubmitError(t('purchases.suppliers.name_required'));
            return;
        }
        setSubmitting(true);
        try {
            const address = {
                address1: formData.address1 || '',
                address2: formData.address2 || '',
                neighborhood: formData.district || '',
                city: formData.city || '',
                province: formData.state || '',
                zipCode: formData.postalCode || '',
                country: formData.country || '',
            };
            const additionalContacts = (formData.additionalContacts || []).map((ac) => ({
                name: (ac.name || '').trim(),
                phone: (ac.phone || '').trim() || undefined,
                email: (ac.email || '').trim() || undefined,
                title: (ac.title || '').trim() || undefined,
            })).filter((ac) => ac.name);
            const payload = {
                name: formData.name.trim(),
                type: formData.type === 'commercial' ? 'commercial' : 'individual',
                code: formData.code || undefined,
                taxNumber: formData.taxNumber || undefined,
                commercialRegister: formData.commercialRegister || undefined,
                phone: formData.phone || undefined,
                mobile: formData.mobile || undefined,
                email: formData.email || undefined,
                notes: formData.notes || undefined,
                initialBalance: Number(formData.initialBalance) || 0,
                address,
                additionalContacts,
            };
            let res;
            if (editSupplier && editSupplier._id) {
                res = await api.patch(`/contacts/${editSupplier._id}`, payload);
            } else {
                res = await api.post('/contacts/suppliers', payload);
            }
            const data = res.data;
            if (res.status === 200 || res.status === 201) {
                if (typeof onSave === 'function') onSave(data.contact || data);
                onClose();
            } else {
                setSubmitError(data.message || t('sales.common.error_message'));
            }
        } catch (err) {
            setSubmitError(err.response?.data?.message || err.message || t('sales.common.error_message'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const isRtl = i18n.language === 'ar';

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
            <div className="relative transform rounded-xl bg-white text-start shadow-xl transition-all w-full my-8 max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
                {/* Header - match reference */}
                <div className="border-b border-gray-200 bg-white px-6 py-4 flex-shrink-0">
                    <div className="flex flex-wrap items-center justify-between sm:flex-nowrap">
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                {editSupplier ? t('purchases.suppliers.edit_title') : t('purchases.suppliers.add_title')}
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
                    {submitError && (
                        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
                            {submitError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left column */}
                        <div className="grid content-start grid-cols-1 sm:grid-cols-6 gap-y-2 gap-x-4">
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">{t('purchases.suppliers.type')}</label>
                                <div className="mt-2 flex items-center space-x-7 rtl:space-x-reverse">
                                    <div className="flex items-center">
                                        <input id="individual" name="type" type="radio" value="individual" checked={formData.type === 'individual'} onChange={handleInputChange} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-transparent" />
                                        <label htmlFor="individual" className={`block text-sm font-medium text-gray-700 ${isRtl ? 'ms-2' : 'ml-2'}`}>{t('purchases.suppliers.type_individual')}</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="commercial" name="type" type="radio" value="commercial" checked={formData.type === 'commercial'} onChange={handleInputChange} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-transparent" />
                                        <label htmlFor="commercial" className={`block text-sm font-medium text-gray-700 ${isRtl ? 'ms-2' : 'ml-2'}`}>{t('purchases.suppliers.type_commercial')}</label>
                                    </div>
                                </div>
                            </div>

                            <div className="sm:col-span-6 xl:col-span-3">
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.code', 'Code')}</label>
                                <div className="relative">
                                    <input id="code" name="code" type="text" disabled value={formData.code} className={`block w-full rounded-md border-gray-300 disabled:bg-transparent shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${isRtl ? 'pe-10 ps-3' : 'ps-10 pe-3'}`} />
                                    <div className={`absolute inset-y-0 flex items-center ${isRtl ? 'start-0 ps-3' : 'end-0 pe-3'} pointer-events-none text-indigo-900`}>
                                        <Pencil className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.name', 'Name')} <span className="font-bold text-red-600">*</span></label>
                                <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            </div>

                            {formData.type === 'commercial' && (
                                <>
                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.suppliers.tax_number', 'Tax Number')}</label>
                                        <input name="taxNumber" type="text" value={formData.taxNumber} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.suppliers.commercial_register', 'Commercial Register')}</label>
                                        <input name="commercialRegister" type="text" value={formData.commercialRegister} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                    </div>
                                </>
                            )}

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.initial_balance', 'Opening Balance')}</label>
                                <input name="initialBalance" type="text" value={formData.initialBalance} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">{t('sales.common.notes', 'Notes')}</label>
                                <div className="mt-1">
                                    <textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleInputChange} className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Right column - Contact Information */}
                        <div className="grid content-start grid-cols-1 gap-y-2 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-6">
                                <h3 className="text-lg font-medium text-gray-900">{t('purchases.suppliers.contact_details')}</h3>
                                <div className={`mt-2 flex gap-x-5 flex-wrap`}>
                                    <div className="flex items-center">
                                        <input id="opt-phone" type="checkbox" checked={showOptions.phone} onChange={() => toggleOption('phone')} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <label htmlFor="opt-phone" className={`align-middle text-gray-700 font-medium ${isRtl ? 'ms-1' : 'ml-1'}`}>{t('sales.common.phone')}</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="opt-email" type="checkbox" checked={showOptions.email} onChange={() => toggleOption('email')} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <label htmlFor="opt-email" className={`align-middle text-gray-700 font-medium ${isRtl ? 'ms-1' : 'ml-1'}`}>{t('sales.common.email')}</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="opt-address" type="checkbox" checked={showOptions.address} onChange={() => toggleOption('address')} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <label htmlFor="opt-address" className={`align-middle text-gray-700 font-medium ${isRtl ? 'ms-1' : 'ml-1'}`}>{t('sales.common.address')}</label>
                                    </div>
                                </div>

                                <div className="grid content-start grid-cols-1 sm:grid-cols-6 gap-y-2 gap-x-4 mt-4">
                                    {showOptions.phone && (
                                        <>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.phone')}</label>
                                                <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.mobile')}</label>
                                                <input name="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                        </>
                                    )}
                                    {showOptions.email && (
                                        <div className="sm:col-span-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.email')}</label>
                                            <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                        </div>
                                    )}
                                    {showOptions.address && (
                                        <>
                                            <div className="sm:col-span-6">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.address_line1', 'Address 1')}</label>
                                                <input name="address1" type="text" value={formData.address1} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-6">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.address_line2', 'Address 2')}</label>
                                                <input name="address2" type="text" value={formData.address2} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.district', 'District')}</label>
                                                <input name="district" type="text" value={formData.district} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.city', 'City')}</label>
                                                <input name="city" type="text" value={formData.city} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.postal_code', 'Postal Code')}</label>
                                                <input name="postalCode" type="text" value={formData.postalCode} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.suppliers.province', 'Province')}</label>
                                                <input name="state" type="text" value={formData.state} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.country', 'Country')}</label>
                                                <select name="country" value={formData.country} onChange={handleInputChange} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                                                    <option value="">{t('sales.common.choose')}</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Additional Contacts */}
                            <div className="sm:col-span-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">{t('purchases.suppliers.additional_contacts')}</h3>
                            </div>
                            <div className="sm:col-span-6">
                                <button type="button" onClick={addAdditionalContact} className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-indigo-700">
                                    <Plus className={`h-4 w-4 ${isRtl ? 'ms-2 -me-0.5' : '-ms-0.5 me-2'}`} />
                                    {t('purchases.suppliers.add_contact')}
                                </button>
                            </div>
                            <div className="sm:col-span-6 space-y-4">
                                {formData.additionalContacts.map((contact, index) => (
                                    <div key={index} className="flex flex-wrap items-start gap-4 p-4 bg-white rounded-md border border-gray-200">
                                        <button type="button" onClick={() => removeAdditionalContact(index)} className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600" aria-label={t('purchases.suppliers.delete')}>
                                            <Minus size={14} strokeWidth={3} />
                                        </button>
                                        <div className="flex-1 min-w-[200px] space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.suppliers.contact_name', 'Contact Name')}</label>
                                                <input type="text" value={contact.name} onChange={(e) => handleAdditionalContactChange(index, 'name', e.target.value)} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.phone')}</label>
                                                    <input type="text" value={contact.phone} onChange={(e) => handleAdditionalContactChange(index, 'phone', e.target.value)} className="rounded-md bg-white block w-full border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.suppliers.job_title', 'Job Title')}</label>
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
                            {t('purchases.suppliers.cancel')}
                        </button>
                        <button type="submit" disabled={submitting} className="inline-flex gap-1 rounded-md border border-transparent bg-emerald-500 px-4 py-2 font-medium text-white shadow-sm hover:bg-emerald-600 text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                            {submitting ? t('sales.common.saving') : (editSupplier ? t('purchases.suppliers.update') : t('purchases.suppliers.save'))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSupplierModal;
