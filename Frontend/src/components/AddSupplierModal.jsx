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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-md">
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

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-white">
                    {submitError && (
                        <div className="mx-6 mt-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
                            {submitError}
                        </div>
                    )}

                    <div className="p-8 space-y-10">
                        {/* Section 1: Main Info */}
                        <section>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Side: Identity Info */}
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 col-span-1 md:col-span-2">
                                            <label htmlFor="name" className="block text-sm font-bold text-gray-900 mb-2">
                                                {t('sales.common.name')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder={t('purchases.suppliers.name_placeholder')}
                                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg p-4 font-bold bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('purchases.suppliers.type')}</label>
                                            <div className="flex items-center gap-6 h-12 border border-gray-200 rounded-xl px-4 bg-white shadow-sm">
                                                <div className="flex items-center cursor-pointer group">
                                                    <input
                                                        id="individual"
                                                        name="type"
                                                        type="radio"
                                                        value="individual"
                                                        checked={formData.type === 'individual'}
                                                        onChange={handleInputChange}
                                                        className="h-5 w-5 border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <label htmlFor="individual" className={`cursor-pointer block text-sm font-semibold text-gray-700 ${isRtl ? 'me-3' : 'ms-3'}`}>{t('purchases.suppliers.type_individual')}</label>
                                                </div>
                                                <div className="flex items-center cursor-pointer group">
                                                    <input
                                                        id="commercial"
                                                        name="type"
                                                        type="radio"
                                                        value="commercial"
                                                        checked={formData.type === 'commercial'}
                                                        onChange={handleInputChange}
                                                        className="h-5 w-5 border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <label htmlFor="commercial" className={`cursor-pointer block text-sm font-semibold text-gray-700 ${isRtl ? 'me-3' : 'ms-3'}`}>{t('purchases.suppliers.type_commercial')}</label>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">{t('sales.common.code')}</label>
                                            <div className="relative rounded-xl shadow-sm">
                                                <input
                                                    id="code"
                                                    name="code"
                                                    type="text"
                                                    value={formData.code || ''}
                                                    onChange={handleInputChange}
                                                    className={`block w-full rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50/50 text-center font-mono p-3 ${isRtl ? 'pe-12 ps-4' : 'ps-12 pe-4'}`}
                                                />
                                                <div className={`absolute inset-y-0 flex items-center ${isRtl ? 'end-0 pe-4' : 'start-0 ps-4'} pointer-events-none text-gray-400`}>
                                                    <Pencil className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {formData.type === 'commercial' && (
                                        <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                                <label className="block text-xs font-black text-indigo-500 uppercase mb-3 ml-1 tracking-widest">{t('purchases.suppliers.tax_number')}</label>
                                                <input
                                                    name="taxNumber"
                                                    type="text"
                                                    value={formData.taxNumber}
                                                    onChange={handleInputChange}
                                                    placeholder="1234567890"
                                                    className="block w-full rounded-xl border-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 bg-gray-50/20 font-bold"
                                                />
                                            </div>
                                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                                <label className="block text-xs font-black text-indigo-500 uppercase mb-3 ml-1 tracking-widest">{t('purchases.suppliers.commercial_register')}</label>
                                                <input
                                                    name="commercialRegister"
                                                    type="text"
                                                    value={formData.commercialRegister}
                                                    onChange={handleInputChange}
                                                    placeholder="1010101010"
                                                    className="block w-full rounded-xl border-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 bg-gray-50/20 font-bold"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Opening Balance & Notes */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.initial_balance')}</label>
                                        <div className="relative shadow-sm rounded-xl overflow-hidden">
                                            <input
                                                name="initialBalance"
                                                type="number"
                                                value={formData.initialBalance}
                                                onChange={handleInputChange}
                                                className={`block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 ${isRtl ? 'ps-16' : 'pe-16'}`}
                                            />
                                            <div className={`absolute inset-y-0 ${isRtl ? 'left-0 border-r' : 'right-0 border-l'} border-gray-200 bg-gray-50 flex items-center px-4 pointer-events-none text-gray-500 text-xs font-black uppercase tracking-wider`}>
                                                SAR
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.notes')}</label>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            rows={6}
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm resize-none p-4"
                                            placeholder={t('purchases.suppliers.notes_placeholder')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Contact Methods & Address */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-gray-200 pb-2">
                                <h3 className="text-lg font-bold text-gray-900">{t('purchases.suppliers.contact_details')}</h3>
                                <div className="flex gap-4">
                                    <label className="inline-flex items-center cursor-pointer group">
                                        <input type="checkbox" checked={showOptions.phone} onChange={() => toggleOption('phone')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span className={`text-xs font-semibold text-gray-500 group-hover:text-indigo-600 ${isRtl ? 'me-2' : 'ms-2'}`}>{t('sales.common.phone')}</span>
                                    </label>
                                    <label className="inline-flex items-center cursor-pointer group">
                                        <input type="checkbox" checked={showOptions.email} onChange={() => toggleOption('email')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span className={`text-xs font-semibold text-gray-500 group-hover:text-indigo-600 ${isRtl ? 'me-2' : 'ms-2'}`}>{t('sales.common.email')}</span>
                                    </label>
                                    <label className="inline-flex items-center cursor-pointer group">
                                        <input type="checkbox" checked={showOptions.address} onChange={() => toggleOption('address')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span className={`text-xs font-semibold text-gray-500 group-hover:text-indigo-600 ${isRtl ? 'me-2' : 'ms-2'}`}>{t('sales.common.address')}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Basic Contact Info */}
                                <div className="space-y-6">
                                    {(showOptions.phone || showOptions.email) && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                            {showOptions.phone && (
                                                <>
                                                    <div>
                                                        <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">{t('sales.common.phone')}</label>
                                                        <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">{t('sales.common.mobile')}</label>
                                                        <input name="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" />
                                                    </div>
                                                </>
                                            )}
                                            {showOptions.email && (
                                                <div className={`${showOptions.phone ? 'col-span-1' : 'col-span-1 md:col-span-3'}`}>
                                                    <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">{t('sales.common.email')}</label>
                                                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Address Grid */}
                                {showOptions.address && (
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">{t('purchases.suppliers.address1')}</label>
                                            <input name="address1" type="text" value={formData.address1} onChange={handleInputChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 bg-white" />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">{t('purchases.suppliers.address2')}</label>
                                            <input name="address2" type="text" value={formData.address2} onChange={handleInputChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">{t('purchases.suppliers.city')}</label>
                                            <input name="city" type="text" value={formData.city} onChange={handleInputChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">{t('purchases.suppliers.district')}</label>
                                            <input name="district" type="text" value={formData.district} onChange={handleInputChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">{t('purchases.suppliers.province')}</label>
                                            <input name="state" type="text" value={formData.state} onChange={handleInputChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">{t('purchases.suppliers.postal_code')}</label>
                                            <input name="postalCode" type="text" value={formData.postalCode} onChange={handleInputChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 bg-white" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">{t('purchases.suppliers.country')}</label>
                                            <select name="country" value={formData.country} onChange={handleInputChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 bg-white">
                                                <option value="">{t('purchases.suppliers.choose_country')}</option>
                                                <option value="Egypt">{t('sales.common.egypt_country') || 'مصر'}</option>
                                                <option value="Saudi Arabia">{t('sales.common.saudi_arabia') || 'السعودية'}</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Section 3: Additional Contacts List */}
                        <section className="bg-indigo-50/30 p-8 rounded-3xl border border-indigo-100/50">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">{t('purchases.suppliers.additional_contacts')}</h3>
                                    <p className="text-sm text-gray-500 mt-1">إضافة أطراف أخرى للتواصل مع هذا المورد</p>
                                </div>
                                <button type="button" onClick={addAdditionalContact} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
                                    <Plus className="h-5 w-5" />
                                    {t('purchases.suppliers.add_contact')}
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.additionalContacts.map((contact, index) => (
                                    <div key={index} className="flex gap-4 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm relative group animate-in zoom-in-95 duration-300">
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 flex-1">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">{t('purchases.suppliers.contact_name')}</label>
                                                <input
                                                    type="text"
                                                    value={contact.name}
                                                    onChange={(e) => handleAdditionalContactChange(index, 'name', e.target.value)}
                                                    className="block w-full rounded-xl border-gray-300 text-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">{t('sales.common.phone')}</label>
                                                <input
                                                    type="text"
                                                    value={contact.phone}
                                                    onChange={(e) => handleAdditionalContactChange(index, 'phone', e.target.value)}
                                                    className="block w-full rounded-xl border-gray-300 text-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">{t('sales.common.email')}</label>
                                                <input
                                                    type="email"
                                                    value={contact.email}
                                                    onChange={(e) => handleAdditionalContactChange(index, 'email', e.target.value)}
                                                    className="block w-full rounded-xl border-gray-300 text-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">{t('purchases.suppliers.job_title')}</label>
                                                <input
                                                    type="text"
                                                    value={contact.title}
                                                    onChange={(e) => handleAdditionalContactChange(index, 'title', e.target.value)}
                                                    className="block w-full rounded-xl border-gray-300 text-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                                                />
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => removeAdditionalContact(index)} className="text-gray-300 hover:text-red-500 transition-colors p-2 self-center">
                                            <Minus size={24} />
                                        </button>
                                    </div>
                                ))}
                                {formData.additionalContacts.length === 0 && (
                                    <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                                        {t('sales.common.no_additional_contacts')}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Footer - Aligned to the left */}
                    <div className="flex items-center justify-start gap-4 px-8 py-6 bg-gray-50 border-t border-gray-200 sticky bottom-0 z-10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 bg-white px-8 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
                        >
                            {t('purchases.suppliers.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex justify-center rounded-lg border border-transparent bg-emerald-600 px-12 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
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
