import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Plus, RefreshCw, X, Search, MoreVertical, Pencil, Minus, Eye, Check, Trash2, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currencyFormatter';
import ConfirmDeleteModal from '../../components/confirmdeletemodal';
import logError from '../../utils/logError';

export default function Customers() {
    const { t, i18n } = useTranslation();
    const { id: customerIdFromUrl } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCustomerId, setCurrentCustomerId] = useState(null);
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

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
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [viewFormData, setViewFormData] = useState(null);
    const [viewContactMethods, setViewContactMethods] = useState({ phone: true, email: true, address: true });
    const [isSavingView, setIsSavingView] = useState(false);

    const [contactMethods, setContactMethods] = useState({
        phone: true,
        email: true,
        address: true
    });
    const [searchTerm, setSearchTerm] = useState('');

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [responseMessage, setResponseMessage] = useState({ type: '', text: '' });

    // Fetch customers from API
    const fetchCustomers = async (page = 1, search = searchTerm) => {
        setLoading(true);
        try {
            const response = await api.get(`/contacts/customers?page=${page}&limit=${itemsPerPage}${search ? `&search=${search}` : ''}`);
            const data = response.data;
            setCustomers(data.contacts || []);
            const total = data.pagination?.total || (data.contacts?.length || 0);
            setTotalResults(total);
            setTotalPages(data.pagination?.totalPages || Math.ceil(total / itemsPerPage) || 1);
            setCurrentPage(page);
        } catch (error) {
            logError('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (customerIdFromUrl) {
            openViewModal({ _id: customerIdFromUrl });
        }
    }, [customerIdFromUrl]);

    useEffect(() => {
        if (location.state?.openAddModal) {
            openAddModal();
            // Clear state after handling
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const getCustomerById = async (id) => {
        setLoadingCustomer(true);
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

                setCurrentCustomerId(id);
                setIsEditing(true);
                setIsModalOpen(true);
            }
        } catch (error) {
            logError('Error fetching customer:', error);
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
                response = await api.patch(`/contacts/${currentCustomerId}`, dataToSend);
                result = response.data;
            } else {
                // Create new customer - POST request
                response = await api.post('/contacts/customers', dataToSend);
                result = response.data;
            }

            if (response.status !== 200 && response.status !== 201) {
                throw new Error(result.message || t('sales.common.error_message'));
            }

            // Dispatch event for real-time report updates
            if (isEditing && currentCustomerId) {
                window.dispatchEvent(new CustomEvent('customer-updated'));
            } else {
                window.dispatchEvent(new CustomEvent('customer-created'));
            }

            console.log('Customer saved successfully:', result);

            // Show success message
            setResponseMessage({
                type: 'success',
                text: result.message || t('sales.common.success_message')
            });

            // Refresh customer list
            fetchCustomers(currentPage);

            // Close modal and reset form after short delay
            setTimeout(() => {
                setIsModalOpen(false);
                resetForm();
            }, 1500);

        } catch (error) {
            logError('Error saving customer:', error);
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
        setSelectedCustomerId(customer._id);
        try {
            const res = await api.get(`/contacts/${customer._id}`);
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
                setViewContact(customer);
                const addr = customer.address || {};
                setViewFormData({
                    name: customer.name || '',
                    type: customer.type === 'commercial' ? 'commercial' : 'individual',
                    code: customer.code || '',
                    taxNumber: customer.taxNumber || '',
                    commercialRegister: customer.commercialRegister || '',
                    mobile: customer.mobile || '',
                    phone: customer.phone || '',
                    email: customer.email || '',
                    notes: customer.notes || '',
                    initialBalance: customer.initialBalance ?? 0,
                    address1: addr.address1 || '',
                    address2: addr.address2 || '',
                    city: addr.city || '',
                    neighborhood: addr.neighborhood || '',
                    province: addr.province || '',
                    zipCode: addr.zipCode || '',
                    country: addr.country || '',
                    additionalContacts: Array.isArray(customer.additionalContacts) ? customer.additionalContacts.map(ac => ({ name: ac.name || '', phone: ac.phone || '', email: ac.email || '', title: ac.title || '' })) : []
                });
            }
        } catch (err) {
            logError(err);
            setViewContact(customer);
        }
    };

    const handleRowClick = (customer) => {
        openViewModal(customer);
    };

    const handleDeleteClick = (customer) => {
        setCustomerToDelete(customer);
        setShowDeleteConfirm(true);
        setMenuOpenId(null);
    };

    const handleDeleteCustomer = async (id) => {
        try {
            const res = await api.delete(`/contacts/${id}`);
            const data = res.data;
            if (res.status === 200) {
                fetchCustomers();
                if (viewContact?._id === id) {
                    setViewContact(null);
                    setSelectedCustomerId(null);
                }
                if (selectedCustomerId === id) {
                    setSelectedCustomerId(null);
                }
            } else {
                alert(data.message || t('sales.common.error_message'));
            }
        } catch (err) {
            alert(t('sales.common.error_message'));
        }
        setShowDeleteConfirm(false);
        setCustomerToDelete(null);
    };

    const confirmDelete = () => {
        if (customerToDelete) {
            handleDeleteCustomer(customerToDelete._id);
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
                fetchCustomers();
            } else {
                alert(result.message || t('sales.common.error_message'));
            }
        } catch (err) {
            alert(t('sales.common.error_message'));
        } finally {
            setIsSavingView(false);
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

    const getTypeText = (type) => {
        if (i18n.language === 'ar') {
            return type === 'commercial' ? 'تجاري' : 'فردي';
        }
        return type === 'commercial' ? 'Commercial' : 'Individual';
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
                        <div className="flex items-center gap-2 border border-gray-200 bg-gray-50 text-gray-500 px-4 py-2 rounded-lg hover:bg-white hover:border-indigo-300 transition-all min-w-[200px]">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder={t('sales.common.search_filter')}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    fetchCustomers(1, e.target.value);
                                }}
                                className={`w-full bg-transparent focus:outline-none text-sm text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Left Side: Title & Navigation */}
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => fetchCustomers(1, searchTerm)}
                        disabled={loading}
                        className={`p-2 text-gray-400 hover:text-indigo-600 transition-all rounded-full hover:bg-gray-50 ${loading ? 'animate-spin' : ''}`}
                        title={t('sales.common.refresh')}
                    >
                        <RefreshCw size={18} />
                    </button>

                    <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

                    <div className="flex items-center gap-2 text-gray-800">
                        <h1 className="text-lg font-bold">{t('sales.customers.title')}</h1>
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
                ) : customers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="text-6xl mb-4">👥</div>
                        <p className="text-lg font-medium">{t('sales.customers.no_customers')}</p>
                        <p className="text-sm">{t('sales.customers.start_creating')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-white">
                                <tr>
                                    <th className={`px-6 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-sm font-bold text-gray-500`}>{t('sales.customers.name')}</th>
                                    <th className={`px-6 py-4 text-center text-sm font-bold text-gray-500`}>{t('sales.customers.balance')}</th>
                                    <th className="px-6 py-4 w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {customers.map((customer) => (
                                    <tr
                                        key={customer._id}
                                        onClick={() => handleRowClick(customer)}
                                        className={`cursor-pointer transition-all hover:bg-gray-50 group border-b border-gray-50 last:border-0`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs ring-4 ring-white">
                                                    {customer.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-800">{customer.name}</div>
                                                    <div className="text-xs text-gray-400 font-medium mt-0.5">#{customer.code || customer._id?.slice(-6)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset ${(customer.currentBalance ?? customer.initialBalance ?? 0) < 0 ? 'bg-red-50 text-red-700 ring-red-600/10' : 'bg-green-50 text-green-700 ring-green-600/20'}`}>
                                                {(customer.currentBalance ?? customer.initialBalance ?? 0) !== 0
                                                    ? formatCurrency(Math.abs(customer.currentBalance ?? customer.initialBalance ?? 0), customer.currency || 'EGP')
                                                    : '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-end relative" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => setMenuOpenId(menuOpenId === customer._id ? null : customer._id)}
                                                className={`p-2 rounded-lg transition-colors ${menuOpenId === customer._id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {menuOpenId === customer._id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                                                    <div className={`absolute top-full mt-1 ${i18n.language === 'ar' ? 'left-0' : 'right-0'} z-20 w-40 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 py-1 overflow-hidden ring-1 ring-black/5`}>
                                                        <button type="button" onClick={() => { openViewModal(customer); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-start text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                                                            <Eye size={16} />
                                                            {t('sales.common.view')}
                                                        </button>
                                                        <button type="button" onClick={() => { getCustomerById(customer._id); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-start text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                                                            <Pencil size={16} />
                                                            {t('sales.common.edit')}
                                                        </button>
                                                        <div className="h-px bg-gray-50 my-1"></div>
                                                        <button type="button" onClick={() => handleDeleteClick(customer)} className="flex items-center gap-3 w-full px-4 py-2.5 text-start text-sm text-red-600 hover:bg-red-50 transition-colors">
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

                        {/* Pagination (Static for now as per code structure, but styling to match) */}
                        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex items-center justify-between">
                            <div className="text-xs text-gray-500 font-medium">
                                {t('sales.common.showing')} <span className="font-bold text-gray-800">{totalResults}</span> {t('sales.common.results')}
                            </div>
                            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => fetchCustomers(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                    className="px-4 py-2 text-gray-600 text-xs font-bold border-e border-gray-100 hover:bg-gray-50 disabled:opacity-50 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {t('sales.common.prev')}
                                </button>
                                <div className="px-4 py-2 text-gray-400 text-xs font-bold border-e border-gray-100 bg-gray-50/50">
                                    {currentPage} / {totalPages}
                                </div>
                                <button
                                    onClick={() => fetchCustomers(currentPage + 1)}
                                    disabled={currentPage === totalPages || loading}
                                    className="px-4 py-2 text-gray-600 text-xs font-bold hover:bg-gray-50 disabled:opacity-50 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {t('sales.common.next')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* View Customer Modal - with tabs Summary / Invoices / Payments */}
            {viewContact && viewFormData && (() => {
                return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className={`text-xl font-bold text-gray-800 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.view_customer')}</h2>
                                <button type="button" onClick={() => { setViewContact(null); setViewFormData(null); setViewTab('summary'); setSelectedCustomerId(null); if (customerIdFromUrl) navigate('/dashboard/sales/customers'); }} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
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
                                        {(viewContact.currentBalance ?? viewContact.initialBalance ?? 0) !== 0 ? formatCurrency(viewContact.currentBalance ?? viewContact.initialBalance ?? 0, viewContact.currency || 'EGP') : '—'}
                                    </p>
                                </div>
                                <div className={`text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.customers.account_statement')}</p>
                                    <p className="text-sm font-bold text-gray-800">#{viewContact.code || viewContact._id?.slice(-6)} {viewContact.name}</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                {viewTab === 'summary' && viewFormData && (
                                    <form className="space-y-6">
                                        {/* Type - Radio buttons */}
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.type')}</label>
                                            <div className="flex gap-4 flex-wrap">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="viewType" value="individual" checked={viewFormData.type === 'individual'} onChange={(e) => setViewFormData({ ...viewFormData, type: e.target.value })} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                                    <span className="text-sm">{t('sales.customers.individual')}</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="viewType" value="commercial" checked={viewFormData.type === 'commercial'} onChange={(e) => setViewFormData({ ...viewFormData, type: e.target.value })} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                                    <span className="text-sm">{t('sales.customers.commercial')}</span>
                                                </label>
                                            </div>
                                        </div>
                                        {/* Code & Name */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div>
                                                <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.customer_code')}</label>
                                                <input type="text" name="code" value={viewFormData.code} onChange={handleViewFormChange} readOnly className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm" />
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.customer_name')} <span className="text-red-500">*</span></label>
                                                <input type="text" name="name" value={viewFormData.name} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                            </div>
                                        </div>
                                        {/* Tax Number & Commercial Register - only for Commercial */}
                                        {viewFormData.type === 'commercial' && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.tax_number')} <span className="text-red-500">*</span></label>
                                                    <input type="text" name="taxNumber" value={viewFormData.taxNumber} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.commercial_register')} <span className="text-red-500">*</span></label>
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
                                            <label className={`block text-sm font-semibold text-gray-700 mb-3 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.contact_methods')}</label>
                                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                                <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" aria-label="Edit"><Pencil size={18} /></button>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={viewContactMethods.phone} onChange={() => handleViewContactMethodChange('phone')} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                                    <span className="text-sm">{t('sales.customers.phone')}</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={viewContactMethods.email} onChange={() => handleViewContactMethodChange('email')} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                                    <span className="text-sm">{t('sales.customers.email')}</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={viewContactMethods.address} onChange={() => handleViewContactMethodChange('address')} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                                    <span className="text-sm">{t('sales.customers.address')}</span>
                                                </label>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.phone')}</label>
                                                    <input type="text" name="phone" value={viewFormData.phone} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.mobile')}</label>
                                                    <input type="text" name="mobile" value={viewFormData.mobile} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.email')}</label>
                                                    <input type="email" name="email" value={viewFormData.email} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.address1')}</label>
                                                    <input type="text" name="address1" value={viewFormData.address1} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.address2')}</label>
                                                    <input type="text" name="address2" value={viewFormData.address2} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.city')}</label>
                                                    <input type="text" name="city" value={viewFormData.city} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.neighborhood')}</label>
                                                    <input type="text" name="neighborhood" value={viewFormData.neighborhood} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.province')}</label>
                                                    <input type="text" name="province" value={viewFormData.province} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.zip_code')}</label>
                                                    <input type="text" name="zipCode" value={viewFormData.zipCode} onChange={handleViewFormChange} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.country')}</label>
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
                                            <p className={`text-base font-semibold text-gray-700 mb-3 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.additional_contacts')}</p>
                                            {(viewFormData.additionalContacts || []).map((ac, index) => (
                                                <div key={index} className="flex flex-wrap items-start gap-3 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                                    <button type="button" onClick={() => {
                                                        const updated = viewFormData.additionalContacts.filter((_, i) => i !== index);
                                                        setViewFormData({ ...viewFormData, additionalContacts: updated });
                                                    }} className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600" aria-label="Remove"><Minus size={16} /></button>
                                                    <div className="flex-1 min-w-[200px]">
                                                        <label className={`block text-sm font-semibold text-gray-700 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.customers.contact_name')}</label>
                                                        <input type="text" value={ac.name} onChange={(e) => {
                                                            const list = [...viewFormData.additionalContacts];
                                                            list[index] = { ...list[index], name: e.target.value };
                                                            setViewFormData({ ...viewFormData, additionalContacts: list });
                                                        }} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg" placeholder={t('sales.customers.contact_name')} />
                                                    </div>
                                                    <div className="flex gap-4 flex-wrap">
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded" readOnly checked /><span className="text-sm">{t('sales.customers.phone')}</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded" readOnly /><span className="text-sm">{t('sales.customers.email')}</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded" readOnly /><span className="text-sm">{t('sales.customers.address')}</span></label>
                                                    </div>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => setViewFormData({ ...viewFormData, additionalContacts: [...(viewFormData.additionalContacts || []), { name: '', phone: '', email: '', title: '' }] })} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                                                <Plus size={18} />
                                                {t('sales.customers.add_new_contact')}
                                            </button>
                                        </div>
                                    </form>
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
                                <button type="button" onClick={() => { setViewContact(null); setViewFormData(null); setSelectedCustomerId(null); setViewTab('summary'); if (customerIdFromUrl) navigate('/dashboard/sales/customers'); }} className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold">
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

            <ConfirmDeleteModal
                isOpen={showDeleteConfirm && !!customerToDelete}
                onClose={() => { setShowDeleteConfirm(false); setCustomerToDelete(null); }}
                onConfirm={confirmDelete}
                title={t('sales.common.confirm_delete')}
                message={
                    customerToDelete
                        ? `${t('sales.common.confirm_delete')} #${customerToDelete.code || customerToDelete._id?.slice(-6)} ${customerToDelete.name}?`
                        : t('sales.common.confirm_delete')
                }
            />

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
