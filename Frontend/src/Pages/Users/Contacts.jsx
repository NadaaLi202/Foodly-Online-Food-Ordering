import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Search,
    RefreshCw,
    X,
    Users as UsersIcon,
    Mail,
    Phone,
    Building2,
    Edit,
    Trash2,
    UserCircle,
    Hash,
    DollarSign
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Contacts = () => {
    const { t, i18n } = useTranslation();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedContactId, setSelectedContactId] = useState(null);
    const [activeModule, setActiveModule] = useState('customer'); // 'customer' or 'supplier'
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        type: 'individual',
        code: '',
        taxNumber: '',
        commercialRegister: '',
        phone: '',
        mobile: '',
        alternativePhone: '',
        email: '',
        address: {
            address1: '',
            address2: '',
            neighborhood: '',
            city: '',
            province: '',
            zipCode: '',
            country: ''
        },
        initialBalance: 0,
        creditLimit: 0,
        notes: '',
        isActive: true
    });

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const endpoint = activeModule === 'customer' ? 'customers' : 'suppliers';
            const response = await fetch(`http://localhost:4000/api/v1/contacts/${endpoint}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setContacts(data.contacts || []);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [activeModule]);

    const handleOpenModal = (mode, contact = null) => {
        setModalMode(mode);
        if (mode === 'edit' && contact) {
            setSelectedContactId(contact._id);
            setFormData({
                name: contact.name || '',
                type: contact.type || 'individual',
                code: contact.code || '',
                taxNumber: contact.taxNumber || '',
                commercialRegister: contact.commercialRegister || '',
                phone: contact.phone || '',
                mobile: contact.mobile || '',
                alternativePhone: contact.alternativePhone || '',
                email: contact.email || '',
                address: {
                    address1: contact.address?.address1 || '',
                    address2: contact.address?.address2 || '',
                    neighborhood: contact.address?.neighborhood || '',
                    city: contact.address?.city || '',
                    province: contact.address?.province || '',
                    zipCode: contact.address?.zipCode || '',
                    country: contact.address?.country || ''
                },
                initialBalance: contact.initialBalance || 0,
                creditLimit: contact.creditLimit || 0,
                notes: contact.notes || '',
                isActive: contact.isActive !== undefined ? contact.isActive : true
            });
        } else {
            setSelectedContactId(null);
            setFormData({
                name: '',
                type: 'individual',
                code: '',
                taxNumber: '',
                commercialRegister: '',
                phone: '',
                mobile: '',
                alternativePhone: '',
                email: '',
                address: {
                    address1: '',
                    address2: '',
                    neighborhood: '',
                    city: '',
                    province: '',
                    zipCode: '',
                    country: ''
                },
                initialBalance: 0,
                creditLimit: 0,
                notes: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let url, method;
            if (modalMode === 'add') {
                const endpoint = activeModule === 'customer' ? 'customers' : 'suppliers';
                url = `http://localhost:4000/api/v1/contacts/${endpoint}`;
                method = 'POST';
            } else {
                url = `http://localhost:4000/api/v1/contacts/${selectedContactId}`;
                method = 'PATCH';
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchContacts();
            } else {
                const error = await response.json();
                alert(error.message || t('sales.common.error_message'));
            }
        } catch (error) {
            console.error('Error saving contact:', error);
            alert(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('sales.common.confirm_delete', 'Are you sure you want to delete?'))) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:4000/api/v1/contacts/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) fetchContacts();
        } catch (error) {
            console.error('Error deleting contact:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredContacts = useMemo(() => {
        return contacts.filter(c =>
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm)
        );
    }, [contacts, searchTerm]);

    return (
        <div className="min-h-screen bg-[#F8FAFC]" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <UsersIcon size={24} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {activeModule === 'customer' ? t('sidebar.customers', 'Customers') : t('sidebar.suppliers', 'Suppliers')}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Module Toggle */}
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setActiveModule('customer')}
                                className={`px-4 py-2 rounded-md font-semibold transition-all ${activeModule === 'customer'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {t('sidebar.customers', 'Customers')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveModule('supplier')}
                                className={`px-4 py-2 rounded-md font-semibold transition-all ${activeModule === 'supplier'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {t('sidebar.suppliers', 'Suppliers')}
                            </button>
                        </div>

                        <div className="relative group hidden sm:block">
                            <Search className={`absolute ${i18n.language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors`} size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('sales.common.search_filter')}
                                className={`pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-64 text-${i18n.language === 'ar' ? 'right' : 'left'} ${i18n.language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => handleOpenModal('add')}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-100 group"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>{t('sales.common.add')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={fetchContacts}
                            className={`p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all bg-white ${loading ? 'animate-spin' : ''}`}
                            title={t('sales.common.refresh')}
                        >
                            <RefreshCw size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {loading && contacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-4">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-medium">{i18n.language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm">
                        <div className="inline-flex p-6 bg-indigo-50 text-indigo-200 rounded-full mb-6">
                            <UsersIcon size={64} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {activeModule === 'customer' ? t('sales.customers.no_customers', 'No customers found') : t('sales.suppliers.no_suppliers', 'No suppliers found')}
                        </h3>
                        <p className="text-gray-500 mb-8">
                            {activeModule === 'customer' ? t('sales.customers.start_creating', 'Start by creating your first customer') : t('sales.suppliers.start_creating', 'Start by creating your first supplier')}
                        </p>
                        <button
                            type="button"
                            onClick={() => handleOpenModal('add')}
                            className="text-indigo-600 font-semibold hover:underline flex items-center gap-2 mx-auto justify-center"
                        >
                            <Plus size={18} /> {t('sales.common.add')}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#FBFCFE] border-b border-gray-200">
                                    <tr>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.name', 'Name')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.type', 'Type')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.code', 'Code')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.phone', 'Phone')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.email', 'Email')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.balance', 'Balance')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-600">
                                    {filteredContacts.map((contact) => (
                                        <tr key={contact._id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <UserCircle size={16} className="text-gray-400" />
                                                    {contact.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${contact.type === 'commercial' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                                    }`}>
                                                    <Building2 size={12} />
                                                    {contact.type === 'commercial' ? t('sales.common.commercial', 'Commercial') : t('sales.common.individual', 'Individual')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Hash size={14} className="text-gray-400" />
                                                    {contact.code || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-gray-400" />
                                                    {contact.phone || contact.mobile || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className="text-gray-400" />
                                                    {contact.email || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign size={14} className="text-gray-400" />
                                                    {contact.currentBalance?.toLocaleString() || '0'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenModal('edit', contact)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title={t('sales.common.update')}
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(contact._id)}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title={t('sales.common.delete')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300 my-8">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                                    <UsersIcon size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {modalMode === 'add'
                                        ? (activeModule === 'customer' ? t('sales.customers.add_customer', 'Add Customer') : t('sales.suppliers.add_supplier', 'Add Supplier'))
                                        : (activeModule === 'customer' ? t('sales.customers.edit_customer', 'Edit Customer') : t('sales.suppliers.edit_supplier', 'Edit Supplier'))
                                    }
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.name', 'Name')} *</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        placeholder={t('sales.common.name', 'Name')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.type', 'Type')}</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                    >
                                        <option value="individual">{t('sales.common.individual', 'Individual')}</option>
                                        <option value="commercial">{t('sales.common.commercial', 'Commercial')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.code', 'Code')}</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        placeholder={t('sales.common.code', 'Code')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.tax_number', 'Tax Number')}</label>
                                    <input
                                        type="text"
                                        value={formData.taxNumber}
                                        onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        placeholder={t('sales.common.tax_number', 'Tax Number')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.commercial_register', 'Commercial Register')}</label>
                                    <input
                                        type="text"
                                        value={formData.commercialRegister}
                                        onChange={(e) => setFormData({ ...formData, commercialRegister: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        placeholder={t('sales.common.commercial_register', 'Commercial Register')}
                                    />
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sales.common.contact_info', 'Contact Information')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.phone', 'Phone')}</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                            placeholder={t('sales.common.phone', 'Phone')}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.mobile', 'Mobile')}</label>
                                        <input
                                            type="tel"
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                            className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                            placeholder={t('sales.common.mobile', 'Mobile')}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.email', 'Email')}</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sales.common.address', 'Address')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.address1', 'Address Line 1')}</label>
                                        <input
                                            type="text"
                                            value={formData.address.address1}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, address1: e.target.value } })}
                                            className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.city', 'City')}</label>
                                        <input
                                            type="text"
                                            value={formData.address.city}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                            className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.country', 'Country')}</label>
                                        <input
                                            type="text"
                                            value={formData.address.country}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                                            className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Financial Information */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sales.common.financial_info', 'Financial Information')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.initial_balance', 'Initial Balance')}</label>
                                        <input
                                            type="number"
                                            value={formData.initialBalance}
                                            onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
                                            className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.credit_limit', 'Credit Limit')}</label>
                                        <input
                                            type="number"
                                            value={formData.creditLimit}
                                            onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                                            className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="border-t pt-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('sales.common.notes', 'Notes')}</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'} resize-none`}
                                    placeholder={t('sales.common.notes', 'Notes')}
                                />
                            </div>

                            <div className="flex gap-4 pt-4 sticky bottom-0 bg-white border-t pb-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 p-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    {t('sales.common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 p-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all disabled:opacity-50"
                                >
                                    {loading ? '...' : t('sales.common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contacts;
