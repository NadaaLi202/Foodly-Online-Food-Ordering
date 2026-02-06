import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Search, MoreVertical, Pencil, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Customers() {
    const { t, i18n } = useTranslation();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCustomerId, setCurrentCustomerId] = useState(null);
    const [loadingCustomer, setLoadingCustomer] = useState(false);

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
        address1: '',
        address2: '',
        city: '',
        neighborhood: '',
        province: '',
        zipCode: '',
        country: '',
        additionalContacts: []
    });
    const [viewContact, setViewContact] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);

    const [contactMethods, setContactMethods] = useState({
        phone: true,
        email: true,
        address: true
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [responseMessage, setResponseMessage] = useState({ type: '', text: '' });

    // Fetch customers from API
    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:4000/api/v1/contacts/customers');
            const data = await response.json();
            setCustomers(data.contacts || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const getCustomerById = async (id) => {
        setLoadingCustomer(true);
        try {
            const res = await fetch(`http://localhost:4000/api/v1/contacts/${id}`);
            const data = await res.json();

            if (data.contact) {
                const c = data.contact;
                const addr = c.address || {};
                setFormData({
                    name: c.name || '',
                    type: c.type === 'commercial' ? 'commercial' : 'individual',
                    code: c.code || '',
                    taxNumber: c.taxNumber || '',
                    commercialRegister: c.commercialRegister || '',
                    mobile: c.mobile || '',
                    phone: c.phone || '',
                    email: c.email || '',
                    notes: c.notes || '',
                    initialBalance: c.initialBalance ?? 0,
                    address1: addr.address1 || '',
                    address2: addr.address2 || '',
                    city: addr.city || '',
                    neighborhood: addr.neighborhood || '',
                    province: addr.province || '',
                    zipCode: addr.zipCode || '',
                    country: addr.country || '',
                    additionalContacts: Array.isArray(c.additionalContacts) ? c.additionalContacts.map(ac => ({ name: ac.name || '', phone: ac.phone || '', email: ac.email || '', title: ac.title || '' })) : []
                });

                if (data.contact.contactMethods) {
                    setContactMethods({
                        phone: data.contact.contactMethods.phone !== false,
                        email: data.contact.contactMethods.email !== false,
                        address: data.contact.contactMethods.address !== false
                    });
                } else {
                    setContactMethods({ phone: true, email: true, address: true });
                }

                setCurrentCustomerId(id);
                setIsEditing(true);
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
        } finally {
            setLoadingCustomer(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation (required فقط)
        if (!formData.name.trim()) {
            newErrors.name = t('sales.customers.customer_name') + ' ' + t('sales.common.required');
        }

        // Mobile validation (required فقط)
        if (!formData.mobile.trim()) {
            newErrors.mobile = t('sales.customers.mobile') + ' ' + t('sales.common.required');
        }

        // Business (Commercial) only: Tax Number and Commercial Register required
        if (formData.type === 'commercial') {
            if (!(formData.taxNumber || '').trim()) {
                newErrors.taxNumber = t('sales.customers.tax_number') + ' ' + t('sales.common.required');
            }
            if (!(formData.commercialRegister || '').trim()) {
                newErrors.commercialRegister = t('sales.customers.commercial_register') + ' ' + t('sales.common.required');
            }
        }

        // Additional contacts: name required when row exists
        (formData.additionalContacts || []).forEach((ac, i) => {
            if (!(ac.name || '').trim()) {
                newErrors[`additionalContact_${i}`] = t('sales.customers.contact_name') + ' ' + t('sales.common.required');
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        // When switching to Individual, clear Business-only field errors
        if (name === 'type' && value === 'individual') {
            setErrors(prev => ({ ...prev, taxNumber: '', commercialRegister: '' }));
        }
    };

    const handleContactMethodChange = (method) => {
        setContactMethods(prev => ({
            ...prev,
            [method]: !prev[method]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setResponseMessage({ type: '', text: '' });

        try {
            let response;
            let result;

            const type = (formData.type === 'commercial' ? 'commercial' : 'individual');
            const address = {
                address1: formData.address1 || '',
                address2: formData.address2 || '',
                neighborhood: formData.neighborhood || '',
                city: formData.city || '',
                province: formData.province || '',
                zipCode: formData.zipCode || '',
                country: formData.country || ''
            };
            const additionalContacts = (formData.additionalContacts || []).map(ac => ({
                name: (ac.name || '').trim(),
                phone: (ac.phone || '').trim() || undefined,
                email: (ac.email || '').trim() || undefined,
                title: (ac.title || '').trim() || undefined
            })).filter(ac => ac.name);

            const dataToSend = {
                name: formData.name,
                type,
                code: formData.code || undefined,
                taxNumber: formData.taxNumber || undefined,
                commercialRegister: formData.commercialRegister || undefined,
                phone: formData.phone || undefined,
                mobile: formData.mobile || undefined,
                email: formData.email || undefined,
                notes: formData.notes || undefined,
                initialBalance: Number(formData.initialBalance) || 0,
                address,
                additionalContacts
            };

            if (isEditing && currentCustomerId) {
                // Update existing customer - PATCH request
                response = await fetch(`http://localhost:4000/api/v1/contacts/${currentCustomerId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend)
                });
                result = await response.json();
            } else {
                // Create new customer - POST request
                response = await fetch('http://localhost:4000/api/v1/contacts/customers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend)
                });
                result = await response.json();
            }

            if (!response.ok) {
                throw new Error(result.message || t('sales.common.error_message'));
            }

            console.log('Customer saved successfully:', result);

            // Show success message
            setResponseMessage({
                type: 'success',
                text: result.message || t('sales.common.success_message')
            });

            // Refresh customer list
            fetchCustomers();

            // Close modal and reset form after short delay
            setTimeout(() => {
                setIsModalOpen(false);
                resetForm();
            }, 1500);

        } catch (error) {
            console.error('Error saving customer:', error);
            setResponseMessage({
                type: 'error',
                text: error.message || t('sales.common.error_message')
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
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
            address1: '',
            address2: '',
            city: '',
            neighborhood: '',
            province: '',
            zipCode: '',
            country: '',
            additionalContacts: []
        });
        setContactMethods({
            phone: true,
            email: true,
            address: true
        });
        setCurrentCustomerId(null);
        setIsEditing(false);
        setResponseMessage({ type: '', text: '' });
        setErrors({});
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const openAddModal = () => {
        resetForm();
        setViewContact(null);
        setIsModalOpen(true);
    };

    const openViewModal = async (customer) => {
        setMenuOpenId(null);
        try {
            const res = await fetch(`http://localhost:4000/api/v1/contacts/${customer._id}`);
            const data = await res.json();
            if (data.contact) {
                setViewContact(data.contact);
                setViewTab('summary');
            } else {
                setViewContact(customer);
            }
        } catch (err) {
            console.error(err);
            setViewContact(customer);
        }
    };

    const handleDeleteCustomer = async (id) => {
        if (!window.confirm(t('sales.common.confirm_delete'))) return;
        try {
            const res = await fetch(`http://localhost:4000/api/v1/contacts/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                fetchCustomers();
                if (viewContact?._id === id) setViewContact(null);
            } else {
                alert(data.message || t('sales.common.error_message'));
            }
        } catch (err) {
            alert(t('sales.common.error_message'));
        }
        setMenuOpenId(null);
    };

    const getTypeText = (type) => {
        if (i18n.language === 'ar') {
            return type === 'commercial' ? 'تجاري' : 'فردي';
        }
        return type === 'commercial' ? 'Commercial' : 'Individual';
    };

    const addAdditionalContact = () => {
        setFormData(prev => ({
            ...prev,
            additionalContacts: [...(prev.additionalContacts || []), { name: '', phone: '', email: '', title: '' }]
        }));
    };

    const removeAdditionalContact = (index) => {
        setFormData(prev => ({
            ...prev,
            additionalContacts: prev.additionalContacts.filter((_, i) => i !== index)
        }));
        setErrors(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => { if (k.startsWith('additionalContact_')) delete next[k]; });
            return next;
        });
    };

    const handleAdditionalContactChange = (index, field, value) => {
        setFormData(prev => {
            const list = [...(prev.additionalContacts || [])];
            if (!list[index]) return prev;
            list[index] = { ...list[index], [field]: value };
            return { ...prev, additionalContacts: list };
        });
        if (field === 'name' && errors[`additionalContact_${index}`]) {
            setErrors(prev => ({ ...prev, [`additionalContact_${index}`]: '' }));
        }
    };

    const getTypeColor = (type) => type === 'commercial' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';

    return (
        <div className="min-h-screen bg-gray-50" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={openAddModal}
                        className="flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm shadow-sm"
                    >
                        <Plus size={18} />
                        <span>{t('sales.common.add')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={fetchCustomers}
                        className="flex items-center gap-2 border-2 border-gray-100 text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all font-bold text-sm"
                    >
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
                <RefreshCw size={16} className="text-gray-400 cursor-pointer" onClick={fetchCustomers} />
                <h1 className="text-lg font-black text-gray-800">{t('sales.customers.title')}</h1>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading && !isModalOpen ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="text-6xl mb-4">👥</div>
                        <p className="text-lg font-medium">{t('sales.customers.no_customers')}</p>
                        <p className="text-sm">{t('sales.customers.start_creating')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.customers.name')}</th>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.customers.balance')}</th>
                                    <th className="px-6 py-4 w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {customers.map((customer) => (
                                    <tr key={customer._id} className="hover:bg-indigo-50/30 transition-all group">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-700">
                                            #{customer.code || customer._id?.slice(-6) || '—'} {customer.name}
                                        </td>
                                        <td className={`px-6 py-5 whitespace-nowrap text-sm font-black ${(customer.currentBalance ?? customer.initialBalance ?? 0) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                            {(customer.currentBalance ?? customer.initialBalance ?? 0) !== 0
                                                ? (customer.currentBalance ?? customer.initialBalance ?? 0).toLocaleString() + ' ' + t('sales.common.currency')
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right relative">
                                            <button
                                                type="button"
                                                onClick={() => setMenuOpenId(menuOpenId === customer._id ? null : customer._id)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            {menuOpenId === customer._id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                                                    <div className="absolute top-full mt-1 right-0 z-20 py-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px]">
                                                        <button type="button" onClick={() => { openViewModal(customer); }} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                                            {t('sales.customers.view_customer')}
                                                        </button>
                                                        <button type="button" onClick={() => { getCustomerById(customer._id); setMenuOpenId(null); }} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                                            {t('sales.common.edit')}
                                                        </button>
                                                        <button type="button" onClick={() => handleDeleteCustomer(customer._id)} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                                                            {t('sales.common.delete')}
                                                        </button>
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

            {/* View Customer Modal - with tabs Summary / Invoices / Payments */}
            {viewContact && (() => {
                const addr = viewContact.address || {};
                return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className={`text-xl font-bold text-gray-800 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.view_customer')}</h2>
                                <button type="button" onClick={() => { setViewContact(null); setViewTab('summary'); }} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                            </div>
                            {/* Tabs */}
                            <div className="border-b border-gray-100 flex gap-0">
                                <button type="button" onClick={() => setViewTab('summary')} className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${viewTab === 'summary' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                    {t('sales.customers.summary')}
                                </button>
                                <button type="button" onClick={() => setViewTab('invoices')} className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${viewTab === 'invoices' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                    {t('sales.customers.invoices_tab')}
                                </button>
                                <button type="button" onClick={() => setViewTab('payments')} className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${viewTab === 'payments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                    {t('sales.customers.payments_tab')}
                                </button>
                            </div>
                            {/* Below tabs: Balance + Account Statement */}
                            <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.customers.balance')}</p>
                                    <p className={`text-sm font-black ${(viewContact.currentBalance ?? viewContact.initialBalance ?? 0) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                        {(viewContact.currentBalance ?? viewContact.initialBalance ?? 0) !== 0 ? (viewContact.currentBalance ?? viewContact.initialBalance ?? 0).toLocaleString() + ' ' + t('sales.common.currency') : '—'}
                                    </p>
                                </div>
                                <div className={`text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.customers.account_statement')}</p>
                                    <p className="text-sm font-bold text-gray-800">#{viewContact.code || viewContact._id?.slice(-6)} {viewContact.name}</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                {viewTab === 'summary' && (
                                    <div className="space-y-6">
                                        {/* Type */}
                                        <div>
                                            <p className={`text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.type')}</p>
                                            <div className="flex gap-4">
                                                <span className="text-sm text-gray-800">{getTypeText(viewContact.type)}</span>
                                            </div>
                                        </div>
                                        {/* Code & Name */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div>
                                                <p className={`text-sm font-semibold text-gray-700 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.customer_code')}</p>
                                                <p className="text-sm text-gray-800">{viewContact.code || '—'}</p>
                                            </div>
                                            <div>
                                                <p className={`text-sm font-semibold text-gray-700 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.customer_name')} *</p>
                                                <p className="text-sm text-gray-800">{viewContact.name}</p>
                                            </div>
                                        </div>
                                        {/* Notes */}
                                        <div>
                                            <p className={`text-sm font-semibold text-gray-700 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.notes')}</p>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{viewContact.notes || '—'}</p>
                                        </div>
                                        {/* Contact Details */}
                                        <div>
                                            <p className={`text-sm font-semibold text-gray-700 mb-3 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.contact_methods')}</p>
                                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                                <span className="flex items-center gap-2 text-sm text-gray-600">
                                                    <input type="checkbox" checked readOnly className="w-4 h-4 rounded" /><span>{t('sales.customers.phone')}</span>
                                                </span>
                                                <span className="flex items-center gap-2 text-sm text-gray-600">
                                                    <input type="checkbox" checked readOnly className="w-4 h-4 rounded" /><span>{t('sales.customers.email')}</span>
                                                </span>
                                                <span className="flex items-center gap-2 text-sm text-gray-600">
                                                    <input type="checkbox" checked readOnly className="w-4 h-4 rounded" /><span>{t('sales.customers.address')}</span>
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                <div><p className="text-xs font-semibold text-gray-500 mb-1">{t('sales.customers.phone')}</p><p className="text-sm text-gray-800">{viewContact.phone || '—'}</p></div>
                                                <div><p className="text-xs font-semibold text-gray-500 mb-1">{t('sales.customers.mobile')}</p><p className="text-sm text-gray-800">{viewContact.mobile || '—'}</p></div>
                                                <div><p className="text-xs font-semibold text-gray-500 mb-1">{t('sales.customers.email')}</p><p className="text-sm text-gray-800">{viewContact.email || '—'}</p></div>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                                <div><p className="text-xs font-semibold text-gray-500 mb-1">{t('sales.customers.address1')}</p><p className="text-sm text-gray-800">{addr.address1 || '—'}</p></div>
                                                <div><p className="text-xs font-semibold text-gray-500 mb-1">{t('sales.customers.address2')}</p><p className="text-sm text-gray-800">{addr.address2 || '—'}</p></div>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                                <div><p className="text-xs font-semibold text-gray-500 mb-1">{t('sales.customers.city')}</p><p className="text-sm text-gray-800">{addr.city || '—'}</p></div>
                                                <div><p className="text-xs font-semibold text-gray-500 mb-1">{t('sales.customers.neighborhood')}</p><p className="text-sm text-gray-800">{addr.neighborhood || '—'}</p></div>
                                                <div><p className="text-xs font-semibold text-gray-500 mb-1">{t('sales.customers.province')}</p><p className="text-sm text-gray-800">{addr.province || '—'}</p></div>
                                                <div><p className="text-xs font-semibold text-gray-500 mb-1">{t('sales.customers.zip_code')}</p><p className="text-sm text-gray-800">{addr.zipCode || '—'}</p></div>
                                            </div>
                                            <div className="mt-4">
                                                <p className="text-xs font-semibold text-gray-500 mb-1">{t('sales.customers.country')}</p>
                                                <p className="text-sm text-gray-800">{addr.country || '—'}</p>
                                            </div>
                                        </div>
                                        {/* Additional Contact Persons */}
                                        <div>
                                            <p className={`text-base font-semibold text-gray-700 mb-3 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.additional_contacts')}</p>
                                            {Array.isArray(viewContact.additionalContacts) && viewContact.additionalContacts.length > 0 ? (
                                                <ul className="space-y-3">
                                                    {viewContact.additionalContacts.map((ac, i) => (
                                                        <li key={i} className="p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                                                            <p className="text-sm font-medium text-gray-800">{ac.name || '—'}</p>
                                                            {(ac.phone || ac.email) && <p className="text-xs text-gray-500 mt-1">{[ac.phone, ac.email].filter(Boolean).join(' • ')}</p>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500">—</p>
                                            )}
                                            <button type="button" onClick={() => { getCustomerById(viewContact._id); setViewContact(null); }} className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                                                <Plus size={18} />
                                                {t('sales.customers.add_new_contact')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {viewTab === 'invoices' && (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                        <p className="text-sm">{t('sales.customers.no_invoices')}</p>
                                    </div>
                                )}
                                {viewTab === 'payments' && (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                        <p className="text-sm">{t('sales.customers.no_payments')}</p>
                                    </div>
                                )}
                            </div>
                            <div className={`border-t border-gray-200 px-6 py-4 flex justify-start gap-3 bg-white sticky bottom-0 ${i18n.language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
                                <button type="button" onClick={() => setViewContact(null)} className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold">
                                    {t('sales.common.close')}
                                </button>
                                <button type="button" onClick={() => { getCustomerById(viewContact._id); setViewContact(null); }} className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-semibold">
                                    {t('sales.common.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                            <h2 className={`text-xl font-bold text-gray-800 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                {isEditing ? t('sales.customers.edit_customer') : t('sales.customers.add_customer')}
                            </h2>
                            <button
                                onClick={handleCancel}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Response Message */}
                                {responseMessage.text && (
                                    <div className={`p-4 rounded-md ${responseMessage.type === 'success'
                                        ? 'bg-green-50 border border-green-200 text-green-800'
                                        : 'bg-red-50 border border-red-200 text-red-800'
                                        }`}>
                                        <p className="text-sm font-medium">{responseMessage.text}</p>
                                    </div>
                                )}

                                {/* Type and Code - first row per screenshot */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.type')}
                                        </label>
                                        <div className="flex gap-4 flex-wrap">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value="individual"
                                                    checked={formData.type === 'individual'}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">{t('sales.customers.individual')}</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value="commercial"
                                                    checked={formData.type === 'commercial'}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">{t('sales.customers.commercial')}</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.customer_code')}
                                        </label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-indigo-500 text-sm"
                                            readOnly={isEditing}
                                        />
                                    </div>
                                </div>

                                {/* Name * */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('sales.customers.customer_name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none transition-colors ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'}`}
                                        placeholder={t('sales.customers.customer_name')}
                                    />
                                    {errors.name && (
                                        <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                            <span>⚠</span> {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Tax Number & Commercial Register - only for Business (Commercial) */}
                                {formData.type === 'commercial' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('sales.customers.tax_number')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="taxNumber"
                                                value={formData.taxNumber}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none transition-colors ${errors.taxNumber ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'}`}
                                            />
                                            {errors.taxNumber && (
                                                <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{errors.taxNumber}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('sales.customers.commercial_register')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="commercialRegister"
                                                value={formData.commercialRegister}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none transition-colors ${errors.commercialRegister ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'}`}
                                            />
                                            {errors.commercialRegister && (
                                                <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{errors.commercialRegister}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Opening Balance */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('sales.customers.opening_balance')}
                                    </label>
                                    <input
                                        type="number"
                                        name="initialBalance"
                                        value={formData.initialBalance}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('sales.common.notes')}
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
                                    />
                                </div>

                                {/* Contact Details - section with pencil + checkboxes (Phone, Email, Address) */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-3 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('sales.customers.contact_methods')}
                                    </label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" aria-label="Edit">
                                            <Pencil size={18} />
                                        </button>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={contactMethods.phone}
                                                onChange={() => handleContactMethodChange('phone')}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm">{t('sales.customers.phone')}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={contactMethods.email}
                                                onChange={() => handleContactMethodChange('email')}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm">{t('sales.customers.email')}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={contactMethods.address}
                                                onChange={() => handleContactMethodChange('address')}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm">{t('sales.customers.address')}</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Phone, Mobile, Email */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.phone')}
                                        </label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.mobile')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none transition-colors ${errors.mobile ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'}`}
                                            placeholder="05xxxxxxxx"
                                        />
                                        {errors.mobile && (
                                            <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'} flex items-center gap-1`}>
                                                <span>⚠</span> {errors.mobile}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.email')}
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                            placeholder="example@email.com"
                                        />
                                    </div>
                                </div>

                                {/* Address Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.address1')}
                                        </label>
                                        <input
                                            type="text"
                                            name="address1"
                                            value={formData.address1}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.address2')}
                                        </label>
                                        <input
                                            type="text"
                                            name="address2"
                                            value={formData.address2}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* City, Neighborhood, Province, ZipCode */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.city')}
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.neighborhood')}
                                        </label>
                                        <input
                                            type="text"
                                            name="neighborhood"
                                            value={formData.neighborhood}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.province')}
                                        </label>
                                        <input
                                            type="text"
                                            name="province"
                                            value={formData.province}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                            {t('sales.customers.zip_code')}
                                        </label>
                                        <input
                                            type="text"
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Country Dropdown */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('sales.customers.country')}
                                    </label>
                                    <select
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                                    >
                                        <option value="">{t('sales.common.choose')}</option>
                                        <option value="saudi">{t('sales.common.saudi_arabia') || (i18n.language === 'ar' ? 'السعودية' : 'Saudi Arabia')}</option>
                                        <option value="egypt">{t('sales.common.egypt_country') || (i18n.language === 'ar' ? 'مصر' : 'Egypt')}</option>
                                        <option value="uae">{t('sales.common.uae') || (i18n.language === 'ar' ? 'الإمارات' : 'UAE')}</option>
                                        <option value="kuwait">{t('sales.common.kuwait') || (i18n.language === 'ar' ? 'الكويت' : 'Kuwait')}</option>
                                    </select>
                                </div>

                                {/* Additional Contact Persons */}
                                <div>
                                    <h3 className={`text-base font-semibold text-gray-700 mb-3 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('sales.customers.additional_contacts')}
                                    </h3>
                                    {(formData.additionalContacts || []).map((ac, index) => (
                                        <div key={index} className="flex flex-wrap items-start gap-3 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                            <button
                                                type="button"
                                                onClick={() => removeAdditionalContact(index)}
                                                className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                                                aria-label="Remove"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <div className="flex-1 min-w-[200px]">
                                                <label className={`block text-sm font-semibold text-gray-700 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                    {t('sales.customers.contact_name')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={ac.name}
                                                    onChange={(e) => handleAdditionalContactChange(index, 'name', e.target.value)}
                                                    className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none ${errors[`additionalContact_${index}`] ? 'border-red-500' : 'border-gray-200 focus:border-indigo-500'}`}
                                                    placeholder={t('sales.customers.contact_name')}
                                                />
                                                {errors[`additionalContact_${index}`] && (
                                                    <p className={`mt-1 text-sm text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{errors[`additionalContact_${index}`]}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-4 flex-wrap items-center">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" readOnly checked />
                                                    <span className="text-sm">{t('sales.customers.phone')}</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" readOnly />
                                                    <span className="text-sm">{t('sales.customers.email')}</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" readOnly />
                                                    <span className="text-sm">{t('sales.customers.address')}</span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addAdditionalContact}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                                    >
                                        <Plus size={18} />
                                        {t('sales.customers.add_new_contact')}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer - Cancel gray, Save green */}
                        <div className={`bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-start gap-3 sticky bottom-0 ${i18n.language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors font-semibold"
                            >
                                {t('sales.common.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? t('sales.common.saving') : (isEditing ? t('sales.common.update') : t('sales.common.save'))}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}