import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Search, MoreVertical, Pencil, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_BASE = 'http://localhost:4000/api/v1';

export default function Suppliers() {
    const { t, i18n } = useTranslation();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [viewContact, setViewContact] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'individual',
        code: '',
        taxNumber: '',
        commercialRegister: '',
        mobile: '',
        phone: '',
        email: '',
        notes: '',
        initialBalance: 0,
        address1: '', address2: '', city: '', neighborhood: '', province: '', zipCode: '', country: '',
        additionalContacts: []
    });
    const [contactMethods, setContactMethods] = useState({ phone: true, email: true, address: true });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [responseMessage, setResponseMessage] = useState({ type: '', text: '' });

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/contacts/suppliers`);
            const data = await res.json();
            setSuppliers(data.contacts || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    const getContactById = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/contacts/${id}`);
            const data = await res.json();
            if (data.contact) {
                const c = data.contact;
                const addr = c.address || {};
                setFormData({
                    name: c.name || '', type: c.type || 'individual', code: c.code || '',
                    taxNumber: c.taxNumber || '', commercialRegister: c.commercialRegister || '',
                    mobile: c.mobile || '', phone: c.phone || '', email: c.email || '', notes: c.notes || '',
                    initialBalance: c.initialBalance ?? 0,
                    address1: addr.address1 || '', address2: addr.address2 || '', city: addr.city || '',
                    neighborhood: addr.neighborhood || '', province: addr.province || '', zipCode: addr.zipCode || '', country: addr.country || ''
                });
                setCurrentId(id);
                setIsModalOpen(true);
            }
        } catch (err) { console.error(err); }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name?.trim()) newErrors.name = t('sales.customers.customer_name') + ' ' + t('sales.common.required');
        if (formData.type === 'commercial') {
            if (!(formData.taxNumber || '').trim()) newErrors.taxNumber = t('sales.customers.tax_number') + ' ' + t('sales.common.required');
            if (!(formData.commercialRegister || '').trim()) newErrors.commercialRegister = t('sales.customers.commercial_register') + ' ' + t('sales.common.required');
        }
        (formData.additionalContacts || []).forEach((ac, i) => {
            if (!(ac.name || '').trim()) newErrors[`additionalContact_${i}`] = t('sales.customers.contact_name') + ' ' + t('sales.common.required');
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        setResponseMessage({ type: '', text: '' });
        try {
            const payload = {
                name: formData.name,
                type: formData.type === 'commercial' ? 'commercial' : 'individual',
                code: formData.code || undefined,
                taxNumber: formData.taxNumber || undefined,
                commercialRegister: formData.commercialRegister || undefined,
                phone: formData.phone || undefined,
                mobile: formData.mobile || undefined,
                email: formData.email || undefined,
                notes: formData.notes || undefined,
                initialBalance: Number(formData.initialBalance) || 0,
                address: {
                    address1: formData.address1 || undefined, address2: formData.address2 || undefined,
                    neighborhood: formData.neighborhood || undefined, city: formData.city || undefined,
                    province: formData.province || undefined, zipCode: formData.zipCode || undefined,
                    country: formData.country || undefined
                }
            };
            const url = currentId ? `${API_BASE}/contacts/${currentId}` : `${API_BASE}/contacts/suppliers`;
            const method = currentId ? 'PATCH' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || t('sales.common.error_message'));
            setResponseMessage({ type: 'success', text: result.message || t('sales.common.success_message') });
            fetchSuppliers();
            setTimeout(() => { setIsModalOpen(false); setCurrentId(null); resetForm(); }, 1200);
        } catch (err) {
            setResponseMessage({ type: 'error', text: err.message || t('sales.common.error_message') });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', type: 'individual', code: '', taxNumber: '', commercialRegister: '',
            mobile: '', phone: '', email: '', notes: '', initialBalance: 0,
            address1: '', address2: '', city: '', neighborhood: '', province: '', zipCode: '', country: '',
            additionalContacts: []
        });
        setContactMethods({ phone: true, email: true, address: true });
        setResponseMessage({ type: '', text: '' });
        setErrors({});
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('sales.common.confirm_delete'))) return;
        try {
            const res = await fetch(`${API_BASE}/contacts/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) { fetchSuppliers(); if (viewContact?._id === id) setViewContact(null); }
            else alert(data.message || t('sales.common.error_message'));
        } catch (err) { alert(t('sales.common.error_message')); }
        setMenuOpenId(null);
    };

    const getTypeText = (type) => type === 'commercial' ? t('sales.suppliers.commercial') : t('sales.suppliers.individual');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (name === 'type' && value === 'individual') setErrors(prev => ({ ...prev, taxNumber: '', commercialRegister: '' }));
    };
    const handleContactMethodChange = (method) => {
        setContactMethods(prev => ({ ...prev, [method]: !prev[method] }));
    };
    const addAdditionalContact = () => {
        setFormData(prev => ({ ...prev, additionalContacts: [...(prev.additionalContacts || []), { name: '', phone: '', email: '', title: '' }] }));
    };
    const removeAdditionalContact = (index) => {
        setFormData(prev => ({ ...prev, additionalContacts: prev.additionalContacts.filter((_, i) => i !== index) }));
        setErrors(prev => { const next = { ...prev }; Object.keys(next).forEach(k => { if (k.startsWith('additionalContact_')) delete next[k]; }); return next; });
    };
    const handleAdditionalContactChange = (index, field, value) => {
        setFormData(prev => {
            const list = [...(prev.additionalContacts || [])];
            if (!list[index]) return prev;
            list[index] = { ...list[index], [field]: value };
            return { ...prev, additionalContacts: list };
        });
        if (field === 'name' && errors[`additionalContact_${index}`]) setErrors(prev => ({ ...prev, [`additionalContact_${index}`]: '' }));
    };

    return (
        <div className="min-h-screen bg-gray-50 overflow-hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => { setCurrentId(null); resetForm(); setIsModalOpen(true); }} className="flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 font-bold text-sm shadow-sm">
                        <Plus size={18} />
                        <span>{t('sales.common.add')}</span>
                    </button>
                    <button type="button" onClick={fetchSuppliers} className="flex items-center gap-2 border-2 border-gray-100 text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50 font-bold text-sm">
                        <RefreshCw size={16} />
                        <span>{t('sales.common.search_filter')}</span>
                    </button>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                    <Search size={18} />
                    <span>{t('sales.common.view')}</span>
                </div>
            </div>
            <div className="px-6 py-2 flex items-center gap-2">
                <RefreshCw size={16} className="text-gray-400 cursor-pointer" onClick={fetchSuppliers} />
                <h1 className="text-lg font-black text-gray-800">{t('sales.suppliers.title')}</h1>
            </div>
            <div className="p-6">
                {loading && !isModalOpen ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
                    </div>
                ) : suppliers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-80 text-gray-300">
                        <div className="text-6xl mb-4 opacity-20">🏢</div>
                        <p className="text-lg font-bold text-gray-400">{t('sales.suppliers.no_suppliers')}</p>
                        <p className="text-sm text-gray-400 mt-1">{t('sales.suppliers.start_creating')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.suppliers.name')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.suppliers.balance')}</th>
                                    <th className="px-6 py-4 w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {suppliers.map((s) => (
                                    <tr key={s._id} className="hover:bg-indigo-50/30 transition-all">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-700">#{s.code || s._id?.slice(-6) || '—'} {s.name}</td>
                                        <td className={`px-6 py-5 whitespace-nowrap text-sm font-black ${(s.currentBalance ?? s.initialBalance ?? 0) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                            {(s.currentBalance ?? s.initialBalance ?? 0) !== 0 ? (s.currentBalance ?? s.initialBalance ?? 0).toLocaleString() + ' ' + t('sales.common.currency') : '—'}
                                        </td>
                                        <td className="px-6 py-5 text-right relative">
                                            <button type="button" onClick={() => setMenuOpenId(menuOpenId === s._id ? null : s._id)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded">
                                                <MoreVertical size={18} />
                                            </button>
                                            {menuOpenId === s._id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                                                    <div className="absolute top-full mt-1 right-0 z-20 py-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px]">
                                                        <button type="button" onClick={() => { setViewContact(s); setMenuOpenId(null); }} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">{t('sales.suppliers.view_supplier')}</button>
                                                        <button type="button" onClick={() => { getContactById(s._id); setMenuOpenId(null); }} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">{t('sales.common.edit')}</button>
                                                        <button type="button" onClick={() => handleDelete(s._id)} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">{t('sales.common.delete')}</button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {viewContact && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-800">{t('sales.suppliers.view_supplier')}</h2>
                            <button type="button" onClick={() => setViewContact(null)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.suppliers.account_statement')}</p>
                                <p className="text-sm font-bold text-gray-800">#{viewContact.code || viewContact._id?.slice(-6)} {viewContact.name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.suppliers.balance')}</p>
                                <p className={`text-sm font-black ${(viewContact.currentBalance ?? viewContact.initialBalance ?? 0) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                    {(viewContact.currentBalance ?? viewContact.initialBalance ?? 0).toLocaleString()} {t('sales.common.currency')}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t('sales.suppliers.supplier_code')}</p><p className="text-sm font-bold text-gray-700">{viewContact.code || '—'}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t('sales.suppliers.type')}</p><p className="text-sm font-bold text-gray-700">{getTypeText(viewContact.type)}</p></div>
                                <div className="col-span-2"><p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t('sales.suppliers.supplier_name')}</p><p className="text-sm font-bold text-gray-700">{viewContact.name}</p></div>
                                <div className="col-span-2"><p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t('sales.suppliers.email')}</p><p className="text-sm font-bold text-gray-700">{viewContact.email || '—'}</p></div>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setViewContact(null)} className="px-6 py-2.5 border-2 border-gray-200 text-gray-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-50">{t('sales.common.close')}</button>
                            <button type="button" onClick={() => { getContactById(viewContact._id); setViewContact(null); }} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700">{t('sales.common.edit')}</button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className={`text-xl font-bold text-gray-800 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{currentId ? t('sales.suppliers.edit_supplier') : t('sales.suppliers.add_supplier')}</h2>
                            <button type="button" onClick={() => { setIsModalOpen(false); setCurrentId(null); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {responseMessage.text && (
                                    <div className={`p-4 rounded-md ${responseMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}><p className="text-sm font-medium">{responseMessage.text}</p></div>
                                )}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.type')}</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="type" value="individual" checked={formData.type === 'individual'} onChange={handleInputChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm">{t('sales.suppliers.individual')}</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="type" value="commercial" checked={formData.type === 'commercial'} onChange={handleInputChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm">{t('sales.suppliers.commercial')}</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.supplier_code')}</label>
                                        <input type="text" name="code" value={formData.code} onChange={handleInputChange} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" readOnly={!!currentId} />
                                    </div>
                                </div>
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.supplier_name')} <span className="text-red-500">*</span></label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`w-full px-3 py-2.5 border-2 rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-200 focus:border-indigo-500'}`} />
                                    {errors.name && <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{errors.name}</p>}
                                </div>
                                {formData.type === 'commercial' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.tax_number')} <span className="text-red-500">*</span></label>
                                            <input type="text" name="taxNumber" value={formData.taxNumber} onChange={handleInputChange} className={`w-full px-3 py-2.5 border-2 rounded-lg ${errors.taxNumber ? 'border-red-500' : 'border-gray-200'}`} />
                                            {errors.taxNumber && <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{errors.taxNumber}</p>}
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.commercial_register')} <span className="text-red-500">*</span></label>
                                            <input type="text" name="commercialRegister" value={formData.commercialRegister} onChange={handleInputChange} className={`w-full px-3 py-2.5 border-2 rounded-lg ${errors.commercialRegister ? 'border-red-500' : 'border-gray-200'}`} />
                                            {errors.commercialRegister && <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{errors.commercialRegister}</p>}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.opening_balance')}</label>
                                    <input type="number" name="initialBalance" value={formData.initialBalance} onChange={handleInputChange} min="0" step="0.01" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.notes')}</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg resize-none" />
                                </div>
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-3 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.contact_methods')}</label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button type="button" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" aria-label="Edit"><Pencil size={18} /></button>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={contactMethods.phone} onChange={() => handleContactMethodChange('phone')} className="w-4 h-4 text-blue-600 rounded" /><span className="text-sm">{t('sales.suppliers.phone')}</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={contactMethods.email} onChange={() => handleContactMethodChange('email')} className="w-4 h-4 text-blue-600 rounded" /><span className="text-sm">{t('sales.suppliers.email')}</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={contactMethods.address} onChange={() => handleContactMethodChange('address')} className="w-4 h-4 text-blue-600 rounded" /><span className="text-sm">{t('sales.customers.address')}</span></label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.phone')}</label>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.mobile')}</label>
                                        <input type="text" name="mobile" value={formData.mobile} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.email')}</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div><label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.address1')}</label><input type="text" name="address1" value={formData.address1} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg" /></div>
                                    <div><label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.address2')}</label><input type="text" name="address2" value={formData.address2} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg" /></div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div><label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.city')}</label><input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg" /></div>
                                    <div><label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.neighborhood')}</label><input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg" /></div>
                                    <div><label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.province')}</label><input type="text" name="province" value={formData.province} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg" /></div>
                                    <div><label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.zip_code')}</label><input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg" /></div>
                                </div>
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.country')}</label>
                                    <select name="country" value={formData.country} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg bg-white">
                                        <option value="">{t('sales.common.choose')}</option>
                                        <option value="saudi">{i18n.language === 'ar' ? 'السعودية' : 'Saudi Arabia'}</option>
                                        <option value="egypt">{i18n.language === 'ar' ? 'مصر' : 'Egypt'}</option>
                                        <option value="uae">{i18n.language === 'ar' ? 'الإمارات' : 'UAE'}</option>
                                        <option value="kuwait">{i18n.language === 'ar' ? 'الكويت' : 'Kuwait'}</option>
                                    </select>
                                </div>
                                <div>
                                    <h3 className={`text-base font-semibold text-gray-700 mb-3 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.additional_contacts')}</h3>
                                    {(formData.additionalContacts || []).map((ac, index) => (
                                        <div key={index} className="flex flex-wrap items-start gap-3 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                            <button type="button" onClick={() => removeAdditionalContact(index)} className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600" aria-label="Remove"><Minus size={16} /></button>
                                            <div className="flex-1 min-w-[200px]">
                                                <label className={`block text-sm font-semibold text-gray-700 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.contact_name')}</label>
                                                <input type="text" value={ac.name} onChange={(e) => handleAdditionalContactChange(index, 'name', e.target.value)} className={`w-full px-3 py-2 border-2 rounded-lg ${errors[`additionalContact_${index}`] ? 'border-red-500' : 'border-gray-200'}`} placeholder={t('sales.customers.contact_name')} />
                                                {errors[`additionalContact_${index}`] && <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{errors[`additionalContact_${index}`]}</p>}
                                            </div>
                                            <div className="flex gap-4 flex-wrap">
                                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded" readOnly checked /><span className="text-sm">{t('sales.suppliers.phone')}</span></label>
                                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded" readOnly /><span className="text-sm">{t('sales.suppliers.email')}</span></label>
                                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded" readOnly /><span className="text-sm">{t('sales.customers.address')}</span></label>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addAdditionalContact} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                                        <Plus size={18} />{t('sales.suppliers.add_new_contact')}
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div className={`border-t border-gray-200 px-6 py-4 flex justify-start gap-3 sticky bottom-0 bg-white ${i18n.language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
                            <button type="button" onClick={() => { setIsModalOpen(false); setCurrentId(null); resetForm(); }} className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold">{t('sales.common.cancel')}</button>
                            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">{isSubmitting ? t('sales.common.saving') : (currentId ? t('sales.common.update') : t('sales.common.save'))}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
