import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, RefreshCw, X, Phone, MapPin, Mail, User, Building, FileText, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currencyFormatter';
import { prepareContactPayload } from '../../utils/contactUtils';

const Contacts = () => {
    const { t, i18n } = useTranslation();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeModule, setActiveModule] = useState('customer'); // 'customer' or 'supplier'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedContactId, setSelectedContactId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'individual',
        phone: '',
        email: '',
        address: '',
        taxNumber: '',
        commercialRecord: '',
        creditLimit: '',
        openingBalance: 0,
        notes: ''
    });

    const [errors, setErrors] = useState({});

    // Fetch Contacts
    const fetchContacts = async () => {
        setLoading(true);
        try {
            const endpoint = activeModule === 'customer' ? 'customers' : 'suppliers';
            const response = await api.get(`/contacts/${endpoint}`);
            setContacts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            // setContacts([]); // Don't clear on error, maybe show notification
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [activeModule]);

    // Filter contacts based on search
    const filteredContacts = useMemo(() => {
        return contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.phone && contact.phone.includes(searchTerm)) ||
            (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [contacts, searchTerm]);


    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    // Validate Form
    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = t('sales.common.required');
        // Phone is optional but if provided should be valid-ish? backend doesn't seem to enforce strict regex
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = i18n.language === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email';

        // Conditional validation based on type
        if (formData.type === 'commercial') {
            if (!formData.taxNumber || !formData.taxNumber.trim()) {
                newErrors.taxNumber = t('sales.common.required');
            }
            if (!formData.commercialRecord || !formData.commercialRecord.trim()) {
                newErrors.commercialRecord = t('sales.common.required');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Open Modal
    const openModal = (mode, contact = null) => {
        setModalMode(mode);
        if (mode === 'edit' && contact) {
            setSelectedContactId(contact._id);
            setFormData({
                name: contact.name || '',
                type: contact.type || 'individual',
                phone: contact.phone || '',
                email: contact.email || '',
                address: contact.address || '',
                taxNumber: contact.taxNumber || '',
                commercialRecord: contact.commercialRecord || '',
                creditLimit: contact.creditLimit || '',
                openingBalance: contact.openingBalance || 0,
                notes: contact.notes || ''
            });
        } else {
            setFormData({
                name: '',
                type: 'individual',
                phone: '',
                email: '',
                address: '',
                taxNumber: '',
                commercialRecord: '',
                creditLimit: '',
                openingBalance: 0,
                notes: ''
            });
        }
        setIsModalOpen(true);
        setErrors({});
    };

    // Handle Save (Add/Edit)
    const handleSave = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            let url, method;
            const endpoint = activeModule === 'customer' ? 'customers' : 'suppliers';

            if (modalMode === 'add') {
                url = `/contacts/${endpoint}`;
                method = 'POST';
            } else {
                url = `/contacts/${selectedContactId}`;
                method = 'PATCH';
            }

            // Adjust payload based on backend expectations
            // Backend expects 'type' to be sent if creating? The routes are split by type (/customers vs /suppliers)
            // But the controller might use req.body.type or default based on route.
            // Looking at backend code (which I can't see right now but assuming standard REST), 
            // usually separate endpoints imply type handling or we send type.
            // Let's send type just in case, though the route `/contacts/customers` calls `createCustomer` which likely sets type.
            // Actually, the previous code didn't send 'type', so the endpoint handles it.


            const payload = prepareContactPayload(formData);
            // activeModule is handled by the endpoint URL (/customers or /suppliers), so no need to send it in body if controller/route handles it.
            // But checking previous code, it was sending `type: activeModule`. This was likely wrong or mapped to something else? 
            // In backend routes validation, type enum is individual/commercial. contactSchema requires module enum customer/supplier.
            // The controller injects module. So we just need to send type (individual/commercial).

            // Clean payload is ready.

            await api({
                method,
                url,
                data: payload
            });

            alert(i18n.language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
            setIsModalOpen(false);
            fetchContacts();

        } catch (error) {
            console.error('Error saving contact:', error);
            const msg = error.response?.data?.message || (i18n.language === 'ar' ? 'حدث خطأ' : 'An error occurred');
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    // Handle Delete
    const handleDelete = async (id) => {
        if (!window.confirm(i18n.language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;

        try {
            await api.delete(`/contacts/${id}`);
            alert(i18n.language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully');
            fetchContacts();
        } catch (error) {
            console.error('Error deleting contact:', error);
            const msg = error.response?.data?.message || (i18n.language === 'ar' ? 'حدث خطأ في الحذف' : 'Error deleting');
            alert(msg);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>

            {/* Header / Tabs */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 pt-4">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveModule('customer')}
                            className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeModule === 'customer'
                                ? 'text-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t('sales.customers.title')}
                            {activeModule === 'customer' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveModule('supplier')}
                            className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeModule === 'supplier'
                                ? 'text-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t('purchases.suppliers.title')}
                            {activeModule === 'supplier' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => openModal('add')}
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto"
                    >
                        <Plus size={20} />
                        <span>{t('sales.common.add')}</span>
                    </button>

                    <div className="flex items-center gap-2 border-2 border-gray-100 rounded-xl px-4 py-2.5 bg-white flex-1 sm:w-80 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all">
                        <Search size={20} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('sales.common.search_filter')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full focus:outline-none text-sm font-medium bg-transparent"
                        />
                    </div>
                </div>

                <button
                    onClick={fetchContacts}
                    className={`p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all ${loading ? 'animate-spin text-indigo-600' : ''}`}
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-8">
                {loading && !contacts.length ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <User className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {t('sales.common.no_data')}
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6">
                            {activeModule === 'customer'
                                ? t('sales.customers.start_adding')
                                : t('purchases.suppliers.no_suppliers')}
                        </p>
                        <button
                            onClick={() => openModal('add')}
                            className="text-indigo-600 font-bold hover:underline"
                        >
                            {t('sales.common.add_new')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredContacts.map((contact) => (
                            <div key={contact._id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl">
                                        {contact.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openModal('edit', contact)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            {i18n.language === 'ar' ? 'تعديل' : 'Edit'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contact._id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            {i18n.language === 'ar' ? 'حذف' : 'Delete'}
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{contact.name}</h3>
                                <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                    <Building size={14} />
                                    {contact.commercialRecord || 'No Commercial Record'}
                                </p>

                                <div className="space-y-3 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Phone size={16} className="text-gray-400" />
                                        <span dir="ltr">{contact.phone || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Mail size={16} className="text-gray-400" />
                                        <span className="truncate">{contact.email || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <MapPin size={16} className="text-gray-400" />
                                        <span className="truncate">
                                            {typeof contact.address === 'object'
                                                ? (contact.address?.address1 || contact.address?.city || '-')
                                                : (contact.address || '-')}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {t('sales.customers.balance')}
                                    </span>
                                    <span className={`font-bold ${contact.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(contact.balance ?? 0, 'EGP')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-2xl font-black text-gray-900">
                                {modalMode === 'add'
                                    ? (activeModule === 'customer' ? t('sales.customers.add_customer') : t('purchases.suppliers.add_supplier'))
                                    : (activeModule === 'customer' ? t('sales.customers.edit_customer') : t('purchases.suppliers.edit_supplier'))
                                }
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            {t('sales.customers.name')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`w-full bg-gray-50 border-2 ${errors.name ? 'border-red-500' : 'border-gray-100'} rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all`}
                                            placeholder={t('sales.customers.name')}
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name}</p>}
                                    </div>

                                    {/* Contact Type Selector */}
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            {i18n.language === 'ar' ? 'نوع العميل' : 'Contact Type'}
                                        </label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value="individual"
                                                    checked={formData.type === 'individual'}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="font-bold text-gray-700">
                                                    {i18n.language === 'ar' ? 'فردي' : 'Individual'}
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value="commercial"
                                                    checked={formData.type === 'commercial'}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="font-bold text-gray-700">
                                                    {i18n.language === 'ar' ? 'تجاري' : 'Commercial'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            {t('sales.customers.phone')}
                                        </label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                            placeholder="05xxxxxxxx"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            {t('sales.customers.email')}
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`w-full bg-gray-50 border-2 ${errors.email ? 'border-red-500' : 'border-gray-100'} rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all`}
                                            placeholder="example@domain.com"
                                        />
                                        {errors.email && <p className="text-red-500 text-xs mt-1 font-bold">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            {t('sales.customers.tax_number')}
                                            {formData.type === 'commercial' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <input
                                            type="text"
                                            name="taxNumber"
                                            value={formData.taxNumber}
                                            onChange={handleInputChange}
                                            className={`w-full bg-gray-50 border-2 ${errors.taxNumber ? 'border-red-500' : 'border-gray-100'} rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all`}
                                            placeholder="3xxxxxxxxxxxxx"
                                        />
                                        {errors.taxNumber && <p className="text-red-500 text-xs mt-1 font-bold">{errors.taxNumber}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            {t('sales.customers.commercial_record')}
                                            {formData.type === 'commercial' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <input
                                            type="text"
                                            name="commercialRecord"
                                            value={formData.commercialRecord}
                                            onChange={handleInputChange}
                                            className={`w-full bg-gray-50 border-2 ${errors.commercialRecord ? 'border-red-500' : 'border-gray-100'} rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all`}
                                            placeholder="1xxxxxxxxx"
                                        />
                                        {errors.commercialRecord && <p className="text-red-500 text-xs mt-1 font-bold">{errors.commercialRecord}</p>}
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            {t('sales.customers.address')}
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute top-3.5 left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl pl-12 pr-4 py-3 font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                                placeholder={t('sales.customers.address')}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            {t('sales.customers.credit_limit')}
                                        </label>
                                        <input
                                            type="number"
                                            name="creditLimit"
                                            value={formData.creditLimit}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            {t('sales.customers.opening_balance')}
                                        </label>
                                        <input
                                            type="number"
                                            name="openingBalance"
                                            value={formData.openingBalance}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            {t('sales.common.notes')}
                                        </label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                                            placeholder={t('sales.common.notes')}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 rounded-xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-200 transition-all"
                                    >
                                        {t('sales.common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0"
                                    >
                                        {loading ? '...' : t('sales.common.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contacts;
