import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Search,
    RefreshCw,
    X,
    Warehouse,
    Building2,
    Users as UsersIcon,
    CheckCircle2,
    Edit,
    Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import logError from '../../utils/logError';
import { confirmDelete } from '../../utils/confirmdelete';

const Warehouses = () => {
    const { t, i18n } = useTranslation();
    const [warehouses, setWarehouses] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        account: '',
        branch: '',
        users: '',
        enableReceiving: false,
        enableIssuing: false
    });

    const fetchWarehouses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/warehouses');
            setWarehouses(response.data.warehouses || []);
        } catch (error) {
            logError('Error fetching warehouses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data.users || response.data || []);
        } catch (error) {
            logError('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchWarehouses();
    }, []);

    useEffect(() => {
        if (isModalOpen) {
            fetchUsers();
        }
    }, [isModalOpen]);

    const handleOpenModal = (mode, warehouse = null) => {
        setModalMode(mode);
        if (mode === 'edit' && warehouse) {
            setSelectedWarehouseId(warehouse._id || warehouse.id);
            setFormData({
                name: warehouse.name || '',
                account: warehouse.account || '',
                branch: warehouse.branch || '',
                users: Array.isArray(warehouse.users) && warehouse.users.length > 0 ? (warehouse.users[0]._id || warehouse.users[0]) : '',
                enableReceiving: warehouse.enableReceiving || false,
                enableIssuing: warehouse.enableIssuing || false
            });
        } else {
            setSelectedWarehouseId(null);
            setFormData({
                name: '',
                account: '',
                branch: '',
                users: '',
                enableReceiving: false,
                enableIssuing: false
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        const url = modalMode === 'add'
            ? '/warehouses'
            : `/warehouses/${selectedWarehouseId}`;
        const method = modalMode === 'add' ? 'POST' : 'PUT';

        try {
            const payload = { ...formData };
            console.log('Warehouse payload before processing:', payload);
            if (!payload.users || payload.users === '') {
                delete payload.users;
            } else if (typeof payload.users === 'string') {
                payload.users = [payload.users]; // Backend expects an array of ObjectIds
            }
            console.log('Warehouse payload after processing:', payload);
            console.log('Users field:', payload.users, 'Type:', typeof payload.users);

            await api({
                method,
                url,
                data: payload
            });

            setIsModalOpen(false);
            fetchWarehouses();
            alert(i18n.language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');

        } catch (error) {
            logError('Error saving warehouse:', error);
            const msg = error.response?.data?.message || (i18n.language === 'ar' ? 'حدث خطأ' : 'An error occurred');
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirmDelete({ title: t('sales.common.confirm_delete', 'Confirm Delete'), message: t('sales.common.confirm_delete', 'Are you sure you want to delete?'), confirmText: t('sales.common.confirm', 'Confirm'), cancelText: t('sales.common.cancel') });
        if (!confirmed) return;
        setLoading(true);
        try {
            await api.delete(`/warehouses/${id}`);
            fetchWarehouses();
            alert(i18n.language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully');
        } catch (error) {
            logError('Error deleting warehouse:', error);
            const msg = error.response?.data?.message || (i18n.language === 'ar' ? 'حدث خطأ في الحذف' : 'Error deleting');
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const filteredWarehouses = useMemo(() => {
        return warehouses.filter(w =>
            w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.branch?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [warehouses, searchTerm]);

    return (
        <div className="min-h-screen bg-[#F8FAFC]" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Warehouse size={24} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">{t('stocked.warehouses.title')}</h1>
                    </div>

                    <div className="flex items-center gap-3">
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
                            onClick={() => handleOpenModal('add')}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-100 group"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>{t('sales.common.add')}</span>
                        </button>

                        <button
                            onClick={fetchWarehouses}
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
                {loading && warehouses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-4">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-medium">{i18n.language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                    </div>
                ) : filteredWarehouses.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm">
                        <div className="inline-flex p-6 bg-indigo-50 text-indigo-200 rounded-full mb-6">
                            <Warehouse size={64} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('stocked.warehouses.no_warehouses')}</h3>
                        <p className="text-gray-500 mb-8">{t('stocked.warehouses.start_creating')}</p>
                        <button onClick={() => handleOpenModal('add')} className="text-indigo-600 font-semibold hover:underline flex items-center gap-2 mx-auto justify-center">
                            <Plus size={18} /> {t('stocked.warehouses.add_warehouse')}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#FBFCFE] border-b border-gray-200">
                                    <tr>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.warehouses.warehouse_name')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.warehouses.branches')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.warehouses.users')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.permissions.title')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-600">
                                    {filteredWarehouses.map((w) => (
                                        <tr key={w._id || w.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-gray-900">{w.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={14} className="text-gray-400" />
                                                    {w.branch || t('topbar.main_branch')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <UsersIcon size={14} className="text-gray-400" />
                                                    {Array.isArray(w.users) ? w.users.join(', ') : (w.users || '-')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {w.enableReceiving && (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                                            <CheckCircle2 size={10} /> {t('stocked.warehouses.receiving_permissions')}
                                                        </span>
                                                    )}
                                                    {w.enableIssuing && (
                                                        <span className="inline-flex items-center gap-1 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">
                                                            <CheckCircle2 size={10} /> {t('stocked.warehouses.issuing_permissions')}
                                                        </span>
                                                    )}
                                                    {!w.enableReceiving && !w.enableIssuing && <span className="text-gray-300">-</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleOpenModal('edit', w)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title={t('sales.common.update')}>
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(w._id || w.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title={t('sales.common.delete')}>
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
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                                    <Warehouse size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {modalMode === 'add' ? t('stocked.warehouses.add_warehouse') : t('stocked.warehouses.edit_warehouse')}
                                </h2>
                            </div>
                            <X onClick={() => setIsModalOpen(false)} className="text-gray-400 cursor-pointer hover:text-gray-900 transition-colors" />
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('stocked.warehouses.warehouse_name')} *</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        placeholder={t('stocked.warehouses.warehouse_name')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('stocked.warehouses.account')}</label>
                                    <select
                                        value={formData.account}
                                        onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                    >
                                        <option value="">{t('stocked.warehouses.new_account')}</option>
                                        <option value="main">{t('topbar.main_branch')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('stocked.warehouses.branches')}</label>
                                    <select
                                        value={formData.branch}
                                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                    >
                                        <option value="">{t('stocked.warehouses.select_branches_or_users')}</option>
                                        <option value="main">{t('topbar.main_branch')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('stocked.warehouses.users')}</label>
                                    <select
                                        value={formData.users}
                                        onChange={(e) => setFormData({ ...formData, users: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                    >
                                        <option value="">{t('stocked.warehouses.select_branches_or_users')}</option>
                                        {users.map((user) => (
                                            <option key={user._id} value={user._id}>
                                                {user.name || user.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.enableReceiving}
                                                onChange={(e) => setFormData({ ...formData, enableReceiving: e.target.checked })}
                                                className="peer sr-only"
                                            />
                                            <div className="w-12 h-6 bg-gray-200 rounded-full peer-checked:bg-indigo-600 transition-colors"></div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-600 group-hover:text-indigo-600 transition-colors">{t('stocked.warehouses.receiving_permissions')}</span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.enableIssuing}
                                                onChange={(e) => setFormData({ ...formData, enableIssuing: e.target.checked })}
                                                className="peer sr-only"
                                            />
                                            <div className="w-12 h-6 bg-gray-200 rounded-full peer-checked:bg-indigo-600 transition-colors"></div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-600 group-hover:text-indigo-600 transition-colors">{t('stocked.warehouses.issuing_permissions')}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">{t('sales.common.cancel')}</button>
                                <button type="submit" disabled={loading} className="flex-1 p-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all">
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

export default Warehouses;


