import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import contactsService from '../services/contactsService';
import logError from '../utils/logError';

const AddSupplierModal = ({ isOpen, onClose, editSupplier = null, onSave }) => {
    const { t, i18n } = useTranslation();
    const [showOptions, setShowOptions] = useState({ phone: true, email: true, address: true });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [formData, setFormData] = useState({
        type: 'individual',
        code: '',
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
        } else if (isOpen) {
            // Reset form
            setFormData({
                type: 'individual',
                code: '',
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
            // Fetch next code
            fetchNextCode();
        }
    }, [isOpen, editSupplier]);

    const fetchNextCode = async () => {
        try {
            const suppliers = await contactsService.getSuppliers();
            let maxNum = 0;
            // Assuming code format is "1-XXXXXX" or similar. Adjust regex if needed.
            // Based on backend logic: 1-000001
            const regex = /^(\d+)-(\d+)$/;

            // Filter suppliers with valid code format (optional, mostly relevant if codes are consistent)
            // If existing suppliers list is empty, start from 1.
            if (suppliers && suppliers.length > 0) {
                suppliers.forEach(s => {
                    if (s.code && regex.test(s.code)) {
                        const match = s.code.match(regex);
                        if (match) {
                            const num = parseInt(match[2], 10);
                            if (num > maxNum) maxNum = num;
                        }
                    }
                });
            }

            // Simple prediction: increment max found
            const nextNum = maxNum + 1;
            // Replicate backend format: 1-000001
            const nextCode = `1-${String(nextNum).padStart(6, '0')}`;

            setFormData(prev => ({ ...prev, code: nextCode }));

        } catch (error) {
            logError("Failed to predict next supplier code", error);
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (submitError) setSubmitError('');
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
        if (submitError) setSubmitError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        const validation = contactsService.validateSupplierForm(formData, t, { isEdit: !!(editSupplier?._id) });
        if (!validation.valid) {
            setSubmitError(validation.error);
            return;
        }

        const isCreate = !editSupplier?._id;
        // If code matches the auto-generated format, we can omit it to let backend handle it, 
        // OR send it if backend respects it. Backend logic says:
        // "if (!omitCodeForCreate) payload.code = formData.code"
        // And backend controller checks uniqueness.
        // We will send it to ensure what user sees is what they get.
        const payload = contactsService.buildSupplierPayload(formData, { omitCodeForCreate: false });
        setSubmitting(true);

        try {
            const result = isCreate
                ? await contactsService.createSupplier(payload)
                : await contactsService.updateSupplier(editSupplier._id, payload);

            if (result.success) {
                if (typeof onSave === 'function') onSave(result.data);
                onClose();
                if (isCreate) {
                    window.dispatchEvent(new CustomEvent('supplier-created'));
                } else {
                    window.dispatchEvent(new CustomEvent('supplier-updated'));
                }
            } else {
                setSubmitError(result.error || t('sales.common.error_message'));
            }
        } catch (err) {
            setSubmitError(err?.message || t('sales.common.error_message'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const isRtl = i18n.language === 'ar';

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-[60] p-4">
            <div className="relative transform rounded-xl bg-white text-start shadow-xl transition-all w-full my-8 max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className="border-b border-gray-200 bg-white px-6 py-4 flex-shrink-0">
                    <div className="flex flex-wrap items-center justify-between sm:flex-nowrap">
                        <div>
                            <h3 className="text-xl font-bold leading-6 text-gray-800">
                                {editSupplier ? t('purchases.suppliers.edit_title') : t('purchases.suppliers.add_title')}
                            </h3>
                        </div>
                        <div className="flex-shrink-0">
                            <button type="button" onClick={onClose} className="flex rounded-md bg-white text-gray-400 hover:text-gray-500 p-1 focus:outline-none">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-gray-50/30">
                    {submitError && (
                        <div className="mx-6 mt-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
                            {submitError}
                        </div>
                    )}

                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* RIGHT COLUMN (Create visual "Right" for RTL, but logically typically 1st in DOM for RTL or handled via grid order. 
                                Wait, design shows: "Contact Data" on LEFT (in RTL), "Name/Code" on RIGHT (in RTL). 
                                In RTL: 1st column is Right. 2nd is Left.
                                
                                SCREENSHOT ANALYSIS (RTL):
                                Right Side: Code, Type (Individual/Commercial), Name, Initial Balance, Notes.
                                Left Side: Contact Details Header, Checkboxes, Phone, Mobile, Email, Address Fields.
                                
                                Correction from Plan:
                                Screenshot (RTL) shows:
                                Right Column (Form Main Info):
                                - Type (Radio)
                                - Code
                                - Name
                                - Tax/Register (if commercial)
                                - Opening Balance
                                - Notes
                                
                                Left Column (Contact Info):
                                - Contact Details Header
                                - Checkboxes (Phone, Email, Address)
                                - Phone, Mobile
                                - Email
                                - Address Fields (Address1, Address2, District, City, Zip, Province, Country)
                                
                                Let's implement this order.
                             */}

                            {/* Primary Info Column (Right in RTL, Left in LTR if dir=rtl flips it naturally) */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-8">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('purchases.suppliers.type')}</label>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center cursor-pointer">
                                                <input
                                                    id="individual"
                                                    name="type"
                                                    type="radio"
                                                    value="individual"
                                                    checked={formData.type === 'individual'}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                                <label htmlFor="individual" className={`cursor-pointer block text-sm text-gray-700 ${isRtl ? 'me-4 ms-2' : 'ms-2 me-4'}`}>{t('purchases.suppliers.type_individual')}</label>
                                            </div>
                                            <div className="flex items-center cursor-pointer">
                                                <input
                                                    id="commercial"
                                                    name="type"
                                                    type="radio"
                                                    value="commercial"
                                                    checked={formData.type === 'commercial'}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                                <label htmlFor="commercial" className={`cursor-pointer block text-sm text-gray-700 ${isRtl ? 'me-4 ms-2' : 'ms-2 me-4'}`}>{t('purchases.suppliers.type_commercial')}</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-4">
                                        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.code')}</label>
                                        <div className="relative rounded-md shadow-sm">
                                            <input
                                                id="code"
                                                name="code"
                                                type="text"
                                                value={formData.code || ''}
                                                onChange={handleInputChange}
                                                className={`block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50 text-center font-mono ${isRtl ? 'pe-8 ps-3' : 'ps-8 pe-3'}`}
                                            />
                                            <div className={`absolute inset-y-0 flex items-center ${isRtl ? 'start-0 ps-3' : 'end-0 pe-3'} pointer-events-none text-gray-400`}>
                                                <Pencil className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.name')} <span className="text-red-500">*</span></label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>

                                {formData.type === 'commercial' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.suppliers.tax_number')}</label>
                                            <input name="taxNumber" type="text" value={formData.taxNumber} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.suppliers.commercial_register')}</label>
                                            <input name="commercialRegister" type="text" value={formData.commercialRegister} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.initial_balance')}</label>
                                    <input name="initialBalance" type="number" value={formData.initialBalance} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                </div>

                                <div>
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.notes')}</label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        rows={4}
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm resize-none"
                                    />
                                </div>
                            </div>

                            {/* Secondary Info Column (Contact Options) */}
                            <div className="space-y-4">
                                <div className="border-b border-gray-200 pb-2 mb-4">
                                    <h3 className="text-base font-bold text-gray-900">{t('purchases.suppliers.contact_details')}</h3>
                                </div>

                                <div className="flex flex-wrap gap-6 mb-4">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={showOptions.phone} onChange={() => toggleOption('phone')} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                                        <span className={`text-sm font-medium text-gray-700 ${isRtl ? 'me-2' : 'ms-2'}`}>{t('sales.common.phone')}</span>
                                    </label>
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={showOptions.email} onChange={() => toggleOption('email')} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                                        <span className={`text-sm font-medium text-gray-700 ${isRtl ? 'me-2' : 'ms-2'}`}>{t('sales.common.email')}</span>
                                    </label>
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={showOptions.address} onChange={() => toggleOption('address')} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                                        <span className={`text-sm font-medium text-gray-700 ${isRtl ? 'me-2' : 'ms-2'}`}>{t('sales.common.address')}</span>
                                    </label>
                                </div>

                                {showOptions.phone && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('sales.common.phone')}</label>
                                            <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('sales.common.mobile')}</label>
                                            <input name="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                        </div>
                                    </div>
                                )}

                                {showOptions.email && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('sales.common.email')}</label>
                                        <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                    </div>
                                )}

                                {showOptions.address && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('purchases.suppliers.address1')}</label>
                                            <input name="address1" type="text" value={formData.address1} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('purchases.suppliers.address2')}</label>
                                            <input name="address2" type="text" value={formData.address2} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('purchases.suppliers.district')}</label>
                                                <input name="district" type="text" value={formData.district} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('purchases.suppliers.city')}</label>
                                                <input name="city" type="text" value={formData.city} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('purchases.suppliers.province')}</label>
                                                <input name="state" type="text" value={formData.state} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('purchases.suppliers.postal_code')}</label>
                                                <input name="postalCode" type="text" value={formData.postalCode} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('purchases.suppliers.country')}</label>
                                            <select name="country" value={formData.country} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                                                <option value="">{t('purchases.suppliers.choose_country')}</option>
                                                {/* Add actual country list if needed, using simple strings provided by locales or static */}
                                                <option value="Egypt">{t('sales.common.egypt_country') || 'مصر'}</option>
                                                <option value="Saudi Arabia">{t('sales.common.saudi_arabia') || 'السعودية'}</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Contacts Section */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-gray-900">{t('purchases.suppliers.additional_contacts')}</h3>
                                <button type="button" onClick={addAdditionalContact} className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-medium leading-4 text-white shadow-sm hover:bg-indigo-700 focus:outline-none">
                                    <Plus className={`h-4 w-4 ${isRtl ? 'me-1' : 'ms-1'}`} />
                                    {t('purchases.suppliers.add_contact')}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.additionalContacts.map((contact, index) => (
                                    <div key={index} className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <button type="button" onClick={() => removeAdditionalContact(index)} className="flex-shrink-0 text-red-500 hover:text-red-700 p-1">
                                            <Minus size={16} />
                                        </button>
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                                            <input
                                                type="text"
                                                placeholder={t('sales.suppliers.contact_name')}
                                                value={contact.name}
                                                onChange={(e) => handleAdditionalContactChange(index, 'name', e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                            />
                                            <input
                                                type="text"
                                                placeholder={t('sales.common.phone')}
                                                value={contact.phone}
                                                onChange={(e) => handleAdditionalContactChange(index, 'phone', e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                            />
                                            <input
                                                type="email"
                                                placeholder={t('sales.common.email')}
                                                value={contact.email}
                                                onChange={(e) => handleAdditionalContactChange(index, 'email', e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                            />
                                            <input
                                                type="text"
                                                placeholder={t('purchases.suppliers.job_title')}
                                                value={contact.title}
                                                onChange={(e) => handleAdditionalContactChange(index, 'title', e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {formData.additionalContacts.length === 0 && (
                                    <p className="text-gray-400 text-sm italic py-2">{t('sales.common.no_additional_contacts') || 'No additional contacts added.'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                        >
                            {t('purchases.suppliers.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex justify-center rounded-md border border-transparent bg-emerald-500 px-8 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 focus:outline-none disabled:opacity-50"
                        >
                            {submitting ? t('sales.common.saving') : t('purchases.suppliers.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSupplierModal;
