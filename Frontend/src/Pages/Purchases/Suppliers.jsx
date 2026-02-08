import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Search, MoreVertical, Pencil, Minus, Eye, Check, Trash2, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

export default function Suppliers() {
    const { t, i18n } = useTranslation();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSupplierId, setCurrentSupplierId] = useState(null);
    const [loadingSupplier, setLoadingSupplier] = useState(false);

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
    const [viewTab, setViewTab] = useState('summary');
    const [selectedSupplierId, setSelectedSupplierId] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState(null);
    const [viewFormData, setViewFormData] = useState(null);
    const [viewContactMethods, setViewContactMethods] = useState({ phone: true, email: true, address: true });
    const [isSavingView, setIsSavingView] = useState(false);

    const [contactMethods, setContactMethods] = useState({
        phone: true,
        email: true,
        address: true
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [responseMessage, setResponseMessage] = useState({ type: '', text: '' });

    // Fetch suppliers from API
    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/contacts/suppliers');
            const data = response.data;
            setSuppliers(data.contacts || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const getSupplierById = async (id) => {
        setLoadingSupplier(true);
        try {
            const res = await api.get(`/contacts/${id}`);
            const data = res.data;

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

                setCurrentSupplierId(id);
                setIsEditing(true);
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error('Error fetching supplier:', error);
        } finally {
            setLoadingSupplier(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = t('sales.suppliers.name') + ' ' + t('sales.common.required');
        }

        // Mobile validation (required)
        if (!formData.mobile.trim()) {
            newErrors.mobile = t('sales.suppliers.mobile') + ' ' + t('sales.common.required');
        }

        // Business (Commercial) only: Tax Number and Commercial Register required
        if (formData.type === 'commercial') {
            if (!(formData.taxNumber || '').trim()) {
                newErrors.taxNumber = t('sales.suppliers.tax_number') + ' ' + t('sales.common.required');
            }
            if (!(formData.commercialRegister || '').trim()) {
                newErrors.commercialRegister = t('sales.suppliers.commercial_register') + ' ' + t('sales.common.required');
            }
        }

        // Additional contacts: name required when row exists
        (formData.additionalContacts || []).forEach((ac, i) => {
            if (!(ac.name || '').trim()) {
                newErrors[`additionalContact_${i}`] = t('sales.suppliers.contact_name') + ' ' + t('sales.common.required');
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

            if (isEditing && currentSupplierId) {
                // Update existing supplier - PATCH request
                response = await api.patch(`/contacts/${currentSupplierId}`, dataToSend);
                result = response.data;
            } else {
                // Create new supplier - POST request to SUPPLIERS endpoint
                response = await api.post('/contacts/suppliers', dataToSend);
                result = response.data;
            }

            if (response.status !== 200 && response.status !== 201) {
                throw new Error(result.message || t('sales.common.error_message'));
            }

            console.log('Supplier saved successfully:', result);

            // Show success message
            setResponseMessage({
                type: 'success',
                text: result.message || t('sales.common.success_message')
            });

            // Refresh supplier list
            fetchSuppliers();

            // Close modal and reset form after short delay
            setTimeout(() => {
                setIsModalOpen(false);
                resetForm();
            }, 1500);

        } catch (error) {
            console.error('Error saving supplier:', error);
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
        setCurrentSupplierId(null);
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

    const openViewModal = async (supplier) => {
        setMenuOpenId(null);
        setSelectedSupplierId(supplier._id);
        try {
            const res = await api.get(`/contacts/${supplier._id}`);
            const data = res.data;
            if (data.contact) {
                const c = data.contact;
                const addr = c.address || {};
                setViewContact(c);
                setViewFormData({
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
                setViewContactMethods(c.contactMethods ? { phone: c.contactMethods.phone !== false, email: c.contactMethods.email !== false, address: c.contactMethods.address !== false } : { phone: true, email: true, address: true });
                setViewTab('summary');
            } else {
                setViewContact(supplier);
                const addr = supplier.address || {};
                setViewFormData({
                    name: supplier.name || '',
                    type: supplier.type === 'commercial' ? 'commercial' : 'individual',
                    code: supplier.code || '',
                    taxNumber: supplier.taxNumber || '',
                    commercialRegister: supplier.commercialRegister || '',
                    mobile: supplier.mobile || '',
                    phone: supplier.phone || '',
                    email: supplier.email || '',
                    notes: supplier.notes || '',
                    initialBalance: supplier.initialBalance ?? 0,
                    address1: addr.address1 || '',
                    address2: addr.address2 || '',
                    city: addr.city || '',
                    neighborhood: addr.neighborhood || '',
                    province: addr.province || '',
                    zipCode: addr.zipCode || '',
                    country: addr.country || '',
                    additionalContacts: Array.isArray(supplier.additionalContacts) ? supplier.additionalContacts.map(ac => ({ name: ac.name || '', phone: ac.phone || '', email: ac.email || '', title: ac.title || '' })) : []
                });
            }
        } catch (err) {
            console.error(err);
            setViewContact(supplier);
        }
    };

    const handleRowClick = (supplier) => {
        openViewModal(supplier);
    };

    const handleDeleteClick = (supplier) => {
        setSupplierToDelete(supplier);
        setShowDeleteConfirm(true);
        setMenuOpenId(null);
    };

    const handleDeleteSupplier = async (id) => {
        try {
            const res = await api.delete(`/contacts/${id}`);
            const data = res.data;
            if (res.status === 200) {
                fetchSuppliers();
                if (viewContact?._id === id) {
                    setViewContact(null);
                    setSelectedSupplierId(null);
                }
                if (selectedSupplierId === id) {
                    setSelectedSupplierId(null);
                }
            } else {
                alert(data.message || t('sales.common.error_message'));
            }
        } catch (err) {
            alert(t('sales.common.error_message'));
        }
        setShowDeleteConfirm(false);
        setSupplierToDelete(null);
    };

    const confirmDelete = () => {
        if (supplierToDelete) {
            handleDeleteSupplier(supplierToDelete._id);
        }
    };

    const handleViewFormChange = (e) => {
        const { name, value } = e.target;
        if (['address1', 'address2', 'city', 'neighborhood', 'province', 'zipCode', 'country'].includes(name)) {
            setViewFormData(prev => ({ ...prev, [name]: value }));
        } else {
            setViewFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleViewContactMethodChange = (method) => {
        setViewContactMethods(prev => ({ ...prev, [method]: !prev[method] }));
    };

    const handleSaveView = async () => {
        if (!viewFormData || !viewContact) return;
        setIsSavingView(true);
        try {
            const type = (viewFormData.type === 'commercial' ? 'commercial' : 'individual');
            const address = {
                address1: viewFormData.address1 || '',
                address2: viewFormData.address2 || '',
                neighborhood: viewFormData.neighborhood || '',
                city: viewFormData.city || '',
                province: viewFormData.province || '',
                zipCode: viewFormData.zipCode || '',
                country: viewFormData.country || ''
            };
            const additionalContacts = (viewFormData.additionalContacts || []).map(ac => ({
                name: (ac.name || '').trim(),
                phone: (ac.phone || '').trim() || undefined,
                email: (ac.email || '').trim() || undefined,
                title: (ac.title || '').trim() || undefined
            })).filter(ac => ac.name);

            const dataToSend = {
                name: viewFormData.name,
                type,
                code: viewFormData.code || undefined,
                taxNumber: viewFormData.taxNumber || undefined,
                commercialRegister: viewFormData.commercialRegister || undefined,
                phone: viewFormData.phone || undefined,
                mobile: viewFormData.mobile || undefined,
                email: viewFormData.email || undefined,
                notes: viewFormData.notes || undefined,
                initialBalance: Number(viewFormData.initialBalance) || 0,
                address,
                additionalContacts
            };

            const res = await api.patch(`/contacts/${viewContact._id}`, dataToSend);
            const result = res.data;
            if (res.status === 200) {
                await openViewModal({ _id: viewContact._id });
                fetchSuppliers();
            } else {
                alert(result.message || t('sales.common.error_message'));
            }
        } catch (err) {
            alert(t('sales.common.error_message'));
        } finally {
            setIsSavingView(false);
        }
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
            {/* Header / Toolbar */}
            <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-100 flex-wrap gap-4">
                {/* Right Side: Add Button & Search */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm shadow-sm"
                    >
                        <Plus size={18} />
                        <span>{t('sales.common.add')}</span>
                    </button>

                    <div className="relative group">
                        <div className="flex items-center gap-2 border border-gray-200 bg-gray-50 text-gray-500 px-4 py-2.5 rounded-lg hover:bg-white hover:border-indigo-300 transition-all cursor-pointer min-w-[180px]">
                            <Search size={16} />
                            <span className="text-sm font-medium">{t('sales.common.search_filter')}</span>
                        </div>
                    </div>
                </div>

                {/* Left Side: Title & Navigation */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchSuppliers}
                        disabled={loading}
                        className={`p-2 text-gray-400 hover:text-indigo-600 transition-all rounded-full hover:bg-gray-50 ${loading ? 'animate-spin' : ''}`}
                        title={t('sales.common.refresh')}
                    >
                        <RefreshCw size={18} />
                    </button>

                    <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

                    <div className="flex items-center gap-2 text-gray-800">
                        <h1 className="text-lg font-bold">{t('sales.suppliers.title')}</h1>
                        <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                            <Home size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading && !isModalOpen ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : suppliers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="text-6xl mb-4">🏢</div>
                        <p className="text-lg font-medium">{t('sales.suppliers.no_suppliers')}</p>
                        <p className="text-sm">{t('sales.suppliers.start_creating')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-white">
                                <tr>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-sm font-bold text-gray-500`}>{t('sales.suppliers.name')}</th>
                                    <th className={`px-6 py-4 text-center text-sm font-bold text-gray-500`}>{t('sales.suppliers.balance')}</th>
                                    <th className="px-6 py-4 w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {suppliers.map((supplier) => (
                                    <tr
                                        key={supplier._id}
                                        onClick={() => handleRowClick(supplier)}
                                        className={`cursor-pointer transition-all hover:bg-gray-50 group border-b border-gray-50 last:border-0`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs ring-4 ring-white">
                                                    {supplier.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-800">{supplier.name}</div>
                                                    <div className="text-xs text-gray-400 font-medium mt-0.5">#{supplier.code || supplier._id?.slice(-6)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset ${(supplier.currentBalance ?? supplier.initialBalance ?? 0) < 0 ? 'bg-red-50 text-red-700 ring-red-600/10' : 'bg-green-50 text-green-700 ring-green-600/20'}`}>
                                                {(supplier.currentBalance ?? supplier.initialBalance ?? 0) !== 0
                                                    ? (Math.abs(supplier.currentBalance ?? supplier.initialBalance ?? 0)).toLocaleString() + ' ' + t('sales.common.currency')
                                                    : '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-end relative" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => setMenuOpenId(menuOpenId === supplier._id ? null : supplier._id)}
                                                className={`p-2 rounded-lg transition-colors ${menuOpenId === supplier._id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {menuOpenId === supplier._id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                                                    <div className={`absolute top-full mt-1 ${i18n.language === 'ar' ? 'left-0' : 'right-0'} z-20 w-40 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 py-1 overflow-hidden ring-1 ring-black/5`}>
                                                        <button type="button" onClick={() => { openViewModal(supplier); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-start text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                                                            <Eye size={16} />
                                                            {t('sales.suppliers.view_supplier')}
                                                        </button>
                                                        <button type="button" onClick={() => { getSupplierById(supplier._id); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-start text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                                                            <Pencil size={16} />
                                                            {t('sales.suppliers.edit_supplier')}
                                                        </button>
                                                        <div className="h-px bg-gray-50 my-1"></div>
                                                        <button type="button" onClick={() => handleDeleteClick(supplier)} className="flex items-center gap-3 w-full px-4 py-2.5 text-start text-sm text-red-600 hover:bg-red-50 transition-colors">
                                                            <Trash2 size={16} />
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

                        {/* Pagination */}
                        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex items-center justify-between">
                            <div className="text-xs text-gray-500 font-medium">
                                {t('sales.common.showing')} <span className="font-bold text-gray-800">{suppliers.length}</span> {t('sales.common.results')}
                            </div>
                            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200">
                                <button disabled className="px-3 py-1 text-gray-400 text-xs font-bold border-e border-gray-100 cursor-not-allowed">{t('sales.common.prev')}</button>
                                <button disabled className="px-3 py-1 text-gray-400 text-xs font-bold cursor-not-allowed">{t('sales.common.next')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* View Supplier Modal - with tabs Summary / Invoices / Payments */}
            {viewContact && viewFormData && (() => {
                return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className={`text-xl font-bold text-gray-800 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.view_supplier')}</h2>
                                <button type="button" onClick={() => { setViewContact(null); setViewFormData(null); setViewTab('summary'); setSelectedSupplierId(null); }} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                            </div>
                            {/* Tabs */}
                            <div className="border-b border-gray-100 flex gap-0">
                                <button type="button" onClick={() => setViewTab('summary')} className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${viewTab === 'summary' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                    {t('sales.suppliers.summary')}
                                </button>
                                <button type="button" onClick={() => setViewTab('invoices')} className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${viewTab === 'invoices' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                    {t('sales.suppliers.invoices_tab')}
                                </button>
                                <button type="button" onClick={() => setViewTab('payments')} className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${viewTab === 'payments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                    {t('sales.suppliers.payments_tab')}
                                </button>
                            </div>
                            {/* Below tabs: Balance + Account Statement */}
                            <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.suppliers.balance')}</p>
                                    <p className={`text-sm font-black ${(viewContact.currentBalance ?? viewContact.initialBalance ?? 0) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                        {(viewContact.currentBalance ?? viewContact.initialBalance ?? 0) !== 0 ? (viewContact.currentBalance ?? viewContact.initialBalance ?? 0).toLocaleString() + ' ' + t('sales.common.currency') : '—'}
                                    </p>
                                </div>
                                <div className={`text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.suppliers.account_statement')}</p>
                                    <p className="text-sm font-bold text-gray-800">#{viewContact.code || viewContact._id?.slice(-6)} {viewContact.name}</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                {viewTab === 'summary' && viewFormData && (
                                    <form className="space-y-6">
                                        {/* Type - Radio buttons */}
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.type')}</label>
                                            <div className="flex gap-4 flex-wrap">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="viewType" value="individual" checked={viewFormData.type === 'individual'} onChange={(e) => setViewFormData({ ...viewFormData, type: e.target.value })} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                                    <span className="text-sm">{t('sales.suppliers.individual')}</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="viewType" value="commercial" checked={viewFormData.type === 'commercial'} onChange={(e) => setViewFormData({ ...viewFormData, type: e.target.value })} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                                    <span className="text-sm">{t('sales.suppliers.commercial')}</span>
                                                </label>
                                            </div>
                                        </div>
                                        {/* Code & Name */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div>
                                                <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.supplier_code')}</label>
                                                <input type="text" name="code" value={viewFormData.code} onChange={handleViewFormChange} readOnly className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm" />
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.supplier_name')} <span className="text-red-500">*</span></label>
                                                <input type="text" name="name" value={viewFormData.name} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                            </div>
                                        </div>
                                        {/* Tax Number & Commercial Register - only for Commercial */}
                                        {viewFormData.type === 'commercial' && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.tax_number')} <span className="text-red-500">*</span></label>
                                                    <input type="text" name="taxNumber" value={viewFormData.taxNumber} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.commercial_register')} <span className="text-red-500">*</span></label>
                                                    <input type="text" name="commercialRegister" value={viewFormData.commercialRegister} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                            </div>
                                        )}
                                        {/* Notes */}
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.notes')}</label>
                                            <textarea name="notes" value={viewFormData.notes} onChange={handleViewFormChange} rows={3} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 resize-none" />
                                        </div>
                                        {/* Contact Details */}
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-3 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.contact_methods')}</label>
                                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                                <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" aria-label="Edit"><Pencil size={18} /></button>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={viewContactMethods.phone} onChange={() => handleViewContactMethodChange('phone')} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                                    <span className="text-sm">{t('sales.suppliers.phone')}</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={viewContactMethods.email} onChange={() => handleViewContactMethodChange('email')} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                                    <span className="text-sm">{t('sales.suppliers.email')}</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={viewContactMethods.address} onChange={() => handleViewContactMethodChange('address')} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                                    <span className="text-sm">{t('sales.suppliers.address')}</span>
                                                </label>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.phone')}</label>
                                                    <input type="text" name="phone" value={viewFormData.phone} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.mobile')}</label>
                                                    <input type="text" name="mobile" value={viewFormData.mobile} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.email')}</label>
                                                    <input type="email" name="email" value={viewFormData.email} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.address1')}</label>
                                                    <input type="text" name="address1" value={viewFormData.address1} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.address2')}</label>
                                                    <input type="text" name="address2" value={viewFormData.address2} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.city')}</label>
                                                    <input type="text" name="city" value={viewFormData.city} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.neighborhood')}</label>
                                                    <input type="text" name="neighborhood" value={viewFormData.neighborhood} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.province')}</label>
                                                    <input type="text" name="province" value={viewFormData.province} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.zip_code')}</label>
                                                    <input type="text" name="zipCode" value={viewFormData.zipCode} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.country')}</label>
                                                <select name="country" value={viewFormData.country} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white">
                                                    <option value="">{t('sales.common.choose')}</option>
                                                    <option value="saudi">{i18n.language === 'ar' ? 'السعودية' : 'Saudi Arabia'}</option>
                                                    <option value="egypt">{i18n.language === 'ar' ? 'مصر' : 'Egypt'}</option>
                                                    <option value="uae">{i18n.language === 'ar' ? 'الإمارات' : 'UAE'}</option>
                                                    <option value="kuwait">{i18n.language === 'ar' ? 'الكويت' : 'Kuwait'}</option>
                                                </select>
                                            </div>
                                        </div>
                                        {/* Additional Contact Persons */}
                                        <div>
                                            <p className={`text-base font-semibold text-gray-700 mb-3 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.additional_contacts')}</p>
                                            {(viewFormData.additionalContacts || []).map((ac, index) => (
                                                <div key={index} className="flex flex-wrap items-start gap-3 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                                    <button type="button" onClick={() => {
                                                        const updated = viewFormData.additionalContacts.filter((_, i) => i !== index);
                                                        setViewFormData({ ...viewFormData, additionalContacts: updated });
                                                    }} className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600" aria-label="Remove"><Minus size={16} /></button>
                                                    <div className="flex-1 min-w-[200px]">
                                                        <label className={`block text-sm font-semibold text-gray-700 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.contact_name')}</label>
                                                        <input type="text" value={ac.name} onChange={(e) => {
                                                            const list = [...viewFormData.additionalContacts];
                                                            list[index] = { ...list[index], name: e.target.value };
                                                            setViewFormData({ ...viewFormData, additionalContacts: list });
                                                        }} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg" placeholder={t('sales.suppliers.contact_name')} />
                                                    </div>
                                                    <div className="flex gap-4 flex-wrap">
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded" readOnly checked /><span className="text-sm">{t('sales.suppliers.phone')}</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded" readOnly /><span className="text-sm">{t('sales.suppliers.email')}</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded" readOnly /><span className="text-sm">{t('sales.suppliers.address')}</span></label>
                                                    </div>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => setViewFormData({ ...viewFormData, additionalContacts: [...(viewFormData.additionalContacts || []), { name: '', phone: '', email: '', title: '' }] })} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                                                <Plus size={18} />
                                                {t('sales.suppliers.add_new_contact')}
                                            </button>
                                        </div>
                                    </form>
                                )}
                                {viewTab === 'invoices' && (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                        <p className="text-sm">{t('sales.suppliers.no_invoices')}</p>
                                    </div>
                                )}
                                {viewTab === 'payments' && (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                        <p className="text-sm">{t('sales.suppliers.no_payments')}</p>
                                    </div>
                                )}
                            </div>
                            <div className={`border-t border-gray-200 px-6 py-4 flex justify-start gap-3 bg-white sticky bottom-0 ${i18n.language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
                                <button type="button" onClick={() => { setViewContact(null); setViewFormData(null); setSelectedSupplierId(null); setViewTab('summary'); }} className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold">
                                    {t('sales.common.close')}
                                </button>
                                <button type="button" onClick={handleSaveView} disabled={isSavingView || !viewFormData} className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    {isSavingView ? t('sales.common.saving') : t('sales.common.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && supplierToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className={`text-lg font-bold text-gray-800 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                {t('sales.common.confirm_delete')}
                            </h3>
                        </div>
                        <div className="px-6 py-4">
                            <p className={`text-sm text-gray-600 mb-4 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                {t('sales.common.confirm_delete')} <strong>#{supplierToDelete.code || supplierToDelete._id?.slice(-6)} {supplierToDelete.name}</strong>?
                            </p>
                        </div>
                        <div className={`px-6 py-4 border-t border-gray-200 flex justify-end gap-3 ${i18n.language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <button
                                type="button"
                                onClick={() => { setShowDeleteConfirm(false); setSupplierToDelete(null); }}
                                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold"
                            >
                                {t('sales.common.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 font-semibold"
                            >
                                {t('sales.common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Add / Edit Supplier Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className={`text-xl font-bold text-gray-800 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                {isEditing ? t('sales.suppliers.edit_supplier') : t('sales.suppliers.add_supplier')}
                            </h2>
                            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {responseMessage.text && (
                                <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${responseMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {responseMessage.type === 'success' ? <Check size={20} className="mt-0.5" /> : <X size={20} className="mt-0.5" />}
                                    <p className="font-medium text-sm">{responseMessage.text}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Type Selection */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.type')}</label>
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
                                            <span className="text-sm">{t('sales.suppliers.individual')}</span>
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
                                            <span className="text-sm">{t('sales.suppliers.commercial')}</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.supplier_code')} <span className="text-gray-400 font-normal text-xs">({t('sales.common.optional')})</span></label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            placeholder={t('sales.common.auto_generated')}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-gray-300 transition-all font-mono text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.supplier_name')} <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-4 transition-all ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10'}`}
                                            placeholder={t('sales.suppliers.enter_name')}
                                        />
                                        {errors.name && <p className={`mt-1 text-xs font-bold text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{errors.name}</p>}
                                    </div>
                                </div>

                                {/* Commercial Fields */}
                                {formData.type === 'commercial' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.tax_number')} <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="taxNumber"
                                                value={formData.taxNumber}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-4 transition-all ${errors.taxNumber ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10'}`}
                                            />
                                            {errors.taxNumber && <p className={`mt-1 text-xs font-bold text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{errors.taxNumber}</p>}
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.commercial_register')} <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="commercialRegister"
                                                value={formData.commercialRegister}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-4 transition-all ${errors.commercialRegister ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10'}`}
                                            />
                                            {errors.commercialRegister && <p className={`mt-1 text-xs font-bold text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{errors.commercialRegister}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.notes')}</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none transition-all"
                                        placeholder={t('sales.common.notes_placeholder')}
                                    />
                                </div>

                                <div className="h-px bg-gray-100 my-2"></div>

                                {/* Contact Methods */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-3 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.contact_methods')}</label>
                                    <div className="flex flex-wrap gap-4 mb-4">
                                        <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${contactMethods.phone ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                            <input type="checkbox" checked={contactMethods.phone} onChange={() => handleContactMethodChange('phone')} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                                            <span className="text-sm font-medium">{t('sales.suppliers.phone')}</span>
                                        </label>
                                        <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${contactMethods.email ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                            <input type="checkbox" checked={contactMethods.email} onChange={() => handleContactMethodChange('email')} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                                            <span className="text-sm font-medium">{t('sales.suppliers.email')}</span>
                                        </label>
                                        <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${contactMethods.address ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                            <input type="checkbox" checked={contactMethods.address} onChange={() => handleContactMethodChange('address')} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                                            <span className="text-sm font-medium">{t('sales.suppliers.address')}</span>
                                        </label>
                                    </div>

                                    <div className="space-y-4">
                                        {contactMethods.phone && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.mobile')} <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="text"
                                                        name="mobile"
                                                        value={formData.mobile}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-4 transition-all ${errors.mobile ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10'}`}
                                                    />
                                                    {errors.mobile && <p className={`mt-1 text-xs font-bold text-red-500 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{errors.mobile}</p>}
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.phone')}</label>
                                                    <input
                                                        type="text"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {contactMethods.email && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.email')}</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                />
                                            </div>
                                        )}
                                        {contactMethods.address && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.address1')}</label>
                                                        <input type="text" name="address1" value={formData.address1} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                                                    </div>
                                                    <div>
                                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.address2')}</label>
                                                        <input type="text" name="address2" value={formData.address2} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div>
                                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.city')}</label>
                                                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                                                    </div>
                                                    <div>
                                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.neighborhood')}</label>
                                                        <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                                                    </div>
                                                    <div>
                                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.province')}</label>
                                                        <input type="text" name="province" value={formData.province} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                                                    </div>
                                                    <div>
                                                        <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.zip_code')}</label>
                                                        <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.country')}</label>
                                                    <select name="country" value={formData.country} onChange={handleInputChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-white">
                                                        <option value="">{t('sales.common.choose')}</option>
                                                        <option value="saudi">{i18n.language === 'ar' ? 'السعودية' : 'Saudi Arabia'}</option>
                                                        <option value="egypt">{i18n.language === 'ar' ? 'مصر' : 'Egypt'}</option>
                                                        <option value="uae">{i18n.language === 'ar' ? 'الإمارات' : 'UAE'}</option>
                                                        <option value="kuwait">{i18n.language === 'ar' ? 'الكويت' : 'Kuwait'}</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 my-2"></div>

                                {/* Financial Info */}
                                <div>
                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.suppliers.opening_balance')}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="initialBalance"
                                            value={formData.initialBalance}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
                                            placeholder="0.00"
                                        />
                                        <div className={`absolute inset-y-0 ${i18n.language === 'ar' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
                                            <span className="text-gray-500 text-sm font-bold">{t('sales.common.currency')}</span>
                                        </div>
                                    </div>
                                    <p className={`mt-1.5 text-xs text-gray-400 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.positive_credit_negative_debit')}</p>
                                </div>

                                {/* Additional Contact Persons */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-base font-semibold text-gray-700">{t('sales.suppliers.additional_contacts')}</p>
                                        <button type="button" onClick={addAdditionalContact} className="flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors">
                                            <Plus size={16} />
                                            {t('sales.suppliers.add_new_contact')}
                                        </button>
                                    </div>

                                    {(formData.additionalContacts || []).length === 0 ? (
                                        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-400">
                                            <p className="text-sm">{t('sales.suppliers.no_additional_contacts')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {formData.additionalContacts.map((contact, index) => (
                                                <div key={index} className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50/50 group hover:border-indigo-100 transition-colors">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className="text-sm font-bold text-gray-600">#{index + 1}</h4>
                                                        <button type="button" onClick={() => removeAdditionalContact(index)} className="text-gray-400 hover:text-red-500 transition-colors" title={t('sales.common.delete')}><Trash2 size={16} /></button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <input
                                                                type="text"
                                                                placeholder={t('sales.suppliers.contact_name')}
                                                                value={contact.name}
                                                                onChange={(e) => handleAdditionalContactChange(index, 'name', e.target.value)}
                                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm ${errors[`additionalContact_${index}`] ? 'border-red-300' : 'border-gray-200'}`}
                                                            />
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="text"
                                                                placeholder={t('sales.suppliers.job_title')}
                                                                value={contact.title}
                                                                onChange={(e) => handleAdditionalContactChange(index, 'title', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="text"
                                                                placeholder={t('sales.suppliers.mobile')}
                                                                value={contact.phone}
                                                                onChange={(e) => handleAdditionalContactChange(index, 'phone', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="email"
                                                                placeholder={t('sales.suppliers.email')}
                                                                value={contact.email}
                                                                onChange={(e) => handleAdditionalContactChange(index, 'email', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className={`border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50 ${i18n.language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
                            >
                                {t('sales.common.cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                <span>{isEditing ? t('sales.common.save_changes') : t('sales.common.save')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
