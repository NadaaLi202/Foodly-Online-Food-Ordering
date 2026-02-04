import React, { useState } from 'react';
import { X, Plus, Edit2, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AddContactModal = ({ isOpen, onClose, onSave, i18n }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [showOptions, setShowOptions] = useState({
        phone: true,
        email: true,
        address: true
    });

    const [formData, setFormData] = useState({
        type: 'individual',
        code: '1-000002', // Default or generated
        name: '',
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
            country: 'مصر'
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:4000/api/v1/contacts/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (response.ok) {
                onSave(data.contact);
                onClose();
            } else {
                alert(data.message || 'Error saving contact');
            }
        } catch (error) {
            console.error('Error saving contact:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20"
                dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
            >
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Plus size={20} strokeWidth={3} />
                        </div>
                        <h2 className="text-xl font-black text-gray-800 tracking-tight">
                            {t('sales.customers.add_customer')}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    <form id="add-contact-form" onSubmit={handleSubmit} className="space-y-10">
                        {/* Basic Info Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                            {/* Left Side: Type, Name, Balance, Notes */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-8">
                                    <label className="text-sm font-black text-gray-400 uppercase tracking-widest">{t('sales.customers.type')}</label>
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2.5 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="individual"
                                                checked={formData.type === 'individual'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="text-sm font-bold text-gray-600 group-hover:text-indigo-600 transition-colors">{t('sales.customers.individual')}</span>
                                        </label>
                                        <label className="flex items-center gap-2.5 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="commercial"
                                                checked={formData.type === 'commercial'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="text-sm font-bold text-gray-600 group-hover:text-indigo-600 transition-colors">{t('sales.customers.commercial')}</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                                        {t('sales.customers.customer_name')}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none transition-all"
                                        placeholder={t('sales.customers.customer_name')}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.customers.opening_balance')}</label>
                                        <input
                                            type="number"
                                            name="initialBalance"
                                            value={formData.initialBalance}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.common.notes')}</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows="1"
                                            className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none transition-all resize-none"
                                            placeholder="..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Code & Options Toggles */}
                            <div className="space-y-8">
                                <div className="group">
                                    <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.customers.customer_code')}</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            className="w-full bg-indigo-50/30 border-2 border-transparent hover:border-indigo-100 focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-black text-indigo-600 outline-none transition-all"
                                        />
                                        <div className="absolute left-4 rtl:right-4 pointer-events-none text-indigo-300">
                                            <Edit2 size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">{t('sales.customers.contact_methods')}</label>
                                    <div className="flex flex-wrap gap-4">
                                        {['phone', 'email', 'address'].map(opt => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => toggleOption(opt)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all border-2 ${showOptions[opt] ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showOptions[opt] ? 'bg-white border-white' : 'bg-gray-50 border-gray-200'}`}>
                                                    {showOptions[opt] && <div className="w-2 h-2 bg-indigo-600 rounded-sm"></div>}
                                                </div>
                                                {t(`sales.customers.${opt === 'phone' ? 'phone' : opt === 'email' ? 'email' : 'address'}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dynamic Sub-Fields based on toggles */}
                                <div className="space-y-6 pt-2">
                                    {(showOptions.phone) && (
                                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase">{t('sales.customers.phone')}</label>
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase">{t('sales.customers.mobile')}</label>
                                                <input
                                                    type="text"
                                                    name="mobile"
                                                    value={formData.mobile}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {showOptions.email && (
                                        <div className="animate-in slide-in-from-top-2 duration-300">
                                            <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase">{t('sales.customers.email')}</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none transition-all"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Address Section */}
                        {showOptions.address && (
                            <div className="pt-8 border-t border-gray-100 animate-in fade-in duration-500">
                                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-8">{t('sales.customers.address')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 grid grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.customers.address1')}</label>
                                            <input
                                                type="text"
                                                name="address.address1"
                                                value={formData.address.address1}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.customers.address2')}</label>
                                            <input
                                                type="text"
                                                name="address.address2"
                                                value={formData.address.address2}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.customers.city')}</label>
                                            <input
                                                type="text"
                                                name="address.city"
                                                value={formData.address.city}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.customers.neighborhood')}</label>
                                            <input
                                                type="text"
                                                name="address.neighborhood"
                                                value={formData.address.neighborhood}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.customers.province')}</label>
                                            <input
                                                type="text"
                                                name="address.province"
                                                value={formData.address.province}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.customers.zip_code')}</label>
                                            <input
                                                type="text"
                                                name="address.zipCode"
                                                value={formData.address.zipCode}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.customers.country')}</label>
                                        <div className="relative">
                                            <select
                                                name="address.country"
                                                value={formData.address.country}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50/50 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none appearance-none transition-all"
                                            >
                                                <option value="مصر">{t('sales.common.egypt_country')}</option>
                                                <option value="السعودية">{t('sales.common.saudi_arabia')}</option>
                                                <option value="الإمارات">{t('sales.common.uae')}</option>
                                            </select>
                                            <div className="absolute inset-y-0 left-4 rtl:right-4 flex items-center pointer-events-none text-gray-400">
                                                <MapPin size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Additional Contacts Section */}
                        <div className="pt-8 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">{t('sales.customers.additional_contacts')}</h3>
                                <button
                                    type="button"
                                    onClick={addAdditionalContact}
                                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    <Plus size={16} />
                                    {t('sales.customers.add_new_contact')}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.additionalContacts.map((contact, index) => (
                                    <div key={index} className="bg-gray-50/50 p-6 rounded-3xl border-2 border-transparent hover:border-indigo-100 transition-all grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in zoom-in-95 duration-200">
                                        <div className="group">
                                            <label className="block text-[9px] font-black text-gray-400 mb-1.5 uppercase">{t('sales.customers.contact_name')}</label>
                                            <input
                                                type="text"
                                                value={contact.name}
                                                onChange={(e) => handleAdditionalContactChange(index, 'name', e.target.value)}
                                                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:border-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[9px] font-black text-gray-400 mb-1.5 uppercase">{t('sales.customers.phone')}</label>
                                            <input
                                                type="text"
                                                value={contact.phone}
                                                onChange={(e) => handleAdditionalContactChange(index, 'phone', e.target.value)}
                                                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:border-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[9px] font-black text-gray-400 mb-1.5 uppercase">{t('sales.customers.job_title')}</label>
                                            <input
                                                type="text"
                                                value={contact.title}
                                                onChange={(e) => handleAdditionalContactChange(index, 'title', e.target.value)}
                                                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:border-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAdditionalContact(index)}
                                            className="h-10 w-10 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 backdrop-blur-md flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-3.5 border-2 border-gray-100 text-gray-400 rounded-2xl hover:bg-white hover:border-gray-300 hover:text-gray-600 transition-all text-sm font-black uppercase tracking-widest"
                    >
                        {t('sales.common.cancel')}
                    </button>
                    <button
                        form="add-contact-form"
                        type="submit"
                        disabled={loading}
                        className="px-10 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 text-sm font-black uppercase tracking-widest flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                {t('sales.common.save')}
                                <div className="rtl:rotate-180 group-hover:translate-x-1 transition-transform">
                                    {/* Arrow icon optional */}
                                </div>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddContactModal;
