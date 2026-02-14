import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, X, Upload, ChevronDown, ArrowLeftRight, Package, Trash2, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const Operations = () => {
    const { t, i18n } = useTranslation();
    const [operations, setOperations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'inventory', 'operations'
    const [operationType, setOperationType] = useState(''); // 'add', 'withdraw', 'transfer'
    const [showOperationDropdown, setShowOperationDropdown] = useState(false);
    const [errors, setErrors] = useState({});
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [inventoryOps, setInventoryOps] = useState([]);
    const [editingOperation, setEditingOperation] = useState(null);

    const [formData, setFormData] = useState({
        warehouse: '',
        toWarehouse: '', // for transfer
        account: '',
        date: new Date().toISOString().split('T')[0],
        items: [{ product: '', quantity: '' }],
        description: '',
        attachments: [],
        total: ''
    });

    // Fetch operations from API
    const fetchOperations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/operations');
            setOperations(response.data.operations || []);
        } catch (error) {
            console.error('Error fetching operations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventoryOps = async () => {
        setLoading(true);
        try {
            const response = await api.get('/inventory-operations');
            setInventoryOps(response.data.operations || []);
        } catch (error) {
            console.error('Error fetching inventory operations:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch products
    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    // Fetch warehouses
    const fetchWarehouses = async () => {
        try {
            const response = await api.get('/warehouses');
            setWarehouses(response.data.warehouses || [
                { _id: 'main', name: i18n.language === 'ar' ? 'المستودع الرئيسي' : 'Main Warehouse' }
            ]);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
            setWarehouses([
                { _id: 'main', name: i18n.language === 'ar' ? 'المستودع الرئيسي' : 'Main Warehouse' }
            ]);
        }
    };

    // Fetch accounts
    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data.accounts || [
                { _id: '1211', name: i18n.language === 'ar' ? 'الخزنة الرئيسية' : 'Main Treasury', code: '#1211' },
                { _id: '1221', name: i18n.language === 'ar' ? 'الحساب البنكي الرئيسي' : 'Main Bank Account', code: '#1221' },
                { _id: '1251', name: i18n.language === 'ar' ? 'المستودع الرئيسي' : 'Main Warehouse', code: '#1251' }
            ]);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            setAccounts([
                { _id: '1211', name: i18n.language === 'ar' ? 'الخزنة الرئيسية' : 'Main Treasury', code: '#1211' },
                { _id: '1221', name: i18n.language === 'ar' ? 'الحساب البنكي الرئيسي' : 'Main Bank Account', code: '#1221' },
                { _id: '1251', name: i18n.language === 'ar' ? 'المستودع الرئيسي' : 'Main Warehouse', code: '#1251' }
            ]);
        }
    };

    useEffect(() => {
        fetchOperations();
        fetchInventoryOps();
        fetchProducts();
        fetchWarehouses();
        fetchAccounts();
    }, []);

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.warehouse) {
            newErrors.warehouse = `${t('stocked.operations.warehouse')} ${t('sales.common.required')}`;
        }

        if (operationType === 'transfer' && !formData.toWarehouse) {
            newErrors.toWarehouse = `${t('stocked.operations.to_warehouse')} ${t('sales.common.required')}`;
        }

        if (formData.items.length === 0 || !formData.items[0].product) {
            newErrors.items = `${t('stocked.operations.product')} ${t('sales.common.required')}`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    // Handle item changes
    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    // Add item
    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { product: '', quantity: '' }]
        });
    };

    // Remove item
    const removeItem = (index) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }
    };

    // Handle file upload
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setFormData({
            ...formData,
            attachments: [...formData.attachments, ...files]
        });
    };

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        setFormData({
            ...formData,
            attachments: [...formData.attachments, ...files]
        });
    };

    // Remove attachment
    const removeAttachment = (index) => {
        const newAttachments = formData.attachments.filter((_, i) => i !== index);
        setFormData({ ...formData, attachments: newAttachments });
    };

    // Open modal with operation type
    const openModal = (type) => {
        setOperationType(type);
        setShowOperationDropdown(false);
        setIsModalOpen(true);
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            alert(i18n.language === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
            return;
        }

        setLoading(true);

        try {
            // Map frontend types to backend operation strings
            const typeMap = {
                'add': 'stock add process',
                'withdraw': 'inventory exchange process',
                'transfer': 'transfer process',
                'inventory_op': 'inventory operation'
            };

            // Step 1: Always Create the top-level Operation record first to get a shared ID
            let operationId;
            let uploadedAttachments = [];

            if (formData.attachments && formData.attachments.length > 0) {
                // If there are files, use FormData
                const operationFormData = new FormData();
                operationFormData.append('type', typeMap[operationType]);
                operationFormData.append('warehouse', formData.warehouse);
                operationFormData.append('date', formData.date);
                operationFormData.append('description', formData.description);
                if (formData.account) operationFormData.append('account', formData.account);
                if (formData.total) operationFormData.append('totalAmount', formData.total);

                formData.attachments.forEach(file => {
                    operationFormData.append('attachments', file);
                });

                console.log('Creating operation with FormData (files present)');
                const opResponse = await api.post('/operations', operationFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                operationId = opResponse.data.operation._id;
                uploadedAttachments = opResponse.data.operation.attachments || [];
            } else {
                // If NO files, use JSON for simplicity
                const operationPayload = {
                    type: typeMap[operationType],
                    warehouse: formData.warehouse,
                    date: formData.date,
                    description: formData.description,
                    account: formData.account,
                    totalAmount: formData.total
                };

                console.log('Creating operation with JSON (no files)');
                const opResponse = await api.post('/operations', operationPayload);
                operationId = opResponse.data.operation._id;
            }

            console.log('Operation created with ID:', operationId, 'Attachments:', uploadedAttachments);

            // Step 2: Handle specialized record creation based on type
            if (operationType === 'add') {
                // Stock Add Logic: 1 stockAdd + N stockAddItem
                const stockAddPayload = {
                    operation: operationId,
                    warehouse: formData.warehouse,
                    account: formData.account || '',
                    date: formData.date,
                    description: formData.description,
                    totalAmount: formData.total || 0,
                    attachments: uploadedAttachments // Pass the already uploaded attachments
                };

                console.log('Creating stockAdd:', stockAddPayload);
                const saResponse = await api.post('/stockAdd', stockAddPayload);
                const stockAddId = saResponse.data.stockAdd._id;

                for (const item of formData.items) {
                    if (item.product && item.quantity) {
                        await api.post('/stockAdd/item', {
                            stockAdd: stockAddId,
                            product: item.product,
                            quantity: Number(item.quantity),
                            unitCost: 0
                        });
                    }
                }
            } else if (operationType === 'withdraw') {
                // Inventory Exchange Logic: N flat inventory-exchange records
                for (const item of formData.items) {
                    if (item.product && item.quantity) {
                        const exchangePayload = {
                            operation: operationId,
                            warehouse: formData.warehouse,
                            product: item.product,
                            quantity: Number(item.quantity),
                            account: formData.account || '',
                            date: formData.date,
                            description: formData.description,
                            totalAmount: 0,
                            attachments: uploadedAttachments
                        };
                        console.log('Creating inventory-exchange:', exchangePayload);
                        await api.post('/inventory-exchange', exchangePayload);
                    }
                }
            } else if (operationType === 'transfer') {
                // Transfer Process Logic: N flat transfer-process records
                for (const item of formData.items) {
                    if (item.product && item.quantity) {
                        const transferPayload = {
                            operation: operationId,
                            fromWarehouse: formData.warehouse,
                            toWarehouse: formData.toWarehouse,
                            product: item.product,
                            quantity: Number(item.quantity),
                            account: formData.account || '',
                            date: formData.date,
                            description: formData.description,
                            attachments: uploadedAttachments
                        };
                        console.log('Creating transfer-process:', transferPayload);
                        await api.post('/transfer-process', transferPayload);
                    }
                }
            } else if (operationType === 'inventory_op') {
                // Inventory Operation Logic
                const invOpPayload = {
                    operation: operationId,
                    warehouse: formData.warehouse,
                    date: formData.date,
                    description: formData.description,
                    items: formData.items.map(item => ({
                        product: item.product,
                        quantity: Number(item.quantity)
                    })),
                    attachments: uploadedAttachments
                };
                console.log('Creating inventory-operation:', invOpPayload);
                await api.post('/inventory-operations', invOpPayload);
            }

            // Success feedback
            alert(i18n.language === 'ar'
                ? (editingOperation ? 'تم تحديث العملية بنجاح!' : 'تم إضافة العملية بنجاح!')
                : (editingOperation ? 'Operation updated successfully!' : 'Operation added successfully!'));

            setIsModalOpen(false);
            fetchOperations();
            fetchInventoryOps();
            resetForm();
        } catch (error) {
            console.error('Error creating operation:', error);
            const errorMsg = error.response?.data?.message || error.message || (i18n.language === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر' : 'Server connection error');
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };


    const handleEdit = (operation) => {
        setEditingOperation(operation);
        const typeMap = {
            'stock add process': 'add',
            'inventory exchange process': 'withdraw',
            'transfer process': 'transfer',
            'inventory operation': 'inventory_op'
        };
        const type = typeMap[operation.type] || 'add';
        setOperationType(type);

        setFormData({
            warehouse: operation.warehouse?._id || operation.warehouse || '',
            toWarehouse: operation.toWarehouse || '',
            date: new Date(operation.date).toISOString().slice(0, 16),
            description: operation.description || '',
            account: operation.account || '',
            total: operation.totalAmount || 0,
            items: operation.items || [{ product: '', quantity: 1 }],
            attachments: []
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm(i18n.language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;

        setLoading(true);
        try {
            let endpoint = 'operations';
            if (activeTab === 'operations') endpoint = 'inventory-operations';

            const response = await api.delete(`/${endpoint}/${id}`);

            if (response.status === 200) {
                alert(i18n.language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully');
                activeTab === 'operations' ? fetchInventoryOps() : fetchOperations();
            } else {
                alert(i18n.language === 'ar' ? 'فشل الحذف' : 'Deletion failed');
            }
        } catch (error) {
            console.error('Error deleting operation:', error);
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            warehouse: '',
            toWarehouse: '',
            account: '',
            date: new Date().toISOString().split('T')[0],
            items: [{ product: '', quantity: '' }],
            description: '',
            attachments: [],
            total: ''
        });
        setOperationType('');
        setErrors({});
    };

    // Get modal title based on operation type
    const getModalTitle = () => {
        switch (operationType) {
            case 'add':
                return t('stocked.operations.add_inventory_operation');
            case 'withdraw':
                return t('stocked.operations.withdraw_inventory_operation');
            case 'transfer':
                return t('stocked.operations.transfer_operation');
            default:
                return t('stocked.operations.add_operation');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    {/* Add Button with Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowOperationDropdown(!showOperationDropdown)}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                        >
                            <Plus size={20} />
                            <span>{t('sales.common.add')}</span>
                            <ChevronDown size={16} />
                        </button>

                        {showOperationDropdown && (
                            <div className={`absolute top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 ${i18n.language === 'ar' ? 'right-0' : 'left-0'}`}>
                                <button
                                    onClick={() => openModal('add')}
                                    className={`w-full px-4 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-100`}
                                >
                                    {t('stocked.operations.add_inventory_operation')}
                                </button>
                                <button
                                    onClick={() => openModal('withdraw')}
                                    className={`w-full px-4 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-100`}
                                >
                                    {t('stocked.operations.withdraw_inventory_operation')}
                                </button>
                                <button
                                    onClick={() => openModal('transfer')}
                                    className={`w-full px-4 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-100`}
                                >
                                    {t('stocked.operations.transfer_operation')}
                                </button>
                                <button
                                    onClick={() => openModal('inventory_op')}
                                    className={`w-full px-4 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} hover:bg-gray-50 text-sm text-gray-700`}
                                >
                                    {i18n.language === 'ar' ? 'عملية جرد' : 'Inventory Operation'}
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={fetchOperations}
                        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Search size={18} />
                        <span className="hidden sm:inline">{t('sales.common.search_filter')}</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50 w-full sm:w-auto overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Package size={16} />
                        <span>{t('stocked.operations.inventory')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('operations')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'operations' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <ArrowLeftRight size={16} />
                        <span>{t('stocked.operations.inventory_operations')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'stock' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Package size={16} />
                        <span>{t('stocked.operations.stock')}</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
                {loading && !isModalOpen ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : operations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-lg font-medium text-center">
                            <span className="text-yellow-500">⚠️</span> {t('stocked.operations.no_operations')}
                        </p>
                        <p className="text-sm">{t('stocked.operations.no_operations_yet')}</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={`px-4 sm:px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('stocked.operations.type')}</th>
                                    <th className={`px-4 sm:px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('stocked.operations.warehouse')}</th>
                                    <th className={`px-4 sm:px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('stocked.operations.date')}</th>
                                    <th className={`px-4 sm:px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('stocked.operations.products')}</th>
                                    <th className={`px-4 sm:px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('sales.common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(activeTab === 'operations' ? inventoryOps : operations).map((operation) => (
                                    <tr key={operation._id} className="hover:bg-gray-50">
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {activeTab === 'operations' ? (i18n.language === 'ar' ? 'عملية جرد' : 'Inventory Operation') : (
                                                <>
                                                    {operation.type === 'add' && t('stocked.operations.add_inventory_operation')}
                                                    {operation.type === 'withdraw' && t('stocked.operations.withdraw_inventory_operation')}
                                                    {operation.type === 'transfer' && t('stocked.operations.transfer_operation')}
                                                </>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {operation.warehouse?.name || (typeof operation.warehouse === 'string' ? operation.warehouse : '-')}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(operation.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                {operation.items?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(operation)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title={t('sales.common.edit')}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(operation._id)}
                                                    className="text-red-600 hover:text-red-900"
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
                )}
            </div>

            {/* Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-800">{getModalTitle()}</h2>
                                <button
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Body - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                    {/* Row 1: Warehouse, Account, Date */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* From Warehouse */}
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {operationType === 'transfer' ? t('stocked.operations.from_warehouse') : t('stocked.operations.warehouse')} <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="warehouse"
                                                value={formData.warehouse}
                                                onChange={handleInputChange}
                                                className={`w-full border-2 ${errors.warehouse ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-green-500 bg-white`}
                                            >
                                                <option value="">{t('stocked.operations.select_warehouse')}</option>
                                                {warehouses.map((wh) => (
                                                    <option key={wh._id} value={wh._id}>{wh.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* To Warehouse (for transfer) */}
                                        {operationType === 'transfer' && (
                                            <div>
                                                <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                    {t('stocked.operations.to_warehouse')} <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="toWarehouse"
                                                    value={formData.toWarehouse}
                                                    onChange={handleInputChange}
                                                    className={`w-full border-2 ${errors.toWarehouse ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-green-500 bg-white`}
                                                >
                                                    <option value="">{t('stocked.operations.select_warehouse')}</option>
                                                    {warehouses.map((wh) => (
                                                        <option key={wh._id} value={wh._id}>{wh.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Account (for add operation) */}
                                        {operationType === 'add' && (
                                            <div>
                                                <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                    {t('stocked.operations.account')}
                                                </label>
                                                <select
                                                    name="account"
                                                    value={formData.account}
                                                    onChange={handleInputChange}
                                                    className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-green-500 bg-white`}
                                                >
                                                    <option value="">{t('stocked.operations.select_account')}</option>
                                                    {accounts.map((acc) => (
                                                        <option key={acc._id} value={acc._id}>{acc.name} {acc.code}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Date */}
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('stocked.operations.date')}
                                            </label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                                className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-green-500`}
                                            />
                                        </div>
                                    </div>

                                    {/* Products Section */}
                                    <div>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                                            <label className={`text-sm font-semibold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('stocked.operations.product')} <span className="text-red-500">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={addItem}
                                                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm"
                                            >
                                                <Plus size={14} />
                                                {t('stocked.operations.add_product')}
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {formData.items.map((item, index) => (
                                                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                                    <div className="sm:col-span-6">
                                                        <label className={`block text-xs text-gray-500 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                            {t('stocked.operations.product')}
                                                        </label>
                                                        <select
                                                            value={item.product}
                                                            onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                                                            className={`w-full border-2 ${errors.items && index === 0 ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-green-500 bg-white`}
                                                        >
                                                            <option value="">{t('stocked.operations.select_product')}</option>
                                                            {products.map((prod) => (
                                                                <option key={prod._id} value={prod._id}>{prod.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="sm:col-span-4">
                                                        <label className={`block text-xs text-gray-500 mb-1 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                            {t('stocked.operations.quantity')}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                            placeholder="0"
                                                            min="0"
                                                            className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-green-500`}
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        {formData.items.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(index)}
                                                                className="text-red-500 hover:text-red-700 p-2 w-full sm:w-auto"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Total (for add operation) */}
                                    {operationType === 'add' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                    {t('stocked.operations.total')}
                                                </label>
                                                <input
                                                    type="number"
                                                    name="total"
                                                    value={formData.total}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                    className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-green-500`}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Description and Attachments */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Attachments */}
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('stocked.operations.attachments')}
                                            </label>
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                onDragOver={handleDragOver}
                                                onDrop={handleDrop}
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center hover:border-green-500 cursor-pointer transition-colors block"
                                            >
                                                <div className="text-gray-400 mb-2">📎</div>
                                                <p className="text-sm text-gray-500">
                                                    <span className="text-green-600">{t('sales.common.click_to_upload')}</span> {t('sales.common.or_drag')}
                                                </p>
                                            </label>
                                            {formData.attachments.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {formData.attachments.map((file, index) => (
                                                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm">
                                                            <span className="truncate max-w-[150px] sm:max-w-[200px]">{file.name}</span>
                                                            <button type="button" onClick={() => removeAttachment(index)} className="text-red-500">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className={`block text-sm font-semibold text-gray-700 mb-2 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                                {t('stocked.operations.description')}
                                            </label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                rows="4"
                                                className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-${i18n.language === 'ar' ? 'right' : 'left'} focus:outline-none focus:border-green-500 resize-none`}
                                                placeholder={t('stocked.operations.description')}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-start gap-3 sticky bottom-0">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full sm:w-auto bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? t('sales.common.saving') : t('sales.common.save')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                >
                                    {t('sales.common.cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Overlay to close dropdown */}
            {
                showOperationDropdown && (
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowOperationDropdown(false)}
                    />
                )
            }
        </div >
    );
};

export default Operations;
